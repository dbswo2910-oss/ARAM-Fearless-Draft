import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, validateSessionToken } from './auth';

import { HttpError } from './errors';

export { HttpError };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  const msg = e instanceof Error ? e.message : String(e);
  console.error('[api]', e);
  return json({ error: msg || '서버 오류' }, 500);
}

/** 상태 변경 요청에 대한 Origin 검사 (CSRF 방어; SameSite=Lax 쿠키와 이중 방어) */
export function checkOrigin(req: NextRequest) {
  if (req.method === 'GET' || req.method === 'HEAD') return;
  const origin = req.headers.get('origin');
  if (!origin) return; // 동일 출처 fetch 일부 환경은 Origin 미전송. 쿠키 SameSite=Lax 로 보호.
  const hosts = [req.headers.get('host'), ...(req.headers.get('x-forwarded-host') || '').split(',')]
    .map((h) => h?.trim())
    .filter(Boolean);
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, '잘못된 Origin');
  }
  if (!hosts.includes(originHost)) throw new HttpError(403, '허용되지 않은 출처의 요청입니다.');
}

/** API 라우트 공통 가드: Origin 검사 + 세션 검증 */
export function guard(req: NextRequest) {
  checkOrigin(req);
  if (!validateSessionToken(req.cookies.get(SESSION_COOKIE)?.value)) throw new HttpError(401, '로그인이 필요합니다.');
}

export async function readJson<T = Record<string, unknown>>(req: NextRequest, maxBytes = 200_000): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, '요청이 너무 큽니다.');
  try {
    const v = JSON.parse(text || '{}');
    if (typeof v !== 'object' || v === null) throw new Error();
    return v as T;
  } catch {
    throw new HttpError(400, 'JSON 형식이 올바르지 않습니다.');
  }
}

export function clientIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
}
