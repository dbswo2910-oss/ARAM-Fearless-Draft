import { json, readJson } from '@/lib/api';
import { authed } from '@/lib/route';
import { deleteConversation, listMessages, mustGetCharacter, mustGetConversation, updateConversation } from '@/lib/repo';
import { stopGeneration } from '@/lib/generate';

type P = { id: string };

export const GET = authed<P>((_req, { id }) => {
  const conversation = mustGetConversation(id);
  return json({ conversation, character: mustGetCharacter(conversation.character_id), messages: listMessages(id) });
});

export const PATCH = authed<P>(async (req, { id }) => json(updateConversation(id, await readJson(req))));

export const DELETE = authed<P>((_req, { id }) => {
  stopGeneration(id);
  deleteConversation(id);
  return json({ ok: true });
});
