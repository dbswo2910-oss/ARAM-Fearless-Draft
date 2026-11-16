import { json, readJson } from '@/lib/api';
import { authed } from '@/lib/route';
import { createCharacter, listCharacters } from '@/lib/repo';

export const GET = authed(() => json(listCharacters()));
export const POST = authed(async (req) => json(createCharacter(await readJson(req)), 201));
