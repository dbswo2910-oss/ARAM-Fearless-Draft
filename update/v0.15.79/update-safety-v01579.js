'use strict';
const fs=require('fs'),path=require('path');
const SAFETY_VERSION='0.15.79';
const CRITICAL=['index.html','autosync-core.js','main.js','preload.js','package.json'];
function safeRel(p){p=String(p||'').replace(/\\/g,'/').replace(/^\.\//,'');if(!p||p.startsWith('/')||p.includes('\0')||p.split('/').some(x=>x==='..')||/^[A-Za-z]:/.test(p))throw new Error('unsafe safety path '+p);return p}
function defaultRoot(){try{const {app}=require('electron');return path.join(app.getPath('userData'),'update-safety-v01579')}catch{return path.join(process.cwd(),'.update-safety-v01579')}}
function rootOf(opts={}){return path.resolve(opts.root||defaultRoot())}
function ensure(p){fs.mkdirSync(p,{recursive:true})}
function readJson(p){try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return null}}
function writeJson(p,v){ensure(path.dirname(p));const t=p+'.tmp-'+process.pid;fs.writeFileSync(t,JSON.stringify(v,null,2),'utf8');try{fs.renameSync(t,p)}catch{try{fs.rmSync(p,{force:true})}catch{}fs.renameSync(t,p)}}
function pendingPath(root){return path.join(root,'pending-update.json')}
function failurePath(root){return path.join(root,'safety-failure.json')}
function historyLog(root){return path.join(root,'safety-history.ndjson')}
function append(root,event,detail={}){try{ensure(root);fs.appendFileSync(historyLog(root),JSON.stringify({at:new Date().toISOString(),event,detail})+'\n','utf8')}catch{}}
function copyFile(src,dst){ensure(path.dirname(dst));fs.copyFileSync(src,dst)}
function snapshotName(current){return `${Date.now()}-v${String(current||'unknown').replace(/[^0-9A-Za-z._-]/g,'_')}`}
function prepareUpdateTransaction(opts={}){
  const root=rootOf(opts),appDir=path.resolve(opts.appDir||process.cwd()),current=String(opts.current||''),latest=String(opts.latest||'');
  const rels=[...new Set([...(Array.isArray(opts.touched)?opts.touched:[]),...CRITICAL].map(safeRel))];
  ensure(path.join(root,'snapshots'));const snap=path.join(root,'snapshots',snapshotName(current));ensure(snap);
  const files=[];
  try{
    for(const rel of rels){const src=path.join(appDir,...rel.split('/')),exists=fs.existsSync(src)&&fs.statSync(src).isFile();files.push({rel,existed:exists});if(exists)copyFile(src,path.join(snap,...rel.split('/')))}
    const pending={schema:1,safetyVersion:SAFETY_VERSION,state:'prepared',fromVersion:current,toVersion:latest,appDir,snapshotDir:snap,preparedAt:Date.now(),files,bootCount:0,bootVersion:'',bootStartedAt:0,cleanExitAt:0,cleanExitVersion:'',appliedAt:0};
    writeJson(pendingPath(root),pending);try{fs.rmSync(failurePath(root),{force:true})}catch{}
    append(root,'UPDATE_PREPARED',{from:current,to:latest,files:files.length,snapshotDir:snap});return pending;
  }catch(e){try{fs.rmSync(snap,{recursive:true,force:true})}catch{};throw e}
}
function markUpdateApplied(opts={}){const root=rootOf(opts),p=pendingPath(root),x=readJson(p);if(!x)return false;x.state='applied';x.appliedAt=Date.now();x.expectedRelaunch=true;if(opts.from)x.fromVersion=String(opts.from);if(opts.to)x.toVersion=String(opts.to);writeJson(p,x);append(root,'UPDATE_APPLIED',{from:x.fromVersion,to:x.toVersion});return true}
function abortUpdateTransaction(opts={}){const root=rootOf(opts),p=pendingPath(root),x=readJson(p);if(!x)return false;append(root,'UPDATE_ABORTED',{from:x.fromVersion,to:x.toVersion,reason:String(opts.reason||'')});try{fs.rmSync(x.snapshotDir,{recursive:true,force:true})}catch{};try{fs.rmSync(p,{force:true})}catch{};return true}
function restoreSnapshot(x,root){const appDir=path.resolve(x.appDir||process.cwd());for(const f of Array.isArray(x.files)?x.files:[]){const rel=safeRel(f.rel),dst=path.join(appDir,...rel.split('/')),src=path.join(x.snapshotDir,...rel.split('/'));if(f.existed&&fs.existsSync(src)){copyFile(src,dst)}else if(!f.existed){try{fs.rmSync(dst,{recursive:true,force:true})}catch{}}}append(root,'AUTO_ROLLBACK',{from:x.toVersion,to:x.fromVersion,snapshotDir:x.snapshotDir});try{fs.rmSync(pendingPath(root),{force:true})}catch{};writeJson(path.join(root,'last-rollback.json'),{at:Date.now(),from:x.toVersion,to:x.fromVersion,snapshotDir:x.snapshotDir});}
function parseRecentHang(diagDir,since){const f=fs.existsSync(path.join(diagDir,'external-hang.log'))?path.join(diagDir,'external-hang.log'):path.join(diagDir,'external-hang-v01578.log');try{const st=fs.statSync(f),start=Math.max(0,st.size-256*1024),fd=fs.openSync(f,'r'),buf=Buffer.alloc(st.size-start);fs.readSync(fd,buf,0,buf.length,start);fs.closeSync(fd);for(const line of buf.toString('utf8').split(/\r?\n/)){if(!line.trim())continue;let j;try{j=JSON.parse(line)}catch{continue}const t=Date.parse(j.at||'')||0;if(t>=since&&/^HNG-[MRB]001$/.test(String(j.code||'')))return j}return null}catch{return null}}
function installBootGuard(opts={}){
  const root=rootOf(opts),version=String(opts.version||''),appDir=path.resolve(opts.appDir||process.cwd());ensure(root);
  let x=readJson(pendingPath(root)),rollbackScheduled=false;
  let app=null;try{app=require('electron').app}catch{}
  if(x&&x.state==='applied'&&String(x.toVersion)===version){
    const diagDir=app?path.join(app.getPath('userData'),'diagnostics'):path.join(root,'diagnostics');
    const priorOwnBoot=String(x.bootVersion||'')===version&&Number(x.bootStartedAt)>0;
    const abnormal=priorOwnBoot&&!Number(x.cleanExitAt||0);
    const hang=priorOwnBoot?parseRecentHang(diagDir,Number(x.bootStartedAt)||0):null;
    const failure=readJson(failurePath(root));const markedFailure=priorOwnBoot&&failure&&Number(failure.at||0)>=Number(x.bootStartedAt||0)?failure:null;
    if(abnormal||hang||markedFailure){
      try{restoreSnapshot(x,root);rollbackScheduled=true;if(typeof opts.record==='function')opts.record('SAFE-RB1','auto-rollback',{from:x.toVersion,to:x.fromVersion,reason:hang?.code||markedFailure?.code||'abnormal-exit'});if(app){app.whenReady().then(()=>setTimeout(()=>{try{app.relaunch()}catch{}app.exit(0)},100))}}catch(e){append(root,'ROLLBACK_FAILED',{message:e?.message||String(e)});if(typeof opts.record==='function')opts.record('SAFE-E901','rollback-failed',{message:e?.message||String(e)})}
    }else{
      x.bootCount=Number(x.bootCount||0)+1;x.bootVersion=version;x.bootStartedAt=Date.now();x.cleanExitAt=0;x.cleanExitVersion='';x.expectedRelaunch=false;writeJson(pendingPath(root),x);append(root,'PROBATION_START',{version,bootCount:x.bootCount});
      let healthy=0;
      const timer=setInterval(()=>{
        const now=Date.now();let mAge=999999,rAge=999999;
        try{const f=fs.existsSync(path.join(diagDir,'heartbeat-main.json'))?path.join(diagDir,'heartbeat-main.json'):path.join(diagDir,'heartbeat-main-v01578.json');mAge=now-fs.statSync(f).mtimeMs}catch{}
        try{const f=fs.existsSync(path.join(diagDir,'heartbeat-renderer.json'))?path.join(diagDir,'heartbeat-renderer.json'):path.join(diagDir,'heartbeat-renderer-v01578.json');rAge=now-fs.statSync(f).mtimeMs}catch{}
        if(mAge<1600&&rAge<1600)healthy++;else healthy=0;
        if(healthy>=12){
          clearInterval(timer);
          const cur=readJson(pendingPath(root));
          if(cur&&String(cur.toVersion)===version){
            writeJson(path.join(root,'last-known-good.json'),{version,committedAt:Date.now(),previousVersion:cur.fromVersion,rollbackSnapshot:cur.snapshotDir});
            append(root,'PROBATION_COMMIT',{version,previous:cur.fromVersion});
            try{fs.rmSync(pendingPath(root),{force:true})}catch{}
            try{fs.rmSync(failurePath(root),{force:true})}catch{}
            if(typeof opts.record==='function')opts.record('SAFE-OK1','update-probation-committed',{version});
          }
        }
      },1000);timer.unref?.();
    }
  }
  if(app){app.on('before-quit',()=>{const cur=readJson(pendingPath(root));if(cur&&String(cur.bootVersion||'')===version){cur.cleanExitAt=Date.now();cur.cleanExitVersion=version;writeJson(pendingPath(root),cur);append(root,'CLEAN_EXIT',{version})}})}
  return{root,rollbackScheduled,pending:readJson(pendingPath(root))};
}
function markSafetyFailure(opts={}){const root=rootOf(opts),payload={at:Date.now(),code:String(opts.code||'SAFE-FAIL'),detail:opts.detail||{}};writeJson(failurePath(root),payload);append(root,'SAFETY_FAILURE',payload);return payload}
module.exports={prepareUpdateTransaction,markUpdateApplied,abortUpdateTransaction,installBootGuard,markSafetyFailure,_test:{restoreSnapshot,readJson,writeJson,rootOf,parseRecentHang},score_logic_changed:false};
