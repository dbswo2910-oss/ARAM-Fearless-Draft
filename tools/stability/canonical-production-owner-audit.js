'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {buildRendererSource,MODULE_IDS}=require('../../update/v0.16.0/canonical-owner-bundler-v0160');
const ROOT=path.resolve(__dirname,'../..');
const p=(...xs)=>path.join(ROOT,...xs);
const outDir=p('audit-output','stability','canonical-production-owner');
fs.rmSync(outDir,{recursive:true,force:true});
fs.mkdirSync(path.join(outDir,'canonical','src'),{recursive:true});
function copy(rel,target=rel){const src=p(rel),dst=path.join(outDir,target);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst)}
copy('update/v0.16.0/canonical-renderer-bundle.js','canonical-renderer-bundle.js');
for(const id of MODULE_IDS)copy(`src/${id}`,`canonical/src/${id}`);

class El{
  constructor(id){this.id=id;this.attrs={};this.dataset={};}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-')){const key=k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());this.dataset[key]=String(v)}}
  getAttribute(k){return this.attrs[k]??null}
}
const ids=['builderCore','draft','draftRiskBoardV01546','random','randomInputAnchor','comboResults','comboDetail','data','dataCard','dataPatchNotesV01599','dataHubTopNavV015115'];
const elements=Object.fromEntries(ids.map(id=>[id,new El(id)]));
const document={
  body:new El('body'),
  getElementById:id=>elements[id]||null,
  querySelector:sel=>String(sel||'').startsWith('#')?(elements[String(sel).slice(1)]||null):null
};
class MutationObserver{constructor(cb){this.cb=cb}observe(){this.observing=true}disconnect(){this.observing=false}}
class CustomEvent{constructor(type,opts={}){this.type=type;this.detail=opts.detail}}
const events=[];
const window={MutationObserver,CustomEvent,dispatchEvent:e=>{events.push({type:e?.type,detail:e?.detail});return true}};
const context=vm.createContext({window,document,MutationObserver,CustomEvent,console});
const built=buildRendererSource({appDir:outDir});
const result=vm.runInContext(built.source,context,{timeout:3000,filename:'canonical-production-owner-v0160.js'});
const bridge=window.__ARAM_CANONICAL_V0160__;
const registry=require(p('src','core','owner-registry.js'));
const rows=Object.entries(registry.owners||{});
const checks={
  result_production_active:result?.production_active===true,
  bridge_production_active:bridge?.production_active===true,
  owners_15:bridge?.owners_active===15&&bridge?.owner_target===15,
  registry_15:registry.production_active===true&&rows.length===15&&rows.every(([,x])=>x?.status==='production'),
  draft_active:bridge?.adapters?.draft?.status==='active',
  random_pick_active:bridge?.adapters?.random_pick?.status==='active',
  data_active:bridge?.adapters?.data?.status==='active',
  draft_boundary:elements.builderCore.getAttribute('data-canonical-owner')==='draft',
  random_boundary:elements.random.getAttribute('data-canonical-owner')==='random_pick',
  data_boundary:elements.data.getAttribute('data-canonical-owner')==='data',
  no_legacy_removal:bridge?.legacy_removal_authorized===false&&registry.legacy_removal_authorized===false,
  context_isolation_compatible:bridge?.context_isolation_compatible===true&&bridge?.node_integration_required===false
};
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
const report={status:failed.length?'FAILURE':'SUCCESS',stage:'V0160_CANONICAL_PRODUCTION_OWNER_LAYER',release:'0.16.0',module_ids:[...MODULE_IDS],bridge,checks,failed,events,production_manifest_mutated:false,legacy_removal_authorized:false};
fs.mkdirSync(p('audit-output','stability'),{recursive:true});
fs.writeFileSync(p('audit-output','stability','canonical-production-owner-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(`V0.16 CANONICAL PRODUCTION OWNER LAYER: ${report.status}`,JSON.stringify({owners:bridge?.owners_active,failed}));
if(failed.length)process.exit(1);
