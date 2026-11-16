import 'server-only';
import { HttpError } from './api';
import { chatStream } from './ollama';
import { buildChatMessages } from './prompt';
import { addMessage, finalizeMessage, listMessages, mustGetCharacter, mustGetConversation, touchConversation } from './repo';
import { getSettings } from './settings';

// 대화당 동시 생성 1개로 제한 (GPU 1장 환경에서 중복 요청이 VRAM/속도를 잡아먹지 않도록)
const g = globalThis as unknown as { __noirActive?: Map<string, AbortController> };
const active = (g.__noirActive ??= new Map());

export function stopGeneration(conversationId: string): boolean {
  const c = active.get(conversationId);
  if (!c) return false;
  c.abort();
  return true;
}

export function isGenerating(conversationId: string): boolean {
  return active.has(conversationId);
}

export function resolveModel(conversationModel: string | null, characterModel: string | null, defaultModel: string) {
  return conversationModel || characterModel || defaultModel;
}

/**
 * 어시스턴트 응답을 생성하여 NDJSON 스트림으로 반환.
 * 이벤트: {type:"start", messageId, model} → {type:"delta", text}* → {type:"done", ...} | {type:"error", error}
 * 클라이언트 연결이 끊기거나 중단 요청 시 지금까지의 텍스트를 'partial' 로 저장.
 */
export function streamAssistantReply(conversationId: string, requestSignal: AbortSignal): Response {
  const conv = mustGetConversation(conversationId);
  const ch = mustGetCharacter(conv.character_id);
  const s = getSettings();
  const model = resolveModel(conv.model, ch.model, s.defaultModel);
  if (!model) throw new HttpError(400, '사용할 AI 모델이 지정되지 않았습니다. 설정에서 기본 모델을 선택하세요.');
  if (active.has(conversationId)) throw new HttpError(409, '이 대화에서 이미 응답을 생성 중입니다.');

  const history = listMessages(conversationId);
  const { messages, droppedCount, promptTokens } = buildChatMessages(ch, conv, history, s);
  const placeholder = addMessage(conversationId, 'assistant', '', 'partial', model);

  const ctl = new AbortController();
  active.set(conversationId, ctl);
  const onReqAbort = () => ctl.abort();
  requestSignal.addEventListener('abort', onReqAbort);

  const enc = new TextEncoder();
  let text = '';
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(JSON.stringify(obj) + '\n'));
        } catch {
          closed = true;
        }
      };
      send({ type: 'start', messageId: placeholder.id, model, droppedCount, promptTokens });
      let lastSave = Date.now();
      try {
        const stats = await chatStream(
          s.ollamaUrl,
          {
            model,
            messages,
            keep_alive: s.keepAlive,
            options: {
              temperature: ch.temperature ?? s.temperature,
              top_p: s.topP,
              repeat_penalty: s.repeatPenalty,
              num_ctx: s.numCtx,
              num_predict: s.numPredict,
            },
          },
          (delta) => {
            text += delta;
            send({ type: 'delta', text: delta });
            // 중간 저장 (프로세스가 죽어도 대부분 보존)
            if (Date.now() - lastSave > 2000) {
              finalizeMessage(placeholder.id, text, 'partial');
              lastSave = Date.now();
            }
          },
          ctl.signal,
        );
        const finalText = text.trim();
        if (!finalText) {
          finalizeMessage(placeholder.id, '', 'error');
          send({ type: 'error', error: '모델이 빈 응답을 반환했습니다.' });
        } else {
          finalizeMessage(placeholder.id, finalText, 'complete', stats.evalCount);
          send({ type: 'done', messageId: placeholder.id, evalCount: stats.evalCount, doneReason: stats.doneReason });
        }
      } catch (e) {
        if (ctl.signal.aborted) {
          finalizeMessage(placeholder.id, text.trim(), text.trim() ? 'partial' : 'error');
          send({ type: 'stopped', messageId: placeholder.id });
        } else {
          const msg = e instanceof Error ? e.message : String(e);
          finalizeMessage(placeholder.id, text.trim(), text.trim() ? 'partial' : 'error');
          send({ type: 'error', error: msg, messageId: placeholder.id });
        }
      } finally {
        active.delete(conversationId);
        requestSignal.removeEventListener('abort', onReqAbort);
        touchConversation(conversationId);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {}
        }
      }
    },
    cancel() {
      closed = true;
      ctl.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
