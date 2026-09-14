'use strict';
/**
 * Canonical owner registry for the v0.16 migration.
 * `status: shadow` means the canonical owner exists only for migration/testing and MUST NOT own production yet.
 */
const owners=Object.freeze({
  main:{canonical:'src/main',legacy:'update/v0.15.135/main-v015135.js',status:'shadow'},
  preload:{canonical:'src/preload',legacy:'update/v0.15.117/preload.js',status:'shadow'},
  state:{canonical:'src/state',legacy:'state-integrity-v015117',status:'shadow'},
  lifecycle:{canonical:'src/core/lifecycle',legacy:'resource-lifecycle-v015118',status:'shadow'},
  updater:{canonical:'src/updater',legacy:'v0.15.79 safety baseline + successors',status:'shadow'},
  autosync:{canonical:'src/autosync',legacy:'autosync-concurrency-v015119',status:'shadow'},
  riot:{canonical:'src/riot',legacy:'riot-grade-collector-v01532 + current Riot/data service chain',status:'shadow'},
  draft:{canonical:'src/draft',legacy:'draft-risk-board-v01546 + current Draft runtime chain',status:'shadow'},
  random_pick:{canonical:'src/random/pick',legacy:'runtime-v015100 under v0.15.115 single-owner baseline',status:'planned'},
  random_ingame:{canonical:'src/random/ingame',legacy:'current RANDOM IN GAME runtime chain',status:'planned'},
  data:{canonical:'src/data',legacy:'ui-stability-v015115',status:'planned'},
  items:{canonical:'src/items',legacy:'current item catalog/recommendation owners',status:'planned'},
  profile:{canonical:'src/profile',legacy:'current history/profile/results chain',status:'planned'},
  research:{canonical:'src/research',legacy:'current Research UI/storage read-only integration',status:'planned'},
  diagnostics:{canonical:'src/diagnostics',legacy:'stability/diagnostics/runtime-diagnostics.js',status:'shadow'}
});
function getOwner(name){return owners[name]||null}
function assertSingleOwner(){const canonical=new Map();for(const [name,x] of Object.entries(owners)){if(canonical.has(x.canonical))throw new Error(`duplicate canonical owner path ${x.canonical}: ${canonical.get(x.canonical)}, ${name}`);canonical.set(x.canonical,name)}return true}
module.exports={owners,getOwner,assertSingleOwner,policy_version:'0.16-migration',production_active:false};
