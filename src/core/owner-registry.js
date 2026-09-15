'use strict';
/**
 * v0.16 production owner registry.
 * The canonical layer owns routing/lifecycle. Proven Golden implementations remain
 * delegated behind the adapters until the later legacy-removal stage is separately gated.
 */
const owners=Object.freeze({
  main:{canonical:'src/main',legacy:'update/v0.15.135/main-v015135.js',status:'production',mode:'production-adapter'},
  preload:{canonical:'src/preload',legacy:'update/v0.15.117/preload.js',status:'production',mode:'production-adapter'},
  state:{canonical:'src/state',legacy:'state-integrity-v015117',status:'production',mode:'production-adapter'},
  lifecycle:{canonical:'src/core/lifecycle',legacy:'resource-lifecycle-v015118',status:'production',mode:'production-adapter'},
  updater:{canonical:'src/updater',legacy:'v0.15.79 safety baseline + successors',status:'production',mode:'production-adapter'},
  autosync:{canonical:'src/autosync',legacy:'autosync-concurrency-v015119',status:'production',mode:'production-adapter'},
  riot:{canonical:'src/riot',legacy:'riot-grade-collector-v01532 + current Riot/data service chain',status:'production',mode:'production-adapter'},
  draft:{canonical:'src/draft',legacy:'draft-risk-board-v01546 + current Draft runtime chain',status:'production',mode:'renderer-production-adapter'},
  random_pick:{canonical:'src/random/pick',legacy:'runtime-v015100 under v0.15.115 single-owner baseline',status:'production',mode:'renderer-production-adapter'},
  random_ingame:{canonical:'src/random/ingame',legacy:'current RANDOM IN GAME runtime chain',status:'production',mode:'production-adapter'},
  data:{canonical:'src/data',legacy:'ui-stability-v015115',status:'production',mode:'renderer-production-adapter'},
  items:{canonical:'src/items',legacy:'current item catalog/recommendation owners',status:'production',mode:'production-adapter'},
  profile:{canonical:'src/profile',legacy:'current history/profile/results chain',status:'production',mode:'production-adapter'},
  research:{canonical:'src/research',legacy:'current Research UI/storage read-only integration',status:'production',mode:'production-adapter'},
  diagnostics:{canonical:'src/diagnostics',legacy:'stability/diagnostics/runtime-diagnostics.js',status:'production',mode:'production-adapter'}
});
function getOwner(name){return owners[name]||null}
function assertSingleOwner(){const canonical=new Map();for(const [name,x] of Object.entries(owners)){if(canonical.has(x.canonical))throw new Error(`duplicate canonical owner path ${x.canonical}: ${canonical.get(x.canonical)}, ${name}`);canonical.set(x.canonical,name)}return true}
function summary(){const rows=Object.entries(owners).map(([name,x])=>({name,status:x.status,mode:x.mode,canonical:x.canonical,legacy:x.legacy}));return{total:rows.length,production:rows.filter(x=>x.status==='production').length,rows}}
module.exports={owners,getOwner,assertSingleOwner,summary,policy_version:'0.16-production-adapter',production_active:true,legacy_removal_authorized:false};
