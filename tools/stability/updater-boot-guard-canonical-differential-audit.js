'use strict';
const fs=require('fs');
const os=require('os');
const path=require('path');
const L=require('./lib');
const legacy=require('../../update/v0.15.116/update-safety-v01579');
const tx=require('../../src/updater/transaction');
const boot=require('../../src/updater/boot-guard');

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aram-v0160-boot-guard-'));
const legacyRoot=path.join(tmp,'legacy-root');
const canonicalRoot=path.join(tmp,'canonical-root');
const legacyDiag=path.join(tmp,'legacy-diag');
const canonicalDiag=path.join(tmp,'canonical-diag');
const report={status:'SUCCESS',production_active:false,checks:[],legacy_source:'update/v0.15.116/update-safety-v01579.js',canonical_source:'src/updater/boot-guard.js'};
function check(name,ok,detail={}){report.checks.push({name,ok:!!ok,detail});if(!ok)report.status='FAIL'}
function writeJson(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2),'utf8')}
function sameCore(a,b){return JSON.stringify(a)===JSON.stringify(b)}
try{
  fs.mkdirSync(legacyDiag,{recursive:true});fs.mkdirSync(canonicalDiag,{recursive:true});
  const bootStartedAt=Date.parse('2026-09-14T07:00:00.000Z');
  const hang={at:'2026-09-14T07:00:03.000Z',code:'HNG-R001',detail:{fixture:true}};
  for(const d of [legacyDiag,canonicalDiag])fs.writeFileSync(path.join(d,'external-hang.log'),JSON.stringify({at:'2026-09-14T06:59:59.000Z',code:'IGNORED'})+'\n'+JSON.stringify(hang)+'\n','utf8');
  const lHang=legacy._test.parseRecentHang(legacyDiag,bootStartedAt),cHang=boot.parseRecentHang(canonicalDiag,bootStartedAt);
  check('parseRecentHang parity',sameCore({at:lHang?.at,code:lHang?.code},{at:cHang?.at,code:cHang?.code}),{legacy:lHang,canonical:cHang});

  const pendingBase={schema:1,safetyVersion:'0.15.116',state:'applied',fromVersion:'0.15.134',toVersion:'0.15.135',appDir:tmp,snapshotDir:path.join(tmp,'snapshot'),bootCount:1,bootVersion:'0.15.135',bootStartedAt,cleanExitAt:0,cleanExitVersion:'',appliedAt:bootStartedAt-1000};
  fs.mkdirSync(pendingBase.snapshotDir,{recursive:true});
  const failure={at:bootStartedAt+2000,code:'SAFE-E901',detail:{fixture:true}};
  for(const r of [legacyRoot,canonicalRoot]){fs.mkdirSync(r,{recursive:true});writeJson(path.join(r,'safety-failure.json'),failure)}
  const lFailure=legacy._test.failureForBoot(legacyRoot,pendingBase),cFailure=boot.failureForBoot(canonicalRoot,pendingBase);
  check('failureForBoot parity',sameCore({code:lFailure?.code,at:lFailure?.at},{code:cFailure?.code,at:cFailure?.at}),{legacy:lFailure,canonical:cFailure});

  const assessment=boot.assessPriorBoot({root:canonicalRoot,pending:pendingBase,version:'0.15.135',diagDir:canonicalDiag});
  check('prior boot assessment preserves rollback triggers',assessment.eligible===true&&assessment.priorOwnBoot===true&&assessment.abnormal===true&&assessment.rollback===true&&assessment.reason==='HNG-R001',assessment);

  const cleanPending={...pendingBase,cleanExitAt:bootStartedAt+5000,cleanExitVersion:'0.15.135'};
  fs.rmSync(path.join(canonicalRoot,'safety-failure.json'),{force:true});fs.rmSync(path.join(canonicalDiag,'external-hang.log'),{force:true});
  const cleanAssessment=boot.assessPriorBoot({root:canonicalRoot,pending:cleanPending,version:'0.15.135',diagDir:canonicalDiag});
  check('clean prior boot does not rollback',cleanAssessment.eligible===true&&cleanAssessment.rollback===false&&cleanAssessment.abnormal===false,cleanAssessment);

  const probationRoot=path.join(tmp,'probation-root');fs.mkdirSync(probationRoot,{recursive:true});
  const probationPending={...pendingBase,bootCount:2,bootVersion:'',bootStartedAt:0,cleanExitAt:77,cleanExitVersion:'old',expectedRelaunch:true};
  writeJson(path.join(probationRoot,'pending-update.json'),probationPending);
  const started=boot.startProbation({root:probationRoot,version:'0.15.135',now:()=>bootStartedAt});
  check('probation start semantics',started.bootCount===3&&started.bootVersion==='0.15.135'&&started.bootStartedAt===bootStartedAt&&started.cleanExitAt===0&&started.cleanExitVersion===''&&started.expectedRelaunch===false,started);

  const diag=path.join(probationRoot,'diagnostics');fs.mkdirSync(diag,{recursive:true});
  const hbNow=bootStartedAt+10000;for(const f of ['heartbeat-main.json','heartbeat-renderer.json']){const p=path.join(diag,f);fs.writeFileSync(p,'{}','utf8');fs.utimesSync(p,new Date(hbNow-500),new Date(hbNow-500))}
  const ages=boot.heartbeatAges(diag,hbNow);
  check('heartbeat stable-file preference and age',ages.main===500&&ages.renderer===500,ages);
  const monitor=boot.createProbationMonitor({root:probationRoot,version:'0.15.135',diagDir:diag,healthyRequired:3,heartbeatMaxAgeMs:1600});
  const ticks=[monitor.tick(hbNow),monitor.tick(hbNow+100),monitor.tick(hbNow+200)];
  const lkg=tx._test.readJson(path.join(probationRoot,'last-known-good.json'));
  check('healthy probation commits after threshold',ticks[2].committed===true&&!fs.existsSync(path.join(probationRoot,'pending-update.json'))&&lkg?.version==='0.15.135'&&lkg?.previousVersion==='0.15.134', {ticks,lkg});

  const blockedRoot=path.join(tmp,'blocked-root');fs.mkdirSync(blockedRoot,{recursive:true});
  const blockedPending={...pendingBase,bootStartedAt};writeJson(path.join(blockedRoot,'pending-update.json'),blockedPending);writeJson(path.join(blockedRoot,'safety-failure.json'),failure);
  const blockedMonitor=boot.createProbationMonitor({root:blockedRoot,version:'0.15.135',diagDir:diag,healthyRequired:1});const blocked=blockedMonitor.tick(hbNow);
  check('runtime failure blocks probation',blocked.committed===false&&blocked.blocked===true&&blocked.reason==='SAFE-E901'&&fs.existsSync(path.join(blockedRoot,'pending-update.json')),blocked);

  const cleanRoot=path.join(tmp,'clean-root');fs.mkdirSync(cleanRoot,{recursive:true});writeJson(path.join(cleanRoot,'pending-update.json'),{...pendingBase});const clean=boot.markCleanExit({root:cleanRoot,version:'0.15.135',now:()=>hbNow});const cleanFile=tx.readPending({root:cleanRoot});
  check('clean exit persistence',clean===true&&cleanFile.cleanExitAt===hbNow&&cleanFile.cleanExitVersion==='0.15.135',cleanFile);

  const failRoot=path.join(tmp,'failure-root');const marked=boot.markSafetyFailure({root:failRoot,at:hbNow,code:'SAFE-X001',detail:{fixture:true}});const markedFile=tx._test.readJson(path.join(failRoot,'safety-failure.json'));
  check('safety failure persistence',marked.at===hbNow&&markedFile?.code==='SAFE-X001'&&markedFile?.detail?.fixture===true,{marked,markedFile});

  const legacySource=L.read('update/v0.15.116/update-safety-v01579.js');
  for(const token of ["/^HNG-[MRB]001$/","healthy>=12","mAge<1600&&rAge<1600","PROBATION_COMMIT","CLEAN_EXIT","SAFE-OK1"]){check(`legacy invariant present: ${token}`,legacySource.includes(token),{})}
  check('canonical boot guard remains production inactive',boot.production_active===false&&boot.score_logic_changed===false&&boot.random_scoring_changed===false,{production_active:boot.production_active});
  check('canonical updater storage identity preserved',tx.FORMAT_ROOT==='update-safety-v01579'&&tx.LEGACY_SAFETY_VERSION==='0.15.116',{root:tx.FORMAT_ROOT,safetyVersion:tx.LEGACY_SAFETY_VERSION});
}finally{
  try{fs.rmSync(tmp,{recursive:true,force:true})}catch{}
}
L.write('audit-output/stability/updater-boot-guard-canonical-differential-report.json',report);
console.log(`UPDATER BOOT GUARD DIFFERENTIAL: ${report.status} · ${report.checks.filter(x=>x.ok).length}/${report.checks.length}`);
if(report.status!=='SUCCESS')process.exit(1);
