import { authed } from '@/lib/route';
import { readAvatar } from '@/lib/files';
import { HttpError } from '@/lib/api';

export const GET = authed<{ name: string }>((_req, { name }) => {
  const f = readAvatar(name);
  if (!f) throw new HttpError(404, '파일 없음');
  return new Response(new Uint8Array(f.data), {
    headers: { 'Content-Type': f.type, 'Cache-Control': 'private, max-age=31536000, immutable' },
  });
});
