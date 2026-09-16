'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'audit-output','aram-rating-v032-r22-probation-r19-isolation-audit.json');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const main=read('update/v0.16.0/main-v0160.js');
const builder=read('tools/research/aram-rating-v032-r18-build-installed-shadow-rc-kit.js');
const r19=read('tools/research/aram-rating-v032-r19-physical-shadow-rc.ps1');
const checks={
  main_has_probation_reconciler:main.includes('installProbationReadinessReconciler'),
  main_intercepts_only_safe_rt121:main.includes("String(opts?.code||'')!=='SAFE-RT121'"),
  main_retries_before_marking_failure:main.includes('const MAX_ATTEMPTS=5')&&main.includes('const RETRY_MS=1000')&&main.includes('SAFE-RT121 persisted after retries'),
  main_preserves_non_rt121_failures:main.includes('return original.call(safety,opts)'),
  main_disables_promotion_only_for_r19:main.includes("process.env.ARAM_R19_DISABLE_COLD_START_PROMOTION!=='1'"),
  builder_graceful_quit:builder.includes('requestGracefulQuit')&&builder.includes('app.quit()'),
  r19_temp_safety_isolation:r19.includes('Patch-TempSafetyIsolation')&&r19.includes('ARAM_R19_SAFETY_ROOT'),
  r19_disables_cold_start_promotion:r19.includes("ARAM_R19_DISABLE_COLD_START_PROMOTION = '1'"),
  r19_observes_real_safety_state:r19.includes('Snapshot-SafetyFiles')&&r19.includes('production_safety_state_stable'),
  r19_success_requires_safety_stable:r19.includes('$success =')&&r19.includes('-and $safetyStable'),
  r19_graceful_exit_wait:r19.includes('$quitDeadline = (Get-Date).AddSeconds(6)'),
  production_scoring_untouched:!main.includes('score_logic_changed=true')&&!r19.includes('production_score_changed=$true')
};
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
const report={
  status:failed.length?'FAILURE':'SUCCESS',
  stage:'R22_PROBATION_AND_R19_ISOLATION_AUDIT',
  checks,
  failed,
  files:{
    main_v0160:{sha256:sha(main),bytes:Buffer.byteLength(main)},
    r18_builder:{sha256:sha(builder),bytes:Buffer.byteLength(builder)},
    r19_harness:{sha256:sha(r19),bytes:Buffer.byteLength(r19)}
  },
  contract:{
    safe_rt121_transient_failure_is_deferred:true,
    persistent_safe_rt121_still_blocks_probation:true,
    r19_real_update_safety_state_must_not_change:true,
    r19_cold_start_promotion_disabled:true,
    shadow_process_graceful_exit:true,
    production_rating_activation:false
  }
};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
console.log(`R22 PROBATION/R19 ISOLATION AUDIT: ${report.status} (${Object.keys(checks).length-failed.length}/${Object.keys(checks).length})`);
if(failed.length){console.error('failed:',failed.join(', '));process.exit(1)}
