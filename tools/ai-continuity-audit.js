'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(read(p));
const must=(s,n,l)=>{if(!String(s).includes(n))throw new Error(`continuity audit missing ${l}: ${n}`)};
const ok=l=>console.log('PASS',l);

const manifest=json('update/manifest.json');
const current=json('update/current-state.json');
const manual=json('docs/continuity-manual.json');
const rules=read('AGENTS.md');
const handoff=read('docs/AI_HANDOFF.md');
const known=read('docs/KNOWN_ISSUES.md');

if(current.active_version!==manifest.version)throw new Error(`current-state version ${current.active_version} != manifest ${manifest.version}`);
if(current.min_launcher!==String(manifest.min_launcher||''))throw new Error('current-state min_launcher drift');
ok('generated-version-sync');

const byPath=new Map((manifest.files||[]).map(x=>[x.path,x]));
for(const row of current.critical_files||[]){
  if(!row.path||!row.source)throw new Error('critical-file row incomplete');
  const live=byPath.get(row.path);
  if(!live)throw new Error('critical-file target missing from manifest: '+row.path);
  if(live.source!==row.source)throw new Error(`critical-file source drift ${row.path}: ${row.source} != ${live.source}`);
}
ok('critical-source-map');

must(rules,'read docs/NEW_CHAT_BOOTSTRAP.md','bootstrap rule');
must(rules,'update/manifest.json','manifest authority rule');
must(rules,'Do **not** infer current behavior from version numbers alone','no version inference rule');
must(rules,'source-of-truth','source of truth rule');
must(handoff,`v${manifest.version}`,'active version handoff');
must(known,'Real Windows','real-Windows limitation');
ok('governance-doc-contract');

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

// Real-device evidence may explicitly reject a build. Keep that distinct from
// pending/blocked/stale states so a failed Windows acceptance is never silently
// rewritten as success or mere lack of evidence.
const allowed=new Set(['pending','known_stale_baseline','verified','blocked','failed_real_windows']);
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
ok('generated-current-state-doc');

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/ai-continuity-report.json'),JSON.stringify({status:'SUCCESS',version:manifest.version,checks:['generated-version-sync','critical-source-map','governance-doc-contract','active-owner-contract','retired-overlay-regression-guard','manual-validation-and-working-style-contract','generated-current-state-doc']},null,2)+'\n');
console.log('AI CONTINUITY AUDIT: SUCCESS');
