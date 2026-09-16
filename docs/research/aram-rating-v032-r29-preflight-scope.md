# R29 preflight scope

Before the user's physical run, GitHub-side work may safely include:

1. Static dependency and policy checks for R19/R26/R27/R29.
2. CI dry-runs and self-tests that do not depend on installed local state.
3. Cleanup of stale CI/test-harness assumptions that are demonstrably unrelated to runtime behavior.
4. Documentation of blocker-driven next steps.

It may **not** substitute synthetic or CI state for:

- the user's installed v0.16.0 app state,
- local shadow-evidence IndexedDB contents,
- local canonical checkpoint contents,
- the physical read-only R29 classification generated from those local states.

Therefore, any remaining physical step must be reported explicitly rather than marked complete from CI alone.
