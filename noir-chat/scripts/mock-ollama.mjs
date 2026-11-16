// 테스트용 가짜 Ollama 서버 (실제 Ollama 와 같은 NDJSON 스트리밍 프로토콜).
// 실제 모델이 없는 환경에서 앱의 스트리밍/저장/중단 흐름을 검증한다.
import http from 'node:http';

const PORT = Number(process.env.MOCK_OLLAMA_PORT || 11999);
const MODELS = [
  { name: 'mock-ko:14b', size: 9_000_000_000, details: { parameter_size: '14B', quantization_level: 'Q4_K_M', family: 'mock' } },
  { name: 'mock-small:7b', size: 4_700_000_000, details: { parameter_size: '7B', quantization_level: 'Q4_K_M', family: 'mock' } },
];
const loaded = new Set();
let lastChat = null;

function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => resolve(b ? JSON.parse(b) : {}));
  });
}

const server = http.createServer(async (req, res) => {
  const send = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  if (req.url === '/api/version') return send(200, { version: '0.0.0-mock' });
  if (req.url === '/api/tags') return send(200, { models: MODELS });
  if (req.url === '/api/ps') return send(200, { models: [...loaded].map((n) => ({ name: n, size: 9e9, size_vram: 9e9 })) });
  // 테스트 검증용: 마지막 /api/chat 요청 본문
  if (req.url === '/__last_chat') return send(200, lastChat ?? {});
  if (req.url === '/api/generate' && req.method === 'POST') {
    const b = await readBody(req);
    if (b.keep_alive === 0) loaded.delete(b.model);
    return send(200, { done: true });
  }
  if (req.url === '/api/chat' && req.method === 'POST') {
    const b = await readBody(req);
    lastChat = b;
    if (!MODELS.some((m) => m.name === b.model)) return send(404, { error: `model "${b.model}" not found, try pulling it first` });
    loaded.add(b.model);
    const last = b.messages[b.messages.length - 1];
    const slow = /천천히|slow/.test(last?.content || '');
    const system = b.messages[0]?.content || '';
    const adult = system.includes('성인 간 합의된 픽션');
    const reply = `*잠시 생각하다가 미소 짓는다* 응, "${(last?.content || '').slice(0, 20)}"라고 했지? [mock 응답 · 메시지 ${b.messages.length}개 · ${adult ? 'adult' : 'general'}]`;
    const chunks = reply.match(/.{1,4}/gsu) || [];
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
    let closed = false;
    res.on('close', () => (closed = true));
    for (const c of chunks) {
      if (closed) return;
      res.write(JSON.stringify({ model: b.model, message: { role: 'assistant', content: c }, done: false }) + '\n');
      await new Promise((r) => setTimeout(r, slow ? 150 : 10));
    }
    res.end(JSON.stringify({ model: b.model, message: { role: 'assistant', content: '' }, done: true, done_reason: 'stop', eval_count: chunks.length, prompt_eval_count: 100 }) + '\n');
    return;
  }
  send(404, { error: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => console.log(`mock ollama on http://127.0.0.1:${PORT}`));
