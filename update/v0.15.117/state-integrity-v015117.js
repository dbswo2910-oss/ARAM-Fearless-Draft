'use strict';
const fs=require('fs');
const path=require('path');

const VERSION='0.15.117';
const DEFAULT_MAX_BYTES=8*1024*1024;
const DIAG_MAX_BYTES=2*1024*1024;

function defaultUserData(){
  try{
    const {app}=require('electron');
    if(app&&typeof app.getPath==='function')return app.getPath('userData');
  }catch{}
  const roaming=process.env.APPDATA||path.join(process.env.USERPROFILE||process.cwd(),'AppData','Roaming');
  return path.join(roaming,'ARAM Fearless Draft');
}
function rootOf(opts={}){return path.resolve(opts.root||path.join(defaultUserData(),'state-integrity-v015117'))}
function ensure(dir){fs.mkdirSync(dir,{recursive:true})}
function safeName(name){
  const s=String(name||'').trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(s))throw new Error('unsafe state namespace');
  return s;
}
function validateSize(text,maxBytes=DEFAULT_MAX_BYTES){
  const bytes=Buffer.byteLength(String(text),'utf8');
  if(bytes>maxBytes)throw new Error(`state payload too large: ${bytes}`);
  return bytes;
}
function validBy(value,validator){
  if(typeof validator!=='function')return true;
  try{return validator(value)!==false}catch{return false}
}
function parseJsonText(text,{validator,maxBytes=DEFAULT_MAX_BYTES}={}){
  validateSize(text,maxBytes);
  const value=JSON.parse(String(text));
  if(!validBy(value,validator))throw new Error('state schema validation failed');
  return value;
}
function readJsonFile(file,opts={}){
  try{
    const st=fs.statSync(file);
    if(!st.isFile())return{ok:false,reason:'not-file'};
    if(st.size>Number(opts.maxBytes||DEFAULT_MAX_BYTES))return{ok:false,reason:'too-large',size:st.size};
    const text=fs.readFileSync(file,'utf8');
    const value=parseJsonText(text,opts);
    return{ok:true,value,text,size:Buffer.byteLength(text,'utf8')};
  }catch(e){return{ok:false,reason:e?.code==='ENOENT'?'missing':'invalid',error:e?.message||String(e)}}
}
function fsyncDir(dir){
  let fd;
  try{fd=fs.openSync(dir,'r');fs.fsyncSync(fd)}catch{}finally{try{if(fd!==undefined)fs.closeSync(fd)}catch{}}
}
function writeTextAtomic(file,text,{maxBytes=DEFAULT_MAX_BYTES}={}){
  text=String(text);validateSize(text,maxBytes);ensure(path.dirname(file));
  const token=`${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const tmp=`${file}.tmp-${token}`;
  let fd;
  try{
    fd=fs.openSync(tmp,'wx',0o600);
    fs.writeFileSync(fd,text,'utf8');
    fs.fsyncSync(fd);
  }finally{try{if(fd!==undefined)fs.closeSync(fd)}catch{}}
  try{
    fs.renameSync(tmp,file);
  }catch(first){
    const old=`${file}.swap-${token}`;let moved=false;
    try{
      if(fs.existsSync(file)){fs.renameSync(file,old);moved=true}
      fs.renameSync(tmp,file);
      if(moved)fs.rmSync(old,{force:true});
    }catch(second){
      try{if(moved&&!fs.existsSync(file)&&fs.existsSync(old))fs.renameSync(old,file)}catch{}
      try{fs.rmSync(tmp,{force:true})}catch{}
      throw second||first;
    }
  }
  fsyncDir(path.dirname(file));
  return true;
}
function rotateDiag(root){
  const file=path.join(root,'state-integrity.ndjson');
  try{if(fs.statSync(file).size>DIAG_MAX_BYTES){const old=file+'.1';try{fs.rmSync(old,{force:true})}catch{};fs.renameSync(file,old)}}catch{}
  return file;
}
function appendDiagnostic(opts={},event,detail={}){
  const root=rootOf(opts);try{ensure(root);const file=rotateDiag(root);fs.appendFileSync(file,JSON.stringify({at:new Date().toISOString(),version:VERSION,event,detail})+'\n','utf8')}catch{}
}
function quarantine(file,opts={},label='state'){
  try{
    if(!fs.existsSync(file))return'';
    const root=rootOf(opts),dir=path.join(root,'quarantine');ensure(dir);
    const dst=path.join(dir,`${safeName(label)}-${Date.now()}.corrupt`);
    fs.copyFileSync(file,dst);return dst;
  }catch{return''}
}
function namespacePaths(name,opts={}){
  const root=rootOf(opts),n=safeName(name),dir=path.join(root,'mirrors');ensure(dir);
  return{root,primary:path.join(dir,`${n}.json`),backup:path.join(dir,`${n}.bak.json`),name:n};
}
function writeNamespace(name,payload,opts={}){
  const p=namespacePaths(name,opts),validator=opts.validator,maxBytes=Number(opts.maxBytes)||DEFAULT_MAX_BYTES;
  if(!validBy(payload,validator))throw new Error('state namespace schema validation failed');
  const text=JSON.stringify({schema:1,namespace:p.name,version:VERSION,updatedAt:Date.now(),payload});
  validateSize(text,maxBytes);
  const current=readJsonFile(p.primary,{maxBytes});
  if(current.ok)writeTextAtomic(p.backup,current.text,{maxBytes});
  writeTextAtomic(p.primary,text,{maxBytes});
  const verify=readJsonFile(p.primary,{maxBytes,validator:x=>x&&x.schema===1&&x.namespace===p.name&&validBy(x.payload,validator)});
  if(!verify.ok)throw new Error('state namespace post-write verification failed');
  appendDiagnostic(opts,'MIRROR_WRITE',{namespace:p.name,bytes:verify.size});
  return{ok:true,namespace:p.name,updatedAt:verify.value.updatedAt};
}
function readNamespace(name,opts={}){
  const p=namespacePaths(name,opts),validator=opts.validator,maxBytes=Number(opts.maxBytes)||DEFAULT_MAX_BYTES;
  const envelopeValidator=x=>x&&x.schema===1&&x.namespace===p.name&&validBy(x.payload,validator);
  const primary=readJsonFile(p.primary,{maxBytes,validator:envelopeValidator});
  if(primary.ok)return{ok:true,payload:primary.value.payload,source:'primary',recovered:false,updatedAt:primary.value.updatedAt||0};
  const backup=readJsonFile(p.backup,{maxBytes,validator:envelopeValidator});
  if(backup.ok){
    const q=quarantine(p.primary,opts,`${p.name}-mirror`);
    writeTextAtomic(p.primary,backup.text,{maxBytes});
    appendDiagnostic(opts,'MIRROR_RECOVERED',{namespace:p.name,reason:primary.reason,quarantine:q||''});
    return{ok:true,payload:backup.value.payload,source:'backup',recovered:true,updatedAt:backup.value.updatedAt||0};
  }
  if(primary.reason!=='missing'||backup.reason!=='missing')appendDiagnostic(opts,'MIRROR_UNREADABLE',{namespace:p.name,primary:primary.reason,backup:backup.reason});
  return{ok:false,payload:null,source:'none',recovered:false,reason:primary.reason||'missing'};
}
function externalPath(name,opts={}){const root=rootOf(opts),n=safeName(name),dir=path.join(root,'external-lkg');ensure(dir);return{root,name:n,lkg:path.join(dir,`${n}.json`)}}
function guardExternalJson(file,{name,validator,maxBytes=DEFAULT_MAX_BYTES,root}={}){
  if(!file)throw new Error('external state file required');
  const opts={root},p=externalPath(name||path.basename(file).replace(/[^A-Za-z0-9._-]/g,'_'),opts);
  const primary=readJsonFile(file,{validator,maxBytes});
  if(primary.ok){
    writeTextAtomic(p.lkg,primary.text,{maxBytes});
    appendDiagnostic(opts,'EXTERNAL_LKG_CAPTURE',{name:p.name,bytes:primary.size});
    return{ok:true,recovered:false,captured:true,source:'primary'};
  }
  const lkg=readJsonFile(p.lkg,{validator,maxBytes});
  if(lkg.ok){
    const q=quarantine(file,opts,`${p.name}-external`);
    writeTextAtomic(file,lkg.text,{maxBytes});
    appendDiagnostic(opts,'EXTERNAL_RECOVERED',{name:p.name,reason:primary.reason,quarantine:q||''});
    return{ok:true,recovered:true,captured:false,source:'lkg',reason:primary.reason};
  }
  if(primary.reason==='missing'&&lkg.reason==='missing')return{ok:true,recovered:false,captured:false,source:'empty'};
  appendDiagnostic(opts,'EXTERNAL_UNRECOVERABLE',{name:p.name,primary:primary.reason,lkg:lkg.reason});
  return{ok:false,recovered:false,captured:false,source:'none',reason:primary.reason};
}
function watchExternalJson(file,opts={}){
  guardExternalJson(file,opts);
  const listener=(cur,prev)=>{
    if(cur.mtimeMs===prev.mtimeMs&&cur.size===prev.size)return;
    try{guardExternalJson(file,opts)}catch(e){appendDiagnostic({root:opts.root},'EXTERNAL_WATCH_ERROR',{name:opts.name||path.basename(file),message:e?.message||String(e)})}
  };
  fs.watchFile(file,{interval:1200,persistent:false},listener);
  return()=>{try{fs.unwatchFile(file,listener)}catch{}};
}
module.exports={
  VERSION,DEFAULT_MAX_BYTES,rootOf,safeName,parseJsonText,readJsonFile,writeTextAtomic,
  writeNamespace,readNamespace,guardExternalJson,watchExternalJson,appendDiagnostic,
  score_logic_changed:false,random_scoring_changed:false,policy_version:VERSION
};
