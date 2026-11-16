import { HttpError, json, readJson } from '@/lib/api';
import { authed } from '@/lib/route';
import { deleteAllSessions, getPasswordHash, setPassword, validateNewPassword, verifyPassword, createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

/** 비밀번호 변경: 기존 세션 전부 폐기 후 현재 기기에 새 세션 발급 */
export const POST = authed(async (req) => {
  const body = await readJson<{ current?: string; next?: string }>(req, 2000);
  const hash = getPasswordHash()!;
  if (typeof body.current !== 'string' || !(await verifyPassword(body.current, hash)))
    throw new HttpError(401, '현재 비밀번호가 올바르지 않습니다.');
  await setPassword(validateNewPassword(body.next));
  deleteAllSessions();
  const { token, expires } = createSession(req.headers.get('user-agent'));
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expires));
  return res;
});
