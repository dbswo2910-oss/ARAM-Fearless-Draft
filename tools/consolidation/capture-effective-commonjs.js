'use strict';
const fs=require('fs');
const path=require('path');
const Module=require('module');

const appDir=path.resolve(process.argv[2]||'');
const entry=String(process.argv[3]||'');
const out=path.resolve(process.argv[4]||'');
if(!appDir||!entry||!out)throw new Error('usage: node capture-effective-commonjs.js <appDir> <entry> <out>');
const active=path.join(appDir,entry);
if(!fs.existsSync(active))throw new Error(`entry missing: ${active}`);

const originalLoad=Module._load;
const originalCompile=Module.prototype._compile;
const noop=()=>{};
const blackbox={install:noop,record:noop};
const electronStub={
  app:{on:noop,once:noop,getPath:()=>appDir,setPath:noop,disableHardwareAcceleration:noop,whenReady:()=>new Promise(()=>{})},
  ipcMain:{handle:noop,removeHandler:noop,on:noop,removeListener:noop},
  BrowserWindow:function(){},
  dialog:{},shell:{},nativeTheme:{},
  contextBridge:{exposeInMainWorld:noop},
  ipcRenderer:{invoke:async()=>null,on:noop,removeListener:noop}
};

function sideEffectStub(request){
  switch(request){
    case './update-safety-v01579': return{installBootGuard:()=>({rollbackScheduled:false})};
    case './freeze-blackbox-v01577': return blackbox;
    case './hang-heartbeat-v01579': return{install:noop};
    case './ingame-transition-patch-v01575': return{patchIndexText:text=>({ok:true,text,changed:false,results:[]})};
    case './safe-index-patch-v01578': return{patchIndexText:text=>({ok:true,text,changed:false,status:'stub',count:0})};
    case './autosync-live-runtime-v01571': return{patch:noop};
    case './autosync-concurrency-v015119': return{install:noop};
    case './autosync-core': return{};
    case './cold-start-promotion-v0160': return{install:noop};
    case './canonical-owner-bundler-v0160': return{buildRendererSource:()=>({source:'true',modules:[]})};
    case './src/main/universal-rating-ipc': return{installUniversalRatingIpc:noop};
    default:return null;
  }
}
Module._load=function(request,parent,isMain){
  if(request==='electron')return electronStub;
  const stub=sideEffectStub(request);
  if(stub)return stub;
  return originalLoad.call(this,request,parent,isMain);
};

let compileCount=0;
let captured=null;
let stopped=false;
Module.prototype._compile=function(content,filename){
  const isActive=path.resolve(filename)===path.resolve(active);
  if(isActive){
    compileCount++;
    const text=String(content);
    captured=text;
    const isSuccessor=/module\._compile\s*\(\s*src\s*,\s*__filename\s*\)/.test(text);
    if(!isSuccessor){
      stopped=true;
      fs.mkdirSync(path.dirname(out),{recursive:true});
      fs.writeFileSync(out,text,'utf8');
      return this.exports;
    }
  }
  return originalCompile.call(this,content,filename);
};

let error=null;
try{require(active)}catch(e){error=e}
Module._load=originalLoad;
Module.prototype._compile=originalCompile;
if(error)throw error;
if(!stopped||!captured)throw new Error(`final CommonJS source was not captured; compileCount=${compileCount}`);
console.log(JSON.stringify({status:'SUCCESS',entry,compileCount,bytes:Buffer.byteLength(captured),out},null,2));
