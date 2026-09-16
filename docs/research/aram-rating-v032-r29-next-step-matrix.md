# ARAM Rating v0.3.2 — R29 next-step matrix

Use this matrix only after a physical R29 report has been produced from the installed app.

| R29 result | Meaning | Next action |
|---|---|---|
| `WAIT_FOR_STRUCTURAL_EVIDENCE` | Required evidence shape is incomplete (for example, no-cold-start sample or second eligible patch). | Keep production activation OFF. Wait for the specified structural trigger; do not rerun blindly. |
| `MODEL_EVIDENCE_REVIEW_REQUIRED` | Existing data exposes a model-quality blocker. | Keep production activation OFF. Perform offline model/tuning/rejection work targeted to the blocker before collecting more data. |
| `HOLD_SHADOW` | No decisive blocker, but evidence is not strong enough for manual promotion review. | Continue passive shadow observation only after meaningful new evidence. |
| `READY_FOR_MANUAL_REVIEW` | Predeclared evidence gates are satisfied. | Review the evidence manually. This does **not** authorize automatic production activation. |

## Blocker-specific follow-up

- `NEED_MORE_NO_COLD_START_TEST_MATCHES`: wait until enough genuinely new no-cold-start test matches exist.
- `NEED_SECOND_ELIGIBLE_PATCH`: wait for an additional eligible patch with sufficient test matches; same-patch bulk cannot satisfy this.
- `NO_COLD_START_PERFORMANCE_NOT_BETTER_THAN_50`: inspect/tune cold-start behavior offline.
- `BOOTSTRAP_NOT_CLEAR_VS_RUNNER`: run an information/power analysis and favor independent future evidence; do not spam duplicate collection.
- `DOES_NOT_BEAT_50_LOG_LOSS` or `DOES_NOT_BEAT_50_BRIER`: treat predictive edge as inadequate and tune/reject before more collection.
- `CALIBRATION_TOO_WEAK`: target calibration offline without tuning on the frozen holdout.
- `TEST_SAMPLE_INSUFFICIENT`: collect only enough new independent test evidence to meet the declared sample gate.
- `MULTI_PATCH_PERFORMANCE_NOT_ROBUST`: investigate patch heterogeneity and gather future-patch evidence rather than more same-patch volume.

Production activation and automatic promotion remain disabled in every branch of this matrix until a separate explicit manual cutover decision is made.
