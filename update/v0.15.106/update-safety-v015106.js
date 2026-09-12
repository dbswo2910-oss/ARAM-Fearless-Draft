'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./update-safety-v01579')}catch{prior=require('../v0.15.79/update-safety-v01579')}
let functionalWatch=null;

function readJson(p){try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return null}}
function installFunctionalFailureWatch({root,version,record}={}){
  if(functionalWatch)return functionalWatch;
  const r=path.resolve(root||'.');
  const pendingPath=path.join(r,'pending-update.json');
  const failurePath=path.join(r,'safety-failure.json');
  let app=null;try{app=require('electron').app}catch{}
  let finished=false;
  const stop=()=>{if(functionalWatch){clearInterval(functionalWatch);functionalWatch=null}finished=true};
  functionalWatch=setInterval(()=>{
    try{
      const pending=readJson(pendingPath);
      if(!pending){stop();return}
      if(String(pending.toVersion||'')!==String(version||''))return;
      if(String(pending.bootVersion||'')!==String(version||'')||!Number(pending.bootStartedAt||0))return;
      const failure=readJson(failurePath);
      if(!failure||Number(failure.at||0)<Number(pending.bootStartedAt||0))return;
      stop();
      prior._test.restoreSnapshot(pending,r);
      try{record?.('SAFE-RB106','functional-readiness-rollback',{version:String(version||''),code:String(failure.code||'SAFE-FAIL')})}catch{}
      if(app){setTimeout(()=>{try{app.relaunch()}catch{};app.exit(0)},120)}
    }catch(e){try{record?.('SAFE-E106','functional-readiness-watch-error',{message:e?.message||String(e)})}catch{}}
  },250);
  functionalWatch.unref?.();
  return functionalWatch;
}

function installBootGuard(opts={}){
  const out=prior.installBootGuard(opts);
  if(out&&!out.rollbackScheduled&&out.root)installFunctionalFailureWatch({root:out.root,version:String(opts.version||''),record:opts.record});
  return out;
}

module.exports={
  ...prior,
  installBootGuard,
  installFunctionalFailureWatch,
  functional_failure_watch:true,
  score_logic_changed:false,
  policy_version:'0.15.106'
};
