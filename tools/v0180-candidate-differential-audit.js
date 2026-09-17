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
const updaterStart='function verParts(v){';
const updaterEnd='// v0.15.69:';
const updaterClient="const updaterClient=require('../main/updater-client').createUpdaterClient({app,appDir:__dirname,version:VERSION,updateRepo:UPDATE_REPO,updateBranch:UPDATE_BRANCH,launcherVersion:LAUNCHER_VERSION,transaction:canonicalOwners.updater,onBeforeExit:()=>{quitting=true}});\n\n";
const oldUpdateIpc="ipcMain.handle('desktop:update-now',()=>checkAndApplyUpdate());";
const newUpdateIpc="ipcMain.handle('desktop:update-now',()=>updaterClient.checkAndApplyUpdate());";
function replaceSection(src,start,end,replacement){const a=src.indexOf(start),b=src.indexOf(end);if(a<0||b<0||b<=a)throw new Error(`frozen v0.17 section drifted: ${start}`);return src.slice(0,a)+replacement+src.slice(b)}
if((baseline.split(oldAutosync).length-1)!==1)throw new Error('frozen v0.17 AutoSync migration block drifted');
if((baseline.split(oldItems).length-1)!==1)throw new Error('frozen v0.17 item catalog migration point drifted');
if((baseline.split(oldItemIpc).length-1)!==1)throw new Error('frozen v0.17 item catalog IPC point drifted');
if((baseline.split(updaterStart).length-1)!==1||(baseline.split(updaterEnd).length-1)!==1)throw new Error('frozen v0.17 updater client section drifted');
if((baseline.split(oldUpdateIpc).length-1)!==1)throw new Error('frozen v0.17 updater IPC route drifted');
if((candidate.split(ownerRequire).length-1)!==1)throw new Error('v0.18 composition root require cardinality != 1');
if((candidate.split(newAutosync).length-1)!==1)throw new Error('v0.18 canonical AutoSync install cardinality != 1');
if((candidate.split(newItemIpc).length-1)!==1)throw new Error('v0.18 canonical item IPC install cardinality != 1');
if((candidate.split(updaterClient).length-1)!==1)throw new Error('v0.18 updater client cardinality != 1');
if((candidate.split(newUpdateIpc).length-1)!==1)throw new Error('v0.18 updater IPC route cardinality != 1');
for(const name of ['autosync-queue-v01517','autosync-cc-impact-v01525','autosync-mission-timeline-v01529','autosync-telemetry-v01534','item-catalog-v01527','update-safety-v01579'])if(candidate.includes(`require('./${name}')`))throw new Error(`legacy owner survived candidate: ${name}`);
for(const forbidden of ['function checkAndApplyUpdate(){','function validateManifestV015116(','function getBuffer(','module._compile('])if(candidate.includes(forbidden))throw new Error(`legacy runtime block survived candidate: ${forbidden}`);
let expected=baseline
  .replace(oldAutosync,ownerRequire+'\n'+newAutosync)
  .replace(oldItems,'')
  .replace(oldItemIpc,newItemIpc)
  .replace(oldUpdateIpc,newUpdateIpc)
  .replace("const VERSION='0.17.0';","const VERSION='0.18.0';")
  .replace("const os=require('os');\n",'')
  .replace("const https=require('https');\n",'')
  .replace("const crypto=require('crypto');\n",'')
  .replace('let mainWindow=null,tray=null,quitting=false,alwaysOnTop=false,updateBusy=false,gradeCollector=null;','let mainWindow=null,tray=null,quitting=false,alwaysOnTop=false,gradeCollector=null;');
expected=replaceSection(expected,updaterStart,updaterEnd,updaterClient);
if(candidate!==expected){let i=0;while(i<candidate.length&&i<expected.length&&candidate[i]===expected[i])i++;throw new Error(`candidate contains unapproved drift at offset ${i}`)}
const report={status:'PASS',baselineSha256:sha(baseline),candidateSha256:sha(candidate),compositionRoot:'src/app/canonical-runtime-owners.js',updaterClient:'src/main/updater-client.js',approvedChanges:{version:'0.17.0 -> 0.18.0',legacyAutoSyncRequiresRemoved:4,legacyItemCatalogRequiresRemoved:1,legacyItemIpcBlockRemoved:1,legacyUpdaterClientBlockRemoved:1,legacyUpdaterSafetyRequiresRemoved:4,canonicalCompositionRootAdded:1,canonicalAutoSyncInstallAdded:1,canonicalItemsIpcInstallAdded:1,canonicalUpdaterClientAdded:1},unapprovedDrift:false};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v0180-candidate-differential.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
