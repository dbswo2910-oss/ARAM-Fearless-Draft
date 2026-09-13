# v0.15.126 — 전적검색 명칭 통일

- 사용자 화면의 `매치 랩` / `매치랩` / `Match Lab` 기능명을 `전적검색`으로 통일합니다.
- 상단 내비게이션의 기존 `LAB` 보조 배지는 유지합니다.
- 변경 범위는 `#history` 전적 화면과 해당 상단 내비게이션의 표시 문구뿐입니다.
- 내부 `match-lab-*`, `historyMatchDetail`, 저장 키, 전적 수집/검색 함수와 파일명은 변경하지 않습니다.
- 전적 수집, Riot Grade, AutoSync, RANDOM, DATA, 추천/점수 로직은 변경하지 않습니다.
- MutationObserver / setInterval 기반 UI 수리 루프를 추가하지 않습니다.
