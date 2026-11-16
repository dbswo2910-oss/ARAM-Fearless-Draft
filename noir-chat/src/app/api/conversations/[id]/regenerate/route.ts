import { HttpError } from '@/lib/api';
import { authed } from '@/lib/route';
import { deleteMessage, listMessages, mustGetConversation } from '@/lib/repo';
import { isGenerating, streamAssistantReply } from '@/lib/generate';

/** 마지막 캐릭터 응답을 지우고 다시 생성 */
export const POST = authed<{ id: string }>((req, { id }) => {
  mustGetConversation(id);
  if (isGenerating(id)) throw new HttpError(409, '이 대화에서 이미 응답을 생성 중입니다.');
  const msgs = listMessages(id);
  const last = msgs[msgs.length - 1];
  if (!last) throw new HttpError(400, '재생성할 메시지가 없습니다.');
  if (last.role === 'assistant') {
    if (msgs.length === 1) throw new HttpError(400, '첫 인사말은 재생성할 수 없습니다.');
    deleteMessage(last.id);
  }
  return streamAssistantReply(id, req.signal);
});
