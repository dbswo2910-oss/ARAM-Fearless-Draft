# v0.15.135 Golden Baseline

Status: **FROZEN / CURRENT REFACTORING TRUTH**

Frozen on: 2026-09-15 (Asia/Seoul)
Repository: `dbswo2910-oss/ARAM-Fearless-Draft`
Version: `0.15.135`
Golden source commit: `2048d56ceec2317b4cef225f284443521005994d`
Frozen branch: `baseline/v0.15.135-golden`
Production manifest: `update/manifest.json` → `0.15.135`
Package: `update/v0.15.135/package.json`
Electron entry: `update/v0.15.135/main-v015135.js`
Runtime stability source: `update/v0.15.135/runtime-source-stability-v015135.js`

## Purpose

This baseline is the comparison truth for the v0.16 canonical refactor. Refactoring work must preserve the observable behavior of v0.15.135 unless a later change is explicitly approved as intentional.

No feature work is part of this freeze. The baseline commit and frozen branch must not be rebased, force-moved, or reused as a development branch.

## Comparison scope

The following are frozen as the current reference behavior/state:

- overall renderer appearance and navigation behavior
- Draft behavior and recommendation output
- RANDOM PICK / IN GAME behavior, TOP5 and recommendation output
- DATA behavior including Patch Notes and Champion Tier List transitions
- Player Profile / Results / match-history behavior
- Item recommendation behavior
- persisted settings and storage identity
- LocalStorage / IndexedDB compatibility expectations
- Research checkpoint continuity, including the preserved 159-match checkpoint
- AutoSync observable state and behavior
- updater-visible version and package identity

This is a behavioral baseline, not permission to copy private local databases into the repository. User-local identifiers, PUUIDs, account data and private match caches remain outside Git.

## Real Windows acceptance

The user has confirmed the currently installed v0.15.135 on the real Windows PC as the working reference state. This user acceptance supersedes the older repository note that v0.15.135 visual acceptance was still pending for baseline-freeze purposes.

The freeze does **not** automatically convert unrelated long-soak or future-device checks into verified tests. Those can remain separately tracked until dedicated regression coverage exists.

## Integrity rules

1. `baseline/v0.15.135-golden` must remain anchored to `2048d56ceec2317b4cef225f284443521005994d`.
2. Production code is not to be edited as part of this freeze.
3. Any v0.16 refactor that changes a frozen output must either fail differential comparison or document an explicit intentional change.
4. Research storage must continue to read the existing 159-match checkpoint without destructive migration.
5. Storage identity, settings, history/cache compatibility and AutoSync state must not be silently reset.
6. The Golden branch is reference-only; active development continues elsewhere.

## Verification snapshot

- Golden branch vs release commit: **IDENTICAL** (`ahead_by=0`, `behind_by=0` at freeze time)
- Production manifest version on `main`: **0.15.135**
- Release package version: **0.15.135**
- Real Windows v0.15.135 user acceptance: **VERIFIED FOR GOLDEN BASELINE**
- Research 159-match continuity: **MUST PRESERVE**
- Runtime/feature changes introduced by this freeze: **NONE**

## Git tag

Canonical requested tag name: `golden-v0.15.135`.

The connected GitHub automation surface used for this maintenance session can create/update branches and repository files but does not expose tag creation. Therefore the immutable comparison reference is currently represented by the exact frozen branch plus full commit SHA above. When a tag-capable Git operation is available, create `golden-v0.15.135` pointing to the same release commit (or to a metadata-only freeze commit if the repository later standardizes that convention); do not retarget the frozen branch.
