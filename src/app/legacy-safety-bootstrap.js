'use strict';
const fs=require('fs');
const path=require('path');

function fromRoot(appRoot,file){return require(path.join(appRoot,file))}

function install({appRoot,version,livePatch}={}){
  appRoot=path.resolve(String(appRoot||''));
  version=String(version||'').trim();
  if(!appRoot||!version)throw new Error('legacy safety bootstrap requires appRoot + version');
  if(!livePatch||typeof livePatch.patch!=='function')throw new Error('legacy safety bootstrap requires live AutoSync patch owner');

  const updateSafety=fromRoot(appRoot,'update-safety-v01579.js');
  let blackbox=null;
  try{blackbox=fromRoot(appRoot,'freeze-blackbox-v01577.js')}catch{}
  const bootSafety=updateSafety.installBootGuard({version,appDir:appRoot,record:blackbox?.record});
  if(bootSafety?.rollbackScheduled)return{rollbackScheduled:true,bootSafety};

  if(!blackbox)blackbox=fromRoot(appRoot,'freeze-blackbox-v01577.js');
  blackbox.install({version});
  fromRoot(appRoot,'hang-heartbeat-v01579.js').install({version,record:blackbox.record});

  const {patchIndexText:patchInGame}=fromRoot(appRoot,'ingame-transition-patch-v01575.js');
  const {patchIndexText:patchRenderAll}=fromRoot(appRoot,'safe-index-patch-v01578.js');
  const indexPath=path.join(appRoot,'index.html');
  const before=fs.readFileSync(indexPath,'utf8');
  const a=patchInGame(before);
  if(!a.ok)throw new Error('v0.17 legacy in-game index contract mismatch: '+JSON.stringify(a.results));
  const b=patchRenderAll(a.text);
  if(!b.ok)throw new Error('v0.17 legacy renderAll index contract mismatch: '+JSON.stringify({status:b.status,count:b.count}));
  const changed=!!(a.changed||b.changed);
  if(changed){
    const backup=path.join(appRoot,'index.pre-v01578-stability.bak.html');
    if(!fs.existsSync(backup))fs.copyFileSync(indexPath,backup);
    fs.writeFileSync(indexPath,b.text,'utf8');
    blackbox.record('IDX-0170','index-stability-patched',{inGame:!!a.changed,renderAll:!!b.changed});
  }

  const autosyncCore=fromRoot(appRoot,'autosync-core.js');
  livePatch.patch(autosyncCore);
  return{rollbackScheduled:false,bootSafety,blackbox,indexPatch:{inGame:a,renderAll:b,changed}};
}

module.exports={install,production_active:true,owner_status:'clean-bootstrap'};
