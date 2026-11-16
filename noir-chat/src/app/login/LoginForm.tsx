'use client';
import { useState } from 'react';
import { api } from '@/components/client-api';

export default function LoginForm() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/api/auth/login', { body: { password: pw } });
      window.location.href = '/';
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="wordmark">N<i>O</i>IR</div>
        <p className="lead">개인 전용 공간입니다.</p>
        <label className="field">
          <span>비밀번호</span>
          <input className="input" type="password" autoComplete="current-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        {err && <div className="error-text">{err}</div>}
        <button className="btn btn-primary" disabled={busy || !pw}>{busy ? '확인 중…' : '들어가기'}</button>
      </form>
    </main>
  );
}
