# v0.15.114 — RANDOM PICK INTEGRITY

This release is a corrective pass after the real Electron v0.15.113 screenshot exposed three remaining failures in RANDOM PICK.

## Fixed

- **Pool grade clipping** — tier/grade tokens such as `A+`, `D`, and `B` are now kept inside their candidate item instead of hanging outside the candidate panel.
- **Corrupted candidate names** — TOP5 candidate labels now prefer the engine combo source (`randomState.combos[index].sel`) rather than repeatedly re-parsing already-decorated DOM text. This prevents strings such as `케넨케케넨`.
- **DNA did not change when candidates changed** — selected-candidate DNA is now derived from that candidate's actual combo structure/parts first (`engage`, `frontline`, `poke`, protection/sustain, AOE/zone control, effective AD/AP), with the prior candidate model used only as a fallback.
- **Legacy layout conflict** — v0.15.114 is injected directly into `random-practice-focus-v01549.js`, the Random Practice lifecycle owner. It no longer relies on unrelated shell scripts to happen to mount at the correct time.
- **Decision panel width** — historical `.rp107Right/.rp112Right` compatibility wrappers are deliberately retained, but v0.15.114 forces them below the main candidate/TOP5 column at full usable width. Older repair code may move nodes back into that wrapper without recreating a microscopic third column.

## Safety

- Recommendation ranking and score calculation are unchanged.
- Item recommendation logic is unchanged.
- DATA views are unchanged.
- PICK / IN GAME separation is preserved.

`score_logic_changed:false`
`random_scoring_changed:false`
