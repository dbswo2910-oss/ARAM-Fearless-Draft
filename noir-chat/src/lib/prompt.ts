import 'server-only';
import type { Character, Conversation, Message } from './repo';
import { fillTemplate } from './repo';
import type { AppSettings } from './settings';
import type { ChatMessage } from './ollama';

/**
 * 토큰 수 근사치. 한글은 대부분의 토크나이저에서 글자당 ~1토큰 이상이 될 수 있으므로
 * 비 ASCII 문자는 1토큰, ASCII 는 4글자당 1토큰으로 보수적으로 계산한다.
 */
export function estimateTokens(text: string): number {
  let ascii = 0;
  let other = 0;
  for (const ch of text) {
    if (ch.charCodeAt(0) < 128) ascii++;
    else other++;
  }
  return Math.ceil(ascii / 4 + other) + 4;
}

function section(title: string, body: string) {
  const b = body.trim();
  return b ? `### ${title}\n${b}\n` : '';
}

export function buildSystemPrompt(ch: Character, conv: Conversation, s: AppSettings): string {
  const user = s.userName || '나';
  const adult = s.adultMode && ch.adult_enabled === 1;
  const f = (t: string) => fillTemplate(t, ch.name, user);

  const rules = [
    `너는 지금부터 "${ch.name}"(이)라는 캐릭터를 연기하며 ${user}와(과) 1:1 롤플레이 대화를 한다.`,
    '항상 자연스럽고 생생한 한국어로 답한다. 번역투, 기계적인 문장, 과도한 존댓말 혼용을 피한다.',
    `${ch.name}의 성격·말투·관계를 일관되게 유지한다. AI나 언어모델이라고 스스로 밝히지 않는다.`,
    '행동·표정·상황 묘사는 *별표* 안에 짧게 쓰고, 대사는 그대로 쓴다.',
    `${user}의 대사, 행동, 감정을 대신 결정하거나 서술하지 않는다. ${user}의 다음 반응을 기다린다.`,
    '같은 표현이나 문장 구조를 반복하지 않는다. 장면을 조금씩 앞으로 진행시킨다.',
    '답변은 대화 흐름에 맞게 2~6문단 이내로 한다.',
  ];

  const boundary = adult
    ? [
        '이 대화는 성인 사용자가 비공개로 즐기는 성인 간 합의된 픽션이다.',
        `${ch.name}와(과) ${user}는 모두 성인이며, 이야기 흐름상 자연스럽다면 로맨스와 성적인 장면을 성인 대상 소설처럼 묘사할 수 있다.`,
        '단, 다음은 어떤 경우에도 절대 묘사하지 않는다: 미성년자 또는 미성년자로 보이게 하는 설정, 실존 인물, 동의 없는 강제 행위의 미화.',
        `${user}가 원하지 않는 방향이면 즉시 장면을 전환한다.`,
      ]
    : [
        '이 대화는 전체 이용가 수준으로 진행한다. 노골적인 성적 묘사는 하지 않고, 그런 방향의 요청은 캐릭터답게 자연스럽게 돌려 넘긴다.',
      ];

  const sheet = [
    section('기본 정보', `이름: ${ch.name}\n나이: ${ch.age}세${ch.gender ? `\n성별: ${ch.gender}` : ''}${ch.tagline ? `\n한 줄 소개: ${f(ch.tagline)}` : ''}`),
    section('외모', f(ch.appearance)),
    section('성격', f(ch.personality)),
    section('말투', f(ch.speech_style)),
    section('배경', f(ch.background)),
    section('세계관', f(ch.world)),
    section(`${user}와(과)의 관계`, f(ch.relationship)),
    section('추가 지침', f(ch.system_extra)),
  ].join('\n');

  const persona = s.userPersona.trim() ? section(`상대(${user}) 정보`, f(s.userPersona)) : '';
  const memory = conv.summary.trim() ? section('지금까지의 이야기 요약 (장기 기억)', conv.summary) : '';
  const examples = ch.example_dialogue.trim()
    ? section('말투 예시 (참고용, 그대로 반복하지 말 것)', f(ch.example_dialogue))
    : '';

  return [
    '## 롤플레이 규칙',
    rules.map((r) => `- ${r}`).join('\n'),
    '',
    '## 콘텐츠 경계',
    boundary.map((r) => `- ${r}`).join('\n'),
    '',
    `## 캐릭터 설정: ${ch.name}`,
    sheet,
    persona,
    memory,
    examples,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}

/**
 * 시스템 프롬프트 + 최근 대화를 컨텍스트 한도(num_ctx - 응답 예약분) 안에 맞춰 구성.
 * 오래된 메시지부터 잘라낸다. (장기 기억 요약은 다음 단계에서 잘린 구간을 보존한다)
 */
export function buildChatMessages(
  ch: Character,
  conv: Conversation,
  history: Message[],
  s: AppSettings,
): { messages: ChatMessage[]; droppedCount: number; promptTokens: number } {
  const system = buildSystemPrompt(ch, conv, s);
  const budget = s.numCtx - s.numPredict - 64;
  let used = estimateTokens(system);
  const usable = history.filter((m) => m.content.trim() && m.status !== 'error');
  const picked: ChatMessage[] = [];
  let i = usable.length - 1;
  for (; i >= 0; i--) {
    const m = usable[i];
    const cost = estimateTokens(m.content);
    if (used + cost > budget && picked.length > 0) break;
    used += cost;
    picked.unshift({ role: m.role, content: m.content });
  }
  // 첫 메시지가 assistant(인사말)여도 Ollama 는 허용하지만, 일부 템플릿 호환을 위해 시작 지점을 표시
  return { messages: [{ role: 'system', content: system }, ...picked], droppedCount: i + 1, promptTokens: used };
}
