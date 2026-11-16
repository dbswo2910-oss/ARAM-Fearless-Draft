'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, streamRequest, type StreamEvent } from './client-api';
import Avatar from './Avatar';
import { timeAgo } from './format';

export type Msg = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  status: 'complete' | 'partial' | 'error';
  model?: string | null;
};
type Conv = { id: string; title: string; model: string | null; character_id: string };
type Char = { id: string; name: string; avatar: string | null; tagline: string; model: string | null; adult_enabled: number };
type ConvRow = { id: string; title: string; updated_at: number; last_message: string | null };

/** *행동 묘사* 를 기울임으로 표시. HTML 은 렌더링하지 않음(React 텍스트 노드 사용) */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.length > 2 && p.startsWith('*') && p.endsWith('*') ? <em key={i}>{p.slice(1, -1)}</em> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

export default function ChatView(props: {
  conversation: Conv;
  character: Char;
  initialMessages: Msg[];
  conversations: ConvRow[];
  defaultModel: string;
  userName: string;
}) {
  const { character } = props;
  const router = useRouter();
  const [conv, setConv] = useState(props.conversation);
  const [messages, setMessages] = useState<Msg[]>(props.initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stickRef = useRef(true);

  const effectiveModel = conv.model || character.model || props.defaultModel;

  useEffect(() => {
    api<{ online: boolean; models: { name: string }[] }>('/api/ollama/status')
      .then((s) => {
        setModels(s.models.map((m) => m.name));
        if (!s.online) setError('Ollama 에 연결할 수 없습니다. PC에서 Ollama 가 실행 중인지 확인하세요.');
      })
      .catch(() => {});
  }, []);

  // 사용자가 위로 스크롤해 읽는 중이면 자동 스크롤하지 않음
  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // textarea 자동 높이
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }, [input]);

  const reload = useCallback(async () => {
    const d = await api<{ messages: Msg[] }>(`/api/conversations/${conv.id}`);
    setMessages(d.messages);
  }, [conv.id]);

  const runStream = useCallback(
    async (path: string, body: unknown) => {
      setError('');
      setInfo('');
      setStreaming(true);
      stickRef.current = true;
      const ctl = new AbortController();
      abortRef.current = ctl;
      const tempId = -Date.now();
      setMessages((m) => [...m, { id: tempId, role: 'assistant', content: '', status: 'partial' }]);
      try {
        await streamRequest(
          path,
          body,
          (e: StreamEvent) => {
            if (e.type === 'start') {
              if (e.droppedCount > 0) setInfo(`오래된 메시지 ${e.droppedCount}개는 컨텍스트 한도로 이번 응답에 포함되지 않았습니다.`);
            } else if (e.type === 'delta') {
              setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, content: x.content + e.text } : x)));
            } else if (e.type === 'error') {
              setError(e.error);
            }
          },
          ctl.signal,
        );
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        abortRef.current = null;
        setStreaming(false);
        await reload().catch(() => {});
      }
    },
    [reload],
  );

  async function send() {
    const text = input.trim();
    if (streaming) return;
    if (!text) return;
    setInput('');
    setMessages((m) => [...m, { id: -1, role: 'user', content: text, status: 'complete' }]);
    await runStream(`/api/conversations/${conv.id}/messages`, { content: text });
  }

  async function stop() {
    await api(`/api/conversations/${conv.id}/stop`, { method: 'POST', body: {} }).catch(() => {});
    abortRef.current?.abort();
  }

  async function regenerate() {
    if (streaming) return;
    setMessages((m) => (m.length && m[m.length - 1].role === 'assistant' ? m.slice(0, -1) : m));
    await runStream(`/api/conversations/${conv.id}/regenerate`, {});
  }

  async function continueReply() {
    if (streaming) return;
    await runStream(`/api/conversations/${conv.id}/messages`, { content: '' });
  }

  async function saveEdit(regen: boolean) {
    if (!editing) return;
    const m = messages.find((x) => x.id === editing.id);
    if (!m) return;
    try {
      await api(`/api/messages/${editing.id}`, { method: 'PATCH', body: { content: editing.text, truncateAfter: regen } });
      setEditing(null);
      await reload();
      if (regen && m.role === 'user') await runStream(`/api/conversations/${conv.id}/regenerate`, {});
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeMessage(id: number) {
    if (!confirm('이 메시지를 삭제할까요?')) return;
    await api(`/api/messages/${id}`, { method: 'DELETE' });
    await reload();
  }

  async function changeModel(model: string) {
    const c = await api<Conv>(`/api/conversations/${conv.id}`, { method: 'PATCH', body: { model: model || null } });
    setConv(c);
  }

  async function newConversation() {
    const c = await api<{ id: string }>('/api/conversations', { body: { characterId: character.id } });
    router.push(`/chat/${c.id}`);
  }

  async function renameConversation() {
    const t = prompt('대화 제목', conv.title);
    if (!t) return;
    setConv(await api<Conv>(`/api/conversations/${conv.id}`, { method: 'PATCH', body: { title: t } }));
    router.refresh();
  }

  async function deleteConversation() {
    if (!confirm('이 대화를 삭제할까요? 되돌릴 수 없습니다.')) return;
    await api(`/api/conversations/${conv.id}`, { method: 'DELETE' });
    const next = props.conversations.find((c) => c.id !== conv.id);
    router.push(next ? `/chat/${next.id}` : '/');
    router.refresh();
  }

  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const lastIdx = messages.length - 1;

  return (
    <div className="chat-layout">
      <div className={`drawer-backdrop ${drawer ? 'open' : ''}`} onClick={() => setDrawer(false)} />
      <aside className={`chat-side ${drawer ? 'open' : ''}`}>
        <div className="chat-side-head">
          <Link href="/" className="wordmark" style={{ fontSize: 15 }}>N<i>O</i>IR</Link>
          <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={newConversation}>+ 새 대화</button>
        </div>
        <div className="chat-side-list">
          <div className="faint" style={{ fontSize: 12, padding: '6px 12px' }}>{character.name}와의 대화</div>
          {props.conversations.map((c) => (
            <Link key={c.id} href={`/chat/${c.id}`} className={c.id === conv.id ? 'active' : ''} onClick={() => setDrawer(false)}>
              {c.id === conv.id ? conv.title : c.title}
              <small>{timeAgo(c.updated_at)} · {c.last_message || '…'}</small>
            </Link>
          ))}
        </div>
        <div style={{ padding: 10, borderTop: '1px solid var(--line-soft)', display: 'flex', gap: 6 }}>
          <Link href={`/characters/${character.id}`} className="btn btn-sm btn-ghost">캐릭터 편집</Link>
          <Link href="/settings" className="btn btn-sm btn-ghost">설정</Link>
        </div>
      </aside>

      <section className="chat-main">
        <header className="chat-head">
          <button className="icon-btn only-mobile" aria-label="대화 목록" onClick={() => setDrawer(true)}>☰</button>
          <Avatar name={character.name} avatar={character.avatar} size={38} />
          <div className="who">
            <b>{character.name} {character.adult_enabled === 1 && <span className="badge badge-adult">19</span>}</b>
            <small>{conv.title}</small>
          </div>
          <select className="model-select" value={conv.model ?? ''} onChange={(e) => changeModel(e.target.value)} title="이 대화에서 사용할 모델">
            <option value="">{`기본: ${character.model || props.defaultModel || '미지정'}`}</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="icon-btn" title="제목 변경" onClick={renameConversation}>✎</button>
          <button className="icon-btn" title="대화 삭제" onClick={deleteConversation}>🗑</button>
        </header>

        <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
          <div className="chat-inner">
            {messages.length === 0 && (
              <div className="empty">
                <h2>{character.name}</h2>
                <p>{character.tagline || '첫 마디를 건네 보세요.'}</p>
              </div>
            )}
            {messages.map((m, i) => {
              const isStreamingMsg = streaming && i === lastIdx && m.role === 'assistant';
              const isEditing = editing?.id === m.id;
              return (
                <div key={m.id} className={`msg ${m.role} ${i === lastIdx ? 'last' : ''}`}>
                  {m.role === 'assistant' && <Avatar name={character.name} avatar={character.avatar} size={34} className="side" />}
                  <div className="bubble-wrap">
                    {isEditing ? (
                      <div className="msg-edit">
                        <textarea className="textarea" rows={5} value={editing.text} onChange={(e) => setEditing({ id: m.id, text: e.target.value })} />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button className="btn btn-sm btn-ghost" onClick={() => setEditing(null)}>취소</button>
                          <button className="btn btn-sm" onClick={() => saveEdit(false)}>저장</button>
                          {m.role === 'user' && <button className="btn btn-sm btn-primary" onClick={() => saveEdit(true)}>저장 후 다시 생성</button>}
                        </div>
                      </div>
                    ) : (
                      <div className="bubble">
                        {m.content ? <RichText text={m.content} /> : isStreamingMsg ? <span className="typing"><span /><span /><span /></span> : <span className="faint">(응답 없음)</span>}
                        {isStreamingMsg && m.content && <span className="cursor" />}
                      </div>
                    )}
                    {!isStreamingMsg && !isEditing && m.id > 0 && (
                      <div className="msg-tools">
                        {m.status === 'partial' && <span className="msg-status">중단됨</span>}
                        {m.status === 'error' && <span className="msg-status err">생성 실패</span>}
                        <button onClick={() => setEditing({ id: m.id, text: m.content })}>수정</button>
                        <button onClick={() => navigator.clipboard?.writeText(m.content)}>복사</button>
                        {i === lastIdx && m.role === 'assistant' && i > 0 && !streaming && <button onClick={regenerate}>↻ 다시</button>}
                        {i === lastIdx && m.role === 'assistant' && !streaming && <button onClick={continueReply}>이어서</button>}
                        {i === lastIdx && m.role === 'user' && !streaming && <button onClick={regenerate}>응답 받기</button>}
                        <button onClick={() => removeMessage(m.id)}>삭제</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="composer-wrap">
          {error && (
            <div className="banner">
              {error}
              <button className="btn btn-sm btn-ghost" onClick={() => setError('')}>닫기</button>
            </div>
          )}
          {info && !error && <div className="composer-hint" style={{ marginBottom: 6 }}>{info}</div>}
          <div className="composer">
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              placeholder={effectiveModel ? `${character.name}에게 메시지…` : '설정에서 모델을 먼저 선택하세요'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !coarse && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            {streaming ? (
              <button className="send stop" aria-label="생성 중지" onClick={stop}>■</button>
            ) : (
              <button className="send" aria-label="보내기" disabled={!input.trim() || !effectiveModel} onClick={send}>➤</button>
            )}
          </div>
          <div className="composer-hint">*행동 묘사*는 별표로 감싸세요 · {effectiveModel || '모델 미지정'}</div>
        </div>
      </section>
    </div>
  );
}
