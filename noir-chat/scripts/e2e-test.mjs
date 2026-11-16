// 통합 테스트: 임시 데이터 폴더 + 가짜 Ollama + 실제 Next 프로덕션 서버(next start)를 띄워
// 인증·보안·캐릭터·대화·스트리밍·중단·재생성·아바타 흐름을 HTTP 로 검증한다.
// 사용: npm run build && npm run test:e2e
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const APP_PORT = 3299;
const MOCK_PORT = 11999;
const BASE = `http://127.0.0.1:${APP_PORT}`;
const MOCK = `http://127.0.0.1:${MOCK_PORT}`;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'noir-e2e-'));
const PW = 'correct-horse-battery';

const procs = [];
let failures = 0;
let passes = 0;
function ok(cond, name, extra) {
  if (cond) {
    passes++;
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}`, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : '');
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function start(cmd, args, env) {
  const p = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  p.stdout.on('data', (d) => process.env.E2E_VERBOSE && process.stdout.write(`[${args[0]}] ${d}`));
  p.stderr.on('data', (d) => process.env.E2E_VERBOSE && process.stderr.write(`[${args[0]}] ${d}`));
  procs.push(p);
  return p;
}

async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(url, { redirect: 'manual' });
      return;
    } catch {
      await sleep(200);
    }
  }
  throw new Error(`timeout waiting for ${url}`);
}

let cookie = '';
async function req(method, p, body, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (cookie && !opts.noCookie) headers.cookie = cookie;
  if (body !== undefined && !(body instanceof FormData)) headers['content-type'] = 'application/json';
  if (method !== 'GET' && !headers.origin) headers.origin = BASE;
  const r = await fetch(BASE + p, {
    method,
    headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    redirect: 'manual',
    signal: opts.signal,
  });
  const sc = r.headers.get('set-cookie');
  if (sc && !opts.keepCookie) {
    const m = sc.match(/noir_session=([^;]*)/);
    if (m) cookie = m[1] ? `noir_session=${m[1]}` : '';
  }
  return r;
}
async function jreq(method, p, body, opts) {
  const r = await req(method, p, body, opts);
  let data = null;
  try {
    data = await r.json();
  } catch {}
  return { status: r.status, data };
}
async function stream(p, body, opts = {}) {
  const r = await req('POST', p, body, opts);
  if (!r.ok) return { status: r.status, events: [], data: await r.json().catch(() => null) };
  const events = [];
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) {
          const e = JSON.parse(line);
          events.push(e);
          opts.onEvent?.(e);
        }
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
  }
  return { status: r.status, events, text: events.filter((e) => e.type === 'delta').map((e) => e.text).join('') };
}
const lastChat = async () => (await fetch(MOCK + '/__last_chat')).json();

async function main() {
  console.log(`data dir: ${DATA}`);
  start('node', ['scripts/mock-ollama.mjs'], { MOCK_OLLAMA_PORT: String(MOCK_PORT) });
  start('node', ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(APP_PORT)], {
    NOIR_DATA_DIR: DATA,
    OLLAMA_URL: MOCK,
    NEXT_TELEMETRY_DISABLED: '1',
  });
  await waitFor(MOCK + '/api/version');
  await waitFor(BASE + '/login');

  console.log('\n[1] 초기 설정 / 인증');
  let r = await req('GET', '/');
  ok(r.status === 307 && r.headers.get('location') === '/setup', '초기 설정 전 / → /setup (상대 경로 리다이렉트)', r.headers.get('location'));
  r = await req('GET', '/login');
  ok(r.status === 307 && r.headers.get('location') === '/setup', '초기 설정 전 /login → /setup');
  let j = await jreq('GET', '/api/characters');
  ok(j.status === 401, '미인증 API 401');
  j = await jreq('POST', '/api/auth/setup', { password: PW, confirmAdult: false });
  ok(j.status === 400, '성인 확인 없으면 설정 거부');
  j = await jreq('POST', '/api/auth/setup', { password: 'short', confirmAdult: true });
  ok(j.status === 400, '짧은 비밀번호 거부');
  j = await jreq('POST', '/api/auth/setup', { password: PW, confirmAdult: true, userName: '유진' }, { headers: { origin: 'http://evil.example' } });
  ok(j.status === 403, '타 출처(Origin) 요청 거부');
  j = await jreq('POST', '/api/auth/setup', { password: PW, confirmAdult: true, userName: '유진' });
  ok(j.status === 200 && cookie.startsWith('noir_session='), '초기 설정 성공 + 세션 쿠키 발급');
  const setupCookie = cookie;
  j = await jreq('POST', '/api/auth/setup', { password: 'another-password-1', confirmAdult: true });
  ok(j.status === 409, '초기 설정 재실행 차단');
  r = await req('GET', '/api/characters', undefined, { noCookie: true, headers: { cookie: 'noir_session=forged-token' } });
  ok(r.status === 401, '위조 세션 토큰 거부');
  for (const p of ['/', '/settings', '/chat/abc', '/characters/new']) {
    r = await req('GET', p, undefined, { noCookie: true, headers: { cookie: 'noir_session=forged-token' } });
    ok(r.status === 307 && r.headers.get('location') === '/login', `위조 세션으로 ${p} 접근 → /login`, r.headers.get('location'));
  }
  r = await req('GET', '/', undefined, { noCookie: true, headers: { 'x-forwarded-host': 'evil.example', host: 'evil.example' } });
  ok(r.headers.get('location') === '/login', '리다이렉트가 Host 헤더에 영향받지 않음(오픈 리다이렉트 방지)');

  console.log('\n[2] 설정 / Ollama 연결');
  j = await jreq('PUT', '/api/settings', { ollamaUrl: 'javascript:alert(1)' });
  ok(j.status === 400, '잘못된 Ollama URL 거부');
  j = await jreq('PUT', '/api/settings', { ollamaUrl: MOCK, defaultModel: 'mock-ko:14b', numCtx: 999999 });
  ok(j.status === 200 && j.data.numCtx === 32768 && j.data.defaultModel === 'mock-ko:14b', '설정 저장 + 범위 보정', j.data);
  j = await jreq('GET', '/api/ollama/status');
  ok(j.data.online === true && j.data.models.length === 2, 'Ollama 상태/모델 목록', j.data);
  await jreq('PUT', '/api/settings', { numCtx: 8192 });

  console.log('\n[3] 캐릭터');
  j = await jreq('POST', '/api/characters', { name: '서아', age: 17 });
  ok(j.status === 400, '19세 미만 캐릭터 거부');
  j = await jreq('POST', '/api/characters', { name: '서아', age: 25, background: '현재 여고생', adult_enabled: true });
  ok(j.status === 400 && /미성년자/.test(j.data.error), '성인 모드 + 미성년 암시 표현 거부', j.data);
  j = await jreq('POST', '/api/characters', {
    name: '서아', age: 27, gender: '여성', tagline: '새벽 바의 바텐더',
    personality: '차분하지만 장난기 있음', speech_style: '{{user}}를 "손님"이라 부르는 반말',
    background: '고등학생 때부터 바텐더를 꿈꿨다', relationship: '단골 손님과 바텐더',
    greeting: '*잔을 닦다 고개를 든다* 왔네, {{user}}.', example_dialogue: '{{user}}: 안녕\n{{char}}: 응, 앉아.',
  });
  ok(j.status === 201 && j.data.id, '캐릭터 생성', j.data);
  const charId = j.data.id;
  j = await jreq('PUT', `/api/characters/${charId}`, { age: 15 });
  ok(j.status === 400, '수정 시에도 나이 검증');
  j = await jreq('GET', '/api/characters');
  ok(j.data.length === 1 && j.data[0].name === '서아', '캐릭터 목록');

  console.log('\n[4] 대화 + 스트리밍');
  j = await jreq('POST', '/api/conversations', { characterId: charId });
  ok(j.status === 201, '대화 생성');
  const convId = j.data.id;
  j = await jreq('GET', `/api/conversations/${convId}`);
  ok(j.data.messages.length === 1 && j.data.messages[0].content === '*잔을 닦다 고개를 든다* 왔네, 유진.', '인사말 + {{user}} 치환', j.data.messages);
  let s = await stream(`/api/conversations/${convId}/messages`, { content: '오늘 추천 칵테일은?' });
  ok(s.status === 200 && s.events[0]?.type === 'start' && s.events.at(-1)?.type === 'done', '스트림 start→delta→done', s.events.map((e) => e.type));
  ok(s.events.filter((e) => e.type === 'delta').length > 5, '여러 조각으로 실시간 스트리밍');
  let lc = await lastChat();
  ok(lc.messages[0].role === 'system' && lc.messages[0].content.includes('서아') && lc.messages[0].content.includes('손님'), '시스템 프롬프트에 캐릭터 설정 반영');
  ok(lc.messages[0].content.includes('전체 이용가'), '성인 모드 OFF → 일반 수위 지침');
  ok(lc.options.num_ctx === 8192 && lc.keep_alive === '15m', 'num_ctx/keep_alive 전달', { o: lc.options, k: lc.keep_alive });
  ok(lc.messages.at(-1).content === '오늘 추천 칵테일은?' && lc.messages[1].role === 'assistant', '대화 이력 순서 전달');
  j = await jreq('GET', `/api/conversations/${convId}`);
  const msgs = j.data.messages;
  ok(msgs.length === 3 && msgs[2].status === 'complete' && msgs[2].content === s.text.trim(), '응답 DB 저장 (complete)', msgs);

  console.log('\n[5] 성인 모드');
  await jreq('PUT', `/api/characters/${charId}`, { adult_enabled: true });
  await stream(`/api/conversations/${convId}/messages`, { content: '한 잔 더' });
  lc = await lastChat();
  ok(lc.messages[0].content.includes('전체 이용가'), '전역 성인 모드 OFF 면 캐릭터 허용만으로는 적용 안 됨');
  await jreq('PUT', '/api/settings', { adultMode: true });
  await stream(`/api/conversations/${convId}/messages`, { content: '한 잔 더 줘' });
  lc = await lastChat();
  ok(lc.messages[0].content.includes('성인 간 합의된 픽션') && lc.messages[0].content.includes('미성년자'), '성인 모드 ON → 성인 지침 + 금지 경계 포함');

  console.log('\n[6] 재생성 / 이어서 / 수정');
  j = await jreq('GET', `/api/conversations/${convId}`);
  const before = j.data.messages;
  s = await stream(`/api/conversations/${convId}/regenerate`, {});
  j = await jreq('GET', `/api/conversations/${convId}`);
  ok(s.events.at(-1)?.type === 'done' && j.data.messages.length === before.length && j.data.messages.at(-1).id !== before.at(-1).id, '재생성: 마지막 응답 교체');
  s = await stream(`/api/conversations/${convId}/messages`, { content: '' });
  j = await jreq('GET', `/api/conversations/${convId}`);
  ok(s.events.at(-1)?.type === 'done' && j.data.messages.length === before.length + 1, '이어서 말하기 (빈 입력)');
  const userMsg = j.data.messages.find((m) => m.role === 'user');
  j = await jreq('PATCH', `/api/messages/${userMsg.id}`, { content: '수정된 질문', truncateAfter: true });
  j = await jreq('GET', `/api/conversations/${convId}`);
  ok(j.data.messages.at(-1).content === '수정된 질문' && j.data.messages.length === 2, '메시지 수정 + 이후 삭제');
  s = await stream(`/api/conversations/${convId}/regenerate`, {});
  lc = await lastChat();
  ok(s.events.at(-1)?.type === 'done' && lc.messages.at(-1).content === '수정된 질문', '수정 후 재생성은 사용자 메시지를 지우지 않음');

  console.log('\n[7] 중단 / 동시 요청 / 연결 끊김');
  let stopped = false;
  const slowP = stream(`/api/conversations/${convId}/messages`, { content: '천천히 말해줘' }, {
    onEvent: async (e) => {
      if (e.type === 'delta' && !stopped) {
        stopped = true;
        const conc = await jreq('POST', `/api/conversations/${convId}/messages`, { content: '동시에' });
        ok(conc.status === 409, '같은 대화 동시 생성 차단(409)', conc);
        await sleep(400);
        await jreq('POST', `/api/conversations/${convId}/stop`, {});
      }
    },
  });
  s = await slowP;
  ok(s.events.at(-1)?.type === 'stopped', '중단 요청 → stopped 이벤트', s.events.map((e) => e.type).slice(-3));
  j = await jreq('GET', `/api/conversations/${convId}`);
  let last = j.data.messages.at(-1);
  ok(last.status === 'partial' && last.content.length > 0 && last.content.length < 60, '중단 시 부분 응답 저장', last);
  ok(!j.data.messages.some((m) => m.content === '동시에'), '거부된 동시 요청의 사용자 메시지는 저장되지 않음', j.data.messages.map((m) => m.content));

  const ac = new AbortController();
  const dcP = stream(`/api/conversations/${convId}/messages`, { content: '천천히 이야기해' }, { signal: ac.signal, onEvent: (e) => e.type === 'delta' && setTimeout(() => ac.abort(), 300) });
  await dcP;
  await sleep(800);
  j = await jreq('GET', `/api/conversations/${convId}`);
  last = j.data.messages.at(-1);
  ok(last.role === 'assistant' && last.status === 'partial' && last.content.length > 0, '클라이언트 연결 끊김 → 부분 저장 + 생성 중단', last);
  s = await stream(`/api/conversations/${convId}/messages`, { content: '다시 말해' });
  ok(s.events.at(-1)?.type === 'done', '연결 끊김 후 잠금 해제되어 다시 생성 가능');

  console.log('\n[8] 모델 오류 처리');
  await jreq('PATCH', `/api/conversations/${convId}`, { model: 'not-installed:7b' });
  s = await stream(`/api/conversations/${convId}/messages`, { content: '안녕' });
  ok(s.events.at(-1)?.type === 'error' && /not found/.test(s.events.at(-1).error), '설치 안 된 모델 → 오류 이벤트', s.events.at(-1));
  await jreq('PATCH', `/api/conversations/${convId}`, { model: null });
  await jreq('PUT', '/api/settings', { ollamaUrl: 'http://127.0.0.1:1' });
  s = await stream(`/api/conversations/${convId}/messages`, { content: '안녕' });
  ok(s.events.at(-1)?.type === 'error' && /연결할 수 없습니다/.test(s.events.at(-1).error), 'Ollama 꺼짐 → 한국어 안내 오류');
  j = await jreq('GET', '/api/ollama/status');
  ok(j.data.online === false, '상태 API: offline');
  await jreq('PUT', '/api/settings', { ollamaUrl: MOCK });

  console.log('\n[9] 아바타 업로드');
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');
  let fd = new FormData();
  fd.append('file', new Blob([png], { type: 'image/png' }), 'a.png');
  j = await jreq('POST', `/api/characters/${charId}/avatar`, fd);
  ok(j.status === 200 && /\.png$/.test(j.data.avatar), 'PNG 업로드', j);
  r = await req('GET', `/api/files/avatars/${j.data.avatar}`);
  ok(r.status === 200 && r.headers.get('content-type') === 'image/png', '아바타 조회 (인증 필요)');
  r = await req('GET', `/api/files/avatars/${j.data.avatar}`, undefined, { noCookie: true });
  ok(r.status === 401, '미인증 아바타 조회 차단');
  fd = new FormData();
  fd.append('file', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'x.png');
  j = await jreq('POST', `/api/characters/${charId}/avatar`, fd);
  ok(j.status === 400, '이미지 위장 파일 거부 (시그니처 검사)');
  r = await req('GET', '/api/files/avatars/..%2F..%2Fnoir.db');
  ok(r.status === 404, '경로 조작 차단');

  console.log('\n[10] 페이지 렌더링');
  for (const p of ['/', '/settings', '/characters/new', `/characters/${charId}`, `/chat/${convId}`]) {
    r = await req('GET', p);
    const html = await r.text();
    ok(r.status === 200 && html.includes('NOIR') || html.includes('N<i>O</i>IR'), `GET ${p} 200`, r.status);
  }
  r = await req('GET', '/');
  ok((await r.text()).includes('서아'), '홈에 캐릭터 표시');

  console.log('\n[11] 로그인 제한 / 비밀번호 재설정 / 로그아웃');
  cookie = '';
  j = await jreq('POST', '/api/auth/login', { password: 'wrong-password' });
  ok(j.status === 401, '틀린 비밀번호 401');
  for (let i = 0; i < 7; i++) await jreq('POST', '/api/auth/login', { password: 'wrong-password' });
  j = await jreq('POST', '/api/auth/login', { password: PW });
  ok(j.status === 429, '8회 실패 후 올바른 비밀번호도 잠금(429)');
  execFileSync('node', ['scripts/reset-password.mjs'], { cwd: ROOT, env: { ...process.env, NOIR_DATA_DIR: DATA, NOIR_NEW_PASSWORD: 'brand-new-password' } });
  r = await req('GET', '/api/characters', undefined, { noCookie: true, headers: { cookie: setupCookie } });
  ok(r.status === 401, '재설정 후 기존 세션 무효화');
  j = await jreq('POST', '/api/auth/login', { password: 'brand-new-password' });
  ok(j.status === 200 && cookie, '재설정 비밀번호로 로그인 (잠금 해제)');
  j = await jreq('POST', '/api/auth/password', { current: 'brand-new-password', next: 'third-password-xyz' });
  ok(j.status === 200, '비밀번호 변경');
  const c2 = cookie;
  j = await jreq('POST', '/api/auth/logout', {});
  r = await req('GET', '/api/characters', undefined, { noCookie: true, headers: { cookie: c2 } });
  ok(r.status === 401, '로그아웃 후 세션 무효');

  console.log('\n[12] 삭제 연쇄');
  await jreq('POST', '/api/auth/login', { password: 'third-password-xyz' });
  j = await jreq('DELETE', `/api/characters/${charId}`);
  ok(j.status === 200, '캐릭터 삭제');
  j = await jreq('GET', `/api/conversations/${convId}`);
  ok(j.status === 404, '캐릭터 삭제 시 대화도 삭제(CASCADE)');
}

main()
  .catch((e) => {
    failures++;
    console.error('FATAL', e);
  })
  .finally(() => {
    for (const p of procs) p.kill();
    fs.rmSync(DATA, { recursive: true, force: true });
    console.log(`\n결과: ${passes} 통과, ${failures} 실패`);
    process.exit(failures ? 1 : 0);
  });
