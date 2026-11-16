import 'server-only';

export interface OllamaModel {
  name: string;
  size: number;
  parameterSize?: string;
  quantization?: string;
  family?: string;
  modifiedAt?: string;
}

export interface OllamaLoaded {
  name: string;
  size: number;
  sizeVram: number;
  expiresAt?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature: number;
  top_p: number;
  repeat_penalty: number;
  num_ctx: number;
  num_predict: number;
}

async function req(base: string, path: string, init?: RequestInit & { timeoutMs?: number }) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), init?.timeoutMs ?? 5000);
  try {
    return await fetch(base.replace(/\/+$/, '') + path, { ...init, signal: init?.signal ?? ctl.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

export async function ollamaVersion(base: string): Promise<string | null> {
  try {
    const r = await req(base, '/api/version', { timeoutMs: 2500 });
    if (!r.ok) return null;
    return ((await r.json()) as { version?: string }).version ?? 'unknown';
  } catch {
    return null;
  }
}

export async function listModels(base: string): Promise<OllamaModel[]> {
  const r = await req(base, '/api/tags');
  if (!r.ok) throw new Error(`Ollama /api/tags 실패 (${r.status})`);
  const data = (await r.json()) as {
    models?: { name: string; size: number; modified_at?: string; details?: { parameter_size?: string; quantization_level?: string; family?: string } }[];
  };
  return (data.models ?? [])
    .filter((m) => !/embed/i.test(m.name))
    .map((m) => ({
      name: m.name,
      size: m.size,
      parameterSize: m.details?.parameter_size,
      quantization: m.details?.quantization_level,
      family: m.details?.family,
      modifiedAt: m.modified_at,
    }));
}

export async function listLoaded(base: string): Promise<OllamaLoaded[]> {
  const r = await req(base, '/api/ps');
  if (!r.ok) return [];
  const data = (await r.json()) as { models?: { name: string; size: number; size_vram: number; expires_at?: string }[] };
  return (data.models ?? []).map((m) => ({ name: m.name, size: m.size, sizeVram: m.size_vram, expiresAt: m.expires_at }));
}

/** 모델을 VRAM 에서 즉시 내림 (이미지 생성 전 VRAM 확보용) */
export async function unloadModel(base: string, model: string) {
  await req(base, '/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, keep_alive: 0 }),
    timeoutMs: 15000,
  });
}

export interface StreamStats {
  evalCount?: number;
  promptEvalCount?: number;
  doneReason?: string;
}

/**
 * Ollama /api/chat 스트리밍. 텍스트 조각마다 onDelta 호출.
 * signal 로 중단 가능 (중단 시 AbortError throw).
 */
export async function chatStream(
  base: string,
  body: { model: string; messages: ChatMessage[]; options: ChatOptions; keep_alive: string },
  onDelta: (text: string) => void,
  signal: AbortSignal,
): Promise<StreamStats> {
  let r: Response;
  try {
    r = await fetch(base.replace(/\/+$/, '') + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: true }),
      signal,
      cache: 'no-store',
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new Error(`Ollama 에 연결할 수 없습니다 (${base}). Ollama 가 실행 중인지 확인하세요.`);
  }
  if (!r.ok || !r.body) {
    const t = await r.text().catch(() => '');
    let msg = t;
    try {
      msg = (JSON.parse(t) as { error?: string }).error ?? t;
    } catch {}
    throw new Error(`Ollama 오류 (${r.status}): ${msg.slice(0, 300)}`);
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  const stats: StreamStats = {};
  const handle = (line: string) => {
    if (!line.trim()) return;
    const obj = JSON.parse(line) as {
      message?: { content?: string };
      done?: boolean;
      error?: string;
      eval_count?: number;
      prompt_eval_count?: number;
      done_reason?: string;
    };
    if (obj.error) throw new Error(`Ollama: ${obj.error}`);
    if (obj.message?.content) onDelta(obj.message.content);
    if (obj.done) {
      stats.evalCount = obj.eval_count;
      stats.promptEvalCount = obj.prompt_eval_count;
      stats.doneReason = obj.done_reason;
    }
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      handle(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
    }
  }
  buf += dec.decode();
  handle(buf);
  return stats;
}
