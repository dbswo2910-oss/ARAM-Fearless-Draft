'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from './client-api';
import { formatBytes } from './format';

type Settings = {
  ollamaUrl: string;
  defaultModel: string;
  numCtx: number;
  numPredict: number;
  keepAlive: string;
  temperature: number;
  topP: number;
  repeatPenalty: number;
  adultMode: boolean;
  userName: string;
  userPersona: string;
};
type Status = {
  online: boolean;
  url: string;
  version?: string;
  models: { name: string; size: number; parameterSize?: string; quantization?: string }[];
  loaded: { name: string; size: number; sizeVram: number }[];
};

// RTX 4070 12GB 기준: 가중치 + KV 캐시 + 여유 1GB 를 고려한 대략적 판단
function vramFit(size: number) {
  const gb = size / 1e9;
  if (gb <= 9.5) return { label: '여유', cls: 'badge-ok' };
  if (gb <= 11) return { label: '빠듯', cls: '' };
  return { label: 'VRAM 초과(느림)', cls: 'badge-bad' };
}

export default function SettingsView({ initial }: { initial: Settings }) {
  const [s, setS] = useState(initial);
  const [status, setStatus] = useState<Status | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', next2: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [welcome, setWelcome] = useState(false);
  useEffect(() => setWelcome(new URLSearchParams(window.location.search).has('welcome')), []);

  const refresh = useCallback(() => {
    api<Status>('/api/ollama/status').then(setStatus).catch((e) => setErr(e.message));
  }, []);
  useEffect(refresh, [refresh]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  async function save(patch?: Partial<Settings>) {
    setErr('');
    setMsg('');
    try {
      const next = await api<Settings>('/api/settings', { method: 'PUT', body: patch ?? s });
      setS(next);
      setMsg('저장했습니다.');
      setTimeout(() => setMsg(''), 2500);
      if (!patch || 'ollamaUrl' in patch) refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function toggleAdult(on: boolean) {
    if (on && !confirm('성인 모드를 켭니다.\n\n만 19세 이상 성인이며, 성인 간 합의된 픽션 콘텐츠를 본인이 비공개로 이용함에 동의합니다.')) return;
    await save({ adultMode: on });
  }

  async function unloadAll() {
    const r = await api<{ unloaded: string[] }>('/api/ollama/unload', { method: 'POST', body: {} });
    setMsg(r.unloaded.length ? `VRAM 에서 내림: ${r.unloaded.join(', ')}` : '로드된 모델이 없습니다.');
    refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg('');
    if (pw.next !== pw.next2) return setPwMsg('새 비밀번호가 서로 다릅니다.');
    try {
      await api('/api/auth/password', { body: { current: pw.current, next: pw.next } });
      setPw({ current: '', next: '', next2: '' });
      setPwMsg('변경했습니다. 다른 기기는 모두 로그아웃되었습니다.');
    } catch (e) {
      setPwMsg((e as Error).message);
    }
  }

  async function logout(all: boolean) {
    if (all && !confirm('모든 기기에서 로그아웃할까요?')) return;
    await api('/api/auth/logout', { body: { all } });
    window.location.href = '/login';
  }

  const models = status?.models ?? [];

  return (
    <div className="form-grid">
      {welcome && (
        <div className="card form-section" style={{ borderColor: 'var(--ember)' }}>
          <h2>환영합니다</h2>
          <p className="muted" style={{ margin: 0 }}>먼저 아래에서 Ollama 연결을 확인하고 기본 모델을 고른 뒤, 캐릭터를 만들어 대화를 시작하세요.</p>
        </div>
      )}

      <section className="card form-section">
        <h2>AI 엔진 (Ollama)</h2>
        <div className="status-row">
          {status === null ? <span className="badge">확인 중…</span> : status.online
            ? <span className="badge badge-ok"><span className="dot" style={{ background: 'var(--ok)' }} /> 연결됨 v{status.version}</span>
            : <span className="badge badge-bad"><span className="dot" style={{ background: 'var(--danger)' }} /> 연결 안 됨</span>}
          <button className="btn btn-sm" onClick={refresh}>다시 확인</button>
          {status?.loaded.length ? <button className="btn btn-sm" onClick={unloadAll}>VRAM 비우기</button> : null}
        </div>
        {status && !status.online && (
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
            PC에서 Ollama 를 실행하세요. 설치 후 터미널에서 예: <code>ollama pull qwen2.5:14b</code>
          </p>
        )}
        <label className="field">
          <span>Ollama 주소</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="input" value={s.ollamaUrl} onChange={(e) => set('ollamaUrl', e.target.value)} />
            <button className="btn" onClick={() => save({ ollamaUrl: s.ollamaUrl })}>적용</button>
          </div>
        </label>
        <label className="field">
          <span>기본 대화 모델</span>
          <select className="select" value={s.defaultModel} onChange={(e) => save({ defaultModel: e.target.value })}>
            <option value="">선택하세요</option>
            {s.defaultModel && !models.some((m) => m.name === s.defaultModel) && <option value={s.defaultModel}>{s.defaultModel} (설치 안 됨)</option>}
            {models.map((m) => <option key={m.name} value={m.name}>{m.name} · {m.parameterSize ?? ''} {m.quantization ?? ''} · {formatBytes(m.size)}</option>)}
          </select>
        </label>
        {models.length > 0 && (
          <table className="model-table">
            <thead><tr><th>설치된 모델</th><th>크기</th><th>12GB VRAM</th><th>상태</th></tr></thead>
            <tbody>
              {models.map((m) => {
                const fit = vramFit(m.size);
                const loaded = status?.loaded.find((l) => l.name === m.name);
                return (
                  <tr key={m.name}>
                    <td>{m.name}</td>
                    <td>{formatBytes(m.size)}</td>
                    <td><span className={`badge ${fit.cls}`}>{fit.label}</span></td>
                    <td>{loaded ? <span className="badge badge-ok">GPU {Math.round((loaded.sizeVram / Math.max(loaded.size, 1)) * 100)}%</span> : <span className="faint">대기</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="card form-section">
        <h2>생성 옵션 <small>12GB VRAM 기준 권장값이 기본입니다</small></h2>
        <div className="grid-2">
          <label className="field"><span>컨텍스트 길이 (num_ctx)</span>
            <input className="input" type="number" step={1024} value={s.numCtx} onChange={(e) => set('numCtx', +e.target.value)} />
            <small>길수록 많이 기억하지만 VRAM 사용 증가. 14B 모델은 8192 권장.</small></label>
          <label className="field"><span>최대 응답 길이 (토큰)</span>
            <input className="input" type="number" step={50} value={s.numPredict} onChange={(e) => set('numPredict', +e.target.value)} /></label>
          <label className="field"><span>창의성 (temperature)</span>
            <input className="input" type="number" step={0.05} value={s.temperature} onChange={(e) => set('temperature', +e.target.value)} /></label>
          <label className="field"><span>top_p</span>
            <input className="input" type="number" step={0.01} value={s.topP} onChange={(e) => set('topP', +e.target.value)} /></label>
          <label className="field"><span>반복 억제 (repeat_penalty)</span>
            <input className="input" type="number" step={0.01} value={s.repeatPenalty} onChange={(e) => set('repeatPenalty', +e.target.value)} /></label>
          <label className="field"><span>모델 유지 시간 (keep_alive)</span>
            <input className="input" value={s.keepAlive} onChange={(e) => set('keepAlive', e.target.value)} />
            <small>대화 후 VRAM 에 머무는 시간. 예: 15m, 1h, 0(즉시 해제)</small></label>
        </div>
        <div><button className="btn" onClick={() => save({ numCtx: s.numCtx, numPredict: s.numPredict, temperature: s.temperature, topP: s.topP, repeatPenalty: s.repeatPenalty, keepAlive: s.keepAlive })}>생성 옵션 저장</button></div>
      </section>

      <section className="card form-section">
        <h2>수위</h2>
        <label className="toggle">
          <input type="checkbox" checked={s.adultMode} onChange={(e) => toggleAdult(e.target.checked)} />
          <span>
            <b>성인 모드 (19+)</b>
            <small>켜면 캐릭터 설정에서 &lsquo;성인 롤플레이 허용&rsquo;을 켠 캐릭터에 한해 성인 간 합의된 로맨스·성적 묘사가 허용됩니다. 미성년자 설정과 실존 인물은 항상 금지됩니다. 실제 표현 수위는 선택한 모델에 따라 다릅니다.</small>
          </span>
        </label>
      </section>

      <section className="card form-section">
        <h2>내 정보 <small>캐릭터가 나를 어떻게 알고 있는지</small></h2>
        <label className="field"><span>이름</span><input className="input" maxLength={40} value={s.userName} onChange={(e) => set('userName', e.target.value)} /></label>
        <label className="field"><span>내 페르소나</span>
          <textarea className="textarea" rows={3} maxLength={2000} value={s.userPersona} placeholder="외모, 직업, 성격 등 캐릭터가 알고 있을 나의 설정" onChange={(e) => set('userPersona', e.target.value)} /></label>
        <div><button className="btn" onClick={() => save({ userName: s.userName, userPersona: s.userPersona })}>저장</button></div>
      </section>

      <section className="card form-section">
        <h2>보안</h2>
        <form className="form-grid" onSubmit={changePassword}>
          <div className="grid-2">
            <label className="field"><span>현재 비밀번호</span><input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
            <span />
            <label className="field"><span>새 비밀번호 (10자 이상)</span><input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
            <label className="field"><span>새 비밀번호 확인</span><input className="input" type="password" autoComplete="new-password" value={pw.next2} onChange={(e) => setPw({ ...pw, next2: e.target.value })} /></label>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn" disabled={!pw.current || !pw.next}>비밀번호 변경</button>
            {pwMsg && <span className="muted" style={{ fontSize: 13.5 }}>{pwMsg}</span>}
          </div>
        </form>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => logout(false)}>로그아웃</button>
          <button className="btn btn-danger" onClick={() => logout(true)}>모든 기기에서 로그아웃</button>
        </div>
      </section>

      {(msg || err) && <div className="toast">{err ? <span className="error-text">{err}</span> : msg}</div>}
    </div>
  );
}
