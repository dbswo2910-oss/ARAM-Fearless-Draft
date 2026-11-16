import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMinorIndicators as f } from '../src/lib/safety.ts';

const cases: [string, boolean][] = [
  ['나보다 3살 연상인 직장 상사', false],
  ['고등학생 때부터 알던 소꿉친구', false],
  ['유치원 교사로 일한다', false],
  ['외동 딸 only child', false],
  ['27살 바리스타', false],
  ['중학생 시절 첫사랑', false],
  ['5살 차이 나는 연인', false],
  ['17살 여고생', true],
  ['그녀는 16세다', true],
  ['a 17 year old girl', true],
  ['loli 스타일', true],
  ['미성년자', true],
  ['현재 고등학생이다', true],
];

for (const [text, expected] of cases) {
  test(`minor indicator: ${text}`, () => {
    assert.equal(f(text).length > 0, expected, JSON.stringify(f(text)));
  });
}
