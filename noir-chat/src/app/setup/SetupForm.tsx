'use client';
import { useState } from 'react';
import { api } from '@/components/client-api';

export default function SetupForm() {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [name, setName] = useState('');
  const [adult, setAdult] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) return setErr('비밀번호가 서로 다릅니다.');
    setBusy(true);
    setErr('');
    try {
      await api('/api/auth/setup', { body: { password: pw, confirmAdult: adult, userName: name } });
      window.location.href = '/settings?welcome=1';
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="wordmark">N<i>O</i>IR</div>
        <p className="lead">처음 실행입니다. 이 PC 전용 비밀번호를 만드세요.</p>
        <label className="field">
          <span>내 이름 (대화에서 불릴 이름)</span>
          <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="예: 유진" />
        </label>
        <label className="field">
          <span>비밀번호 (10자 이상)</span>
          <input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        <label className="field">
          <span>비밀번호 확인</span>
          <input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <small>분실 시 PC에서 <code>npm run reset-password</code> 로 재설정할 수 있습니다.</small>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
          <span><b>저는 만 19세 이상 성인입니다.</b><small>이 서비스는 성인 1인 전용 비공개 환경입니다.</small></span>
        </label>
        {err && <div className="error-text">{err}</div>}
        <button className="btn btn-primary" disabled={busy || !pw || !adult}>{busy ? '설정 중…' : '시작하기'}</button>
      </form>
    </main>
  );
}
