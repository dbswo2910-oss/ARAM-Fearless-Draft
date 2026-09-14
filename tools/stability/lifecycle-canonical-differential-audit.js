'use strict';
const vm=require('vm');
const L=require('./lib');
const canonical=require('../../src/core/lifecycle');
function legacyProbe(){
  const calls=[];let beforeUnload=null;
  const mk=(name,{throwOnDispose=false}={})=>({dispose(reason){calls.push([name,reason]);if(throwOnDispose)throw new Error(name+' dispose fail')},getStats(){return{name}}});
  const window={
    __ARAM_RANDOM_PRACTICE_RUNTIME_V01572__:true,
    __ARAM_RANDOM_INGAME_RUNTIME_V01570__:true,
    __ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__:true,
    __ARAM_UI_STABILITY_BASELINE_V015115__:true,
    __ARAM_STATE_INTEGRITY_V015117__:true,
    aramRandomPracticeRuntimeV01572:mk('practice'),
    aramRandomIngameRuntimeV01570:mk('ingame',{throwOnDispose:true}),
    aramLiveAutosyncRuntimeV01571:mk('autosync'),
    addEventListener(name,fn){if(name==='beforeunload')beforeUnload=fn}
  };
  vm.runInNewContext(L.read('update/v0.15.118/resource-lifecycle-v015118.js'),{window,console});
  const api=window.aramResourceLifecycleV015118;
  const first=api.snapshot();
  const d1=api.dispose('fixture');
  const d2=api.dispose('fixture-again');
  return{first,d1,d2,calls,stats:api.getStats(),beforeUnload:typeof beforeUnload==='function'};
}
function canonicalProbe(){
  const calls=[];let beforeUnload=null;
  const mk=(name,{throwOnDispose=false}={})=>({name,ready:true,dispose(reason){calls.push([name,reason]);if(throwOnDispose)throw new Error(name+' dispose fail')},getStats(){return{name}}});
  const api=canonical.createResourceLifecycle([mk('practice'),mk('ingame',{throwOnDispose:true}),mk('autosync')],{version:'fixture'});
  canonical.attachBeforeUnload({addEventListener(name,fn){if(name==='beforeunload')beforeUnload=fn}},api);
  const first=api.snapshot();
  const d1=api.dispose('fixture');
  const d2=api.dispose('fixture-again');
  return{first,d1,d2,calls,stats:api.getStats(),beforeUnload:typeof beforeUnload==='function'};
}
const legacy=legacyProbe(),next=canonicalProbe();
for(const p of [legacy,next]){
  L.must(p.d1===true,'first dispose must succeed');
  L.must(p.d2===false,'second dispose must be idempotent false');
  L.must(p.calls.length===3,'each resource dispose must be attempted exactly once');
  L.must(p.stats.disposeCalls===2,'disposeCalls semantic drift');
  L.must(p.stats.disposeErrors===1,'dispose error accounting semantic drift');
  L.must(p.stats.lastDisposeReason==='fixture-again','last dispose reason semantic drift');
  L.must(p.stats.disposed===true,'disposed state semantic drift');
  L.must(p.beforeUnload===true,'beforeunload lifecycle hook missing');
}
L.must(legacy.calls.map(x=>x[0]).join('|')===next.calls.map(x=>x[0]).join('|'),'canonical resource disposal order differs from legacy');
L.must(Object.keys(next.first.resources).join('|')==='practice|ingame|autosync','canonical lifecycle resource registry drift');
L.must(canonical.production_active===false&&canonical.score_logic_changed===false&&canonical.random_scoring_changed===false,'canonical lifecycle shadow must remain inactive and scoring neutral');
const report={status:'SUCCESS',production_active:false,legacy:{disposeCalls:legacy.stats.disposeCalls,disposeErrors:legacy.stats.disposeErrors,disposalOrder:legacy.calls.map(x=>x[0])},canonical:{implementation:canonical.IMPLEMENTATION_VERSION,disposeCalls:next.stats.disposeCalls,disposeErrors:next.stats.disposeErrors,disposalOrder:next.calls.map(x=>x[0])},cutover_allowed:false};
L.write('audit-output/stability/lifecycle-canonical-differential.json',report);
console.log('LIFECYCLE CANONICAL DIFFERENTIAL: SUCCESS · disposal/idempotency/error semantics preserved');
