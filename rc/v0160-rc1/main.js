'use strict';
const fs=require('fs');
const path=require('path');
const {app,BrowserWindow}=require('electron');

const RC_VERSION='0.16.0-rc.1';
const STABLE_APP_ID='aram-fearless-draft';
const RC_APPDATA_DIR='ARAM Fearless Draft RC1 Sandbox';
const RC_MARKER='.v0160-rc1-sandbox.json';
const reset=process.argv.includes('--aram-rc1-reset-sandbox');
const probeMode=process.argv.includes('--aram-rc1-probe');
const originalAppData=app.getPath('appData');
const productionUserData=path.join(originalAppData,STABLE_APP_ID);
const rcAppData=path.join(originalAppData,RC_APPDATA_DIR);
const rcUserData=path.join(rcAppData,STABLE_APP_ID);

function copyDir(src,dst){
  fs.mkdirSync(dst,{recursive:true});
  for(const e of fs.readdirSync(src,{withFileTypes:true})){
    const a=path.join(src,e.name),b=path.join(dst,e.name);
    if(e.isDirectory())copyDir(a,b);else if(e.isFile())fs.copyFileSync(a,b);
  }
}
function seedSandbox(){
  if(reset)fs.rmSync(rcUserData,{recursive:true,force:true});
  const marker=path.join(rcUserData,RC_MARKER);
  if(fs.existsSync(marker))return{seeded:false,reason:'existing-sandbox',marker};
  fs.mkdirSync(rcAppData,{recursive:true});
  if(fs.existsSync(productionUserData)){
    const staging=rcUserData+'.seed-'+process.pid;
    fs.rmSync(staging,{recursive:true,force:true});
    copyDir(productionUserData,staging);
    fs.writeFileSync(path.join(staging,RC_MARKER),JSON.stringify({schema:1,rc:RC_VERSION,seeded_at:new Date().toISOString(),source:productionUserData},null,2)+'\n','utf8');
    if(fs.existsSync(rcUserData))fs.rmSync(rcUserData,{recursive:true,force:true});
    fs.renameSync(staging,rcUserData);
    return{seeded:true,reason:'cloned-production-userdata',marker:path.join(rcUserData,RC_MARKER)};
  }
  fs.mkdirSync(rcUserData,{recursive:true});
  fs.writeFileSync(marker,JSON.stringify({schema:1,rc:RC_VERSION,seeded_at:new Date().toISOString(),source:null},null,2)+'\n','utf8');
  return{seeded:true,reason:'fresh-sandbox',marker};
}

let seedResult;
try{seedResult=seedSandbox()}catch(e){seedResult={seeded:false,reason:'seed-failed',error:e?.message||String(e)}}
app.setPath('appData',rcAppData);
process.env.ARAM_V0160_RC=RC_VERSION;
console.log('[v0.16 RC1 sandbox]',{productionUserData,rcAppData,userData:path.join(rcAppData,STABLE_APP_ID),seedResult});

require('./main-v015135.js');

function reportPath(){
  if(process.env.ARAM_V0160_RC_REPORT)return path.resolve(process.env.ARAM_V0160_RC_REPORT);
  return path.join(app.getPath('userData'),'diagnostics','v0160-rc1-probe.json');
}
function writeReport(body){
  const p=reportPath();fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(body,null,2)+'\n','utf8');return p;
}
async function rendererState(win){
  if(!win||win.isDestroyed?.())return null;
  try{return await win.webContents.executeJavaScript(`(()=>{const s=globalThis.__ARAM_V0160_RC1_STATE__;return s?JSON.parse(JSON.stringify(s)):null})()`,true)}catch{return null}
}
function installProbe(){
  const started=Date.now(),timeoutMs=30000;
  const tick=async()=>{
    const wins=BrowserWindow.getAllWindows();
    for(const win of wins){
      const state=await rendererState(win);
      if(state){
        const ok=state.version===RC_VERSION&&state.diagnostics===true&&state.data===true&&Array.isArray(state.errors)&&state.errors.length===0;
        const body={schema:1,rc:RC_VERSION,status:ok?'SUCCESS':'FAILURE',at:new Date().toISOString(),probe_mode:probeMode,sandbox:{production_path:productionUserData,rc_appdata:rcAppData,rc_user_data:app.getPath('userData'),production_untouched:path.resolve(app.getPath('userData'))!==path.resolve(productionUserData),seed:seedResult},renderer:state};
        const out=writeReport(body);console.log('[v0.16 RC1 probe]',body.status,out,body.renderer);
        if(probeMode){process.exitCode=ok?0:2;setTimeout(()=>app.quit(),350)}
        return;
      }
    }
    if(Date.now()-started>=timeoutMs){
      const body={schema:1,rc:RC_VERSION,status:'FAILURE',at:new Date().toISOString(),probe_mode:probeMode,sandbox:{production_path:productionUserData,rc_appdata:rcAppData,rc_user_data:app.getPath('userData'),production_untouched:path.resolve(app.getPath('userData'))!==path.resolve(productionUserData),seed:seedResult},renderer:null,error:'canonical renderer state unavailable before timeout'};
      const out=writeReport(body);console.error('[v0.16 RC1 probe] FAILURE',out);
      if(probeMode){process.exitCode=3;app.quit()}
      return;
    }
    setTimeout(tick,750);
  };
  setTimeout(tick,750);
}
app.whenReady().then(installProbe).catch(e=>{try{writeReport({schema:1,rc:RC_VERSION,status:'FAILURE',error:e?.message||String(e)})}catch{}if(probeMode){process.exitCode=4;app.quit()}});
