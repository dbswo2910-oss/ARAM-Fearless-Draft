import { HttpError, readJson } from '@/lib/api';
import { authed } from '@/lib/route';
import { addMessage, mustGetConversation } from '@/lib/repo';
import { isGenerating, streamAssistantReply } from '@/lib/generate';

/** 사용자 메시지 저장 후 캐릭터 응답을 스트리밍. content 가 비어 있으면 "이어서 말하기" */
export const POST = authed<{ id: string }>(async (req, { id }) => {
  mustGetConversation(id);
  const body = await readJson<{ content?: string }>(req, 50_000);
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (content.length > 8000) throw new HttpError(400, '메시지는 8000자 이하로 입력하세요.');
  if (isGenerating(id)) throw new HttpError(409, '이 대화에서 이미 응답을 생성 중입니다.');
  if (content) addMessage(id, 'user', content);
  return streamAssistantReply(id, req.signal);
});
