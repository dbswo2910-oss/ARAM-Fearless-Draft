(function(){
  'use strict';
  const KEY='__ARAM_CANONICAL_V0160__';
  const existing=window[KEY];
  if(existing&&existing.version==='0.16.0'&&existing.production_active===true)return existing;
  const req=window.__ARAM_CANONICAL_REQUIRE_V0160__;
  if(typeof req!=='function')throw new Error('v0.16 canonical require bridge missing');
  const registry=req('core/owner-registry.js');
  registry.assertSingleOwner();
  const rows=Object.entries(registry.owners||{});
  if(registry.production_active!==true||rows.length!==15||!rows.every(([,x])=>x?.status==='production'))throw new Error(`v0.16 owner registry not production-ready: ${rows.filter(([,x])=>x?.status==='production').length}/${rows.length}`);
  const adapterModules={
    draft:req('draft/production-adapter.js'),
    random_pick:req('random/pick/production-adapter.js'),
    data:req('data/production-adapter.js')
  };
  const adapters={};
  for(const [name,mod] of Object.entries(adapterModules)){
    if(mod?.production_active!==true||mod?.owner_status!=='production'||typeof mod?.activate!=='function')throw new Error(`v0.16 ${name} production adapter contract invalid`);
    adapters[name]=mod.activate({window,document});
    if(adapters[name]?.status!=='active')throw new Error(`v0.16 ${name} production adapter failed to activate`);
  }
  const bridge=Object.freeze({
    version:'0.16.0',
    stage:'production-owner-layer',
    production_active:true,
    owners_active:rows.length,
    owner_target:15,
    implementation_mode:'canonical-router-with-legacy-adapters',
    renderer_owner_adapters:['draft','random_pick','data'],
    legacy_cleanup_pending:true,
    legacy_removal_authorized:false,
    node_integration_required:false,
    context_isolation_compatible:true,
    adapters:Object.freeze(Object.fromEntries(Object.entries(adapters).map(([name,x])=>[name,Object.freeze({status:x.status,mode:x.mode,root_found:!!x.root_found,legacy_delegate:x.legacy_delegate})])))
  });
  try{Object.defineProperty(window,KEY,{value:bridge,configurable:true})}catch{window[KEY]=bridge}
  try{window.dispatchEvent(new CustomEvent('aram:canonical-v0160-owner-layer-ready',{detail:{version:bridge.version,stage:bridge.stage,owners_active:bridge.owners_active}}))}catch{}
  return bridge;
})();
