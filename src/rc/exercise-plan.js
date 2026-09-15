'use strict';
const {REQUIRED_OWNERS}=require('./activation-plan');

// RC-only deterministic exercise matrix. Every entry points at an existing audit
// that executes canonical src code against Golden-compatible fixtures. Nothing
// here activates a production owner or contacts League/network services.
const EXERCISES=Object.freeze([
  {audit:'tools/stability/subsystem-shadow-audit.js',owners:['main','preload'],markers:['src/main/bootstrap','src/preload/ipc-contract']},
  {audit:'tools/stability/state-canonical-differential-audit.js',owners:['state'],markers:['src/state/']},
  {audit:'tools/stability/lifecycle-canonical-differential-audit.js',owners:['lifecycle'],markers:['src/core/lifecycle']},
  {audit:'tools/stability/updater-canonical-differential-audit.js',owners:['updater'],markers:['src/updater']},
  {audit:'tools/stability/autosync-canonical-differential-audit.js',owners:['autosync'],markers:['src/autosync']},
  {audit:'tools/stability/riot-canonical-differential-audit.js',owners:['riot'],markers:['src/riot']},
  {audit:'tools/stability/draft-canonical-differential-audit.js',owners:['draft'],markers:['src/draft']},
  {audit:'tools/stability/random-pick-final-owner-audit.js',owners:['random_pick'],markers:['src/random/pick']},
  {audit:'tools/stability/random-ingame-coordinator-canonical-differential-audit.js',owners:['random_ingame'],markers:['src/random/ingame']},
  {audit:'tools/stability/data-final-owner-audit.js',owners:['data'],markers:['src/data']},
  {audit:'tools/stability/item-canonical-differential-audit.js',owners:['items'],markers:['src/items']},
  {audit:'tools/stability/profile-results-final-owner-audit.js',owners:['profile'],markers:['src/profile']},
  {audit:'tools/stability/research-final-owner-audit.js',owners:['research'],markers:['src/research']},
  {audit:'tools/stability/diagnostics-audit.js',owners:['diagnostics'],markers:['src/diagnostics']}
]);

function coveredOwners(){return [...new Set(EXERCISES.flatMap(x=>x.owners))]}
function assertCompleteCoverage(){
  const covered=coveredOwners();
  const missing=REQUIRED_OWNERS.filter(x=>!covered.includes(x));
  const extra=covered.filter(x=>!REQUIRED_OWNERS.includes(x));
  if(missing.length||extra.length)throw new Error(`RC canonical exercise coverage mismatch missing=[${missing}] extra=[${extra}]`);
  return true;
}

module.exports={EXERCISES,coveredOwners,assertCompleteCoverage,production_active:false,network_allowed:false};
