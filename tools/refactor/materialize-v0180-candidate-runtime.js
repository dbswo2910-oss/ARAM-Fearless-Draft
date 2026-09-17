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
const UPDATER_START='function verParts(v){';
const UPDATER_END='// v0.15.69:';
const NEW_UPDATER_CLIENT="const updaterClient=require('../main/updater-client').createUpdaterClient({app,appDir:__dirname,version:VERSION,updateRepo:UPDATE_REPO,updateBranch:UPDATE_BRANCH,launcherVersion:LAUNCHER_VERSION,transaction:canonicalOwners.updater,onBeforeExit:()=>{quitting=true}});\n\n";
const OLD_UPDATE_IPC="ipcMain.handle('desktop:update-now',()=>checkAndApplyUpdate());";
const NEW_UPDATE_IPC="ipcMain.handle('desktop:update-now',()=>updaterClient.checkAndApplyUpdate());";
function replaceSection(src,start,end,replacement){const a=src.indexOf(start),b=src.indexOf(end);if(a<0||b<0||b<=a)throw new Error(`v0.18 section boundary drifted: ${start} -> ${end}`);return src.slice(0,a)+replacement+src.slice(b)}
function materialize(){
  const src=fs.readFileSync(SOURCE,'utf8');
  const autosyncCount=src.split(OLD_AUTOSYNC).length-1;
  const itemsCount=src.split(OLD_ITEMS).length-1;
  const itemIpcCount=src.split(OLD_ITEM_IPC).length-1;
  const updaterStartCount=src.split(UPDATER_START).length-1;
  const updaterEndCount=src.split(UPDATER_END).length-1;
  const updateIpcCount=src.split(OLD_UPDATE_IPC).length-1;
  if(autosyncCount!==1)throw new Error(`v0.18 AutoSync Golden block cardinality drifted: ${autosyncCount}`);
  if(itemsCount!==1)throw new Error(`v0.18 Items Golden require cardinality drifted: ${itemsCount}`);
  if(itemIpcCount!==1)throw new Error(`v0.18 Items IPC Golden block cardinality drifted: ${itemIpcCount}`);
  if(updaterStartCount!==1||updaterEndCount!==1)throw new Error(`v0.18 updater client section cardinality drifted: ${updaterStartCount}/${updaterEndCount}`);
  if(updateIpcCount!==1)throw new Error(`v0.18 updater IPC cardinality drifted: ${updateIpcCount}`);
  let out=src.replace(OLD_AUTOSYNC,NEW_OWNER_REQUIRE+'\n'+NEW_AUTOSYNC)
    .replace(OLD_ITEMS,'')
    .replace(OLD_ITEM_IPC,NEW_ITEM_IPC)
    .replace(OLD_UPDATE_IPC,NEW_UPDATE_IPC)
    .replace("const VERSION='0.17.0';","const VERSION='0.18.0';")
    .replace("const os=require('os');\n",'')
    .replace("const https=require('https');\n",'')
    .replace("const crypto=require('crypto');\n",'')
    .replace('let mainWindow=null,tray=null,quitting=false,alwaysOnTop=false,updateBusy=false,gradeCollector=null;','let mainWindow=null,tray=null,quitting=false,alwaysOnTop=false,gradeCollector=null;');
  out=replaceSection(out,UPDATER_START,UPDATER_END,NEW_UPDATER_CLIENT);
  for(const old of ["require('./autosync-queue-v01517')","require('./autosync-cc-impact-v01525')","require('./autosync-mission-timeline-v01529')","require('./autosync-telemetry-v01534')","require('./item-catalog-v01527')","require('./update-safety-v01579')",OLD_ITEM_IPC,'function checkAndApplyUpdate(){','function validateManifestV015116(','function getBuffer(']){if(out.includes(old))throw new Error(`legacy owner reference survived v0.18 materialization: ${old}`)}
  if((out.split(NEW_OWNER_REQUIRE).length-1)!==1)throw new Error('canonical runtime composition root require cardinality != 1');
  if((out.split(NEW_AUTOSYNC).length-1)!==1)throw new Error('canonical AutoSync core install cardinality != 1');
  if((out.split(NEW_ITEM_IPC).length-1)!==1)throw new Error('canonical Items IPC install cardinality != 1');
  if((out.split(NEW_UPDATER_CLIENT).length-1)!==1)throw new Error('canonical updater client cardinality != 1');
  if((out.split(NEW_UPDATE_IPC).length-1)!==1)throw new Error('canonical updater IPC route cardinality != 1');
  fs.writeFileSync(OUTPUT,out,'utf8');
  return{source:path.relative(ROOT,SOURCE).replace(/\\/g,'/'),output:path.relative(ROOT,OUTPUT).replace(/\\/g,'/'),migratedSemanticOwners:{autosync:4,items:1,updaterTransaction:1,updaterClient:1},compositionRoot:'src/app/canonical-runtime-owners.js',updaterClient:'src/main/updater-client.js',version:'0.18.0'};
}
if(require.main===module)console.log(JSON.stringify(materialize()));
module.exports={materialize,SOURCE,OUTPUT,OLD_AUTOSYNC,NEW_OWNER_REQUIRE,NEW_AUTOSYNC,OLD_ITEMS,OLD_ITEM_IPC,NEW_ITEM_IPC,UPDATER_START,UPDATER_END,NEW_UPDATER_CLIENT,OLD_UPDATE_IPC,NEW_UPDATE_IPC,replaceSection};
