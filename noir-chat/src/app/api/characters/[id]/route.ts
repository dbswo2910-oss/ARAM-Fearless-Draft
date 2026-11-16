import { json, readJson } from '@/lib/api';
import { authed } from '@/lib/route';
import { deleteCharacter, mustGetCharacter, updateCharacter } from '@/lib/repo';
import { removeAvatarFile } from '@/lib/files';

type P = { id: string };
export const GET = authed<P>((_req, { id }) => json(mustGetCharacter(id)));
export const PUT = authed<P>(async (req, { id }) => json(updateCharacter(id, await readJson(req))));
export const DELETE = authed<P>((_req, { id }) => {
  const c = deleteCharacter(id);
  if (c.avatar) removeAvatarFile(c.avatar);
  return json({ ok: true });
});
