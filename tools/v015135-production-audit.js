'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const j=p=>JSON.parse(read(p));
const must=(s,n,l=n)=>{if(!String(s).includes(n))throw new Error(`v0.15.135 missing ${l}: ${n}`)};
const mustNot=(s,n,l=n)=>{if(String(s).includes(n))throw new Error(`v0.15.135 forbidden ${l}: ${n}`)};

(function main(){
  const p134=j('update/v0.15.134/package.json'),p135=j('update/v0.15.135/package.json');
  if(p135.name!==p134.name||p135.name!=='aram-fearless-draft')throw new Error('stable Electron app identity changed');
  if(p135.version!=='0.15.135'||p135.main!=='main-v015135.js')throw new Error('v0.15.135 package metadata mismatch');

  const mainSrc=read('update/v0.15.135/main-v015135.js');
  must(mainSrc,"STABLE_APP_ID='aram-fearless-draft'",'stable userData app id');
  must(mainSrc,"app.setPath('userData',stable)",'stable userData pin');
  if(mainSrc.indexOf("app.setPath('userData',stable)")>mainSrc.indexOf('module._compile'))throw new Error('userData pin occurs too late');

  const route=require('../update/v0.15.135/successor-route-v015135.js');
  const base=read('update/v0.15.122/main-v015122.js');
  const routed=route.patchSuccessorSource(base);
  must(routed,"'0.15.135').replaceAll(stabilityAnchor,'runtime-source-stability-v015135')",'successor route');
  mustNot(routed,"'0.15.122').replaceAll(stabilityAnchor,'runtime-source-stability-v015122')",'stale successor route');

  const RT=require('../update/v0.15.135/runtime-source-stability-v015135.js');
  const runtimeSrc=read('update/v0.15.135/runtime-source-stability-v015135.js');
  must(runtimeSrc,"try{prior=require('../v0.15.134/runtime-source-stability-v015134')}catch{prior=require('./runtime-source-stability-v015134')}",'v0.15.134 predecessor');
  must(runtimeSrc,"if(file==='input-interaction-stability-v01539.js')src=patchPatchNotesSemanticShell(src);",'actual injected DATA runtime target');
  must(runtimeSrc,"patch_notes_shell_fix_owner:'ui-stability-v015115'",'existing DATA owner');
  must(runtimeSrc,"patch_notes_shell_fix_strategy:'scoped-semantic-title-close-sweep-plus-child-observer'",'semantic sweep strategy');
  must(runtimeSrc,"patch_notes_shell_scope:'#data excluding Patch Notes body/nav'",'scope contract');
  if(RT.score_logic_changed!==false||RT.random_scoring_changed!==false)throw new Error('scoring neutrality changed');

  // Exercise the actual installed runtime source path after the entire predecessor chain.
  const input=read('update/v0.15.39/input-interaction-stability-v01539.js');
  const patched=RT.patchRuntimeSource('input-interaction-stability-v01539.js',input);
  try{new Function(patched)}catch(e){throw new Error('patched DATA runtime parse failed: '+e.message)}
  for(const x of [
    'PATCH_NOTES_ALWAYS_OPEN_V015132',
    'PATCH_NOTES_REAL_WINDOWS_V015133',
    'PATCH_NOTES_RESOLVED_TITLE_V015134',
    'PATCH_NOTES_SEMANTIC_SHELL_V015135',
    "view.querySelectorAll('.title')",
    "view.querySelectorAll('button')",
    "data115PatchShellHiddenV015135='1'",
    "new MutationObserver(mutations=>",
    "observer.observe(p.view,{childList:true,subtree:true})",
    "p.view?.dataset?.data115Mode!=='patch'"
  ])must(patched,x,'patched production runtime contract');
  if((patched.match(/PATCH_NOTES_SEMANTIC_SHELL_V015135/g)||[]).length!==1)throw new Error('v0.15.135 semantic shell fix injected more than once');

  // Unit fixture for the narrow semantic sweep. It must hide only the generic shell row,
  // exclude Patch Notes content, and restore only its own tagged row in tier mode.
  const attrs={};
  const styleState={};
  const style={setProperty:(k,v,p)=>{styleState[k]={v,p}},removeProperty:k=>{delete styleState[k]}};
  const shell={
    textContent:'챔피언 상세 닫기',dataset:{},hidden:false,style,parentElement:null,
    closest:()=>null,contains:()=>false,querySelector:()=>null,
    querySelectorAll:sel=>sel==='button'?[closeBtn]:[],
    setAttribute:(k,v)=>{attrs[k]=v},removeAttribute:k=>{delete attrs[k]}
  };
  const closeBtn={textContent:'닫기',parentElement:shell,getAttribute:k=>k==='aria-label'?'닫기':'',closest:sel=>sel==='.title'?shell:null};
  const patchBtn={textContent:'닫기',getAttribute:()=>'',closest:()=>patchTitle,parentElement:null};
  const patchTitle={
    textContent:'챔피언 상세 닫기',dataset:{},hidden:false,style:{setProperty(){},removeProperty(){}},parentElement:null,
    closest:sel=>String(sel).includes('#dataPatchNotesV01599')?{}:null,contains:()=>false,querySelector:()=>null,
    querySelectorAll:sel=>sel==='button'?[patchBtn]:[],setAttribute(){},removeAttribute(){}
  };
  patchBtn.parentElement=patchTitle;
  const card={};
  const view={
    dataset:{},
    querySelectorAll:sel=>{
      if(sel==='.title')return[shell,patchTitle];
      if(sel==='button')return[closeBtn,patchBtn];
      if(sel==='[data-data115-patch-shell-hidden-v015135="1"]')return shell.dataset.data115PatchShellHiddenV015135==='1'?[shell]:[];
      return[];
    }
  };
  const text=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const hiddenCount=RT.applyPatchShellSemanticSweepV015135({view,card},true,text);
  if(hiddenCount!==1||shell.hidden!==true||shell.dataset.data115PatchShellHiddenV015135!=='1')throw new Error('semantic sweep did not hide exactly the generic shell row');
  if(styleState.display?.v!=='none'||styleState.display?.p!=='important'||attrs['aria-hidden']!=='true')throw new Error('semantic sweep did not force shell display:none!important');
  if(patchTitle.hidden!==false||patchTitle.dataset.data115PatchShellHiddenV015135)throw new Error('Patch Notes subtree was incorrectly hidden');
  RT.applyPatchShellSemanticSweepV015135({view,card},false,text);
  if(shell.hidden!==false||shell.dataset.data115PatchShellHiddenV015135||styleState.display||attrs['aria-hidden'])throw new Error('semantic sweep did not restore its tagged shell row in tier mode');

  // ui-stability remains a source payload appended by the existing runtime pipeline,
  // not a new standalone presentation owner.
  const standalone=read('update/v0.15.120/ui-stability-baseline-v015115.js');
  const standaloneResult=RT.patchRuntimeSource('ui-stability-baseline-v015115.js',standalone);
  if(standaloneResult.includes('PATCH_NOTES_SEMANTIC_SHELL_V015135'))throw new Error('v0.15.135 incorrectly targets standalone ui-stability source');

  const manifest=j('update/manifest.json');
  if(manifest.version!=='0.15.135'||String(manifest.min_launcher)!=='2.0.2')throw new Error(`active manifest mismatch: ${manifest.version}`);
  const map=new Map(manifest.files.map(x=>[x.path,x.source]));
  const expected={
    'package.json':'update/v0.15.135/package.json',
    'main-v015135.js':'update/v0.15.135/main-v015135.js',
    'successor-route-v015135.js':'update/v0.15.135/successor-route-v015135.js',
    'runtime-source-stability-v015135.js':'update/v0.15.135/runtime-source-stability-v015135.js',
    'cold-start-promotion-v015135.js':'update/v0.15.135/cold-start-promotion-v015135.js'
  };
  for(const [k,v] of Object.entries(expected))if(map.get(k)!==v)throw new Error(`manifest route mismatch ${k}: ${map.get(k)||'missing'}`);
  if(map.get('ui-stability-baseline-v015115.js')!=='update/v0.15.120/ui-stability-baseline-v015115.js')throw new Error('DATA single owner source replaced');

  const manual=j('docs/continuity-manual.json');
  if(manual.real_world_validation?.patch_notes_shell_header_v015134?.status!=='failed_real_windows')throw new Error('v0.15.134 visual rejection not recorded');
  if(manual.real_world_validation?.patch_notes_shell_header_v015135?.status!=='pending')throw new Error('v0.15.135 Windows acceptance state missing');
  if(manual.next_planned_work?.version!=='0.15.136')throw new Error('next planned work not advanced after hotfix');

  const report={
    status:'SUCCESS',version:'0.15.135',issue:79,
    prior_failure:'v0.15.134 patched one resolved title node but real Windows still rendered the generic champion-detail shell row',
    uncertainty:'without a live DOM dump, the surviving row may be a different title node or a late renderer replacement; v0.15.135 handles both without broad document-wide mutation',
    fix:'under #data only, find a compact row containing 챔피언 상세 plus a 닫기 button, exclude Patch Notes body/nav, tag/hide it, restore only tagged rows, and reapply on child-list replacement',
    production_runtime_target:'input-interaction-stability-v01539.js',data_owner:'ui-stability-v015115',
    semantic_fixture:'PASS',child_replacement_observer_contract:'PASS',standalone_ui_source_not_targeted:true,
    score_logic_changed:false,random_scoring_changed:false
  };
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/v015135-production-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('v0.15.135 PRODUCTION AUDIT: SUCCESS · scoped semantic Patch Notes shell sweep + replacement observer');
})();
