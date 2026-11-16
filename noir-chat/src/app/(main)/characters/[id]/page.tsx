import { requirePageAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import TopBar from '@/components/TopBar';
import CharacterForm from '@/components/CharacterForm';
import StartChatButton from '@/components/StartChatButton';
import { getCharacter } from '@/lib/repo';
import { getSettings } from '@/lib/settings';

export default async function EditCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAuth();
  const { id } = await params;
  const c = getCharacter(id);
  if (!c) notFound();
  return (
    <div className="shell">
      <TopBar />
      <main className="page page-narrow">
        <div className="page-head"><div><h1>{c.name}</h1><p>캐릭터 설정 편집</p></div><StartChatButton characterId={c.id} label="새 대화 시작" className="btn btn-primary" /></div>
        <CharacterForm initial={c} adultModeOn={getSettings().adultMode} />
      </main>
    </div>
  );
}
