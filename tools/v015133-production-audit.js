'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const j=p=>JSON.parse(read(p));
const must=(s,n,l=n)=>{if(!String(s).includes(n))throw new Error(`v0.15.133 missing ${l}: ${n}`)};
const mustNot=(s,n,l=n)=>{if(String(s).includes(n))throw new Error(`v0.15.133 forbidden ${l}: ${n}`)};
const tuple=v=>String(v||'0').split('.').map(x=>Number(x)||0);
const gte=(a,b)=>{const A=tuple(a),B=tuple(b);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y}return true};

class FakeStyle{
  constructor(){this.map=new Map()}
  setProperty(k,v,priority=''){this.map.set(k,{value:String(v),priority:String(priority||'')})}
  removeProperty(k){this.map.delete(k)}
  getPropertyValue(k){return this.map.get(k)?.value||''}
  getPropertyPriority(k){return this.map.get(k)?.priority||''}
}
class FakeEl{
  constructor({id='',classes=[],text=''}={}){this.id=id;this.classes=new Set(classes);this.textContent=text;this.children=[];this.parentElement=null;this.dataset={};this.hidden=false;this.attrs=new Map();this.style=new FakeStyle()}
  append(child){child.parentElement=this;this.children.push(child);return child}
  matches(sel){return sel==='.panel'?this.classes.has('panel'):sel==='.title'?this.classes.has('title'):sel.startsWith('#')?this.id===sel.slice(1):false}
  querySelector(sel){if(sel===':scope > .title')return this.children.find(x=>x.classes.has('title'))||null;return null}
  closest(sel){let x=this;while(x){if(x.matches(sel))return x;x=x.parentElement}return null}
  setAttribute(k,v){this.attrs.set(k,String(v))}
  removeAttribute(k){this.attrs.delete(k)}
  getAttribute(k){return this.attrs.get(k)||null}
}

(function main(){
  const p132=j('update/v0.15.132/package.json'),p133=j('update/v0.15.133/package.json');
  if(p133.name!==p132.name||p133.name!=='aram-fearless-draft')throw new Error('stable Electron app identity changed');
  if(p133.version!=='0.15.133'||p133.main!=='main-v015133.js')throw new Error('v0.15.133 historical package metadata mismatch');

  const mainSrc=read('update/v0.15.133/main-v015133.js');
  must(mainSrc,"STABLE_APP_ID='aram-fearless-draft'",'stable userData app id');
  must(mainSrc,"app.setPath('userData',stable)",'stable userData pin');
  if(mainSrc.indexOf("app.setPath('userData',stable)")>mainSrc.indexOf('module._compile'))throw new Error('userData pin occurs too late');

  const route=require('../update/v0.15.133/successor-route-v015133.js');
  const base=read('update/v0.15.122/main-v015122.js');
  const routed=route.patchSuccessorSource(base);
  must(routed,"'0.15.133').replaceAll(stabilityAnchor,'runtime-source-stability-v015133')",'historical successor route');
  mustNot(routed,"'0.15.122').replaceAll(stabilityAnchor,'runtime-source-stability-v015122')",'stale historical successor route');

  const RT=require('../update/v0.15.133/runtime-source-stability-v015133.js');
  const runtimeSrc=read('update/v0.15.133/runtime-source-stability-v015133.js');
  must(runtimeSrc,"try{prior=require('../v0.15.132/runtime-source-stability-v015132')}catch{prior=require('./runtime-source-stability-v015132')}",'v0.15.132 predecessor');
  must(runtimeSrc,"if(file==='input-interaction-stability-v01539.js')src=patchPatchNotesRealWindows(src);",'historical DATA runtime target');
  must(runtimeSrc,"patch_notes_shell_fix_owner:'ui-stability-v015115'",'existing DATA owner');
  if(RT.score_logic_changed!==false||RT.random_scoring_changed!==false)throw new Error('scoring neutrality changed');

  const input=read('update/v0.15.39/input-interaction-stability-v01539.js');
  const patched=RT.patchRuntimeSource('input-interaction-stability-v01539.js',input);
  try{new Function(patched)}catch(e){throw new Error('historical patched DATA runtime parse failed: '+e.message)}
  for(const x of ['PATCH_NOTES_ALWAYS_OPEN_V015132','PATCH_NOTES_REAL_WINDOWS_V015133','data115PatchShellHiddenV015133',"setProperty?.('display','none','important')"])must(patched,x,'historical patched runtime contract');
  if((patched.match(/PATCH_NOTES_REAL_WINDOWS_V015133/g)||[]).length!==1)throw new Error('v0.15.133 shell transform injected more than once');

  // Preserve the original v0.15.133 fixture as a historical regression contract.
  // Real Windows evidence later proved this topology incomplete; successors must not
  // interpret this fixture passing as visual acceptance of v0.15.133.
  const host=new FakeEl({classes:['data115DataHost']});
  const detail=new FakeEl({classes:['data115DetailBranch']});host.append(detail);
  const outerPanel=new FakeEl({classes:['panel']});detail.append(outerPanel);
  const shellTitle=new FakeEl({classes:['title'],text:'챔피언 상세 닫기'});outerPanel.append(shellTitle);
  const inner=new FakeEl();outerPanel.append(inner);
  const card=new FakeEl({id:'dataCard'});inner.append(card);
  const patchNotes=new FakeEl({id:'dataPatchNotesV01599'});card.append(patchNotes);
  const internalTitle=new FakeEl({classes:['title'],text:'챔피언 상세 닫기'});patchNotes.append(internalTitle);
  const parts={host,detailBranch:detail,card};
  const hidden=RT.applyPatchShellTitleState(parts,true,el=>el.textContent);
  if(hidden!==1)throw new Error(`historical nested fixture expected 1 hidden title, got ${hidden}`);
  if(shellTitle.hidden!==true||shellTitle.getAttribute('aria-hidden')!=='true')throw new Error('historical generic shell title not hidden accessibly');
  if(shellTitle.style.getPropertyValue('display')!=='none'||shellTitle.style.getPropertyPriority('display')!=='important')throw new Error('historical generic shell title missing inline !important display none');
  if(internalTitle.hidden!==false)throw new Error('historical Patch Notes internal title incorrectly hidden');
  const restored=RT.applyPatchShellTitleState(parts,false,el=>el.textContent);
  if(restored!==1||shellTitle.hidden!==false||shellTitle.style.getPropertyValue('display')!=='')throw new Error('historical tier-mode shell title restore failed');

  const manifest=j('update/manifest.json');
  if(!gte(manifest.version,'0.15.133')||String(manifest.min_launcher)!=='2.0.2')throw new Error(`manifest predates v0.15.133 contract: ${manifest.version}`);
  const map=new Map(manifest.files.map(x=>[x.path,x.source]));
  if(map.get('ui-stability-baseline-v015115.js')!=='update/v0.15.120/ui-stability-baseline-v015115.js')throw new Error('DATA single owner source replaced');
  if(manifest.version==='0.15.133'){
    const expected={
      'package.json':'update/v0.15.133/package.json',
      'main-v015133.js':'update/v0.15.133/main-v015133.js',
      'successor-route-v015133.js':'update/v0.15.133/successor-route-v015133.js',
      'runtime-source-stability-v015133.js':'update/v0.15.133/runtime-source-stability-v015133.js',
      'cold-start-promotion-v015133.js':'update/v0.15.133/cold-start-promotion-v015133.js'
    };
    for(const [k,v] of Object.entries(expected))if(map.get(k)!==v)throw new Error(`v0.15.133 active route mismatch ${k}: ${map.get(k)||'missing'}`);
  }

  const manual=j('docs/continuity-manual.json');
  if(!gte(manual.next_planned_work?.version||'0','0.15.134'))throw new Error('next planned work regressed behind v0.15.134');
  if(manual.real_world_validation?.v015132_storage_root_and_cold_start?.status!=='verified')throw new Error('v0.15.132 real-Windows success evidence missing from continuity');
  if(gte(manifest.version,'0.15.134')&&manual.real_world_validation?.patch_notes_shell_header_v015133?.status!=='failed_real_windows')throw new Error('v0.15.133 real-Windows visual rejection not preserved');

  const report={
    status:manifest.version==='0.15.133'?'HISTORICAL_FIXTURE_PASS_VISUAL_ACCEPTANCE_NOT_PROVEN':'HISTORICAL_CONTRACT_PASS',
    historical_version:'0.15.133',
    active_version:manifest.version,
    issue:79,
    real_windows_outcome:'REJECTED: user screenshot showed the outer 챔피언 상세 / 닫기 row still visible',
    historical_fixture_limitation:'ancestor-chain fixture did not represent the live sibling/separate-panel title topology',
    successor_expected_fix:'v0.15.134 patches the exact title object already resolved by ui-stability-v015115 syncData()',
    data_owner:'ui-stability-v015115',
    score_logic_changed:false,
    random_scoring_changed:false
  };
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/v015133-production-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`v0.15.133 HISTORICAL AUDIT: PASS · active v${manifest.version} · real-Windows v0.15.133 remains rejected`);
})();
