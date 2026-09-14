'use strict';
const fs=require('fs');
const path=require('path');
const IMPLEMENTATION_VERSION='0.16-shadow';
const FORMAT_ROOT='update-safety-v01579';
const SCHEMA=1;
const CRITICAL_FILES=Object.freeze(['index.html','autosync-core.js','main.js','preload.js','package.json']);
function safeRelativePath(value){
  const rel=String(value||'').replace(/\\/g,'/').replace(/^\.\//,'');
  if(!rel||rel.startsWith('/')||rel.includes('\0')||rel.split('/').some(x=>x==='..')||/^[A-Za-z]:/.test(rel))throw new Error('unsafe updater path '+rel);
  return rel;
}
function ensure(dir){fs.mkdirSync(dir,{recursive:true})}
function readJson(file){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return null}}
function writeJsonAtomic(file,value){ensure(path.dirname(file));const tmp=`${file}.tmp-${process.pid}-${Date.now()}`;fs.writeFileSync(tmp,JSON.stringify(value,null,2),'utf8');try{fs.renameSync(tmp,file)}catch{try{fs.rmSync(file,{force:true})}catch{}fs.renameSync(tmp,file)}}
function rootOf(opts={}){if(opts.root)return path.resolve(opts.root);return path.resolve(process.cwd(),'.'+FORMAT_ROOT)}
function pendingPath(root){return path.join(root,'pending-update.json')}
function historyPath(root){return path.join(root,'safety-history.ndjson')}
function append(root,event,detail={}){try{ensure(root);fs.appendFileSync(historyPath(root),JSON.stringify({at:new Date().toISOString(),event,detail})+'\n','utf8')}catch{}}
function copy(src,dst){ensure(path.dirname(dst));fs.copyFileSync(src,dst)}
function snapshotName(current,now=Date.now()){return `${now}-v${String(current||'unknown').replace(/[^0-9A-Za-z._-]/g,'_')}`}
function prepareTransaction(opts={}){
  const root=rootOf(opts),appDir=path.resolve(opts.appDir||process.cwd()),current=String(opts.current||''),latest=String(opts.latest||'');
  const files=[...new Set([...(Array.isArray(opts.touched)?opts.touched:[]),...CRITICAL_FILES].map(safeRelativePath))];
  ensure(path.join(root,'snapshots'));const snapshotDir=path.join(root,'snapshots',snapshotName(current));ensure(snapshotDir);const inventory=[];
  try{
    for(const rel of files){const source=path.join(appDir,...rel.split('/')),existed=fs.existsSync(source)&&fs.statSync(source).isFile();inventory.push({rel,existed});if(existed)copy(source,path.join(snapshotDir,...rel.split('/')))}
    const pending={schema:SCHEMA,state:'prepared',fromVersion:current,toVersion:latest,appDir,snapshotDir,preparedAt:Date.now(),files:inventory,bootCount:0,bootVersion:'',bootStartedAt:0,cleanExitAt:0,cleanExitVersion:'',appliedAt:0};
    writeJsonAtomic(pendingPath(root),pending);append(root,'UPDATE_PREPARED',{from:current,to:latest,files:inventory.length,snapshotDir});return pending;
  }catch(error){try{fs.rmSync(snapshotDir,{recursive:true,force:true})}catch{}throw error}
}
function markApplied(opts={}){const root=rootOf(opts),file=pendingPath(root),pending=readJson(file);if(!pending)return false;pending.state='applied';pending.appliedAt=Date.now();pending.expectedRelaunch=true;if(opts.from)pending.fromVersion=String(opts.from);if(opts.to)pending.toVersion=String(opts.to);writeJsonAtomic(file,pending);append(root,'UPDATE_APPLIED',{from:pending.fromVersion,to:pending.toVersion});return true}
function abortTransaction(opts={}){const root=rootOf(opts),file=pendingPath(root),pending=readJson(file);if(!pending)return false;append(root,'UPDATE_ABORTED',{from:pending.fromVersion,to:pending.toVersion,reason:String(opts.reason||'')});try{fs.rmSync(pending.snapshotDir,{recursive:true,force:true})}catch{}try{fs.rmSync(file,{force:true})}catch{}return true}
function restoreSnapshot(pending,opts={}){
  if(!pending||typeof pending!=='object')throw new Error('pending transaction required');const root=rootOf(opts),appDir=path.resolve(pending.appDir||process.cwd());
  for(const entry of Array.isArray(pending.files)?pending.files:[]){const rel=safeRelativePath(entry.rel),dst=path.join(appDir,...rel.split('/')),src=path.join(pending.snapshotDir,...rel.split('/'));if(entry.existed&&fs.existsSync(src))copy(src,dst);else if(!entry.existed)try{fs.rmSync(dst,{recursive:true,force:true})}catch{}}
  append(root,'AUTO_ROLLBACK',{from:pending.toVersion,to:pending.fromVersion,snapshotDir:pending.snapshotDir});try{fs.rmSync(pendingPath(root),{force:true})}catch{}writeJsonAtomic(path.join(root,'last-rollback.json'),{at:Date.now(),from:pending.toVersion,to:pending.fromVersion,snapshotDir:pending.snapshotDir});return true;
}
function readPending(opts={}){return readJson(pendingPath(rootOf(opts)))}
module.exports={IMPLEMENTATION_VERSION,FORMAT_ROOT,SCHEMA,CRITICAL_FILES,safeRelativePath,rootOf,prepareTransaction,markApplied,abortTransaction,restoreSnapshot,readPending,production_active:false,score_logic_changed:false,random_scoring_changed:false,_test:{readJson,writeJsonAtomic,snapshotName,pendingPath}};
