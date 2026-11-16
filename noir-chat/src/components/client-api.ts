'use client';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const r = await fetch(path, {
    method: init?.method ?? (init?.body !== undefined ? 'POST' : 'GET'),
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  if (r.status === 401 && !path.startsWith('/api/auth/')) {
    window.location.href = '/login';
    throw new ApiError(401, '로그인이 필요합니다.');
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, (data as { error?: string }).error || `요청 실패 (${r.status})`);
  return data as T;
}

export type StreamEvent =
  | { type: 'start'; messageId: number; model: string; droppedCount: number; promptTokens: number }
  | { type: 'delta'; text: string }
  | { type: 'done'; messageId: number; evalCount?: number }
  | { type: 'stopped'; messageId: number }
  | { type: 'error'; error: string; messageId?: number };

/** NDJSON 스트림 요청 */
export async function streamRequest(path: string, body: unknown, onEvent: (e: StreamEvent) => void, signal?: AbortSignal) {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
    signal,
  });
  if (!r.ok || !r.body) {
    const data = await r.json().catch(() => ({}));
    throw new ApiError(r.status, (data as { error?: string }).error || `요청 실패 (${r.status})`);
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onEvent(JSON.parse(line) as StreamEvent);
    }
  }
  if (buf.trim()) onEvent(JSON.parse(buf) as StreamEvent);
}
