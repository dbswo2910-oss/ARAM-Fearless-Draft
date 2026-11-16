import { HttpError, json, readJson } from '@/lib/api';
import { authed } from '@/lib/route';
import { deleteMessage, deleteMessagesAfter, editMessage, getMessage } from '@/lib/repo';

type P = { id: string };

function must(id: string) {
  const m = getMessage(Number(id));
  if (!m) throw new HttpError(404, '메시지를 찾을 수 없습니다.');
  return m;
}

/** 메시지 수정. truncateAfter=true 이면 이후 메시지를 삭제(수정 후 다시 생성 흐름) */
export const PATCH = authed<P>(async (req, { id }) => {
  const m = must(id);
  const body = await readJson<{ content?: string; truncateAfter?: boolean }>(req, 50_000);
  if (typeof body.content !== 'string' || !body.content.trim()) throw new HttpError(400, '내용을 입력하세요.');
  if (body.content.length > 8000) throw new HttpError(400, '8000자 이하로 입력하세요.');
  editMessage(m.id, body.content.trim());
  if (body.truncateAfter) deleteMessagesAfter(m.conversation_id, m.id);
  return json({ ok: true });
});

export const DELETE = authed<P>((_req, { id }) => {
  deleteMessage(must(id).id);
  return json({ ok: true });
});
