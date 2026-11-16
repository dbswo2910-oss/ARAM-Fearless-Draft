import { requirePageAuth } from '@/lib/auth';
import TopBar from '@/components/TopBar';
import SettingsView from '@/components/SettingsView';
import { getSettings } from '@/lib/settings';

export default async function SettingsPage() {
  await requirePageAuth();
  return (
    <div className="shell">
      <TopBar />
      <main className="page page-narrow">
        <div className="page-head"><div><h1>설정</h1><p>AI 엔진, 수위, 내 정보, 보안</p></div></div>
        <SettingsView initial={getSettings()} />
      </main>
    </div>
  );
}
