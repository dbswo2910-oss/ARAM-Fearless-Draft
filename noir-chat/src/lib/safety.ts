/**
 * 콘텐츠 경계 규칙 (서버·클라이언트 공용).
 * - 모든 캐릭터는 성인(만 19세 이상)이어야 한다.
 * - 성인 모드 캐릭터 설정에 미성년자를 암시하는 표현을 허용하지 않는다.
 */
export const MIN_CHARACTER_AGE = 19;

const MINOR_TERMS_KO = [
  '미성년', '초등학생', '중학생', '고등학생', '초딩', '중딩', '고딩', '여중생', '남중생', '여고생', '남고생',
  '어린 소녀', '어린 소년', '사춘기 전',
];
const MINOR_TERMS_EN = ['minor', 'underage', 'under-age', 'loli', 'lolita', 'shota', 'preteen', 'pre-teen', 'schoolgirl', 'schoolboy', 'middle school', 'high school student', 'elementary school'];
// "17살", "15세" — 단 "3살 연상", "5살 차이", "17살 때" 같은 관계/과거 표현은 제외
const TEEN_AGE_RE = /(?:^|[^0-9])(1[0-8]|[1-9])\s*(?:살|세)(?![0-9])(?!\s*(?:연상|연하|차이|많|어린|위|아래|때|무렵|부터|에|이후|이전|전|후|까지))/;
const EN_TEEN_RE = /\b(thirteen|fourteen|fifteen|sixteen|seventeen|eighteen)[- ]year[- ]old\b|\b1[0-7][- ]?(?:yo|y\/o|years? old)\b/i;

export function findMinorIndicators(text: string): string[] {
  const hits = new Set<string>();
  const lower = text.toLowerCase();
  for (const t of MINOR_TERMS_KO) {
    // "고등학생 때부터 알던 사이", "중학생 시절" 처럼 과거를 언급하는 표현은 허용
    const re = new RegExp(`${t}(?!\\s*(?:때|시절|시기|이었|였던|였을|무렵))`);
    if (re.test(text)) hits.add(t);
  }
  for (const t of MINOR_TERMS_EN) {
    const re = new RegExp(`\\b${t.replace(/[-/]/g, '[- ]?')}\\b`, 'i');
    if (re.test(lower)) hits.add(t);
  }
  const m = text.match(TEEN_AGE_RE);
  if (m) hits.add(m[0].trim());
  const e = text.match(EN_TEEN_RE);
  if (e) hits.add(e[0]);
  return [...hits];
}
