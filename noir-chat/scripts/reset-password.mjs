// PC 에서 직접 실행: npm run reset-password
// 비밀번호를 재설정하고 모든 세션을 폐기한다. (서버가 실행 중이어도 동작)
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline/promises';

const dir = path.resolve(process.env.NOIR_DATA_DIR || path.join(process.cwd(), 'data'));
const file = path.join(dir, 'noir.db');
if (!fs.existsSync(file)) {
  console.error(`DB 가 없습니다: ${file}\n앱을 한 번 실행해 초기 설정을 진행하세요.`);
  process.exit(1);
}
let pw = process.env.NOIR_NEW_PASSWORD;
if (!pw) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  pw = await rl.question('새 비밀번호 (10자 이상): ');
  rl.close();
}
if (pw.length < 10) {
  console.error('10자 이상이어야 합니다.');
  process.exit(1);
}
const N = 32768, r = 8, p = 1;
const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(pw, salt, 64, { N, r, p, maxmem: 128 * 1024 * 1024 });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
const db = new Database(file);
const t = Date.now();
db.prepare(`INSERT INTO auth(id, password_hash, created_at, updated_at) VALUES (1, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, updated_at = excluded.updated_at`).run(hash, t, t);
db.prepare('DELETE FROM sessions').run();
db.prepare('DELETE FROM login_failures').run();
db.close();
console.log('비밀번호를 재설정했고 모든 기기를 로그아웃했습니다.');
