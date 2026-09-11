'use strict';
const fs=require('fs');
const path=require('path');
const {app,ipcMain}=require('electron');
let installed=false;
let state={version:'0.15.77',dir:'',logFile:'',stackFile:'',lastFile:''};
const captureById=new Map();
function ensureDir(){
  if(state.dir)return state.dir;
  try{state.dir=path.join(app.getPath('userData'),'diagnostics')}catch{state.dir=path.join(__dirname,'diagnostics')}
  try{fs.mkdirSync(state.dir,{recursive:true})}catch{}
  state.logFile=path.join(state.dir,'freeze-blackbox-v01577.log');
  state.stackFile=path.join(state.dir,'freeze-stack-v01577.log');
  state.lastFile=path.join(state.dir,'last-diagnostic-v01577.json');
  return state.dir;
}
function clean(x,depth=0){
  if(depth>4)return'[depth]';
  if(x==null||typeof x==='string'||typeof x==='number'||typeof x==='boolean')return x;
  if(Array.isArray(x))return x.slice(0,80).map(v=>clean(v,depth+1));
  if(typeof x==='object'){
    const out={};for(const [k,v] of Object.entries(x).slice(0,80)){try{out[k]=clean(v,depth+1)}catch{}}
    return out;
  }
  return String(x);
}
function append(file,row){try{fs.appendFileSync(file,JSON.stringify(row)+'\n','utf8')}catch{}}
function record(code,kind,detail={}){
  ensureDir();
  const row={at:new Date().toISOString(),version:state.version,code:String(code||'UNK'),kind:String(kind||''),detail:clean(detail)};
  append(state.logFile,row);
  const problem=/error|timeout|unresponsive|slow|crash|failed|throw|rejection|long-task|critical/i.test(String(kind||''))||/^(FRZ|CRS|JS-|OP-|LT-|MEM-)/.test(String(code||''));
  if(problem)try{fs.writeFileSync(state.lastFile,JSON.stringify(row,null,2),'utf8')}catch{}
  return row;
}
function recordStack(code,reason,frames,extra={}){
  ensureDir();
  const row={at:new Date().toISOString(),version:state.version,code:String(code||'FRZ-003'),reason:String(reason||''),frames:clean(frames),extra:clean(extra)};
  append(state.stackFile,row);
  try{fs.writeFileSync(state.lastFile,JSON.stringify(row,null,2),'utf8')}catch{}
  return row;
}
function readLast(){try{return JSON.parse(fs.readFileSync(state.lastFile,'utf8'))}catch{return null}}
function frameSummary(fr){
  const loc=fr?.location||{};
  return{functionName:String(fr?.functionName||'(anonymous)'),url:String(fr?.url||''),scriptId:String(loc.scriptId||fr?.scriptId||''),line:Number(loc.lineNumber||0)+1,column:Number(loc.columnNumber||0)+1};
}
function install(opts={}){
  if(installed)return state;installed=true;state.version=String(opts.version||'0.15.77');ensureDir();
  try{ipcMain.on('diagnostics:blackbox-v01577',(event,payload)=>{const p=payload&&typeof payload==='object'?payload:{message:String(payload||'')};record(p.code||'REN-000',p.kind||'renderer',{...p,webContentsId:event?.sender?.id||0})})}catch(e){record('BBX-IPC-001','ipc-register-error',{message:e?.message||String(e)})}
  try{ipcMain.handle('diagnostics:get-last-v01577',()=>readLast())}catch{}
  app.on('browser-window-created',(_e,win)=>{
    const wc=win.webContents;
    let probeBusy=false,probeStarted=0,lastProbe=null,lastCaptureAt=0,capturing=false,probeTimer=0,debuggerReady=false,debuggerInit=null;
    const probeCode=`(()=>({at:Date.now(),href:location.href,visibility:document.visibilityState,active:[...document.querySelectorAll('#nav .tab.active,#random.active,#data.active')].map(x=>x.id||x.textContent?.trim()?.slice(0,50)),phase:(typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState?.phase:null),bbx:window.aramBlackboxV01577?.snapshot?.()||null,random:window.aramRandomPracticeRuntimeV01572?.getStats?.()||null,ingame:window.aramRandomIngameRuntimeV01570?.getStats?.()||null,live:window.aramLiveAutosyncRuntimeV01571?.getStats?.()||null,memory:performance?.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null}))()`;
    const prepareDebugger=()=>{
      if(debuggerReady)return Promise.resolve(true);
      if(debuggerInit)return debuggerInit;
      debuggerInit=(async()=>{
        try{
          const dbg=wc.debugger;
          if(!dbg.isAttached())dbg.attach('1.3');
          await dbg.sendCommand('Debugger.enable');
          debuggerReady=true;record('BBX-CDP-000','debugger-ready',{webContentsId:wc.id});return true;
        }catch(e){record('BBX-CDP-001','debugger-init-error',{message:e?.message||String(e)});return false}
        finally{debuggerInit=null}
      })();
      return debuggerInit;
    };
    prepareDebugger().catch(()=>{});
    const captureStack=async(reason)=>{
      const now=Date.now();if(capturing||now-lastCaptureAt<6000||wc.isDestroyed())return false;capturing=true;lastCaptureAt=now;
      const dbg=wc.debugger;let pausedHandler=null;
      try{
        if(!debuggerReady){record('FRZ-004','debugger-not-ready',{reason,lastProbe});return false}
        const paused=new Promise(resolve=>{
          pausedHandler=(_event,method,params)=>{if(method==='Debugger.paused')resolve(params||{})};
          dbg.on('message',pausedHandler);
        });
        await dbg.sendCommand('Debugger.pause');
        const params=await Promise.race([paused,new Promise(r=>setTimeout(()=>r(null),1400))]);
        if(params?.callFrames?.length){
          const frames=params.callFrames.slice(0,16).map(frameSummary);
          recordStack('FRZ-003',reason,frames,{lastProbe,metrics:app.getAppMetrics?.()||[]});
        }else record('FRZ-004','debugger-pause-no-stack',{reason,lastProbe,metrics:app.getAppMetrics?.()||[]});
        try{await dbg.sendCommand('Debugger.resume')}catch{}
        return !!params?.callFrames?.length;
      }catch(e){record('FRZ-004','debugger-capture-failed',{reason,message:e?.message||String(e),lastProbe});return false}
      finally{try{if(pausedHandler)dbg.removeListener('message',pausedHandler)}catch{}capturing=false}
    };
    captureById.set(wc.id,captureStack);
    const startProbe=()=>{
      clearInterval(probeTimer);
      probeTimer=setInterval(()=>{
        if(wc.isDestroyed()||probeBusy)return;
        probeBusy=true;probeStarted=Date.now();
        let warned=false;
        const slowTimer=setTimeout(()=>{if(probeBusy&&!warned){warned=true;record('FRZ-001','renderer-probe-timeout',{probeStarted,lastProbe,metrics:app.getAppMetrics?.()||[]});captureStack('probe-timeout').catch(()=>{})}},1200);
        wc.executeJavaScript(probeCode,false).then(v=>{lastProbe=v;if(warned)record('FRZ-005','renderer-probe-recovered',{elapsedMs:Date.now()-probeStarted,lastProbe:v})}).catch(e=>record('FRZ-006','renderer-probe-error',{message:e?.message||String(e),lastProbe})).finally(()=>{clearTimeout(slowTimer);probeBusy=false});
      },2500);
    };
    wc.on('did-finish-load',()=>{prepareDebugger().catch(()=>{});record('BBX-001','renderer-loaded',{webContentsId:wc.id});startProbe()});
    wc.on('unresponsive',()=>{record('FRZ-002','electron-unresponsive',{lastProbe,metrics:app.getAppMetrics?.()||[]});captureStack('webContents-unresponsive').catch(()=>{})});
    wc.on('responsive',()=>record('FRZ-005','electron-responsive',{lastProbe}));
    wc.on('render-process-gone',(_event,details)=>record('CRS-001','render-process-gone',{details,lastProbe,metrics:app.getAppMetrics?.()||[]}));
    wc.on('console-message',(_event,level,message,line,sourceId)=>{if(level>=3)record('CON-001','renderer-console-error',{level,message:String(message||'').slice(0,1200),line,sourceId})});
    wc.debugger?.on?.('detach',(_event,reason)=>{debuggerReady=false;record('BBX-CDP-002','debugger-detached',{reason:String(reason||'')})});
    wc.on('destroyed',()=>{clearInterval(probeTimer);captureById.delete(wc.id);try{if(wc.debugger?.isAttached?.())wc.debugger.detach()}catch{}});
  });
  record('BBX-000','blackbox-installed',{dir:state.dir});
  return state;
}
module.exports={install,record,recordStack,readLast,captureNow:(wc,reason)=>captureById.get(wc?.id)?.(String(reason||'manual'))||Promise.resolve(false),getState:()=>({...state})};
