import { json } from '@/lib/api';
import { authed } from '@/lib/route';
import { listLoaded, listModels, ollamaVersion } from '@/lib/ollama';
import { getSettings } from '@/lib/settings';

export const GET = authed(async () => {
  const s = getSettings();
  const version = await ollamaVersion(s.ollamaUrl);
  if (!version) return json({ online: false, url: s.ollamaUrl, models: [], loaded: [] });
  const [models, loaded] = await Promise.all([listModels(s.ollamaUrl).catch(() => []), listLoaded(s.ollamaUrl).catch(() => [])]);
  return json({ online: true, url: s.ollamaUrl, version, models, loaded });
});
