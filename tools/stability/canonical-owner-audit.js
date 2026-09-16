'use strict';
const L=require('./lib');
const R=require('../../src/core/owner-registry');
L.must(R.production_active===true,'v0.16 canonical owner registry must be production-active');
L.must(R.legacy_removal_authorized===false,'legacy removal must remain separately gated');
L.must(R.assertSingleOwner()===true,'canonical owner registry duplicate path');
const required=['main','preload','state','lifecycle','updater','autosync','riot','draft','random_pick','random_ingame','data','items','profile','research','diagnostics'];
for(const x of required){
  L.must(R.owners[x],`missing canonical owner ${x}`);
  L.must(R.owners[x].status==='production',`canonical owner ${x} is not production: ${R.owners[x].status}`);
  L.must(/production-adapter$/.test(String(R.owners[x].mode||'')),`canonical owner ${x} must remain adapter-owned before legacy removal: ${R.owners[x].mode}`);
}
const report={status:'SUCCESS',production_active:R.production_active,legacy_removal_authorized:R.legacy_removal_authorized,subsystems:required.length,statuses:Object.fromEntries(Object.entries(R.owners).map(([k,v])=>[k,v.status])),modes:Object.fromEntries(Object.entries(R.owners).map(([k,v])=>[k,v.mode])),policy_version:R.policy_version};
L.write('audit-output/stability/canonical-owner-report.json',report);
console.log('CANONICAL OWNER AUDIT: SUCCESS · v0.16 production adapters active; legacy removal remains gated');
