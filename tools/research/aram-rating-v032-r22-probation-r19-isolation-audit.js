'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'audit-output','aram-rating-v032-r22-probation-r19-isolation-audit.json');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const main=read('update/v0.16.0/main-v0160.js');
const loader=read('update/v0.15.121/runtime-loader-v01579.js');
const builder=read('tools/research/aram-rating-v032-r18-build-installed-shadow-rc-kit.js');
const r19=read('tools/research/aram-rating-v032-r19-physical-shadow-rc.ps1');
const checks={
  runtime_loader_retries_safe_rt121:loader.includes('READINESS_MAX_ATTEMPTS=5')&&loader.includes('READINESS_RETRY_MS=750')&&loader.includes('reconcileReadiness'),
  runtime_loader_marks_only_after_retries:loader.indexOf('const reconciled=await reconcileReadiness')<loader.indexOf('if(!payload.ok){markFailure'),
  runtime_loader_persists_retry_diagnostics:loader.includes('attempts:reconciled.attempts')&&loader.includes('snapshots:reconciled.snapshots'),
  runtime_loader_preserves_failure_gate:loader.includes("markSafetyFailure({code:'SAFE-RT121',detail})")&&loader.includes('critical_runtime_readiness_gate:true'),
  production_main_hash_stable_shape:main.includes("const {app}=require('electron')")&&!main.includes('installProbationReadinessReconciler')&&!main.includes('ARAM_R19_DISABLE_COLD_START_PROMOTION'),
  builder_graceful_quit:builder.includes('requestGracefulQuit')&&builder.includes('app.quit()'),
  r19_temp_safety_isolation:r19.includes('Patch-TempSafetyIsolation')&&r19.includes('ARAM_R19_SAFETY_ROOT'),
  r19_temp_promotion_patch:r19.includes('Patch-TempColdStartPromotion')&&r19.includes("ARAM_R19_DISABLE_COLD_START_PROMOTION = '1'"),
  r19_observes_real_safety_state:r19.includes('Snapshot-SafetyFiles')&&r19.includes('production_safety_state_stable'),
  r19_success_requires_safety_stable:r19.includes('$success =')&&r19.includes('-and $safetyStable'),
  r19_graceful_exit_wait:r19.includes('$quitDeadline = (Get-Date).AddSeconds(6)'),
  production_scoring_untouched:loader.includes('score_logic_changed:false')&&loader.includes('random_scoring_changed:false')&&!r19.includes('production_score_changed=$true')
};
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
const report={
  status:failed.length?'FAILURE':'SUCCESS',
  stage:'R22_PROBATION_AND_R19_ISOLATION_AUDIT',
  checks,
  failed,
  files:{
    main_v0160:{sha256:sha(main),bytes:Buffer.byteLength(main)},
    runtime_loader_v015121:{sha256:sha(loader),bytes:Buffer.byteLength(loader)},
    r18_builder:{sha256:sha(builder),bytes:Buffer.byteLength(builder)},
    r19_harness:{sha256:sha(r19),bytes:Buffer.byteLength(r19)}
  },
  contract:{
    safe_rt121_transient_readiness_is_retried:true,
    persistent_safe_rt121_still_blocks_probation:true,
    production_main_manifest_hash_can_remain_unchanged:true,
    r19_real_update_safety_state_must_not_change:true,
    r19_cold_start_promotion_patch_is_temp_copy_only:true,
    shadow_process_graceful_exit:true,
    production_rating_activation:false
  }
};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
console.log(`R22 PROBATION/R19 ISOLATION AUDIT: ${report.status} (${Object.keys(checks).length-failed.length}/${Object.keys(checks).length})`);
if(failed.length){console.error('failed:',failed.join(', '));process.exit(1)}
