'use strict';
const L=require('./lib');
const R=require('../../src/core/owner-registry');

const required=['main','preload','state','lifecycle','updater','autosync','riot','draft','random_pick','random_ingame','data','items','profile','research','diagnostics'];
L.must(R.assertSingleOwner()===true,'canonical owner registry duplicate path');
for(const x of required)L.must(R.owners[x],`missing canonical owner ${x}`);
L.must(Object.keys(R.owners).length===required.length,`unexpected canonical owner count: ${Object.keys(R.owners).length}`);

const rows=Object.entries(R.owners);
if(R.production_active===false){
  const active=rows.filter(([,x])=>x.status==='active'||x.status==='production');
  L.must(active.length===0,'canonical subsystem activated before shadow migration approval');
  L.must(String(R.policy_version||'').includes('shadow')||String(R.policy_version||'').includes('planned'),'pre-production owner registry policy is not shadow/planned');
}else{
  L.must(R.production_active===true,'canonical production policy flag invalid');
  L.must(R.legacy_removal_authorized===false,'legacy removal must remain separately gated');
  for(const [name,x] of rows){
    L.must(x.status==='production',`production adapter owner ${name} has non-production status ${x.status}`);
    L.must(String(x.mode||'').includes('production-adapter'),`production owner ${name} is not an adapter: ${x.mode}`);
    L.must(String(x.canonical||'').startsWith('src/'),`production owner ${name} canonical path escaped src/: ${x.canonical}`);
    L.must(typeof x.legacy==='string'&&x.legacy.length>0,`production owner ${name} lost validated legacy delegate`);
  }
  L.must(R.policy_version==='0.16-production-adapter',`unexpected production owner policy ${R.policy_version}`);
}

const report={
  status:'SUCCESS',
  production_active:R.production_active,
  legacy_removal_authorized:R.legacy_removal_authorized===true,
  subsystems:required.length,
  statuses:Object.fromEntries(rows.map(([k,v])=>[k,v.status])),
  modes:Object.fromEntries(rows.map(([k,v])=>[k,v.mode])),
  policy_version:R.policy_version,
  single_owner:true,
  production_adapter_contract:R.production_active===true
};
L.write('audit-output/stability/canonical-owner-report.json',report);
console.log(`CANONICAL OWNER AUDIT: SUCCESS · ${R.production_active?'production adapters active; legacy delegates preserved':'source tree remains shadow/planned'}`);
