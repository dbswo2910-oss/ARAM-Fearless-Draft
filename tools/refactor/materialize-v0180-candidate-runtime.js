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
const NEW_ITEMS="const {itemCatalog,updater}=canonicalOwners;";
const OLD_ITEM_IPC="itemCatalog.register(ipcMain);itemCatalog.fetchCatalog().catch(()=>{});";
const NEW_ITEM_IPC="canonicalOwners.installIpc({ipcMain});";
const OLD_UPDATER_REQUIRE="require('./update-safety-v01579')";
const UPDATER_REPLACEMENTS=Object.freeze([
  ["require('./update-safety-v01579').prepareUpdateTransaction",'updater.prepareTransaction'],
  ["require('./update-safety-v01579').abortUpdateTransaction",'updater.abortTransaction'],
  ["require('./update-safety-v01579').markUpdateApplied",'updater.markApplied']
]);
function materialize(){
  const src=fs.readFileSync(SOURCE,'utf8');
  const autosyncCount=src.split(OLD_AUTOSYNC).length-1;
  const itemsCount=src.split(OLD_ITEMS).length-1;
  const itemIpcCount=src.split(OLD_ITEM_IPC).length-1;
  const updaterCallCount=src.split(OLD_UPDATER_REQUIRE).length-1;
  if(autosyncCount!==1)throw new Error(`v0.18 AutoSync Golden block cardinality drifted: ${autosyncCount}`);
  if(itemsCount!==1)throw new Error(`v0.18 Items Golden require cardinality drifted: ${itemsCount}`);
  if(itemIpcCount!==1)throw new Error(`v0.18 Items IPC Golden block cardinality drifted: ${itemIpcCount}`);
  if(updaterCallCount!==4)throw new Error(`v0.18 updater Golden call cardinality drifted: ${updaterCallCount}`);
  let out=src.replace(OLD_AUTOSYNC,NEW_OWNER_REQUIRE+'\n'+NEW_AUTOSYNC)
    .replace(OLD_ITEMS,NEW_ITEMS)
    .replace(OLD_ITEM_IPC,NEW_ITEM_IPC)
    .replace("const VERSION='0.17.0';","const VERSION='0.18.0';");
  for(const [from,to] of UPDATER_REPLACEMENTS)out=out.split(from).join(to);
  for(const old of ["require('./autosync-queue-v01517')","require('./autosync-cc-impact-v01525')","require('./autosync-mission-timeline-v01529')","require('./autosync-telemetry-v01534')","require('./item-catalog-v01527')",OLD_UPDATER_REQUIRE,OLD_ITEM_IPC]){if(out.includes(old))throw new Error(`legacy owner reference survived v0.18 materialization: ${old}`)}
  if((out.split(NEW_OWNER_REQUIRE).length-1)!==1)throw new Error('canonical runtime composition root require cardinality != 1');
  if((out.split(NEW_AUTOSYNC).length-1)!==1)throw new Error('canonical AutoSync core install cardinality != 1');
  if((out.split(NEW_ITEM_IPC).length-1)!==1)throw new Error('canonical Items IPC install cardinality != 1');
  if(!out.includes(NEW_ITEMS)||!out.includes('updater.prepareTransaction')||!out.includes('updater.markApplied')||!out.includes('updater.abortTransaction'))throw new Error('canonical owner wiring incomplete');
  fs.writeFileSync(OUTPUT,out,'utf8');
  return{source:path.relative(ROOT,SOURCE).replace(/\\/g,'/'),output:path.relative(ROOT,OUTPUT).replace(/\\/g,'/'),replacedLegacyReferences:10,migratedSemanticOwners:{autosync:4,items:1,updater:1},compositionRoot:'src/app/canonical-runtime-owners.js',version:'0.18.0'};
}
if(require.main===module)console.log(JSON.stringify(materialize()));
module.exports={materialize,SOURCE,OUTPUT,OLD_AUTOSYNC,NEW_OWNER_REQUIRE,NEW_AUTOSYNC,OLD_ITEMS,NEW_ITEMS,OLD_ITEM_IPC,NEW_ITEM_IPC,OLD_UPDATER_REQUIRE,UPDATER_REPLACEMENTS};
