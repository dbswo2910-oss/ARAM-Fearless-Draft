import { HttpError, json } from '@/lib/api';
import { authed } from '@/lib/route';
import { mustGetCharacter, setCharacterAvatar } from '@/lib/repo';
import { removeAvatarFile, saveAvatar } from '@/lib/files';

type P = { id: string };

export const POST = authed<P>(async (req, { id }) => {
  const ch = mustGetCharacter(id);
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) throw new HttpError(400, '이미지 파일이 없습니다.');
  const name = await saveAvatar(Buffer.from(await file.arrayBuffer()));
  setCharacterAvatar(id, name);
  if (ch.avatar) removeAvatarFile(ch.avatar);
  return json({ avatar: name });
});

export const DELETE = authed<P>((_req, { id }) => {
  const ch = mustGetCharacter(id);
  setCharacterAvatar(id, null);
  if (ch.avatar) removeAvatarFile(ch.avatar);
  return json({ ok: true });
});
