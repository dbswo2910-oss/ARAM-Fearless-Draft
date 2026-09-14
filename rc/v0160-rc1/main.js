'use strict';
const fs=require('fs');
const path=require('path');
const {app,BrowserWindow}=require('electron');

const RC_VERSION='0.16.0-rc.1';
const STABLE_APP_ID='aram-fearless-draft';
const RC_APPDATA_DIR='ARAM Fearless Draft RC1 Sandbox';
const RC_MARKER='.v0160-rc1-sandbox.json';
const TELEMETRY='__ARAM_V0160_RC1_STATE__';
const reset=process.argv.includes('--aram-rc1-reset-sandbox');
const probeMode=process.argv.includes('--aram-rc1-probe');
const earlyReport=process.env.ARAM_V0160_RC_REPORT?path.resolve(process.env.ARAM_V0160_RC_REPORT):null;
const tracePath=earlyReport?earlyReport+'.trace.log':null;
function trace(stage,detail={}){try{const row=JSON.stringify({at:new Date().toISOString(),pid:process.pid,stage,...detail});console.log('[v0.16 RC1 trace]',row);if(tracePath){fs.mkdirSync(path.dirname(tracePath),{recursive:true});fs.appendFileSync(tracePath,row+'\n','utf8')}}catch{}}
trace('main-enter',{argv:process.argv.slice(1)});

let latestRendererState=null;
const attached=new WeakSet();
function consoleText(event,level,message){if(typeof message==='string')return message;if(typeof event?.message==='string')return event.message;if(typeof event?.detail?.message==='string')return event.detail.message;return''}
function attachWindow(win){
  if(!win||attached.has(win))return;attached.add(win);
  const wc=win.webContents;if(!wc)return;
  wc.on('console-message',(event,level,message)=>{
    const text=consoleText(event,level,message);
    const at=text.indexOf(TELEMETRY);if(at<0)return;
    try{const parsed=JSON.parse(text.slice(at+TELEMETRY.length));latestRendererState=parsed;trace('renderer-telemetry',{stage:parsed.stage,data:parsed.data,diagnostics:parsed.diagnostics,research:parsed.research,randomRoles:parsed.randomRoles,errorCount:Array.isArray(parsed.errors)?parsed.errors.length:null})}catch(e){trace('renderer-telemetry-parse-error',{message:e?.message||String(e),preview:text.slice(0,400)})}
  });
  wc.on('dom-ready',()=>trace('renderer-dom-ready',{url:wc.getURL()}));
  wc.on('did-finish-load',()=>trace('renderer-did-finish-load',{url:wc.getURL()}));
  wc.on('did-fail-load',(_e,code,desc,url)=>trace('renderer-did-fail-load',{code,desc,url}));
  wc.on('unresponsive',()=>trace('renderer-unresponsive',{url:wc.getURL()}));
  wc.on('responsive',()=>trace('renderer-responsive',{url:wc.getURL()}));
  wc.on('render-process-gone',(_e,details)=>trace('renderer-gone',{reason:details?.reason,exitCode:details?.exitCode}));
}
app.on('browser-window-created',(_e,win)=>attachWindow(win));

const originalAppData=app.getPath('appData');
const productionUserData=path.join(originalAppData,STABLE_APP_ID);
const rcAppData=path.join(originalAppData,RC_APPDATA_DIR);
const rcUserData=path.join(rcAppData,STABLE_APP_ID);
function copyDir(src,dst){fs.mkdirSync(dst,{recursive:true});for(const e of fs.readdirSync(src,{withFileTypes:true})){const a=path.join(src,e.name),b=path.join(dst,e.name);if(e.isDirectory())copyDir(a,b);else if(e.isFile())fs.copyFileSync(a,b)}}
function seedSandbox(){
  if(reset)fs.rmSync(rcUserData,{recursive:true,force:true});
  const marker=path.join(rcUserData,RC_MARKER);if(fs.existsSync(marker))return{seeded:false,reason:'existing-sandbox',marker};fs.mkdirSync(rcAppData,{recursive:true});
  if(fs.existsSync(productionUserData)){const staging=rcUserData+'.seed-'+process.pid;fs.rmSync(staging,{recursive:true,force:true});copyDir(productionUserData,staging);fs.writeFileSync(path.join(staging,RC_MARKER),JSON.stringify({schema:1,rc:RC_VERSION,seeded_at:new Date().toISOString(),source:productionUserData},null,2)+'\n','utf8');if(fs.existsSync(rcUserData))fs.rmSync(rcUserData,{recursive:true,force:true});fs.renameSync(staging,rcUserData);return{seeded:true,reason:'cloned-production-userdata',marker:path.join(rcUserData,RC_MARKER)}}
  fs.mkdirSync(rcUserData,{recursive:true});fs.writeFileSync(marker,JSON.stringify({schema:1,rc:RC_VERSION,seeded_at:new Date().toISOString(),source:null},null,2)+'\n','utf8');return{seeded:true,reason:'fresh-sandbox',marker};
}
let seedResult;try{seedResult=seedSandbox()}catch(e){seedResult={seeded:false,reason:'seed-failed',error:e?.message||String(e)}}
trace('sandbox-seeded',{seedResult,productionUserData,rcUserData});
app.setPath('appData',rcAppData);app.setPath('userData',rcUserData);process.env.ARAM_V0160_RC=RC_VERSION;
trace('paths-pinned',{appData:app.getPath('appData'),userData:app.getPath('userData')});console.log('[v0.16 RC1 sandbox]',{productionUserData,rcAppData,userData:app.getPath('userData'),seedResult});
trace('golden-require-start');try{require('./main-v015135.js');trace('golden-require-return')}catch(e){trace('golden-require-throw',{name:e?.name,message:e?.message,stack:String(e?.stack||'').slice(0,4000)});throw e}

function reportPath(){if(process.env.ARAM_V0160_RC_REPORT)return path.resolve(process.env.ARAM_V0160_RC_REPORT);return path.join(app.getPath('userData'),'diagnostics','v0160-rc1-probe.json')}
function writeReport(body){const p=reportPath();fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(body,null,2)+'\n','utf8');trace('report-written',{status:body.status,path:p});return p}
function finishProbe(code){if(!probeMode)return;trace('probe-exit-scheduled',{code});setTimeout(()=>{try{app.exit(code)}catch{process.exit(code)}},250)}
function sandboxReport(){return{production_path:productionUserData,rc_appdata:rcAppData,rc_user_data:app.getPath('userData'),production_untouched:path.resolve(app.getPath('userData'))!==path.resolve(productionUserData),seed:seedResult}}
function successReady(state){return !!(state&&state.version===RC_VERSION&&state.diagnostics===true&&state.data===true&&Array.isArray(state.errors)&&state.errors.length===0)}
async function rendererState(win){
  if(latestRendererState)return latestRendererState;if(!win||win.isDestroyed?.())return null;
  const exec=win.webContents.executeJavaScript(`(()=>{const s=globalThis.__ARAM_V0160_RC1_STATE__;return s?JSON.parse(JSON.stringify(s)):null})()`,true).then(value=>({kind:'value',value}),error=>({kind:'error',error}));
  const timeout=new Promise(resolve=>setTimeout(()=>resolve({kind:'timeout'}),800));const result=await Promise.race([exec,timeout]);
  if(result.kind==='value')return result.value;if(result.kind==='error')trace('renderer-exec-error',{message:result.error?.message||String(result.error)});return latestRendererState;
}
function installProbe(){
  for(const win of BrowserWindow.getAllWindows())attachWindow(win);trace('probe-installed',{windowCount:BrowserWindow.getAllWindows().length});const started=Date.now(),timeoutMs=30000;let ticks=0;
  const tick=async()=>{
    ticks++;const wins=BrowserWindow.getAllWindows();if(ticks===1||ticks%8===0)trace('probe-tick',{ticks,windowCount:wins.length,hasTelemetry:!!latestRendererState,urls:wins.map(w=>{try{return w.webContents.getURL()}catch{return''}})});
    let state=latestRendererState;for(const win of wins){if(!state)state=await rendererState(win);if(state)break}
    if(successReady(state)){const body={schema:1,rc:RC_VERSION,status:'SUCCESS',at:new Date().toISOString(),probe_mode:probeMode,verification:'renderer-console-telemetry',sandbox:sandboxReport(),renderer:state};const out=writeReport(body);console.log('[v0.16 RC1 probe] SUCCESS',out,body.renderer);finishProbe(0);return}
    if(Date.now()-started>=timeoutMs){const body={schema:1,rc:RC_VERSION,status:'FAILURE',at:new Date().toISOString(),probe_mode:probeMode,verification:'renderer-console-telemetry',sandbox:sandboxReport(),renderer:state||null,error:state&&Array.isArray(state.errors)&&state.errors.length?`canonical renderer errors: ${state.errors.join('; ')}`:'canonical renderer success state unavailable before timeout'};const out=writeReport(body);console.error('[v0.16 RC1 probe] FAILURE',out);finishProbe(3);return}
    setTimeout(tick,500);
  };setTimeout(tick,500);
}
app.whenReady().then(()=>{for(const win of BrowserWindow.getAllWindows())attachWindow(win);trace('electron-ready',{windowCount:BrowserWindow.getAllWindows().length});installProbe()}).catch(e=>{trace('electron-ready-error',{message:e?.message||String(e)});try{writeReport({schema:1,rc:RC_VERSION,status:'FAILURE',error:e?.message||String(e)})}catch{}finishProbe(4)});
