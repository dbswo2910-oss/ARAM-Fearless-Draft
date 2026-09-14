'use strict';
const fs=require('fs');
const path=require('path');
const tx=require('./transaction');
const IMPLEMENTATION_VERSION='0.16-shadow';
function parseRecentHang(diagDir,since){
  const stable=path.join(diagDir,'external-hang.log'),legacy=path.join(diagDir,'external-hang-v01578.log'),file=fs.existsSync(stable)?stable:legacy;
  try{const st=fs.statSync(file),start=Math.max(0,st.size-256*1024),fd=fs.openSync(file,'r'),buf=Buffer.alloc(st.size-start);fs.readSync(fd,buf,0,buf.length,start);fs.closeSync(fd);for(const line of buf.toString('utf8').split(/\r?\n/)){if(!line.trim())continue;let j;try{j=JSON.parse(line)}catch{continue}const t=Date.parse(j.at||'')||0;if(t>=since&&/^HNG-[MRB]001$/.test(String(j.code||'')))return j}return null}catch{return null}
}
function failureForBoot(root,pending){const failure=tx._test.readJson(tx._test.failurePath(root));return failure&&Number(failure.at||0)>=Number(pending?.bootStartedAt||0)?failure:null}
function markSafetyFailure(opts={}){const root=tx.rootOf(opts),payload={at:Number(opts.at)||Date.now(),code:String(opts.code||'SAFE-FAIL'),detail:opts.detail||{}};tx._test.writeJsonAtomic(tx._test.failurePath(root),payload);tx._test.append(root,'SAFETY_FAILURE',payload);return payload}
function assessPriorBoot({root,pending,version,diagDir}){
  if(!pending||pending.state!=='applied'||String(pending.toVersion)!==String(version))return{eligible:false,rollback:false,reason:''};
  const priorOwnBoot=String(pending.bootVersion||'')===String(version)&&Number(pending.bootStartedAt)>0;
  const abnormal=priorOwnBoot&&!Number(pending.cleanExitAt||0),hang=priorOwnBoot?parseRecentHang(diagDir,Number(pending.bootStartedAt)||0):null,markedFailure=priorOwnBoot?failureForBoot(root,pending):null;
  return{eligible:true,priorOwnBoot,abnormal,hang,markedFailure,rollback:!!(abnormal||hang||markedFailure),reason:hang?.code||markedFailure?.code||(abnormal?'abnormal-exit':'')};
}
function heartbeatAges(diagDir,now=Date.now()){
  function age(stable,legacy){try{const file=fs.existsSync(path.join(diagDir,stable))?path.join(diagDir,stable):path.join(diagDir,legacy);return now-fs.statSync(file).mtimeMs}catch{return 999999}}
  return{main:age('heartbeat-main.json','heartbeat-main-v01578.json'),renderer:age('heartbeat-renderer.json','heartbeat-renderer-v01578.json')};
}
function startProbation(opts={}){
  const root=tx.rootOf(opts),version=String(opts.version||''),pending=opts.pending||tx.readPending({root});if(!pending)return null;
  pending.bootCount=Number(pending.bootCount||0)+1;pending.bootVersion=version;pending.bootStartedAt=Number(opts.now?.())||Date.now();pending.cleanExitAt=0;pending.cleanExitVersion='';pending.expectedRelaunch=false;tx._test.writeJsonAtomic(tx._test.pendingPath(root),pending);tx._test.append(root,'PROBATION_START',{version,bootCount:pending.bootCount});return pending;
}
function commitProbation(opts={}){
  const root=tx.rootOf(opts),version=String(opts.version||''),pending=tx.readPending({root});if(!pending||String(pending.toVersion)!==version||failureForBoot(root,pending))return false;
  tx._test.writeJsonAtomic(path.join(root,'last-known-good.json'),{version,committedAt:Number(opts.now?.())||Date.now(),previousVersion:pending.fromVersion,rollbackSnapshot:pending.snapshotDir});tx._test.append(root,'PROBATION_COMMIT',{version,previous:pending.fromVersion});try{fs.rmSync(tx._test.pendingPath(root),{force:true})}catch{}try{fs.rmSync(tx._test.failurePath(root),{force:true})}catch{}return true;
}
function markCleanExit(opts={}){const root=tx.rootOf(opts),version=String(opts.version||''),pending=tx.readPending({root});if(!pending||String(pending.bootVersion||'')!==version)return false;pending.cleanExitAt=Number(opts.now?.())||Date.now();pending.cleanExitVersion=version;tx._test.writeJsonAtomic(tx._test.pendingPath(root),pending);tx._test.append(root,'CLEAN_EXIT',{version});return true}
function createProbationMonitor(opts={}){
  const root=tx.rootOf(opts),version=String(opts.version||''),diagDir=path.resolve(opts.diagDir||path.join(root,'diagnostics')),heartbeatMaxAgeMs=Number(opts.heartbeatMaxAgeMs)||1600,healthyRequired=Number(opts.healthyRequired)||12;
  let healthy=0,blocked=false;
  function tick(now=Date.now()){
    const pending=tx.readPending({root});if(!pending)return{done:true,committed:false,healthy,blocked};const failure=failureForBoot(root,pending);if(failure){healthy=0;blocked=true;return{done:false,committed:false,healthy,blocked,reason:String(failure.code||'SAFE-FAIL')}}
    const ages=heartbeatAges(diagDir,now);if(ages.main<heartbeatMaxAgeMs&&ages.renderer<heartbeatMaxAgeMs)healthy++;else healthy=0;
    if(healthy>=healthyRequired){const committed=commitProbation({root,version,now:()=>now});return{done:committed,committed,healthy,blocked,ages}}
    return{done:false,committed:false,healthy,blocked,ages};
  }
  return{tick,getState:()=>({healthy,blocked,healthyRequired,heartbeatMaxAgeMs})};
}
module.exports={IMPLEMENTATION_VERSION,parseRecentHang,failureForBoot,markSafetyFailure,assessPriorBoot,heartbeatAges,startProbation,commitProbation,markCleanExit,createProbationMonitor,production_active:false,score_logic_changed:false,random_scoring_changed:false};
