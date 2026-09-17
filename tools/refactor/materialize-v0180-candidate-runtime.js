'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const SOURCE=path.join(ROOT,'src/app/legacy-runtime-v0170.js');
const OUTPUT=path.join(ROOT,'src/app/runtime-v0180.js');
const OLD=[
  "require('./autosync-queue-v01517').patch(autosyncCore);",
  "require('./autosync-cc-impact-v01525').patch(autosyncCore);",
  "require('./autosync-mission-timeline-v01529').patch(autosyncCore);",
  "require('./autosync-telemetry-v01534').patch(autosyncCore);"
].join('\n');
const NEW="require('../autosync').installHistoryOwners(autosyncCore);";
function materialize(){
  const src=fs.readFileSync(SOURCE,'utf8');
  const count=src.split(OLD).length-1;
  if(count!==1)throw new Error(`v0.18 AutoSync Golden block cardinality drifted: ${count}`);
  const out=src.replace(OLD,NEW)
    .replace("const VERSION='0.17.0';","const VERSION='0.18.0';");
  if(out.includes("require('./autosync-queue-v01517')")||out.includes("require('./autosync-cc-impact-v01525')")||out.includes("require('./autosync-mission-timeline-v01529')")||out.includes("require('./autosync-telemetry-v01534')"))throw new Error('legacy AutoSync history owner require survived v0.18 materialization');
  if(!out.includes("require('../autosync').installHistoryOwners(autosyncCore);"))throw new Error('canonical AutoSync history owner install missing');
  fs.writeFileSync(OUTPUT,out,'utf8');
  return{source:path.relative(ROOT,SOURCE).replace(/\\/g,'/'),output:path.relative(ROOT,OUTPUT).replace(/\\/g,'/'),replacedLegacyOwners:4,version:'0.18.0'};
}
if(require.main===module)console.log(JSON.stringify(materialize()));
module.exports={materialize,SOURCE,OUTPUT,OLD,NEW};
