'use strict';
const fs=require('fs');
const path=require('path');
const {app,ipcMain}=require('electron');
let installed=false;
function install(opts={}){
  if(installed)return;installed=true;
  const version=String(opts.version||'0.15.75');
  let dir='';try{dir=path.join(app.getPath('userData'),'diagnostics')}catch{dir=path.join(__dirname,'diagnostics')}
  try{fs.mkdirSync(dir,{recursive:true})}catch{}
  const file=path.join(dir,'freeze-watchdog-v01575.log');
  const stageFile=path.join(dir,'freeze-stage-v01575.log');
  const write=(kind,data={})=>{try{fs.appendFileSync(file,JSON.stringify({at:new Date().toISOString(),version,kind,...data})+'\n','utf8')}catch{}};
  const writeStage=(data={})=>{try{fs.appendFileSync(stageFile,JSON.stringify({at:new Date().toISOString(),version,...data})+'\n','utf8')}catch{}};
  ipcMain.on('diagnostics:freeze-trace-v01575',(event,payload)=>{
    const p=payload&&typeof payload==='object'?payload:{stage:String(payload||'')};
    writeStage({webContentsId:event?.sender?.id||0,code:String(p.code||''),stage:String(p.stage||''),gameId:String(p.gameId||''),detail:p.detail||null});
  });
  app.on('browser-window-created',(_e,win)=>{
    const wc=win.webContents;let lastProbe=null,lastTimeoutAt=0,probeTimer=0;
    const installRendererTrace=()=>wc.executeJavaScript(`(()=>{if(window.__ARAM_FREEZE_TRACE_V01575__)return true;window.__ARAM_FREEZE_TRACE_V01575__={last:{type:'boot',at:Date.now()}};const mark=(type,e)=>{let t=e?.target,desc='';try{desc=[t?.id||'',t?.className||'',t?.textContent||''].join(' ').replace(/\\s+/g,' ').trim().slice(0,160)}catch{}window.__ARAM_FREEZE_TRACE_V01575__.last={type,desc,at:Date.now()}};document.addEventListener('click',e=>mark('click',e),true);document.addEventListener('change',e=>mark('change',e),true);document.addEventListener('input',e=>mark('input',e),true);return true})()`,false).catch(()=>{});
    const probeCode=`(()=>{const active=[...document.querySelectorAll('#nav .tab.active,#random.active,#data.active')].map(x=>x.id||x.textContent?.trim()?.slice(0,40));return{at:Date.now(),active,last:window.__ARAM_FREEZE_TRACE_V01575__?.last||null,phase:(typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState?.phase:null),random:window.aramRandomPracticeRuntimeV01572?.getStats?.()||null,ingame:window.aramRandomIngameRuntimeV01570?.getStats?.()||null,live:window.aramLiveAutosyncRuntimeV01571?.getStats?.()||null,icons56:window.aramRandomItemIconsV01556?.getStatus?.()||window.aramRandomItemIconsV01556?.getStats?.()||null,shop53:window.aramRandomIngameShopV01553?.getStats?.()||null,icons57:window.aramItemIconsGlobalV01557?.getStats?.()||null,art66:window.aramItemArtResolverV01566?.getStats?.()||null,memory:performance?.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null}})()`;
    const startProbe=()=>{clearInterval(probeTimer);probeTimer=setInterval(async()=>{if(wc.isDestroyed())return;try{const timeout=new Promise(r=>setTimeout(()=>r({__timeout:true}),1200));const v=await Promise.race([wc.executeJavaScript(probeCode,false),timeout]);if(v?.__timeout){const n=Date.now();if(n-lastTimeoutAt>5000){lastTimeoutAt=n;write('probe-timeout',{lastProbe,metrics:app.getAppMetrics?.()||[]})}}else lastProbe=v}catch(e){write('probe-error',{message:e?.message||String(e),lastProbe})}},2000)};
    wc.on('did-finish-load',()=>{installRendererTrace();startProbe();write('renderer-loaded')});
    wc.on('unresponsive',()=>write('unresponsive',{lastProbe,metrics:app.getAppMetrics?.()||[]}));
    wc.on('responsive',()=>write('responsive',{lastProbe}));
    wc.on('render-process-gone',(_event,details)=>write('render-process-gone',{details,lastProbe,metrics:app.getAppMetrics?.()||[]}));
    wc.on('destroyed',()=>clearInterval(probeTimer));
  });
  write('watchdog-installed',{file,stageFile});
  return{version,file,stageFile};
}
module.exports={install};
