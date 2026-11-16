import { requirePageAuth } from '@/lib/auth';
import TopBar from '@/components/TopBar';
import CharacterForm from '@/components/CharacterForm';
import { getSettings } from '@/lib/settings';

export default async function NewCharacterPage() {
  await requirePageAuth();
  const s = getSettings();
  return (
    <div className="shell">
      <TopBar />
      <main className="page page-narrow">
        <div className="page-head"><div><h1>새 캐릭터</h1><p>모든 캐릭터는 만 19세 이상 성인이어야 합니다.</p></div></div>
        <CharacterForm adultModeOn={s.adultMode} />
      </main>
    </div>
  );
}
