# v0.15.123 — Startup Patch Notes Notice

- Show a startup modal when the currently registered ARAM patch-notes version has not been dismissed.
- `패치노트 보러가기` routes through the existing DATA owner and opens DATA > 패치노트.
- `다시 보지 않기` stores only the current patch-notes version, so a newly registered patch version is eligible to show again automatically.
- Closing the modal or opening Patch Notes does not permanently suppress future launches; only the explicit do-not-show action does.
- No recommendation, ROLE, RANDOM, Riot Grade, AutoSync, item, champion, or scoring logic is changed.
- Preserve v0.15.122 Riot Grade accuracy, v0.15.121 RANDOM restore, v0.15.120 DATA submenu ownership, v0.15.119 AutoSync concurrency, v0.15.118 lifecycle, v0.15.117 state integrity, and v0.15.79 permanent safety contracts.
