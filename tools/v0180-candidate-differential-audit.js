'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const baseline=read('src/app/legacy-runtime-v0170.js');
const candidate=read('src/app/runtime-v0180.js');
const oldAutosync=[
  "require('./autosync-queue-v01517').patch(autosyncCore);",
  "require('./autosync-cc-impact-v01525').patch(autosyncCore);",
  "require('./autosync-mission-timeline-v01529').patch(autosyncCore);",
  "require('./autosync-telemetry-v01534').patch(autosyncCore);"
].join('\n');
const ownerRequire="const canonicalOwners=require('./canonical-runtime-owners');";
const newAutosync='canonicalOwners.installCore({autosyncCore});';
const oldItems="const itemCatalog=require('./item-catalog-v01527');";
const oldItemIpc="itemCatalog.register(ipcMain);itemCatalog.fetchCatalog().catch(()=>{});";
const newItemIpc='canonicalOwners.installIpc({ipcMain});';
const windowHelpersStart='function iconPath(){';
const updaterStart='function verParts(v){';
const updaterEnd='// v0.15.69:';
const updaterClient="const updaterClient=require('../main/updater-client').createUpdaterClient({app,appDir:__dirname,version:VERSION,updateRepo:UPDATE_REPO,updateBranch:UPDATE_BRANCH,launcherVersion:LAUNCHER_VERSION,transaction:canonicalOwners.updater,onBeforeExit:()=>{quitting=true}});\n\n";
const oldUpdateIpc="ipcMain.handle('desktop:update-now',()=>checkAndApplyUpdate());";
const newUpdateIpc="ipcMain.handle('desktop:update-now',()=>updaterClient.checkAndApplyUpdate());";
const windowStart='function createWindow(){';
const lifecycleStart='if(!app.requestSingleInstanceLock())';
const newWindowShell=[
  "const rendererCompat=require('../main/renderer-compat-stack');",
  "const windowShell=require('../main/window-shell').createWindowShell({app,BrowserWindow,Tray,Menu,nativeImage,shell,appDir:__dirname,version:VERSION,prepareUi:prepareBaseUiForRuntime,onDomReady:win=>rendererCompat.inject(win),onNativeInteraction:(win,busy)=>rendererCompat.setNativeInteraction(win,busy)});",
  'const createWindow=()=>windowShell.createWindow();',
  'const createTray=()=>windowShell.createTray();',
  'const showWindow=()=>windowShell.showWindow();',
  'const setAlwaysOnTop=v=>windowShell.setAlwaysOnTop(v);',
  'const setLaunchAtStartup=v=>windowShell.setLaunchAtStartup(v);',
  ''
].join('\n');
const oldBeforeQuit="app.on('before-quit',()=>{quitting=true;try{gradeCollector?.stop?.()}catch{};try{core.stop()}catch{};try{tray?.destroy()}catch{};tray=null});";
const newBeforeQuit="app.on('before-quit',()=>{quitting=true;try{gradeCollector?.stop?.()}catch{};try{core.stop()}catch{};windowShell.destroyTray()});";
function replaceSection(src,start,end,replacement){const a=src.indexOf(start),b=src.indexOf(end);if(a<0||b<0||b<=a)throw new Error(`frozen v0.17 section drifted: ${start}`);return src.slice(0,a)+replacement+src.slice(b)}
for(const [label,value] of [['autosync',oldAutosync],['items',oldItems],['item ipc',oldItemIpc],['window helpers',windowHelpersStart],['updater start',updaterStart],['updater end',updaterEnd],['update ipc',oldUpdateIpc],['window start',windowStart],['lifecycle',lifecycleStart],['before quit',oldBeforeQuit]])if((baseline.split(value).length-1)!==1)throw new Error(`frozen v0.17 ${label} migration point drifted`);
if((candidate.split(ownerRequire).length-1)!==1)throw new Error('v0.18 composition root require cardinality != 1');
if((candidate.split(newAutosync).length-1)!==1)throw new Error('v0.18 canonical AutoSync install cardinality != 1');
if((candidate.split(newItemIpc).length-1)!==1)throw new Error('v0.18 canonical item IPC install cardinality != 1');
if((candidate.split(updaterClient).length-1)!==1)throw new Error('v0.18 updater client cardinality != 1');
if((candidate.split(newUpdateIpc).length-1)!==1)throw new Error('v0.18 updater IPC route cardinality != 1');
if((candidate.split("require('../main/window-shell').createWindowShell").length-1)!==1)throw new Error('v0.18 window shell cardinality != 1');
if((candidate.split("require('../main/renderer-compat-stack')").length-1)!==1)throw new Error('v0.18 renderer compatibility boundary cardinality != 1');
for(const name of ['autosync-queue-v01517','autosync-cc-impact-v01525','autosync-mission-timeline-v01529','autosync-telemetry-v01534','item-catalog-v01527','update-safety-v01579','runtime-loader-v01579'])if(candidate.includes(`require('./${name}')`))throw new Error(`legacy owner survived candidate: ${name}`);
for(const forbidden of ['function checkAndApplyUpdate(){','function validateManifestV015116(','function getBuffer(','function createWindow(){','function createTray(){','function iconPath(){','module._compile('])if(candidate.includes(forbidden))throw new Error(`legacy runtime block survived candidate: ${forbidden}`);
let expected=baseline
  .replace(oldAutosync,ownerRequire+'\n'+newAutosync)
  .replace(oldItems,'')
  .replace(oldItemIpc,newItemIpc)
  .replace(oldUpdateIpc,newUpdateIpc)
  .replace(oldBeforeQuit,newBeforeQuit)
  .replace('platform:process.platform,arch:process.arch,alwaysOnTop,launchAtStartup:','platform:process.platform,arch:process.arch,alwaysOnTop:windowShell.getAlwaysOnTop(),launchAtStartup:')
  .replace("const VERSION='0.17.0';","const VERSION='0.18.0';")
  .replace("const os=require('os');\n",'')
  .replace("const https=require('https');\n",'')
  .replace("const crypto=require('crypto');\n",'')
  .replace('let mainWindow=null,tray=null,quitting=false,alwaysOnTop=false,updateBusy=false,gradeCollector=null;','let quitting=false,gradeCollector=null;');
expected=replaceSection(expected,windowHelpersStart,updaterStart,'');
expected=replaceSection(expected,updaterStart,updaterEnd,updaterClient);
expected=replaceSection(expected,windowStart,lifecycleStart,newWindowShell);
if(candidate!==expected){let i=0;while(i<candidate.length&&i<expected.length&&candidate[i]===expected[i])i++;throw new Error(`candidate contains unapproved drift at offset ${i}`)}
const report={status:'PASS',baselineSha256:sha(baseline),candidateSha256:sha(candidate),compositionRoot:'src/app/canonical-runtime-owners.js',updaterClient:'src/main/updater-client.js',windowShell:'src/main/window-shell.js',rendererCompatibilityBoundary:'src/main/renderer-compat-stack.js',approvedChanges:{version:'0.17.0 -> 0.18.0',legacyAutoSyncRequiresRemoved:4,legacyItemCatalogRequiresRemoved:1,legacyItemIpcBlockRemoved:1,legacyUpdaterClientBlockRemoved:1,legacyUpdaterSafetyRequiresRemoved:4,legacyWindowTrayBlockRemoved:1,legacyRendererInjectionBlockMovedToCompatibilityBoundary:1,canonicalCompositionRootAdded:1,canonicalAutoSyncInstallAdded:1,canonicalItemsIpcInstallAdded:1,canonicalUpdaterClientAdded:1,canonicalWindowShellAdded:1},unapprovedDrift:false};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v0180-candidate-differential.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
