import type { NextRequest } from 'next/server';
import { checkOrigin, clientIp, errorResponse, HttpError, json, readJson } from '@/lib/api';
import {
  clearLoginFailures, createSession, getPasswordHash, loginLockRemainingMs, recordLoginFailure,
  SESSION_COOKIE, sessionCookieOptions, verifyPassword,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const hash = getPasswordHash();
    if (!hash) throw new HttpError(409, '초기 설정이 필요합니다.');
    const lock = loginLockRemainingMs();
    if (lock > 0) throw new HttpError(429, `로그인 시도가 너무 많습니다. ${Math.ceil(lock / 60000)}분 후 다시 시도하세요.`);
    const body = await readJson<{ password?: string }>(req, 2000);
    const ok = typeof body.password === 'string' && (await verifyPassword(body.password, hash));
    if (!ok) {
      recordLoginFailure(clientIp(req));
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
      throw new HttpError(401, '비밀번호가 올바르지 않습니다.');
    }
    clearLoginFailures();
    const { token, expires } = createSession(req.headers.get('user-agent'));
    const res = json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expires));
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
