import type { NextRequest } from 'next/server';
import { checkOrigin, errorResponse, HttpError, json, readJson } from '@/lib/api';
import { createSession, isSetupDone, SESSION_COOKIE, sessionCookieOptions, setPassword, validateNewPassword } from '@/lib/auth';
import { updateSettings } from '@/lib/settings';

export async function GET() {
  return json({ setupDone: isSetupDone() });
}

/** 최초 1회: 비밀번호 생성 + 성인 확인. 이미 설정되었으면 거부. */
export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    if (isSetupDone()) throw new HttpError(409, '이미 초기 설정이 완료되었습니다.');
    const body = await readJson<{ password?: string; confirmAdult?: boolean; userName?: string }>(req);
    if (body.confirmAdult !== true) throw new HttpError(400, '만 19세 이상 성인만 사용할 수 있습니다.');
    const pw = validateNewPassword(body.password);
    await setPassword(pw);
    if (typeof body.userName === 'string' && body.userName.trim()) updateSettings({ userName: body.userName });
    const { token, expires } = createSession(req.headers.get('user-agent'));
    const res = json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expires));
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
