'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './client-api';
import Avatar from './Avatar';
import { MIN_CHARACTER_AGE, findMinorIndicators } from '@/lib/safety';

type CharacterData = {
  id?: string;
  name: string;
  age: number | string;
  gender: string;
  tagline: string;
  appearance: string;
  personality: string;
  speech_style: string;
  background: string;
  world: string;
  relationship: string;
  greeting: string;
  example_dialogue: string;
  system_extra: string;
  tags: string;
  avatar?: string | null;
  model: string | null;
  temperature: number | null | string;
  adult_enabled: number;
};

const EMPTY: CharacterData = {
  name: '', age: 25, gender: '', tagline: '', appearance: '', personality: '', speech_style: '', background: '',
  world: '', relationship: '', greeting: '', example_dialogue: '', system_extra: '', tags: '', model: null, temperature: '', adult_enabled: 0,
};

type TextKey = 'appearance' | 'personality' | 'speech_style' | 'background' | 'world' | 'relationship' | 'greeting' | 'example_dialogue' | 'system_extra';

const SECTIONS: { title: string; hint?: string; fields: { key: TextKey; label: string; placeholder: string; rows?: number; help?: string }[] }[] = [
  {
    title: '인물',
    fields: [
      { key: 'appearance', label: '외모', placeholder: '키, 체형, 머리 모양과 색, 눈빛, 즐겨 입는 옷, 향기, 특징적인 버릇…', help: '이후 이미지 생성 프롬프트의 기본값으로도 사용됩니다.' },
      { key: 'personality', label: '성격', placeholder: '겉으로 보이는 성격과 속마음, 좋아하는 것/싫어하는 것, 감정 표현 방식…' },
      { key: 'speech_style', label: '말투', placeholder: '반말/존댓말, 자주 쓰는 말버릇, 호칭(예: {{user}}를 "자기"라고 부름), 문장 길이…' },
    ],
  },
  {
    title: '이야기',
    fields: [
      { key: 'background', label: '배경', placeholder: '직업, 과거, 지금의 상황, 비밀…', rows: 4 },
      { key: 'world', label: '세계관', placeholder: '현대 서울 / 판타지 왕국 / 사이버펑크 도시 등 무대와 규칙', rows: 3 },
      { key: 'relationship', label: '{{user}}와의 관계', placeholder: '처음 만난 사이, 오래된 친구, 연인, 계약 관계… 현재 감정의 온도', rows: 3 },
    ],
  },
  {
    title: '대화',
    fields: [
      { key: 'greeting', label: '첫 인사말', placeholder: '*카페 문이 열리자 고개를 든다* 왔어? 오늘은 좀 늦었네.', rows: 4, help: '새 대화를 시작하면 캐릭터가 먼저 이 말로 시작합니다. {{user}}, {{char}} 사용 가능.' },
      { key: 'example_dialogue', label: '말투 예시', placeholder: '{{user}}: 뭐 해?\n{{char}}: *책을 덮으며* 너 기다렸지. 뭐 하긴.', rows: 4, help: '모델이 말투를 잡는 데 큰 도움이 됩니다.' },
      { key: 'system_extra', label: '추가 지침', placeholder: '예: 답변은 짧게. 질투가 많지만 티 내지 않으려 함.', rows: 3 },
    ],
  },
];

export default function CharacterForm({ initial, adultModeOn }: { initial?: Partial<CharacterData>; adultModeOn: boolean }) {
  const router = useRouter();
  const [c, setC] = useState<CharacterData>({ ...EMPTY, ...initial, temperature: initial?.temperature ?? '' } as CharacterData);
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!c.id;

  useEffect(() => {
    api<{ models: { name: string }[] }>('/api/ollama/status')
      .then((s) => setModels(s.models.map((m) => m.name)))
      .catch(() => {});
  }, []);

  const set = <K extends keyof CharacterData>(k: K, v: CharacterData[K]) => setC((p) => ({ ...p, [k]: v }));

  const minorHits = useMemo(() => {
    if (!c.adult_enabled) return [];
    return findMinorIndicators([c.name, c.tagline, c.tags, ...SECTIONS.flatMap((s) => s.fields.map((f) => c[f.key]))].join('\n'));
  }, [c]);
  const ageNum = Number(c.age);
  const ageInvalid = !Number.isInteger(ageNum) || ageNum < MIN_CHARACTER_AGE;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const body = { ...c, age: Number(c.age), temperature: c.temperature === '' ? null : Number(c.temperature) };
      if (isEdit) {
        await api(`/api/characters/${c.id}`, { method: 'PUT', body });
        setMsg('저장했습니다.');
        router.refresh();
      } else {
        const created = await api<{ id: string }>('/api/characters', { body });
        router.push(`/characters/${created.id}?created=1`);
        return;
      }
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  async function uploadAvatar(file: File) {
    if (!c.id) return;
    const fd = new FormData();
    fd.append('file', file);
    setErr('');
    const r = await fetch(`/api/characters/${c.id}/avatar`, { method: 'POST', body: fd });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(data.error || '업로드 실패');
    set('avatar', data.avatar);
    router.refresh();
  }

  async function remove() {
    if (!c.id || !confirm(`${c.name} 캐릭터와 모든 대화 기록을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    await api(`/api/characters/${c.id}`, { method: 'DELETE' });
    router.push('/');
    router.refresh();
  }

  return (
    <form className="form-grid" onSubmit={save}>
      <section className="card form-section">
        <h2>기본 정보</h2>
        {isEdit && (
          <div className="avatar-edit">
            <Avatar name={c.name || '?'} avatar={c.avatar} size={72} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>프로필 이미지 업로드</button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              <span className="faint" style={{ fontSize: 12, alignSelf: 'center' }}>이미지 생성은 다음 단계에서 연결됩니다.</span>
            </div>
          </div>
        )}
        <div className="form-row">
          <label className="field"><span>이름 *</span><input className="input" required maxLength={40} value={c.name} onChange={(e) => set('name', e.target.value)} /></label>
          <label className="field"><span>나이 *</span><input className="input" type="number" min={MIN_CHARACTER_AGE} value={c.age} onChange={(e) => set('age', e.target.value)} /></label>
          <label className="field"><span>성별</span><input className="input" maxLength={20} value={c.gender} onChange={(e) => set('gender', e.target.value)} placeholder="여성 / 남성 / …" /></label>
        </div>
        {ageInvalid && <div className="error-text">나이는 {MIN_CHARACTER_AGE}세 이상의 정수여야 합니다.</div>}
        <label className="field"><span>한 줄 소개</span><input className="input" maxLength={120} value={c.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="새벽에만 문을 여는 바의 바텐더" /></label>
        <label className="field"><span>태그</span><input className="input" maxLength={200} value={c.tags} onChange={(e) => set('tags', e.target.value)} placeholder="로맨스, 츤데레, 현대" /></label>
      </section>

      {SECTIONS.map((s) => (
        <section key={s.title} className="card form-section">
          <h2>{s.title}</h2>
          {s.fields.map((f) => (
            <label key={f.key} className="field">
              <span>{f.label}</span>
              <textarea className="textarea" rows={f.rows ?? 3} value={c[f.key]} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
              {f.help && <small>{f.help}</small>}
            </label>
          ))}
        </section>
      ))}

      <section className="card form-section">
        <h2>모델 · 수위</h2>
        <div className="grid-2">
          <label className="field">
            <span>전용 모델</span>
            <select className="select" value={c.model ?? ''} onChange={(e) => set('model', e.target.value || null)}>
              <option value="">기본 모델 사용</option>
              {c.model && !models.includes(c.model) && <option value={c.model}>{c.model} (설치 안 됨)</option>}
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="field">
            <span>창의성(temperature)</span>
            <input className="input" type="number" step="0.05" min={0} max={2} value={c.temperature ?? ''} placeholder="기본값" onChange={(e) => set('temperature', e.target.value)} />
          </label>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={c.adult_enabled === 1} onChange={(e) => set('adult_enabled', e.target.checked ? 1 : 0)} />
          <span>
            <b>성인(19+) 롤플레이 허용</b>
            <small>
              성인 간 합의된 연애·성적 묘사를 허용합니다. {adultModeOn ? '' : '※ 설정에서 전체 성인 모드도 켜야 적용됩니다. '}
              미성년자 설정·실존 인물은 허용되지 않습니다.
            </small>
          </span>
        </label>
        {minorHits.length > 0 && <div className="error-text">미성년자를 암시하는 표현이 있어 저장할 수 없습니다: {minorHits.join(', ')}</div>}
      </section>

      <div className="form-actions">
        {err && <span className="error-text" style={{ marginRight: 'auto' }}>{err}</span>}
        {msg && <span className="ok-text" style={{ marginRight: 'auto' }}>{msg}</span>}
        {isEdit && <button type="button" className="btn btn-danger" onClick={remove}>삭제</button>}
        <button className="btn btn-primary" disabled={busy || ageInvalid || !c.name.trim() || minorHits.length > 0}>
          {busy ? '저장 중…' : isEdit ? '저장' : '만들기'}
        </button>
      </div>
    </form>
  );
}
