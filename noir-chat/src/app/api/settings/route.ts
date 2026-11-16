import { HttpError, json, readJson } from '@/lib/api';
import { authed } from '@/lib/route';
import { getSettings, updateSettings } from '@/lib/settings';

export const GET = authed(() => json(getSettings()));

export const PUT = authed(async (req) => {
  const body = await readJson(req);
  try {
    return json(updateSettings(body));
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : String(e));
  }
});
