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
const newAutosync="require('../autosync').installHistoryOwners(autosyncCore);";
const oldItems="const itemCatalog=require('./item-catalog-v01527');";
const newItems="const itemCatalog=require('../items').catalogService;";
const oldUpdater="require('./update-safety-v01579')";
const newUpdater="const updater=require('../updater');";
const updaterReplacements=[
  ["require('./update-safety-v01579').prepareUpdateTransaction",'updater.prepareTransaction'],
  ["require('./update-safety-v01579').abortUpdateTransaction",'updater.abortTransaction'],
  ["require('./update-safety-v01579').markUpdateApplied",'updater.markApplied']
];
if((baseline.split(oldAutosync).length-1)!==1)throw new Error('frozen v0.17 AutoSync migration block drifted');
if((baseline.split(oldItems).length-1)!==1)throw new Error('frozen v0.17 item catalog migration point drifted');
if((baseline.split(oldUpdater).length-1)!==4)throw new Error('frozen v0.17 updater transaction call cardinality drifted');
if((candidate.split(newAutosync).length-1)!==1)throw new Error('v0.18 canonical AutoSync install cardinality != 1');
if((candidate.split(newItems).length-1)!==1)throw new Error('v0.18 canonical item catalog cardinality != 1');
if((candidate.split(newUpdater).length-1)!==1)throw new Error('v0.18 canonical updater require cardinality != 1');
for(const name of ['autosync-queue-v01517','autosync-cc-impact-v01525','autosync-mission-timeline-v01529','autosync-telemetry-v01534','item-catalog-v01527'])if(candidate.includes(`require('./${name}')`))throw new Error(`legacy owner survived candidate: ${name}`);
if(candidate.includes(oldUpdater))throw new Error('legacy updater safety owner survived candidate');
if(candidate.includes('module._compile('))throw new Error('candidate reintroduced successor compilation');
let expected=baseline
  .replace(oldAutosync,newAutosync)
  .replace(oldItems,newItems+'\n'+newUpdater)
  .replace("const VERSION='0.17.0';","const VERSION='0.18.0';");
for(const [from,to] of updaterReplacements)expected=expected.split(from).join(to);
if(candidate!==expected){let i=0;while(i<candidate.length&&i<expected.length&&candidate[i]===expected[i])i++;throw new Error(`candidate contains unapproved drift at offset ${i}`)}
const report={status:'PASS',baselineSha256:sha(baseline),candidateSha256:sha(candidate),approvedChanges:{version:'0.17.0 -> 0.18.0',legacyAutoSyncRequiresRemoved:4,legacyItemCatalogRequiresRemoved:1,legacyUpdaterSafetyRequiresRemoved:4,canonicalAutoSyncInstallAdded:1,canonicalItemCatalogAdded:1,canonicalUpdaterRequireAdded:1},unapprovedDrift:false};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v0180-candidate-differential.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
