'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
function normalizeResource(entry,index){
  if(!entry||typeof entry!=='object')return{name:`resource-${index}`,ready:false,dispose:null,getStats:null};
  return{
    name:String(entry.name||`resource-${index}`),
    ready:typeof entry.ready==='function'?entry.ready:()=>entry.ready!==false,
    dispose:typeof entry.dispose==='function'?entry.dispose:null,
    getStats:typeof entry.getStats==='function'?entry.getStats:null
  };
}
function createResourceLifecycle(resources=[],opts={}){
  const version=String(opts.version||IMPLEMENTATION_VERSION);
  const list=(Array.isArray(resources)?resources:[]).map(normalizeResource);
  let disposed=false;
  const stats={snapshots:0,disposeCalls:0,disposeErrors:0,lastDisposeReason:''};
  function snapshot(){
    stats.snapshots++;
    const out={};
    for(const r of list){
      let ready=false,detail=null;
      try{ready=!!r.ready()}catch(e){detail={error:e?.message||String(e)}}
      if(!detail&&r.getStats){try{detail=r.getStats()}catch(e){detail={error:e?.message||String(e)}}}
      out[r.name]={ready,disposable:!!r.dispose,stats:detail};
    }
    return{version,disposed,resources:out,counters:{...stats}};
  }
  function dispose(reason='manual'){
    stats.disposeCalls++;
    stats.lastDisposeReason=String(reason||'manual');
    if(disposed)return false;
    disposed=true;
    for(const r of list){if(!r.dispose)continue;try{r.dispose(stats.lastDisposeReason)}catch{stats.disposeErrors++}}
    return true;
  }
  return{version,snapshot,dispose,getStats:()=>({...stats,disposed}),production_active:false,score_logic_changed:false,random_scoring_changed:false};
}
function attachBeforeUnload(target,lifecycle){
  if(!target||typeof target.addEventListener!=='function')throw new Error('event target with addEventListener required');
  if(!lifecycle||typeof lifecycle.dispose!=='function')throw new Error('lifecycle.dispose required');
  const handler=()=>lifecycle.dispose('beforeunload');
  target.addEventListener('beforeunload',handler,{once:true});
  return handler;
}
module.exports={IMPLEMENTATION_VERSION,createResourceLifecycle,attachBeforeUnload,production_active:false,score_logic_changed:false,random_scoring_changed:false};
