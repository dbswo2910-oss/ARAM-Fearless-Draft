import { json } from '@/lib/api';
import { authed } from '@/lib/route';
import { listLoaded, unloadModel } from '@/lib/ollama';
import { getSettings } from '@/lib/settings';

/** 로드된 모든 LLM 을 VRAM 에서 내림 */
export const POST = authed(async () => {
  const s = getSettings();
  const loaded = await listLoaded(s.ollamaUrl);
  await Promise.all(loaded.map((m) => unloadModel(s.ollamaUrl, m.name)));
  return json({ unloaded: loaded.map((m) => m.name) });
});
