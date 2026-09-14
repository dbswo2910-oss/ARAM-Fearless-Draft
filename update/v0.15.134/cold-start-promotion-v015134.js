'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {execFile}=require('child_process');
let electron=null;try{electron=require('electron')}catch{}
const VERSION='0.15.134';
const LAUNCHER_NAME='ARAM_Fearless_Draft_Launcher_windows_x64.exe';
function sha(p){try{return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}catch{return''}}
function root(){const local=process.env.LOCALAPPDATA||'';return local?path.join(local,'ARAM Fearless Draft AutoUpdate'):''}
function statePath(){const r=root();return r?path.join(r,'promotion-v015134.json'):''}
function readJson(p){try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return null}}
function writeState(v){try{const p=statePath();if(!p)return;fs.mkdirSync(path.dirname(p),{recursive:true});const t=p+'.tmp-'+process.pid;fs.writeFileSync(t,JSON.stringify(v,null,2)+'\n','utf8');try{fs.unlinkSync(p)}catch{}fs.renameSync(t,p)}catch{}}
function needsPromotion(appDir){if(process.platform!=='win32')return{needed:false,reason:'non-windows'};const bundled=path.join(appDir,LAUNCHER_NAME),canonical=path.join(root(),'launcher',LAUNCHER_NAME),st=readJson(statePath());if(!fs.existsSync(bundled))return{needed:false,reason:'bundled-launcher-missing',bundled,canonical};const bh=sha(bundled),ch=sha(canonical);if(st?.version===VERSION&&st?.status==='success'&&bh&&bh===ch)return{needed:false,reason:'already-promoted',bundled,canonical,bundledHash:bh};return{needed:true,reason:'promotion-required',bundled,canonical,bundledHash:bh,canonicalHash:ch}}
function promote(appDir){const check=needsPromotion(appDir);if(!check.needed){if(check.reason==='bundled-launcher-missing')writeState({schema:1,version:VERSION,status:'launcher_missing',at:new Date().toISOString(),...check});return Promise.resolve(check)};writeState({schema:1,version:VERSION,status:'running',at:new Date().toISOString(),...check});return new Promise(resolve=>{execFile(check.bundled,['--promote-only','--app-dir',appDir,'--expected-version',VERSION],{windowsHide:true,timeout:15000},(err,stdout,stderr)=>{const result={schema:1,version:VERSION,status:err?'failed':'success',at:new Date().toISOString(),appDir,bundled:check.bundled,canonical:check.canonical,bundledHash:check.bundledHash,exitError:err?String(err.message||err):'',stderr:String(stderr||'').slice(0,2000)};writeState(result);resolve(result)})})}
function install(opts={}){const appDir=path.resolve(opts.appDir||__dirname);if(String(opts.version||VERSION)!==VERSION)throw new Error('v0.15.134 cold-start promotion version mismatch');if(!electron?.app||process.platform!=='win32')return{scheduled:false,reason:process.platform!=='win32'?'non-windows':'electron-unavailable'};const run=()=>setTimeout(()=>{promote(appDir).catch(e=>writeState({schema:1,version:VERSION,status:'failed',at:new Date().toISOString(),appDir,error:e?.message||String(e)}))},1200);if(electron.app.isReady())run();else electron.app.whenReady().then(run).catch(()=>{});return{scheduled:true,appDir,launcher:path.join(appDir,LAUNCHER_NAME)}}
module.exports={install,promote,needsPromotion,_test:{sha,root,statePath,readJson},policy_version:VERSION,canonical_launcher_name:LAUNCHER_NAME,score_logic_changed:false};
