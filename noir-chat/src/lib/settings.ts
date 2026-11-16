import 'server-only';
import { db } from './db';

export interface AppSettings {
  ollamaUrl: string;
  defaultModel: string;
  numCtx: number;
  numPredict: number;
  keepAlive: string;
  temperature: number;
  topP: number;
  repeatPenalty: number;
  adultMode: boolean;
  userName: string;
  userPersona: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  defaultModel: '',
  // 12GB VRAM 기준: 12~14B Q4 모델 + 8K 컨텍스트가 안전한 기본값
  numCtx: 8192,
  numPredict: 700,
  keepAlive: '15m',
  temperature: 0.85,
  topP: 0.92,
  repeatPenalty: 1.08,
  adultMode: false,
  userName: '나',
  userPersona: '',
};

const LIMITS = {
  numCtx: [2048, 32768],
  numPredict: [64, 4096],
  temperature: [0, 2],
  topP: [0.05, 1],
  repeatPenalty: [0.8, 2],
} as const;

export function getSettings(): AppSettings {
  const rows = db().prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const out: AppSettings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.key in out) {
      try {
        (out as unknown as Record<string, unknown>)[r.key] = JSON.parse(r.value);
      } catch {
        /* ignore malformed */
      }
    }
  }
  return out;
}

function clamp(n: number, [lo, hi]: readonly [number, number]) {
  return Math.min(hi, Math.max(lo, n));
}

/** Validates and persists a partial settings update. Returns the merged settings. */
export function updateSettings(patch: Record<string, unknown>): AppSettings {
  const cur = getSettings();
  const next: AppSettings = { ...cur };
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

  if (patch.ollamaUrl !== undefined) {
    const u = str(patch.ollamaUrl, 300)?.trim();
    if (!u || !/^https?:\/\/[^\s]+$/i.test(u)) throw new Error('Ollama 주소 형식이 올바르지 않습니다.');
    next.ollamaUrl = u.replace(/\/+$/, '');
  }
  if (patch.defaultModel !== undefined) next.defaultModel = str(patch.defaultModel, 200) ?? cur.defaultModel;
  if (patch.keepAlive !== undefined) {
    const k = str(patch.keepAlive, 20)?.trim() ?? '';
    if (!/^(-?\d+|\d+[smh])$/.test(k)) throw new Error('keep_alive 형식 예: 15m, 1h, 0, -1');
    next.keepAlive = k;
  }
  for (const key of ['numCtx', 'numPredict', 'temperature', 'topP', 'repeatPenalty'] as const) {
    const v = num(patch[key]);
    if (v !== undefined) {
      const c = clamp(v, LIMITS[key]);
      (next as unknown as Record<string, number>)[key] = key === 'numCtx' || key === 'numPredict' ? Math.round(c) : c;
    }
  }
  if (patch.adultMode !== undefined) next.adultMode = patch.adultMode === true;
  if (patch.userName !== undefined) next.userName = (str(patch.userName, 40) ?? '').trim() || '나';
  if (patch.userPersona !== undefined) next.userPersona = str(patch.userPersona, 2000) ?? '';

  const stmt = db().prepare(
    'INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );
  db().transaction(() => {
    for (const [k, v] of Object.entries(next)) stmt.run(k, JSON.stringify(v));
  })();
  return next;
}
