'use strict';
const fs=require('fs');
const path=require('path');
const updateSafety=require('./update-safety-v01579');
let blackbox=null;
try{blackbox=require('./freeze-blackbox-v01577')}catch{}
const bootSafety=updateSafety.installBootGuard({version:'0.15.79',appDir:__dirname,record:blackbox?.record});
if(bootSafety.rollbackScheduled){
  module.exports={rollbackScheduled:true};
}else{
  if(!blackbox)blackbox=require('./freeze-blackbox-v01577');
  blackbox.install({version:'0.15.79'});
  require('./hang-heartbeat-v01579').install({version:'0.15.79',record:blackbox.record});
  const {patchIndexText:patchInGame}=require('./ingame-transition-patch-v01575');
  const {patchIndexText:patchRenderAll}=require('./safe-index-patch-v01578');
  function patchInstalledIndex(){
    const p=path.join(__dirname,'index.html');
    const before=fs.readFileSync(p,'utf8');
    const a=patchInGame(before);if(!a.ok)throw new Error('v0.15.79 in-game index contract mismatch: '+JSON.stringify(a.results));
    const b=patchRenderAll(a.text);if(!b.ok)throw new Error('v0.15.79 renderAll index contract mismatch: '+JSON.stringify({status:b.status,count:b.count}));
    const changed=!!(a.changed||b.changed);
    if(changed){
      const backup=path.join(__dirname,'index.pre-v01578-stability.bak.html');
      if(!fs.existsSync(backup))fs.copyFileSync(p,backup);
      fs.writeFileSync(p,b.text,'utf8');
      blackbox.record('IDX-079','index-stability-patched',{inGame:!!a.changed,renderAll:!!b.changed});
    }
    return{inGame:a,renderAll:b,changed};
  }
  try{patchInstalledIndex()}catch(e){blackbox.record('IDX-E079','index-patch-error',{message:e?.message||String(e),stack:e?.stack||''});throw e}
  const autosyncCore=require('./autosync-core');
  require('./autosync-live-runtime-v01571').patch(autosyncCore);
  const basePath=path.join(__dirname,'main.js');
  let src=fs.readFileSync(basePath,'utf8');
  const scriptsOld="'runtime-performance-v01568.js','live-strength-v01513.js'";
  const scriptsNew="'runtime-blackbox-v01577.js','runtime-safety-net-v01579.js','runtime-performance-v01568.js','runtime-live-autosync-v01571.js','live-strength-v01513.js'";
  const randomOld="'random-party-pool-labels-v01562.js','item-art-hotfix-v01563.js'";
  const randomNew="'random-party-pool-labels-v01562.js','runtime-random-practice-v01572.js','item-art-hotfix-v01563.js'";
  const readyOld='Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__) && Boolean(window.__ARAM_LIVE_STRENGTH_V01513__)';
  const readyNew='Boolean(window.__ARAM_BLACKBOX_V01577__) && Boolean(window.__ARAM_SAFETY_NET_V01579__) && Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__) && Boolean(window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__) && Boolean(window.__ARAM_LIVE_STRENGTH_V01513__)';
  const randomReadyOld='Boolean(window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__) && Boolean(window.__ARAM_ITEM_ART_HOTFIX_V01563__)';
  const randomReadyNew='Boolean(window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__) && Boolean(window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__) && Boolean(window.__ARAM_ITEM_ART_HOTFIX_V01563__)';
  for(const needle of [scriptsOld,randomOld,readyOld,randomReadyOld,"const VERSION='0.15.70'"]){if(!src.includes(needle))throw new Error('v0.15.79 base main contract mismatch: '+needle.slice(0,90))}
  src=src.replace(scriptsOld,scriptsNew).replace(randomOld,randomNew).replace(readyOld,readyNew).replace(randomReadyOld,randomReadyNew).replaceAll('0.15.70','0.15.79');
  const loopOld=`let chain=Promise.resolve();
      for(const file of scripts){
        const code=fs.readFileSync(path.join(__dirname,file),'utf8')+\`\\n//# sourceURL=\${file}\`;
        chain=chain.then(()=>mainWindow.webContents.executeJavaScript(code,false));
        if(file==='item-icons-global-v01557.js')chain=chain.then(()=>mainWindow.webContents.executeJavaScript('window.aramRandomIngameRuntimeV01570?.finishBootstrap?.(); true',false));
      }`;
  const loopNew=`let chain=require('./runtime-loader-v01579').injectRuntimeStack({mainWindow,scripts,blackbox:require('./freeze-blackbox-v01577'),patchRuntimeSource:require('./runtime-source-stability-v01579').patchRuntimeSource});`;
  if(!src.includes(loopOld))throw new Error('v0.15.79 runtime loader loop contract mismatch');
  src=src.replace(loopOld,loopNew);
  const finalOld="chain.then(()=>mainWindow.webContents.executeJavaScript('window.aramRuntimePerformanceV01568?.restoreTimerHook?.(); true',false)).then(()=>mainWindow.webContents.executeJavaScript(";
  const finalNew="chain.then(()=>mainWindow.webContents.executeJavaScript(";
  if(!src.includes(finalOld))throw new Error('v0.15.79 runtime finalizer contract mismatch');
  src=src.replace(finalOld,finalNew);
  src=require('./updater-safety-patch-v01579').patchUpdaterSource(src);
  module._compile(src,__filename);
}
