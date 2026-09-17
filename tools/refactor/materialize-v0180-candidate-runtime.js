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
const NEW_AUTOSYNC="require('../autosync').installHistoryOwners(autosyncCore);";
const OLD_ITEMS="const itemCatalog=require('./item-catalog-v01527');";
const NEW_ITEMS="const itemCatalog=require('../items').catalogService;";
function materialize(){
  const src=fs.readFileSync(SOURCE,'utf8');
  const autosyncCount=src.split(OLD_AUTOSYNC).length-1;
  const itemsCount=src.split(OLD_ITEMS).length-1;
  if(autosyncCount!==1)throw new Error(`v0.18 AutoSync Golden block cardinality drifted: ${autosyncCount}`);
  if(itemsCount!==1)throw new Error(`v0.18 Items Golden require cardinality drifted: ${itemsCount}`);
  const out=src.replace(OLD_AUTOSYNC,NEW_AUTOSYNC)
    .replace(OLD_ITEMS,NEW_ITEMS)
    .replace("const VERSION='0.17.0';","const VERSION='0.18.0';");
  for(const old of ["require('./autosync-queue-v01517')","require('./autosync-cc-impact-v01525')","require('./autosync-mission-timeline-v01529')","require('./autosync-telemetry-v01534')","require('./item-catalog-v01527')"]){if(out.includes(old))throw new Error(`legacy owner require survived v0.18 materialization: ${old}`)}
  if(!out.includes(NEW_AUTOSYNC))throw new Error('canonical AutoSync history owner install missing');
  if(!out.includes(NEW_ITEMS))throw new Error('canonical Items catalog owner missing');
  fs.writeFileSync(OUTPUT,out,'utf8');
  return{source:path.relative(ROOT,SOURCE).replace(/\\/g,'/'),output:path.relative(ROOT,OUTPUT).replace(/\\/g,'/'),replacedLegacyOwners:5,version:'0.18.0'};
}
if(require.main===module)console.log(JSON.stringify(materialize()));
module.exports={materialize,SOURCE,OUTPUT,OLD_AUTOSYNC,NEW_AUTOSYNC,OLD_ITEMS,NEW_ITEMS};
