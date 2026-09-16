'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const required = [
  'tools/research/aram-rating-v032-r19-physical-shadow-rc.ps1',
  'tools/research/aram-rating-v032-r26-shadow-evidence-inspect.ps1',
  'tools/research/aram-rating-v032-r27-selection-gate-inspect.ps1',
  'tools/research/aram-rating-v032-r29-one-shot-evidence-refresh.ps1',
  'tools/research/aram-rating-v032-r29-finalize-evidence.js',
  'src/research/final-evidence-plan.js'
];

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) throw new Error(`missing required R29 dependency: ${rel}`);
}

const plan = require(path.join(root, 'src/research/final-evidence-plan.js'));
if (plan.production_active !== false) throw new Error('production_active must remain false');
if (plan.automatic_promotion !== false) throw new Error('automatic_promotion must remain false');

const cases = [
  {
    name: 'structural-only',
    input: {
      selection_status: 'no_clear_winner',
      conditions: { paired_bootstrap_clear_vs_runner: true, beats_50_log_loss: true, beats_50_brier: true, calibration_not_materially_worse: true, test_sample_sufficient: true, multi_patch_robustness: true },
      no_cold_start: { n: 10, log_loss: 0.68 },
      no_cold_start_constant_50: { log_loss: 0.69 },
      patch_robustness: { eligible_patches: 1 }
    },
    expected: 'WAIT_FOR_STRUCTURAL_EVIDENCE'
  },
  {
    name: 'model-evidence',
    input: {
      selection_status: 'no_clear_winner',
      conditions: { paired_bootstrap_clear_vs_runner: false, beats_50_log_loss: true, beats_50_brier: true, calibration_not_materially_worse: true, test_sample_sufficient: true, multi_patch_robustness: true },
      no_cold_start: { n: 40, log_loss: 0.68 },
      no_cold_start_constant_50: { log_loss: 0.69 },
      patch_robustness: { eligible_patches: 2 }
    },
    expected: 'MODEL_EVIDENCE_REVIEW_REQUIRED'
  },
  {
    name: 'manual-review',
    input: {
      selection_status: 'candidate_winner',
      conditions: { paired_bootstrap_clear_vs_runner: true, beats_50_log_loss: true, beats_50_brier: true, calibration_not_materially_worse: true, no_cold_start_improves: true, test_sample_sufficient: true, multi_patch_robustness: true },
      no_cold_start: { n: 40, log_loss: 0.68 },
      no_cold_start_constant_50: { log_loss: 0.69 },
      patch_robustness: { eligible_patches: 2 }
    },
    expected: 'READY_FOR_MANUAL_REVIEW'
  }
];

for (const c of cases) {
  const out = plan.buildFinalEvidencePlan(c.input);
  if (out.classification !== c.expected) throw new Error(`${c.name}: expected ${c.expected}, got ${out.classification}`);
  if (out.production_activation_authorized !== false) throw new Error(`${c.name}: production activation must remain false`);
  if (out.automatic_promotion !== false) throw new Error(`${c.name}: automatic promotion must remain false`);
  if (out.rerun_now_recommended !== false) throw new Error(`${c.name}: blind immediate rerun must remain false`);
}

console.log('R29 PREFLIGHT SELFCHECK: SUCCESS');
