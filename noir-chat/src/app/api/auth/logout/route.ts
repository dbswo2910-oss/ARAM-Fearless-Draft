import type { NextRequest } from 'next/server';
import { checkOrigin, errorResponse, json, readJson } from '@/lib/api';
import { deleteAllSessions, deleteSession, SESSION_COOKIE, validateSessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    checkOrigin(req);
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const body = await readJson<{ all?: boolean }>(req, 1000).catch(() => ({ all: false }));
    if (body.all && validateSessionToken(token)) deleteAllSessions();
    else deleteSession(token);
    const res = json({ ok: true });
    res.cookies.set(SESSION_COOKIE, '', { path: '/', expires: new Date(0) });
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
