'use strict';
const fs=require('fs');
const path=require('path');
const https=require('https');
const crypto=require('crypto');
let electron=null;try{electron=require('electron')}catch{}
const VERSION='0.15.131';
const REPO='dbswo2910-oss/ARAM-Fearless-Draft';
const BRANCH='main';
function readJson(p){try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return null}}
function sha(p){try{const h=crypto.createHash('sha256'),fd=fs.openSync(p,'r'),buf=Buffer.alloc(1024*1024);let n=0;do{n=fs.readSync(fd,buf,0,buf.length,null);if(n)h.update(buf.subarray(0,n))}while(n);fs.closeSync(fd);return h.digest('hex')}catch{return''}}
function existsFile(p){try{return fs.statSync(p).isFile()}catch{return false}}
function appDirs(){
  const local=process.env.LOCALAPPDATA||'';if(!local)return[];
  const out=[],seen=new Set(),add=p=>{p=path.resolve(p);const k=p.toLowerCase();if(!seen.has(k)){seen.add(k);out.push(p)}};
  add(path.join(local,'ARAM Fearless Draft AutoUpdate','appfiles'));
  add(path.join(local,'ARAM Fearless Draft AutoUpdater','appfiles'));
  try{for(const n of fs.readdirSync(local)){if(!/^ARAM Fearless Draft AutoUpdate/i.test(n))continue;const r=path.join(local,n);add(path.join(r,'appfiles'));if(/appfiles$/i.test(n))add(r)}}catch{}
  return out;
}
function installedCandidates(){return appDirs().map(dir=>{const pkg=readJson(path.join(dir,'package.json')),main=pkg?.main?path.join(dir,pkg.main):'';return{dir,version:String(pkg?.version||''),main:String(pkg?.main||''),valid:!!pkg?.version&&!!pkg?.main&&existsFile(main),packageSha256:sha(path.join(dir,'package.json')),mainSha256:main?sha(main):''}})}
function fetchRemoteManifest(){return new Promise(resolve=>{const url=`https://raw.githubusercontent.com/${REPO}/${BRANCH}/update/manifest.json?t=${Date.now()}`;let u;try{u=new URL(url)}catch{return resolve(null)};const req=https.get(u,{headers:{'User-Agent':'ARAM-Fearless-Draft-Boot-Diagnostic/'+VERSION,'Cache-Control':'no-cache'}},res=>{if(Number(res.statusCode)!==200){res.resume();return resolve(null)};const chunks=[];let size=0;res.on('data',c=>{size+=c.length;if(size<1024*1024)chunks.push(c)});res.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{resolve(null)}})});req.setTimeout(4000,()=>req.destroy());req.on('error',()=>resolve(null))})}
function diagnosticRoot(){try{return path.join(electron.app.getPath('userData'),'diagnostics','update-boot-v015131')}catch{return path.join(process.cwd(),'diagnostics','update-boot-v015131')}}
function safetyState(){
  let root='';try{root=path.join(electron.app.getPath('userData'),'update-safety-v01579')}catch{return{root:'',pending:null,lastKnownGood:null,lastRollback:null,failure:null}}
  return{root,pending:readJson(path.join(root,'pending-update.json')),lastKnownGood:readJson(path.join(root,'last-known-good.json')),lastRollback:readJson(path.join(root,'last-rollback.json')),failure:readJson(path.join(root,'safety-failure.json'))}
}
function build(stage,remote){
  const appDir=__dirname,pkg=readJson(path.join(appDir,'package.json'))||{},mainPath=pkg.main?path.join(appDir,pkg.main):'',s=safetyState(),candidates=installedCandidates();
  const recentRollback=!!s.lastRollback&&Date.now()-Number(s.lastRollback.at||0)<5*60*1000;
  return{schema:1,at:new Date().toISOString(),stage,runtimeVersion:VERSION,executablePath:process.execPath,cwd:process.cwd(),appDir,appVersion:(()=>{try{return electron.app.getVersion()}catch{return String(pkg.version||'')}})(),installedVersion:String(pkg.version||''),installedMain:String(pkg.main||''),installedPackageSha256:sha(path.join(appDir,'package.json')),installedMainSha256:mainPath?sha(mainPath):'',manifestVersion:String(remote?.version||''),updateTargetVersion:String(remote?.version||''),manifestMinLauncher:String(remote?.min_launcher||''),launcherVersion:String(process.env.ARAM_LAUNCHER_VERSION||''),launcherExecutable:String(process.env.ARAM_LAUNCHER_EXECUTABLE||''),launcherSelectedAppDir:String(process.env.ARAM_LAUNCHER_APPDIR||''),launcherSelectedVersion:String(process.env.ARAM_LAUNCHER_SELECTED_VERSION||''),launcherBootId:String(process.env.ARAM_LAUNCHER_BOOT_ID||''),bootSource:process.argv.includes('--aram-update-handoff')?'in-app-update-handoff':process.argv.includes('--aram-launcher-cold-start')?'outer-launcher-cold-start':'direct-electron-or-legacy-launcher',installedCandidates:candidates,duplicateInstallDetected:candidates.filter(x=>x.valid).length>1,safetyRoot:s.root,activeSnapshot:String(s.pending?.snapshotDir||s.lastKnownGood?.rollbackSnapshot||''),lastKnownGoodVersion:String(s.lastKnownGood?.version||''),pendingUpdate:s.pending?{state:s.pending.state,fromVersion:s.pending.fromVersion,toVersion:s.pending.toVersion,bootVersion:s.pending.bootVersion,bootCount:s.pending.bootCount,cleanExitVersion:s.pending.cleanExitVersion,snapshotDir:s.pending.snapshotDir}:null,rollbackObserved:recentRollback,lastRollback:s.lastRollback||null,safetyFailure:s.failure?{at:s.failure.at,code:s.failure.code}:null};
}
function text(d){return`=== UPDATE BOOT DIAGNOSTIC ===\nExecutable: ${d.executablePath}\nLauncher Executable: ${d.launcherExecutable||'(legacy/unknown)'}\nApp Dir: ${d.appDir}\nApp Version: ${d.appVersion}\nRuntime Version: ${d.runtimeVersion}\nManifest Version: ${d.manifestVersion||'(pending network probe)'}\nInstalled Version: ${d.installedVersion}\nInstalled Main: ${d.installedMain}\nInstalled Main SHA256: ${d.installedMainSha256}\nActive Snapshot: ${d.activeSnapshot||'(none)'}\nLast Known Good: ${d.lastKnownGoodVersion||'(none)'}\nPending Update: ${d.pendingUpdate?`${d.pendingUpdate.fromVersion} -> ${d.pendingUpdate.toVersion} (${d.pendingUpdate.state})`:'(none)'}\nUpdate Target: ${d.updateTargetVersion||'(pending network probe)'}\nBoot Source: ${d.bootSource}\nDuplicate Install: ${d.duplicateInstallDetected}\nRollback: ${d.rollbackObserved}\n==============================\n`}
function write(d){try{const root=diagnosticRoot();fs.mkdirSync(root,{recursive:true});const json=JSON.stringify(d,null,2)+'\n';fs.writeFileSync(path.join(root,'latest.json'),json,'utf8');fs.writeFileSync(path.join(root,'UPDATE_BOOT_DIAGNOSTIC.txt'),text(d),'utf8');fs.appendFileSync(path.join(root,'history.ndjson'),JSON.stringify(d)+'\n','utf8')}catch{}
  try{console.log(text(d))}catch{}
  return d;
}
function capture(stage,remote=null){return write(build(stage,remote))}
function install(){
  const early=capture('pre-main');
  if(!electron?.app)return early;
  const ready=()=>{const now=capture('ready');void now;fetchRemoteManifest().then(m=>capture('ready+remote-manifest',m)).catch(()=>{})};
  if(electron.app.isReady())ready();else electron.app.whenReady().then(ready).catch(()=>{});
  return early;
}
module.exports={install,capture,_test:{readJson,installedCandidates,build,text},score_logic_changed:false,random_scoring_changed:false,policy_version:VERSION};
