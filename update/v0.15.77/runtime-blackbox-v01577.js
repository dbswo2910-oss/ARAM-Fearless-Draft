'use strict';
(()=>{
  const V='0.15.77';if(window.__ARAM_BLACKBOX_V01577__)return;
  const now=()=>globalThis.performance?.now?.()||Date.now();
  const state={current:null,lastOp:null,lastCode:'OK',lastDetail:null,longTasks:0,maxLongTaskMs:0,slowOps:0,errors:0,wrapped:0};
  const wrappedNames=new Set();
  const send=(code,kind,detail={})=>{state.lastCode=String(code||'');state.lastDetail=detail;try{window.aramDesktop?.traceDiagnostic?.({code,kind,detail})}catch{};paint()};
  function paint(){
    try{
      let el=document.getElementById('aramBbxBadgeV01577');
      if(!el){el=document.createElement('div');el.id='aramBbxBadgeV01577';el.style.cssText='position:fixed;right:10px;bottom:8px;z-index:2147483647;padding:4px 7px;border-radius:7px;background:rgba(3,12,20,.86);border:1px solid #29485f;color:#8fb2c9;font:700 9px/1.2 system-ui;pointer-events:none;opacity:.78';document.body?.appendChild(el)}
      if(el)el.textContent=state.lastCode==='OK'?'DIAG OK':`DIAG ${state.lastCode}`;
    }catch{}
  }
  const opCodes={
    lolAutoSyncPoll:'AUT-100',lolAutoSyncApplyState:'AUT-110',aramTrackLinkedGame:'AUT-120',lolAutoSyncRender:'AUT-130',aramHistoryRenderAccount:'AUT-140',
    renderRandomInputs:'RND-100',runRandomCombos:'RND-110',renderRandomAnalysis:'RND-120',renderRandomDetails:'RND-130',
    renderDataExplorer:'DAT-100',renderData:'DAT-110',renderAll:'UI-100',persist:'STO-100'
  };
  function wrapGlobal(name){
    const fn=window[name];if(typeof fn!=='function'||fn.__aramBlackboxV01577||wrappedNames.has(name))return false;
    const code=opCodes[name]||'OP-000';
    const wrapped=function(...args){
      const parent=state.current,t0=now();state.current={code,name,at:Date.now(),parent:parent?{code:parent.code,name:parent.name}:null};state.lastOp=state.current;
      let out;
      try{out=fn.apply(this,args)}catch(e){state.errors++;send('JS-E002','wrapped-function-throw',{op:code,name,message:e?.message||String(e),stack:String(e?.stack||'').slice(0,2200)});state.current=parent;throw e}
      const syncMs=Math.max(0,now()-t0);state.current=parent;
      if(syncMs>=120){state.slowOps++;send(syncMs>=700?'OP-CRIT':'OP-SLOW','slow-sync-operation',{op:code,name,syncMs:Number(syncMs.toFixed(1))})}
      if(out&&typeof out.then==='function')out.catch?.(e=>{state.errors++;send('JS-P002','wrapped-promise-rejection',{op:code,name,message:e?.message||String(e),stack:String(e?.stack||'').slice(0,2200)})});
      return out;
    };
    try{Object.defineProperty(wrapped,'name',{value:fn.name||name,configurable:true})}catch{}
    wrapped.__aramBlackboxV01577=true;wrapped.__aramOriginal=fn;window[name]=wrapped;wrappedNames.add(name);state.wrapped++;return true;
  }
  function wrapRuntime(obj,name,code){
    if(!obj||typeof obj[name]!=='function'||obj[name].__aramBlackboxV01577)return false;const fn=obj[name];
    const wrapped=function(...args){const t0=now();let out;try{out=fn.apply(this,args)}catch(e){send('JS-E003','runtime-method-throw',{op:code,message:e?.message||String(e),stack:String(e?.stack||'').slice(0,2200)});throw e}const ms=Math.max(0,now()-t0);if(ms>=120)send(ms>=700?'OP-CRIT':'OP-SLOW','slow-runtime-method',{op:code,syncMs:Number(ms.toFixed(1))});return out};
    wrapped.__aramBlackboxV01577=true;wrapped.__aramOriginal=fn;obj[name]=wrapped;state.wrapped++;return true;
  }
  function rescan(){
    Object.keys(opCodes).forEach(wrapGlobal);
    wrapRuntime(window.aramRandomIngameRuntimeV01570,'refresh','ING-100');
    wrapRuntime(window.aramRandomIngameRuntimeV01570,'tick','ING-110');
    wrapRuntime(window.aramRandomPracticeRuntimeV01572,'refresh','RND-140');
    wrapRuntime(window.aramItemArtResolverV01566,'refresh','ITM-100');
    wrapRuntime(window.aramRandomIngameShopV01553,'refresh','ITM-110');
    wrapRuntime(window.aramRandomItemIconsV01556,'refresh','ITM-120');
    wrapRuntime(window.aramItemIconsGlobalV01557,'refresh','ITM-130');
    return state.wrapped;
  }
  window.addEventListener('error',e=>{state.errors++;send('JS-E001','window-error',{message:e?.message||'',source:e?.filename||'',line:e?.lineno||0,column:e?.colno||0,stack:String(e?.error?.stack||'').slice(0,2200)})});
  window.addEventListener('unhandledrejection',e=>{state.errors++;const r=e?.reason;send('JS-P001','unhandled-rejection',{message:r?.message||String(r||''),stack:String(r?.stack||'').slice(0,2200)})});
  try{if(typeof PerformanceObserver==='function'&&PerformanceObserver.supportedEntryTypes?.includes?.('longtask')){const po=new PerformanceObserver(list=>{for(const e of list.getEntries()){const d=Number(e.duration)||0;state.longTasks++;state.maxLongTaskMs=Math.max(state.maxLongTaskMs,d);if(d>=180)send(d>=900?'LT-002':'LT-001','renderer-long-task',{durationMs:Number(d.toFixed(1)),lastOp:state.lastOp})}});po.observe({entryTypes:['longtask']});}}catch(e){send('BBX-R001','longtask-observer-init-failed',{message:e?.message||String(e)})}
  window.aramBlackboxV01577={version:V,rescan,snapshot:()=>({version:V,current:state.current,lastOp:state.lastOp,lastCode:state.lastCode,longTasks:state.longTasks,maxLongTaskMs:state.maxLongTaskMs,slowOps:state.slowOps,errors:state.errors,wrapped:state.wrapped}),score_logic_changed:false};
  window.__ARAM_BLACKBOX_V01577__=true;
  try{window.aramDesktop?.getLastDiagnostic?.().then(x=>{if(x?.code){state.lastCode=String(x.code);state.lastDetail=x;paint()}})}catch{}
  setTimeout(()=>{rescan();paint()},0);setTimeout(rescan,1200);
})();
