'use strict';
const path=require('path');
const base=require('./riot-grade-collector-base-v01532');
const integrity=require('./state-integrity-v015117');

const MAX_RECORDS_SAFE=1000;
function validStore(x){
  if(!x||typeof x!=='object'||Array.isArray(x))return false;
  if(!Array.isArray(x.records)||x.records.length>MAX_RECORDS_SAFE)return false;
  for(const r of x.records){
    if(!r||typeof r!=='object'||Array.isArray(r))return false;
    if(r.grade!=null&&String(r.grade).length>12)return false;
    if(r.roleSnapshot!=null&&(typeof r.roleSnapshot!=='object'||Array.isArray(r.roleSnapshot)))return false;
  }
  return true;
}
function storePath(app){
  try{return path.join(app.getPath('userData'),'riot-grade-v01528.json')}
  catch{return path.join(process.cwd(),'riot-grade-v01528.json')}
}
function createCollector(core,opts={}){
  const file=storePath(opts.app);
  const guardOpts={name:'riot-grade-v01528',validator:validStore,maxBytes:8*1024*1024};
  const initial=integrity.guardExternalJson(file,guardOpts);
  const collector=base.createCollector(core,opts);
  const stopWatch=integrity.watchExternalJson(file,guardOpts);
  const originalStop=collector.stop?.bind(collector);
  let stopped=false;
  function stop(){
    if(!stopped){stopped=true;try{stopWatch()}catch{}}
    return originalStop?.();
  }
  function getIntegrityState(){
    const probe=integrity.guardExternalJson(file,guardOpts);
    return{version:'0.15.117',file,path:path.basename(file),initial,probe,score_logic_changed:false};
  }
  return{...collector,stop,getIntegrityState};
}
module.exports={...base,createCollector,validStore,score_logic_changed:false,random_scoring_changed:false,state_integrity_version:'0.15.117'};
