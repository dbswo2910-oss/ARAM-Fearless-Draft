import 'server-only';
import crypto from 'node:crypto';
import { db, now } from './db';
import { HttpError } from './api';
import { MIN_CHARACTER_AGE, findMinorIndicators } from './safety';

export interface Character {
  id: string;
  name: string;
  age: number;
  gender: string;
  tagline: string;
  appearance: string;
  personality: string;
  speech_style: string;
  background: string;
  world: string;
  relationship: string;
  greeting: string;
  example_dialogue: string;
  system_extra: string;
  tags: string;
  avatar: string | null;
  model: string | null;
  temperature: number | null;
  adult_enabled: number;
  created_at: number;
  updated_at: number;
}

export interface Conversation {
  id: string;
  character_id: string;
  title: string;
  model: string | null;
  summary: string;
  summary_upto: number;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: number;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'complete' | 'partial' | 'error';
  model: string | null;
  eval_count: number | null;
  created_at: number;
}

const newId = () => crypto.randomBytes(9).toString('base64url');

// ---------- Characters ----------
const TEXT_FIELDS: Record<string, number> = {
  name: 40,
  gender: 20,
  tagline: 120,
  appearance: 2000,
  personality: 2000,
  speech_style: 1500,
  background: 3000,
  world: 3000,
  relationship: 1500,
  greeting: 2000,
  example_dialogue: 3000,
  system_extra: 2000,
  tags: 200,
};

export function validateCharacterInput(input: Record<string, unknown>, partial = false) {
  const out: Partial<Character> = {};
  for (const [k, max] of Object.entries(TEXT_FIELDS)) {
    const v = input[k];
    if (v === undefined) continue;
    if (typeof v !== 'string') throw new HttpError(400, `${k} 는 문자열이어야 합니다.`);
    if (v.length > max) throw new HttpError(400, `${k} 는 ${max}자 이하로 입력하세요.`);
    (out as Record<string, unknown>)[k] = v.trim();
  }
  if (!partial || out.name !== undefined) {
    if (!out.name) throw new HttpError(400, '이름을 입력하세요.');
  }
  if (input.age !== undefined || !partial) {
    const age = Number(input.age);
    if (!Number.isInteger(age) || age < MIN_CHARACTER_AGE || age > 10000)
      throw new HttpError(400, `캐릭터 나이는 ${MIN_CHARACTER_AGE}세 이상의 정수여야 합니다. (성인 캐릭터만 허용)`);
    out.age = age;
  }
  if (input.model !== undefined) out.model = typeof input.model === 'string' && input.model ? input.model.slice(0, 200) : null;
  if (input.temperature !== undefined) {
    const t = input.temperature === null || input.temperature === '' ? null : Number(input.temperature);
    if (t !== null && (!Number.isFinite(t) || t < 0 || t > 2)) throw new HttpError(400, '온도는 0~2 사이여야 합니다.');
    out.temperature = t;
  }
  if (input.adult_enabled !== undefined) out.adult_enabled = input.adult_enabled ? 1 : 0;
  return out;
}

/** 성인 모드 캐릭터는 미성년자 암시 표현이 없어야 함 */
function assertAdultSafe(c: Partial<Character>) {
  if (!c.adult_enabled) return;
  const text = Object.keys(TEXT_FIELDS)
    .map((k) => (c as Record<string, unknown>)[k])
    .filter((v) => typeof v === 'string')
    .join('\n');
  const hits = findMinorIndicators(text);
  if (hits.length)
    throw new HttpError(
      400,
      `성인 모드 캐릭터 설정에 미성년자를 암시하는 표현이 있습니다: ${hits.join(', ')}. 성인 캐릭터로 수정하세요.`,
    );
}

export function listCharacters(): (Character & { conversation_count: number; last_active: number | null })[] {
  return db()
    .prepare(
      `SELECT c.*, COUNT(v.id) AS conversation_count, MAX(v.updated_at) AS last_active
       FROM characters c LEFT JOIN conversations v ON v.character_id = c.id
       GROUP BY c.id ORDER BY COALESCE(MAX(v.updated_at), c.updated_at) DESC`,
    )
    .all() as (Character & { conversation_count: number; last_active: number | null })[];
}

export function getCharacter(id: string): Character | undefined {
  return db().prepare('SELECT * FROM characters WHERE id = ?').get(id) as Character | undefined;
}

export function mustGetCharacter(id: string): Character {
  const c = getCharacter(id);
  if (!c) throw new HttpError(404, '캐릭터를 찾을 수 없습니다.');
  return c;
}

export function createCharacter(input: Record<string, unknown>): Character {
  const v = validateCharacterInput(input);
  assertAdultSafe(v);
  const id = newId();
  const t = now();
  const row: Character = {
    id,
    name: v.name!,
    age: v.age!,
    gender: v.gender ?? '',
    tagline: v.tagline ?? '',
    appearance: v.appearance ?? '',
    personality: v.personality ?? '',
    speech_style: v.speech_style ?? '',
    background: v.background ?? '',
    world: v.world ?? '',
    relationship: v.relationship ?? '',
    greeting: v.greeting ?? '',
    example_dialogue: v.example_dialogue ?? '',
    system_extra: v.system_extra ?? '',
    tags: v.tags ?? '',
    avatar: null,
    model: v.model ?? null,
    temperature: v.temperature ?? null,
    adult_enabled: v.adult_enabled ?? 0,
    created_at: t,
    updated_at: t,
  };
  const cols = Object.keys(row);
  db()
    .prepare(`INSERT INTO characters (${cols.join(',')}) VALUES (${cols.map((c) => '@' + c).join(',')})`)
    .run(row);
  return row;
}

export function updateCharacter(id: string, input: Record<string, unknown>): Character {
  const cur = mustGetCharacter(id);
  const v = validateCharacterInput(input, true);
  const merged = { ...cur, ...v, updated_at: now() };
  assertAdultSafe(merged);
  const cols = Object.keys(v).concat('updated_at');
  db()
    .prepare(`UPDATE characters SET ${cols.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`)
    .run({ ...merged, id });
  return merged;
}

export function setCharacterAvatar(id: string, avatar: string | null) {
  mustGetCharacter(id);
  db().prepare('UPDATE characters SET avatar = ?, updated_at = ? WHERE id = ?').run(avatar, now(), id);
}

export function deleteCharacter(id: string): Character {
  const c = mustGetCharacter(id);
  db().prepare('DELETE FROM characters WHERE id = ?').run(id);
  return c;
}

// ---------- Conversations ----------
export function listConversations(characterId?: string) {
  const sql = `SELECT v.*, c.name AS character_name, c.avatar AS character_avatar,
      (SELECT content FROM messages m WHERE m.conversation_id = v.id ORDER BY m.id DESC LIMIT 1) AS last_message,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = v.id) AS message_count
    FROM conversations v JOIN characters c ON c.id = v.character_id
    ${characterId ? 'WHERE v.character_id = ?' : ''}
    ORDER BY v.updated_at DESC LIMIT 200`;
  const stmt = db().prepare(sql);
  return (characterId ? stmt.all(characterId) : stmt.all()) as (Conversation & {
    character_name: string;
    character_avatar: string | null;
    last_message: string | null;
    message_count: number;
  })[];
}

export function getConversation(id: string): Conversation | undefined {
  return db().prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Conversation | undefined;
}

export function mustGetConversation(id: string): Conversation {
  const c = getConversation(id);
  if (!c) throw new HttpError(404, '대화를 찾을 수 없습니다.');
  return c;
}

export function createConversation(characterId: string, userName: string): Conversation {
  const ch = mustGetCharacter(characterId);
  const id = newId();
  const t = now();
  const title = `${ch.name}와의 대화`;
  db().transaction(() => {
    db()
      .prepare('INSERT INTO conversations (id, character_id, title, created_at, updated_at) VALUES (?,?,?,?,?)')
      .run(id, characterId, title, t, t);
    if (ch.greeting.trim()) {
      db()
        .prepare('INSERT INTO messages (conversation_id, role, content, status, created_at) VALUES (?,?,?,?,?)')
        .run(id, 'assistant', fillTemplate(ch.greeting, ch.name, userName), 'complete', t);
    }
  })();
  return mustGetConversation(id);
}

export function updateConversation(id: string, patch: { title?: unknown; model?: unknown }) {
  mustGetConversation(id);
  if (typeof patch.title === 'string') {
    const t = patch.title.trim().slice(0, 80);
    if (t) db().prepare('UPDATE conversations SET title = ? WHERE id = ?').run(t, id);
  }
  if (patch.model !== undefined) {
    const m = typeof patch.model === 'string' && patch.model ? patch.model.slice(0, 200) : null;
    db().prepare('UPDATE conversations SET model = ? WHERE id = ?').run(m, id);
  }
  return mustGetConversation(id);
}

export function deleteConversation(id: string) {
  mustGetConversation(id);
  db().prepare('DELETE FROM conversations WHERE id = ?').run(id);
}

export function touchConversation(id: string) {
  db().prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now(), id);
}

// ---------- Messages ----------
export function listMessages(conversationId: string): Message[] {
  return db().prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(conversationId) as Message[];
}

export function getMessage(id: number): Message | undefined {
  return db().prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message | undefined;
}

export function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  status: Message['status'] = 'complete',
  model: string | null = null,
): Message {
  const t = now();
  const r = db()
    .prepare('INSERT INTO messages (conversation_id, role, content, status, model, created_at) VALUES (?,?,?,?,?,?)')
    .run(conversationId, role, content, status, model, t);
  touchConversation(conversationId);
  return getMessage(Number(r.lastInsertRowid))!;
}

export function finalizeMessage(id: number, content: string, status: Message['status'], evalCount?: number) {
  db()
    .prepare('UPDATE messages SET content = ?, status = ?, eval_count = ? WHERE id = ?')
    .run(content, status, evalCount ?? null, id);
}

export function editMessage(id: number, content: string) {
  db().prepare("UPDATE messages SET content = ?, status = 'complete' WHERE id = ?").run(content, id);
}

export function deleteMessage(id: number) {
  db().prepare('DELETE FROM messages WHERE id = ?').run(id);
}

/** 해당 메시지 이후(포함 X)의 모든 메시지 삭제 — 수정 후 재생성 흐름용 */
export function deleteMessagesAfter(conversationId: string, id: number) {
  db().prepare('DELETE FROM messages WHERE conversation_id = ? AND id > ?').run(conversationId, id);
}

export function fillTemplate(text: string, charName: string, userName: string) {
  return text.replace(/\{\{\s*char\s*\}\}/gi, charName).replace(/\{\{\s*user\s*\}\}/gi, userName);
}
