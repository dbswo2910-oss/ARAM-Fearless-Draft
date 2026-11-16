import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { dataDir } from './db';
import { HttpError } from './api';

const MAX_AVATAR = 8 * 1024 * 1024;
const NAME_RE = /^[A-Za-z0-9_-]{10,40}\.(png|jpg|webp|gif)$/;
const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

function avatarDir() {
  const d = path.join(dataDir(), 'avatars');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/** 확장자가 아닌 실제 파일 시그니처로 형식 판별 */
export function sniffImage(buf: Buffer): keyof typeof TYPES | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.toString('ascii', 0, 4) === 'GIF8') return 'gif';
  return null;
}

export async function saveAvatar(buf: Buffer): Promise<string> {
  if (buf.length > MAX_AVATAR) throw new HttpError(413, '이미지는 8MB 이하만 가능합니다.');
  const ext = sniffImage(buf);
  if (!ext) throw new HttpError(400, 'PNG/JPG/WEBP/GIF 이미지만 업로드할 수 있습니다.');
  const name = `${crypto.randomBytes(12).toString('base64url')}.${ext}`;
  await fs.promises.writeFile(path.join(avatarDir(), name), buf);
  return name;
}

export function readAvatar(name: string): { data: Buffer; type: string } | null {
  if (!NAME_RE.test(name)) return null;
  const p = path.join(avatarDir(), name);
  if (!fs.existsSync(p)) return null;
  return { data: fs.readFileSync(p), type: TYPES[name.split('.').pop()!] };
}

export function removeAvatarFile(name: string) {
  if (!NAME_RE.test(name)) return;
  fs.rm(path.join(avatarDir(), name), { force: true }, () => {});
}
