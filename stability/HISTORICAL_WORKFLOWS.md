# Historical workflow retirement

The v0.16.0 CLEAN BASELINE stabilization branch retires 84 version-pinned v0.15.80–v0.15.134 GitHub Actions workflow definitions from the active workflow tree. Their source history remains permanently available in Git at the v0.15.135 Golden Baseline ancestor and earlier commits; the underlying audit scripts under `tools/` remain available for targeted/manual execution.

This is intentional CI cleanup, not product-code deletion. The active production distribution remains v0.15.135 while the stabilization branch is non-production.

Rules:
- Historical release/activation workflows must not auto-run against canonical v0.16.x development.
- Feature-level regression logic that is still valuable is promoted into the v0.16.0 Stability Foundation or a current feature workflow.
- Do not restore a historical activation workflow as a current owner.
- Git history is the source for historical release reproduction.

Golden reference: `2048d56ceec2317b4cef225f284443521005994d` (v0.15.135).
