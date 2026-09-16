'use strict';
const fs=require('fs');
const path=require('path');
const os=require('os');
const vm=require('vm');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'../..');
const BASELINE_COMMIT='99e65c90d930d2bd2e0b9297518d0657b6c8e399';
const VERSION='0.17.0';
const OUT_DIR=path.join(ROOT,'src','app');
const RELEASE_DIR=path.join(ROOT,'update','v0.17.0');

function gitShow(rel){return cp.execFileSync('git',['show',`${BASELINE_COMMIT}:${rel}`],{cwd:ROOT,encoding:'utf8',maxBuffer:128*1024*1024})}
function baselineManifest(){return JSON.parse(gitShow('update/manifest.json').replace(/^\uFEFF/,''))}
function write(rel,text){const p=path.join(ROOT,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text.endsWith('\n')?text:text+'\n','utf8')}
function overlayFromBaseline(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aram-v0170-overlay-'));
  const manifest=baselineManifest();
  for(const row of manifest.files||[]){
    if(!row?.path||!row?.source)continue;
    const src=path.join(ROOT,...String(row.source).split('/'));
    const dst=path.join(dir,...String(row.path).split('/'));
    if(!fs.existsSync(src))throw new Error(`baseline source missing: ${row.source}`);
    fs.mkdirSync(path.dirname(dst),{recursive:true});
    fs.copyFileSync(src,dst);
  }
  return{dir,manifest};
}
function loadOverlayModule(overlay,id){return require(path.join(overlay,id.replace(/^\.\//,'')))}
function materializeLegacy(overlay){
  const route=require(path.join(ROOT,'update','v0.16.0','successor-route-v0160.js'));
  let source=route.patchSuccessorSource(fs.readFileSync(path.join(overlay,'main-v015122.js'),'utf8'));
  const filename=path.join(overlay,'main-v015122.js');
  let steps=0;
  while(true){
    if(++steps>90)throw new Error('legacy compile chain exceeded 90 steps');
    const isV79=source.includes("const updateSafety=require('./update-safety-v01579')");
    if(isV79){
      const sideEffect="try{patchInstalledIndex()}catch(e){blackbox.record('IDX-E079','index-patch-error',{message:e?.message||String(e),stack:e?.stack||''});throw e}";
      if(!source.includes(sideEffect))throw new Error('v0.15.79 index side-effect anchor missing during materialization');
      source=source.replace(sideEffect,'void patchInstalledIndex; // moved to v0.17 clean bootstrap');
    }
    let captured=null;
    const moduleMock={exports:{},_compile(next){captured=String(next)}};
    const blackbox={install(){},record(){}};
    const fakeRequire=id=>{
      if(id==='fs')return fs;
      if(id==='path')return path;
      if(id==='electron')return{app:{getPath:()=>overlay,setPath(){},on(){}},ipcMain:{handle(){},removeHandler(){}}};
      if(id==='./update-safety-v01579')return{installBootGuard:()=>({rollbackScheduled:false})};
      if(id==='./freeze-blackbox-v01577')return blackbox;
      if(id==='./hang-heartbeat-v01579')return{install(){}};
      if(id==='./autosync-core')return{};
      if(id==='./autosync-live-runtime-v01571')return{patch(){}};
      if(id.startsWith('./'))return loadOverlayModule(overlay,id);
      return require(id);
    };
    const wrapped=`(function(require,module,exports,__filename,__dirname){${source}\n})`;
    const fn=vm.runInNewContext(wrapped,{console,process,Buffer,setTimeout,clearTimeout},{filename:`materialize-step-${steps}.js`});
    fn(fakeRequire,moduleMock,moduleMock.exports,filename,overlay);
    if(captured===null)throw new Error(`wrapper step ${steps} did not compile successor source`);
    source=captured;
    if(isV79)break;
  }
  if(!source.includes("const VERSION='0.16.0'"))throw new Error('flattened legacy runtime missing v0.16.0 version marker');
  source=source.replaceAll('0.16.0',VERSION);
  for(const forbidden of ['module._compile(','main-v016','main-v015122.js','main-v015121.js'])if(source.includes(forbidden))throw new Error(`flattened legacy runtime still contains wrapper marker: ${forbidden}`);
  return source;
}
function buildMain(){
  return `'use strict';\nconst fs=require('fs');\nconst path=require('path');\nconst {app,ipcMain}=require('electron');\nconst {buildRendererSource}=require('./canonical-owner-bundler-v0160');\nconst {installUniversalRatingIpc}=require('./src/main/universal-rating-ipc');\nconst VERSION='${VERSION}';\nconst STABLE_APP_ID='aram-fearless-draft';\nconst CLEAN_RUNTIME_LINEAGE_V0170=Object.freeze({baseline:'0.16.3',golden:'0.15.135',legacySafetyRoot:'main-v01579.js',flattened:true,runtimeSuccessorWrappers:false});\nvoid CLEAN_RUNTIME_LINEAGE_V0170;\nfunction installShadowDiagnostics(){const p=path.join(__dirname,'src','profile','shadow-rating-diagnostics-renderer.js');if(!fs.existsSync(p))throw new Error('v0.17 shadow diagnostics renderer missing');const source=fs.readFileSync(p,'utf8')+'\\n//# sourceURL=shadow-rating-diagnostics-v0170.js';app.on('browser-window-created',(_event,win)=>{const inject=()=>{try{if(!win||win.isDestroyed?.()||win.webContents?.isDestroyed?.())return;Promise.resolve(win.webContents.executeJavaScript(source,false)).catch(e=>console.warn('[v0.17 shadow diagnostics] inject failed:',e?.message||String(e)))}catch(e){console.warn('[v0.17 shadow diagnostics] inject failed:',e?.message||String(e))}};try{win.webContents.on('did-finish-load',inject)}catch(e){console.warn('[v0.17 shadow diagnostics] hook failed:',e?.message||String(e))}})}\nfunction pinStableUserData(){const stable=String(process.env.ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT||'').trim()||path.join(app.getPath('appData'),STABLE_APP_ID);const before=app.getPath('userData');if(path.resolve(before)!==path.resolve(stable))app.setPath('userData',stable);console.log('[v0.17.0 storage-root]',{before,stable,active:app.getPath('userData')});return stable}\nfunction loadCanonicalRegistry(){const registry=require('./canonical/src/core/owner-registry.js');registry.assertSingleOwner?.();const rows=Object.values(registry.owners||{});if(registry.production_active!==true||rows.length!==15||!rows.every(x=>x?.status==='production'))throw new Error('v0.17 canonical owner registry inactive');return registry}\nfunction installCanonicalRendererBridge(registry){const built=buildRendererSource({appDir:__dirname});app.on('browser-window-created',(_event,win)=>{const inject=()=>{try{if(!win||win.isDestroyed?.()||win.webContents?.isDestroyed?.())return;Promise.resolve(win.webContents.executeJavaScript(built.source,false)).then(result=>{if(!result?.production_active||Number(result?.owners_active)!==15)console.warn('[v0.17 canonical renderer bridge] owner layer did not report full activation')}).catch(e=>console.warn('[v0.17 canonical renderer bridge] inject failed:',e?.message||String(e)))}catch(e){console.warn('[v0.17 canonical renderer bridge] inject failed:',e?.message||String(e))}};try{win.webContents.on('did-finish-load',inject)}catch(e){console.warn('[v0.17 canonical renderer bridge] hook failed:',e?.message||String(e))}});return{production_active:true,owners_active:Object.keys(registry.owners||{}).length,modules:built.modules}}\nfunction installV79SafetyBootstrap(){const updateSafety=require('./update-safety-v01579');let blackbox=null;try{blackbox=require('./freeze-blackbox-v01577')}catch{}const bootSafety=updateSafety.installBootGuard({version:VERSION,appDir:__dirname,record:blackbox?.record});if(bootSafety.rollbackScheduled)return{rollbackScheduled:true};if(!blackbox)blackbox=require('./freeze-blackbox-v01577');blackbox.install({version:VERSION});require('./hang-heartbeat-v01579').install({version:VERSION,record:blackbox.record});const {patchIndexText:patchInGame}=require('./ingame-transition-patch-v01575');const {patchIndexText:patchRenderAll}=require('./safe-index-patch-v01578');const indexPath=path.join(__dirname,'index.html');const before=fs.readFileSync(indexPath,'utf8');const a=patchInGame(before);if(!a.ok)throw new Error('v0.17 in-game index contract mismatch: '+JSON.stringify(a.results));const b=patchRenderAll(a.text);if(!b.ok)throw new Error('v0.17 renderAll index contract mismatch: '+JSON.stringify({status:b.status,count:b.count}));if(a.changed||b.changed){const backup=path.join(__dirname,'index.pre-v0170-stability.bak.html');if(!fs.existsSync(backup))fs.copyFileSync(indexPath,backup);fs.writeFileSync(indexPath,b.text,'utf8');blackbox.record('IDX-170','index-stability-patched',{inGame:!!a.changed,renderAll:!!b.changed})}const autosyncCore=require('./autosync-core');require('./autosync-live-runtime-v01571').patch(autosyncCore);return{rollbackScheduled:false}}\n// Preserve v0.16.3 registration order: diagnostics -> Rating/storage -> canonical -> cold-start -> v79 safety -> legacy core.\ninstallShadowDiagnostics();\nconst userData=pinStableUserData();\ninstallUniversalRatingIpc({ipcMain,userDataPath:String(process.env.ARAM_UNIVERSAL_RATING_DB_ROOT||userData)});\nconst canonicalRegistry=loadCanonicalRegistry();\ninstallCanonicalRendererBridge(canonicalRegistry);\ntry{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.17 cold-start promotion] install failed:',e?.message||String(e))}catch{}}\nconst safety=installV79SafetyBootstrap();\nif(safety.rollbackScheduled){module.exports={rollbackScheduled:true}}else{require('./legacy-runtime-v0170.js')}\n`;
}
function buildPreload(overlay){
  const {patchPreloadSource}=require(path.join(ROOT,'src','preload','universal-rating-history-hook.js'));
  const base=fs.readFileSync(path.join(overlay,'preload-base-v015117.js'),'utf8');
  const patched=patchPreloadSource(base);
  if(!patched.changed&&!patched.alreadyPatched)throw new Error('v0.17 preload patch did not materialize');
  const out=patched.source;
  for(const forbidden of ['patchPreloadSource(','module._compile('])if(out.includes(forbidden))throw new Error(`flattened preload still contains runtime patch marker: ${forbidden}`);
  return out;
}
function buildPackage(){return JSON.stringify({name:'aram-fearless-draft',version:VERSION,description:'v0.17.0 clean consolidated runtime',main:'main.js',engines:{electron:'>=28',node:'>=18'}},null,2)+'\n'}
function main(){
  const {dir}=overlayFromBaseline();
  try{
    const legacy=materializeLegacy(dir),mainSource=buildMain(),preload=buildPreload(dir);
    fs.mkdirSync(OUT_DIR,{recursive:true});fs.mkdirSync(RELEASE_DIR,{recursive:true});
    write('src/app/main.js',mainSource);write('src/app/legacy-runtime-v0170.js',legacy);write('src/app/preload.js',preload);
    write('update/v0.17.0/main.js',mainSource);write('update/v0.17.0/legacy-runtime-v0170.js',legacy);write('update/v0.17.0/preload.js',preload);write('update/v0.17.0/package.json',buildPackage());
    console.log('V0.17 CLEAN RUNTIME MATERIALIZED',JSON.stringify({version:VERSION,baseline:BASELINE_COMMIT,legacy_bytes:Buffer.byteLength(legacy),main_bytes:Buffer.byteLength(mainSource),preload_bytes:Buffer.byteLength(preload),runtime_compile_chain:false}));
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
}
if(require.main===module)main();
module.exports={BASELINE_COMMIT,VERSION,overlayFromBaseline,materializeLegacy,buildMain,buildPreload,buildPackage,main};
