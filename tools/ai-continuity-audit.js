'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(read(p));
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`AI continuity audit missing ${label}: ${needle}`)};
const eq=(a,b,label)=>{if(a!==b)throw new Error(`AI continuity audit ${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)};
const report={schema:1,status:'success',checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

for(const p of ['docs/CURRENT_STATE.md','docs/KNOWN_ISSUES.md','docs/NEW_CHAT_BOOTSTRAP.md','docs/continuity-manual.json','update/current-state.json','tools/sync-current-state.js']){
  if(!exists(p))throw new Error('missing continuity file: '+p);
}
ok('continuity-files-present');

const manifest=json('update/manifest.json');
const current=json('update/current-state.json');
const manual=json('docs/continuity-manual.json');
const byPath=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
if(byPath.size!==(manifest.files||[]).length)throw new Error('active manifest has duplicate installed paths');
const pkgSource=byPath.get('package.json');
if(!pkgSource||!exists(pkgSource))throw new Error('active package source missing');
const pkg=json(pkgSource);
eq(current.active.version,String(manifest.version),'current-state active version');
eq(current.active.message,String(manifest.message),'current-state manifest message');
eq(current.package.source,pkgSource,'current-state package source');
eq(current.package.version,String(pkg.version),'current-state package version');
eq(current.package.main,String(pkg.main),'current-state package main');
eq(current.package.main_source,byPath.get(pkg.main)||'','current-state main source');
if(current.package.version!==current.active.version)throw new Error('package/manifest version drift in continuity snapshot');
ok('active-version-package-consistency');

const expectedSources={
  data_view:byPath.get('ui-stability-baseline-v015115.js')||'',
  state_integrity:byPath.get('state-integrity-v015117.js')||'',
  resource_lifecycle:byPath.get('resource-lifecycle-v015118.js')||'',
  autosync_main:byPath.get('autosync-concurrency-v015119.js')||'',
  autosync_renderer:byPath.get('runtime-live-autosync-v01571.js')||''
};
for(const [k,s] of Object.entries(expectedSources)){
  if(!s)throw new Error(`active manifest missing continuity owner source for ${k}`);
  eq(current.owners?.[k]?.active_source,s,`${k} active source`);
}
if(current.owners?.random_pick?.owner!=='runtime-v015100')throw new Error('RANDOM PICK owner drifted from v0.15.115 single-owner baseline');
if(!String(current.owners?.random_pick?.active_runtime_source||'').includes('runtime-source-stability-v'))throw new Error('RANDOM PICK active runtime source missing');
ok('active-owner-contract');

const deletes=new Set(manifest.delete||[]);
for(const row of current.retired_ui_overlays||[]){
  if(byPath.has(row.path)||row.active)throw new Error('retired UI overlay became active: '+row.path);
  if(!deletes.has(row.path)||!row.scheduled_delete)throw new Error('retired UI overlay lost delete guard: '+row.path);
}
if((current.retired_ui_overlays||[]).length<10)throw new Error('retired UI overlay register unexpectedly incomplete');
ok('retired-overlay-regression-guard');

const allowed=new Set(['pending','known_stale_baseline','verified','blocked']);
for(const [key,row] of Object.entries(manual.real_world_validation||{})){
  if(!allowed.has(row.status))throw new Error(`invalid real-world validation status ${key}: ${row.status}`);
}
if(manual.working_style?.priority!=='accuracy_over_speed')throw new Error('accuracy-over-speed project preference missing');
if(current.release_contract?.visual_success_requires_real_windows_evidence!==true)throw new Error('visual evidence completion guard missing');
if(current.release_contract?.scoring_changed_by_continuity_system!==false||current.release_contract?.random_scoring_changed_by_continuity_system!==false)throw new Error('continuity system must remain score-neutral');
ok('manual-validation-and-working-style-contract');

const currentMd=read('docs/CURRENT_STATE.md');
for(const [needle,label] of [
  [`**v${manifest.version}**`,'active version'],
  ['Repository state wins over conversational memory','memory authority rule'],
  ['v0.15.103–v0.15.114','retired overlay warning'],
  ['CI success proves code/regression contracts','CI visual boundary'],
  ['New-chat restore sequence','cold-start sequence']
])must(currentMd,needle,label);
if(manual.next_planned_work?.theme)must(currentMd,manual.next_planned_work.theme,'next planned work');
if(manual.next_planned_work?.version)must(currentMd,`**${manual.next_planned_work.version}**`,'next planned work version');
ok('human-current-state-contract');

const issues=read('docs/KNOWN_ISSUES.md');
for(const id of ['KI-001','KI-002','KI-003','KI-004','KI-005','KI-006'])must(issues,id,'known issue '+id);
must(issues,'VERIFY_REAL_WINDOWS','visual verification state');
must(issues,'VERIFY_REAL_MATCH','real-match verification state');
ok('known-issue-register');

const bootstrap=read('docs/NEW_CHAT_BOOTSTRAP.md');
const ordered=['AGENTS.md','docs/CURRENT_STATE.md','update/current-state.json','update/manifest.json','docs/KNOWN_ISSUES.md','docs/AI_HANDOFF.md'];
let at=-1;
for(const p of ordered){const i=bootstrap.indexOf(p,at+1);if(i<0)throw new Error('bootstrap missing '+p);at=i}
must(bootstrap,'속도보다 정확성과 회귀 방지를 우선','accuracy-over-speed bootstrap wording');
must(bootstrap,'CI만 통과했다고 실제 Electron 화면까지 정상이라고 단정하지 마','visual proof bootstrap guard');
ok('new-chat-bootstrap-order');

const agents=read('AGENTS.md');
for(const p of ['docs/CURRENT_STATE.md','update/current-state.json','docs/KNOWN_ISSUES.md','docs/NEW_CHAT_BOOTSTRAP.md'])must(agents,p,'AGENTS continuity pointer');
must(agents,'Repository state wins over conversational memory','AGENTS memory-authority rule');
ok('agents-cold-start-entrypoint');

const full=read('.github/workflows/full-regression-audit.yml');
must(full,'node tools/ai-continuity-audit.js','Full Regression continuity gate');
const continuityWf=read('.github/workflows/ai-continuity-audit.yml');
must(continuityWf,'node tools/sync-current-state.js --check','dedicated snapshot check');
must(continuityWf,'node tools/ai-continuity-audit.js','dedicated continuity audit');
ok('ci-continuity-gates');

const workflowDir=path.join(ROOT,'.github/workflows');
for(const name of fs.readdirSync(workflowDir)){
  const m=name.match(/^v015(\d+)-activate-.*\.ya?ml$/i);if(!m||Number(m[1])<120)continue;
  const src=fs.readFileSync(path.join(workflowDir,name),'utf8');
  must(src,'node tools/sync-current-state.js',`${name} release continuity sync`);
}
ok('future-v120-plus-activation-sync-policy');

const syncSrc=read('tools/sync-current-state.js');
for(const n of ['update/manifest.json','docs/continuity-manual.json','update/current-state.json','docs/CURRENT_STATE.md','future_activation_workflows_from_v015120_must_run'])must(syncSrc,n,'sync generator contract');
ok('deterministic-sync-generator-contract');

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/ai-continuity-report.json'),JSON.stringify({...report,activeVersion:manifest.version,nextPlannedWork:manual.next_planned_work||{}},null,2)+'\n');
console.log('AI CONTINUITY AUDIT: SUCCESS');
