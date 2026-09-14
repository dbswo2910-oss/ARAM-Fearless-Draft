'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const j=p=>JSON.parse(read(p));
const must=(s,n,l=n)=>{if(!String(s).includes(n))throw new Error(`v0.15.134 missing ${l}: ${n}`)};
const mustNot=(s,n,l=n)=>{if(String(s).includes(n))throw new Error(`v0.15.134 forbidden ${l}: ${n}`)};

(function main(){
  const p133=j('update/v0.15.133/package.json'),p134=j('update/v0.15.134/package.json');
  if(p134.name!==p133.name||p134.name!=='aram-fearless-draft')throw new Error('stable Electron app identity changed');
  if(p134.version!=='0.15.134'||p134.main!=='main-v015134.js')throw new Error('v0.15.134 package metadata mismatch');

  const mainSrc=read('update/v0.15.134/main-v015134.js');
  must(mainSrc,"STABLE_APP_ID='aram-fearless-draft'",'stable userData app id');
  must(mainSrc,"app.setPath('userData',stable)",'stable userData pin');
  if(mainSrc.indexOf("app.setPath('userData',stable)")>mainSrc.indexOf('module._compile'))throw new Error('userData pin occurs too late');

  const route=require('../update/v0.15.134/successor-route-v015134.js');
  const base=read('update/v0.15.122/main-v015122.js');
  const routed=route.patchSuccessorSource(base);
  must(routed,"'0.15.134').replaceAll(stabilityAnchor,'runtime-source-stability-v015134')",'successor route');
  mustNot(routed,"'0.15.122').replaceAll(stabilityAnchor,'runtime-source-stability-v015122')",'stale successor route');

  const RT=require('../update/v0.15.134/runtime-source-stability-v015134.js');
  const runtimeSrc=read('update/v0.15.134/runtime-source-stability-v015134.js');
  must(runtimeSrc,"try{prior=require('../v0.15.133/runtime-source-stability-v015133')}catch{prior=require('./runtime-source-stability-v015133')}",'v0.15.133 predecessor');
  must(runtimeSrc,"if(file==='input-interaction-stability-v01539.js')src=patchResolvedDataTitle(src);",'actual injected DATA runtime target');
  must(runtimeSrc,"patch_notes_shell_fix_owner:'ui-stability-v015115'",'existing DATA owner');
  must(runtimeSrc,"patch_notes_shell_fix_strategy:'resolved-syncData-title-direct-style'",'resolved title strategy');
  if(RT.score_logic_changed!==false||RT.random_scoring_changed!==false)throw new Error('scoring neutrality changed');

  // Critical regression: exercise the same runtime path the installed app uses.
  const input=read('update/v0.15.39/input-interaction-stability-v01539.js');
  const patched=RT.patchRuntimeSource('input-interaction-stability-v01539.js',input);
  try{new Function(patched)}catch(e){throw new Error('patched DATA runtime parse failed: '+e.message)}
  for(const x of [
    'PATCH_NOTES_ALWAYS_OPEN_V015132',
    'PATCH_NOTES_REAL_WINDOWS_V015133',
    'PATCH_NOTES_RESOLVED_TITLE_V015134',
    "title.style.setProperty('display','none','important')",
    "title.style.removeProperty('display')",
    'data115PatchShellHiddenV015134'
  ])must(patched,x,'patched production runtime contract');
  if((patched.match(/PATCH_NOTES_RESOLVED_TITLE_V015134/g)||[]).length!==1)throw new Error('v0.15.134 resolved-title fix injected more than once');

  // The title selector that already works in live DATA must remain the source of truth.
  must(patched,"const title=p.detailBranch.querySelector(':scope > .panel > .title')||p.detailBranch.querySelector(':scope > .title')||p.card.closest('.panel')?.querySelector(':scope > .title');",'syncData resolved-title selector');
  must(patched,"title.hidden=patchMode;/* PATCH_NOTES_RESOLVED_TITLE_V015134 */if(patchMode)",'direct title state hook');

  // Prove v0.15.134 does not pretend ui-stability is loaded as a standalone file.
  const standalone=read('update/v0.15.120/ui-stability-baseline-v015115.js');
  const standaloneResult=RT.patchRuntimeSource('ui-stability-baseline-v015115.js',standalone);
  if(standaloneResult.includes('PATCH_NOTES_RESOLVED_TITLE_V015134'))throw new Error('v0.15.134 incorrectly targets standalone ui-stability source');

  const manifest=j('update/manifest.json');
  if(manifest.version!=='0.15.134'||String(manifest.min_launcher)!=='2.0.2')throw new Error(`active manifest mismatch: ${manifest.version}`);
  const map=new Map(manifest.files.map(x=>[x.path,x.source]));
  const expected={
    'package.json':'update/v0.15.134/package.json',
    'main-v015134.js':'update/v0.15.134/main-v015134.js',
    'successor-route-v015134.js':'update/v0.15.134/successor-route-v015134.js',
    'runtime-source-stability-v015134.js':'update/v0.15.134/runtime-source-stability-v015134.js',
    'cold-start-promotion-v015134.js':'update/v0.15.134/cold-start-promotion-v015134.js'
  };
  for(const [k,v] of Object.entries(expected))if(map.get(k)!==v)throw new Error(`manifest route mismatch ${k}: ${map.get(k)||'missing'}`);
  if(map.get('ui-stability-baseline-v015115.js')!=='update/v0.15.120/ui-stability-baseline-v015115.js')throw new Error('DATA single owner source replaced');

  const manual=j('docs/continuity-manual.json');
  if(manual.real_world_validation?.patch_notes_shell_header_v015133?.status!=='failed_real_windows')throw new Error('v0.15.133 visual rejection not recorded');
  if(manual.real_world_validation?.patch_notes_shell_header_v015134?.status!=='pending')throw new Error('v0.15.134 Windows acceptance state missing');
  if(manual.next_planned_work?.version!=='0.15.135')throw new Error('next planned work not advanced after hotfix');

  const report={
    status:'SUCCESS',
    version:'0.15.134',
    issue:79,
    prior_failure:'v0.15.133 ancestor-chain helper missed the live sibling-panel shell title',
    fix:'apply display:none!important directly to the title object already resolved by ui-stability-v015115 syncData()',
    production_runtime_target:'input-interaction-stability-v01539.js',
    data_owner:'ui-stability-v015115',
    real_source_patchRuntimeSource_fixture:'PASS',
    standalone_ui_source_not_targeted:true,
    score_logic_changed:false,
    random_scoring_changed:false
  };
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/v015134-production-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('v0.15.134 PRODUCTION AUDIT: SUCCESS · resolved DATA title patched on real runtime path');
})();
