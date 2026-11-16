import { requirePageAuth } from '@/lib/auth';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Avatar from '@/components/Avatar';
import StartChatButton from '@/components/StartChatButton';
import { avatarUrl, timeAgo } from '@/components/format';
import { listCharacters, listConversations } from '@/lib/repo';
import { getSettings } from '@/lib/settings';

export default async function Home() {
  await requirePageAuth();
  const chars = listCharacters();
  const convs = listConversations().slice(0, 8);
  const s = getSettings();

  return (
    <div className="shell">
      <TopBar />
      <main className="page">
        <div className="page-head">
          <div>
            <h1>오늘은 누구와 이야기할까요</h1>
            <p>
              {s.defaultModel ? <>기본 모델 <b>{s.defaultModel}</b></> : <Link href="/settings" className="error-text">설정에서 AI 모델을 먼저 선택하세요 →</Link>}
              {s.adultMode && <span className="badge badge-adult" style={{ marginLeft: 8 }}>성인 모드</span>}
            </p>
          </div>
          <Link href="/characters/new" className="btn btn-primary">+ 새 캐릭터</Link>
        </div>

        {convs.length > 0 && (
          <>
            <div className="section-title">이어서 대화하기</div>
            <div className="conv-list">
              {convs.map((c) => (
                <Link key={c.id} href={`/chat/${c.id}`} className="card conv-row">
                  <Avatar name={c.character_name} avatar={c.character_avatar} size={42} />
                  <div className="body">
                    <div className="title">{c.title}</div>
                    <div className="last">{c.last_message || '…'}</div>
                  </div>
                  <time>{timeAgo(c.updated_at)}</time>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="section-title">내 캐릭터</div>
        {chars.length === 0 ? (
          <div className="card empty">
            <h2>아직 캐릭터가 없습니다</h2>
            <p>외모, 성격, 말투, 관계를 직접 설정해 첫 캐릭터를 만들어 보세요.</p>
            <Link href="/characters/new" className="btn btn-primary" style={{ marginTop: 12 }}>캐릭터 만들기</Link>
          </div>
        ) : (
          <div className="char-grid">
            {chars.map((c) => {
              const url = avatarUrl(c.avatar);
              return (
                <div key={c.id} className="card char-card">
                  <div className="char-cover">
                    {url ? <img src={url} alt="" /> : <span className="initial">{c.name.slice(0, 1)}</span>}
                    <div className="char-badges">
                      {c.adult_enabled === 1 && <span className="badge badge-adult">19</span>}
                      {c.conversation_count > 0 && <span className="badge">대화 {c.conversation_count}</span>}
                    </div>
                    <div className="char-meta">
                      <h3>{c.name} <span className="faint" style={{ fontSize: 13, fontWeight: 400 }}>{c.age}</span></h3>
                      <p>{c.tagline || c.personality.slice(0, 60)}</p>
                    </div>
                  </div>
                  <div className="char-actions">
                    <StartChatButton characterId={c.id} />
                    <Link href={`/characters/${c.id}`} className="btn btn-sm btn-ghost">편집</Link>
                  </div>
                </div>
              );
            })}
            <Link href="/characters/new" className="new-card">
              <div><div className="plus">+</div>새 캐릭터</div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
