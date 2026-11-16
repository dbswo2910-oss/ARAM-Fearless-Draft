import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, now } from './db';
import { HttpError } from './errors';

export const SESSION_COOKIE = 'noir_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일 (활동 시 연장)
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8; // 15분 동안 8회 실패 → 잠금 (단일 사용자이므로 전역 카운터)

const SCRYPT = { N: 32768, r: 8, p: 1, keyLen: 64, maxmem: 128 * 1024 * 1024 };

export const MIN_PASSWORD_LENGTH = 10;

function scrypt(password: string, salt: Buffer, N: number, r: number, p: number, keyLen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLen, { N, r, p, maxmem: SCRYPT.maxmem }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.keyLen);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scrypt(password, Buffer.from(saltB64, 'base64'), +N, +r, +p, expected.length);
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

export function validateNewPassword(pw: unknown): string {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD_LENGTH)
    throw new HttpError(400, `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
  if (pw.length > 256) throw new HttpError(400, '비밀번호가 너무 깁니다.');
  return pw;
}

export function isSetupDone(): boolean {
  return !!db().prepare('SELECT 1 FROM auth WHERE id = 1').get();
}

export function getPasswordHash(): string | null {
  const row = db().prepare('SELECT password_hash FROM auth WHERE id = 1').get() as { password_hash: string } | undefined;
  return row?.password_hash ?? null;
}

export async function setPassword(pw: string) {
  const h = await hashPassword(pw);
  const t = now();
  db()
    .prepare(
      `INSERT INTO auth(id, password_hash, created_at, updated_at) VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, updated_at = excluded.updated_at`,
    )
    .run(h, t, t);
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export function createSession(userAgent: string | null): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString('base64url');
  const t = now();
  const exp = t + SESSION_TTL_MS;
  db()
    .prepare('INSERT INTO sessions(token_hash, created_at, expires_at, last_seen, user_agent) VALUES (?,?,?,?,?)')
    .run(sha256(token), t, exp, t, (userAgent || '').slice(0, 300));
  return { token, expires: new Date(exp) };
}

export function validateSessionToken(token: string | undefined | null): boolean {
  if (!token || token.length > 100) return false;
  const h = sha256(token);
  const row = db().prepare('SELECT expires_at, last_seen FROM sessions WHERE token_hash = ?').get(h) as
    | { expires_at: number; last_seen: number }
    | undefined;
  const t = now();
  if (!row) return false;
  if (row.expires_at < t) {
    db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(h);
    return false;
  }
  // 슬라이딩 만료: 1시간에 한 번만 갱신 (쓰기 최소화)
  if (t - row.last_seen > 60 * 60 * 1000) {
    db().prepare('UPDATE sessions SET last_seen = ?, expires_at = ? WHERE token_hash = ?').run(t, t + SESSION_TTL_MS, h);
  }
  return true;
}

export function deleteSession(token: string | undefined) {
  if (token) db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function deleteAllSessions() {
  db().prepare('DELETE FROM sessions').run();
}

export function secureCookies(): boolean {
  return process.env.NOIR_SECURE_COOKIES === '1';
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: secureCookies(),
    path: '/',
    expires,
  };
}

// ---- 로그인 실패 제한 ----
export function loginLockRemainingMs(): number {
  const t = now();
  db().prepare('DELETE FROM login_failures WHERE at < ?').run(t - LOCK_WINDOW_MS);
  const rows = db().prepare('SELECT at FROM login_failures ORDER BY at ASC').all() as { at: number }[];
  if (rows.length < MAX_FAILURES) return 0;
  return rows[rows.length - MAX_FAILURES].at + LOCK_WINDOW_MS - t;
}

export function recordLoginFailure(ip: string | null) {
  db().prepare('INSERT INTO login_failures(at, ip) VALUES (?, ?)').run(now(), ip);
}

export function clearLoginFailures() {
  db().prepare('DELETE FROM login_failures').run();
}

// ---- 요청 단위 인증 헬퍼 ----
export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return validateSessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** 서버 컴포넌트(페이지)용: 미인증 시 로그인/초기설정 페이지로 이동 */
export async function requirePageAuth() {
  if (!isSetupDone()) redirect('/setup');
  if (!(await isAuthenticated())) redirect('/login');
}
