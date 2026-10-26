'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const SOURCE=path.join(ROOT,'src/app/legacy-runtime-v0170.js');
const OUTPUT=path.join(ROOT,'src/app/runtime-v0180.js');
const OLD_AUTOSYNC=[
  "require('./autosync-queue-v01517').patch(autosyncCore);",
  "require('./autosync-cc-impact-v01525').patch(autosyncCore);",
  "require('./autosync-mission-timeline-v01529').patch(autosyncCore);",
  "require('./autosync-telemetry-v01534').patch(autosyncCore);"
].join('\n');
const NEW_OWNER_REQUIRE="const canonicalOwners=require('./canonical-runtime-owners');";
const NEW_AUTOSYNC="canonicalOwners.installCore({autosyncCore});";
const OLD_ITEMS="const itemCatalog=require('./item-catalog-v01527');";
const OLD_ITEM_IPC="itemCatalog.register(ipcMain);itemCatalog.fetchCatalog().catch(()=>{});";
const NEW_ITEM_IPC="canonicalOwners.installIpc({ipcMain});";
const WINDOW_HELPERS_START='function iconPath(){';
const UPDATER_START='function verParts(v){';
const UPDATER_END='// v0.15.69:';
const NEW_UPDATER_CLIENT="const updaterClient=require('../main/updater-client').createUpdaterClient({app,appDir:__dirname,version:VERSION,updateRepo:UPDATE_REPO,updateBranch:UPDATE_BRANCH,launcherVersion:LAUNCHER_VERSION,transaction:canonicalOwners.updater,onBeforeExit:()=>{quitting=true}});\n\n";
const OLD_UPDATE_IPC="ipcMain.handle('desktop:update-now',()=>checkAndApplyUpdate());";
const NEW_UPDATE_IPC="ipcMain.handle('desktop:update-now',()=>updaterClient.checkAndApplyUpdate());";
const WINDOW_START='function createWindow(){';
const LIFECYCLE_START='if(!app.requestSingleInstanceLock())';
const NEW_WINDOW_SHELL=[
  "const rendererCompat=require('../main/renderer-compat-stack');",
  "const windowShell=require('../main/window-shell').createWindowShell({app,BrowserWindow,Tray,Menu,nativeImage,shell,appDir:__dirname,version:VERSION,prepareUi:prepareBaseUiForRuntime,onDomReady:win=>rendererCompat.inject(win),onNativeInteraction:(win,busy)=>rendererCompat.setNativeInteraction(win,busy)});",
  'const createWindow=()=>windowShell.createWindow();',
  'const createTray=()=>windowShell.createTray();',
  'const showWindow=()=>windowShell.showWindow();',
  'const setAlwaysOnTop=v=>windowShell.setAlwaysOnTop(v);',
  'const setLaunchAtStartup=v=>windowShell.setLaunchAtStartup(v);',
  ''
].join('\n');
const OLD_BEFORE_QUIT="app.on('before-quit',()=>{quitting=true;try{gradeCollector?.stop?.()}catch{};try{core.stop()}catch{};try{tray?.destroy()}catch{};tray=null});";
const NEW_BEFORE_QUIT="app.on('before-quit',()=>{quitting=true;try{gradeCollector?.stop?.()}catch{};try{core.stop()}catch{};windowShell.destroyTray()});";
function replaceSection(src,start,end,replacement){const a=src.indexOf(start),b=src.indexOf(end);if(a<0||b<0||b<=a)throw new Error(`v0.18 section boundary drifted: ${start} -> ${end}`);return src.slice(0,a)+replacement+src.slice(b)}
function materialize(){
  const src=fs.readFileSync(SOURCE,'utf8');
  const autosyncCount=src.split(OLD_AUTOSYNC).length-1;
  const itemsCount=src.split(OLD_ITEMS).length-1;
  const itemIpcCount=src.split(OLD_ITEM_IPC).length-1;
  const windowHelperCount=src.split(WINDOW_HELPERS_START).length-1;
  const updaterStartCount=src.split(UPDATER_START).length-1;
  const updaterEndCount=src.split(UPDATER_END).length-1;
  const updateIpcCount=src.split(OLD_UPDATE_IPC).length-1;
  const windowCount=src.split(WINDOW_START).length-1;
  const lifecycleCount=src.split(LIFECYCLE_START).length-1;
  const beforeQuitCount=src.split(OLD_BEFORE_QUIT).length-1;
  if(autosyncCount!==1)throw new Error(`v0.18 AutoSync Golden block cardinality drifted: ${autosyncCount}`);
  if(itemsCount!==1)throw new Error(`v0.18 Items Golden require cardinality drifted: ${itemsCount}`);
  if(itemIpcCount!==1)throw new Error(`v0.18 Items IPC Golden block cardinality drifted: ${itemIpcCount}`);
  if(windowHelperCount!==1)throw new Error(`v0.18 window helper block cardinality drifted: ${windowHelperCount}`);
  if(updaterStartCount!==1||updaterEndCount!==1)throw new Error(`v0.18 updater client section cardinality drifted: ${updaterStartCount}/${updaterEndCount}`);
  if(updateIpcCount!==1)throw new Error(`v0.18 updater IPC cardinality drifted: ${updateIpcCount}`);
  if(windowCount!==1||lifecycleCount!==1)throw new Error(`v0.18 window shell section cardinality drifted: ${windowCount}/${lifecycleCount}`);
  if(beforeQuitCount!==1)throw new Error(`v0.18 before-quit block cardinality drifted: ${beforeQuitCount}`);
  let out=src.replace(OLD_AUTOSYNC,NEW_OWNER_REQUIRE+'\n'+NEW_AUTOSYNC)
    .replace(OLD_ITEMS,'')
    .replace(OLD_ITEM_IPC,NEW_ITEM_IPC)
    .replace(OLD_UPDATE_IPC,NEW_UPDATE_IPC)
    .replace(OLD_BEFORE_QUIT,NEW_BEFORE_QUIT)
    .replace('platform:process.platform,arch:process.arch,alwaysOnTop,launchAtStartup:','platform:process.platform,arch:process.arch,alwaysOnTop:windowShell.getAlwaysOnTop(),launchAtStartup:')
    .replace("const VERSION='0.17.0';","const VERSION='0.18.0';")
    .replace("const os=require('os');\n",'')
    .replace("const https=require('https');\n",'')
    .replace("const crypto=require('crypto');\n",'')
    .replace('let mainWindow=null,tray=null,quitting=false,alwaysOnTop=false,updateBusy=false,gradeCollector=null;','let quitting=false,gradeCollector=null;');
  out=replaceSection(out,WINDOW_HELPERS_START,UPDATER_START,'');
  out=replaceSection(out,UPDATER_START,UPDATER_END,NEW_UPDATER_CLIENT);
  out=replaceSection(out,WINDOW_START,LIFECYCLE_START,NEW_WINDOW_SHELL);
  for(const old of ["require('./autosync-queue-v01517')","require('./autosync-cc-impact-v01525')","require('./autosync-mission-timeline-v01529')","require('./autosync-telemetry-v01534')","require('./item-catalog-v01527')","require('./update-safety-v01579')",OLD_ITEM_IPC,'function checkAndApplyUpdate(){','function validateManifestV015116(','function getBuffer(','function createWindow(){','function createTray(){','function iconPath(){',"require('./runtime-loader-v01579')"]){if(out.includes(old))throw new Error(`legacy owner reference survived v0.18 materialization: ${old}`)}
  if((out.split(NEW_OWNER_REQUIRE).length-1)!==1)throw new Error('canonical runtime composition root require cardinality != 1');
  if((out.split(NEW_AUTOSYNC).length-1)!==1)throw new Error('canonical AutoSync core install cardinality != 1');
  if((out.split(NEW_ITEM_IPC).length-1)!==1)throw new Error('canonical Items IPC install cardinality != 1');
  if((out.split(NEW_UPDATER_CLIENT).length-1)!==1)throw new Error('canonical updater client cardinality != 1');
  if((out.split(NEW_UPDATE_IPC).length-1)!==1)throw new Error('canonical updater IPC route cardinality != 1');
  if((out.split("require('../main/window-shell').createWindowShell").length-1)!==1)throw new Error('canonical window shell cardinality != 1');
  if((out.split("require('../main/renderer-compat-stack')").length-1)!==1)throw new Error('renderer compatibility boundary cardinality != 1');
  if(!out.includes(NEW_BEFORE_QUIT))throw new Error('window shell tray lifecycle not wired');
  fs.writeFileSync(OUTPUT,out,'utf8');
  return{source:path.relative(ROOT,SOURCE).replace(/\\/g,'/'),output:path.relative(ROOT,OUTPUT).replace(/\\/g,'/'),migratedSemanticOwners:{autosync:4,items:1,updaterTransaction:1,updaterClient:1,windowShell:1},compositionRoot:'src/app/canonical-runtime-owners.js',updaterClient:'src/main/updater-client.js',windowShell:'src/main/window-shell.js',rendererCompatibilityBoundary:'src/main/renderer-compat-stack.js',version:'0.18.0'};
}
if(require.main===module)console.log(JSON.stringify(materialize()));
module.exports={materialize,SOURCE,OUTPUT,OLD_AUTOSYNC,NEW_OWNER_REQUIRE,NEW_AUTOSYNC,OLD_ITEMS,OLD_ITEM_IPC,NEW_ITEM_IPC,WINDOW_HELPERS_START,UPDATER_START,UPDATER_END,NEW_UPDATER_CLIENT,OLD_UPDATE_IPC,NEW_UPDATE_IPC,WINDOW_START,LIFECYCLE_START,NEW_WINDOW_SHELL,OLD_BEFORE_QUIT,NEW_BEFORE_QUIT,replaceSection};
