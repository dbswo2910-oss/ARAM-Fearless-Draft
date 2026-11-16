import { HttpError, json, readJson } from '@/lib/api';
import { authed } from '@/lib/route';
import { createConversation, listConversations } from '@/lib/repo';
import { getSettings } from '@/lib/settings';

export const GET = authed((req) => {
  const characterId = req.nextUrl.searchParams.get('characterId') || undefined;
  return json(listConversations(characterId));
});

export const POST = authed(async (req) => {
  const body = await readJson<{ characterId?: string }>(req);
  if (typeof body.characterId !== 'string') throw new HttpError(400, 'characterId 가 필요합니다.');
  return json(createConversation(body.characterId, getSettings().userName), 201);
});
