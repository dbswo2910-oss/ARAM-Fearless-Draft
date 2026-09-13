# NEW CHAT BOOTSTRAP

Use this when continuing ARAM Fearless Draft in a fresh ChatGPT/Codex/AI session.

## Copy/paste prompt

```text
칼바람 프로그램 계속 작업하자.
이전 채팅 기억이나 요약으로 현재 상태를 추측하지 말고 GitHub 저장소를 먼저 복원해.

반드시 이 순서로 확인해:
1) AGENTS.md
2) docs/CURRENT_STATE.md
3) update/current-state.json
4) update/manifest.json
5) docs/KNOWN_ISSUES.md
6) docs/AI_HANDOFF.md
7) 최신 main commit, 최근 merged PR, 관련 GitHub Actions 결과

작업 시작 전에 5줄 안팎으로 현재 활성 버전 / UI·state·resource·AutoSync owner / 아직 실제 Windows 검증이 남은 항목 / 다음 예정 작업 / 이번 요청이 scoring·UI·state·AutoSync 중 무엇을 건드리는지 먼저 확인해.

저장소와 기억이 충돌하면 저장소를 우선하고, 원인을 확인하기 전에는 패치하지 마.
기존 owner 위에 새 overlay/hotfix를 덧씌우지 말고 root cause와 active owner를 먼저 확인해.
CI만 통과했다고 실제 Electron 화면까지 정상이라고 단정하지 마.
시간이 오래 걸려도 속도보다 정확성과 회귀 방지를 우선해.
```

## Agent cold-start protocol

Before editing:

1. Treat `update/manifest.json` as the authoritative active distribution.
2. Use `docs/CURRENT_STATE.md` for the compact human handoff and `update/current-state.json` for machine-readable ownership/version state.
3. Read `docs/KNOWN_ISSUES.md` before proposing a fix so historical failure modes are not repeated.
4. Read `docs/AI_HANDOFF.md` only after the compact current-state files; it is intentionally long historical context.
5. Inspect the latest main commit and recent merged PR/CI rather than assuming the last chat ended at the latest release.
6. Before writing code, identify the current owner of the subsystem being changed.
7. After a release changes `update/manifest.json`, run `node tools/sync-current-state.js` before committing the release metadata.
8. Before declaring completion, run `node tools/ai-continuity-audit.js` plus the relevant feature audit and Full Regression Audit.

## Why this exists

Long development chats can lose details when a new conversation starts. This protocol makes the repository itself the durable project memory. Chat memory is useful context, but it is never authoritative over the current manifest, owner contracts, known-issue register, and CI state.
