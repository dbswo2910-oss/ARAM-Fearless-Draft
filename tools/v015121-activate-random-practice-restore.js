'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(ROOT,p),s,'utf8');

const mp='update/manifest.json';
const m=JSON.parse(read(mp));
if(String(m.version)!=='0.15.120')throw new Error(`v0.15.121 activation requires active v0.15.120, got ${m.version}`);
const replace=(out,source)=>{
  const row=(m.files||[]).find(x=>x.path===out);
  if(!row)throw new Error(`manifest anchor missing: ${out}`);
  row.source=source;
};
const upsert=(out,source,after)=>{
  m.files=(m.files||[]).filter(x=>x.path!==out);
  let i=after?m.files.findIndex(x=>x.path===after):-1;
  if(i<0)i=m.files.length-1;
  m.files.splice(i+1,0,{path:out,source});
};

m.version='0.15.121';
m.message='v0.15.121 · RANDOM PRACTICE RESTORE — deterministic entry/render/input/results with one disposable refresh owner';
replace('runtime-loader-v01579.js','update/v0.15.121/runtime-loader-v01579.js');
replace('package.json','update/v0.15.121/package.json');
upsert('runtime-loader-v015120.js','update/v0.15.120/runtime-loader-v01579.js','runtime-loader-v01579.js');
upsert('runtime-source-stability-v015121.js','update/v0.15.121/runtime-source-stability-v015121.js','runtime-source-stability-v015120.js');
upsert('main-v015121.js','update/v0.15.121/main-v015121.js','main-v015120.js');
const installed=new Set((m.files||[]).map(x=>x.path));
m.delete=(m.delete||[]).filter(x=>!installed.has(x));
write(mp,JSON.stringify(m,null,2)+'\n');

let readme=read('README.md');
readme=readme.replace(/Current app\/update version: \*\*v[^*]+\*\*/,'Current app/update version: **v0.15.121**');
const note='- **v0.15.121**: RANDOM Practice restore. Entering RANDOM restores the existing input/TOP5/detail view from current state, input/change refreshes are coalesced under one disposable runtime owner, and the cooperative exhaustive TOP5 calculator remains unchanged. No recommendation/Random scoring math changed.';
if(!readme.includes('**v0.15.121**: RANDOM Practice restore'))readme+='\n'+note+'\n';
write('README.md',readme);

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.121**');
const handoffNote=`\n### v0.15.121 — RANDOM Practice restore\n\nRANDOM Practice keeps the v0.15.100 PICK DOM/selection owner and the v0.15.115 single-owner UI boundary. The v0.15.72 Random Practice coordinator is revised in-place by the v0.15.121 runtime transform: view entry restores the existing input/TOP5/detail output from current state, click/change/input refresh work is coalesced through the existing maintenance timer, event listeners have one explicit owner and are removed by the v0.15.118 disposer, and the cooperative exhaustive TOP5 path remains the only combo calculator. No MutationObserver, interval repair loop, late DOM reparent owner, or scoring change is introduced. Real-Windows acceptance remains required for final visual/interaction sign-off.\n`;
if(!handoff.includes('### v0.15.121 — RANDOM Practice restore'))handoff+=handoffNote;
write('docs/AI_HANDOFF.md',handoff);

let agents=read('AGENTS.md');
const agentRule=`\n## v0.15.121 RANDOM Practice restore baseline\n\n- RANDOM PICK DOM/selection ownership remains \`runtime-v015100\` under the v0.15.115 single-owner boundary.\n- Runtime interaction/refresh coordination remains the v0.15.72 coordinator, revised by v0.15.121; do not add a second Random refresh owner.\n- Entering RANDOM may restore current inputs/TOP5/detail once, then ordinary interaction uses one coalesced maintenance timer.\n- Random click/change/input/focus/visibility listeners must be explicitly disposable through the v0.15.118 lifecycle owner.\n- Do not restore subtree MutationObserver repair loops, setInterval refresh loops, or the retired v0.15.103-v0.15.114 DOM reparent overlays.\n- The cooperative exhaustive TOP5 calculation and recommendation/Random scoring math are unchanged.\n- CI validates source/lifecycle contracts only; final PICK interaction/visual acceptance still requires real-Windows evidence.\n`;
if(!agents.includes('## v0.15.121 RANDOM Practice restore baseline'))agents+=agentRule;
write('AGENTS.md',agents);

let issues=read('docs/KNOWN_ISSUES.md');
const old='v0.15.115 intentionally retired that late overlay stack and restored a single-owner architecture. The code ownership problem is guarded by CI, but there is not yet a recorded final real-Windows acceptance screenshot/video after the reset.';
const replacement='v0.15.115 intentionally retired that late overlay stack and restored a single-owner architecture. v0.15.121 then restores RANDOM entry/render/input/TOP5-result coordination inside the existing owners and makes the interaction listener set explicitly disposable. The code ownership and refresh-loop contracts are guarded by CI, but there is not yet a recorded final real-Windows acceptance screenshot/video after v0.15.121.';
if(issues.includes(old))issues=issues.replace(old,replacement);
write('docs/KNOWN_ISSUES.md',issues);

const cp='docs/continuity-manual.json';
const c=JSON.parse(read(cp));
const plannedBefore=JSON.stringify(c.next_planned_work??null);
if(c.next_planned_work?.theme!=='SAFE MODE / CRASH-LOOP ISOLATION')throw new Error(`v0.15.121 must preserve existing next_planned_work; got ${c.next_planned_work?.theme||'missing'}`);
c.real_world_validation=c.real_world_validation||{};
c.real_world_validation.random_pick_after_v015115_single_owner_reset={
  status:'pending',
  evidence:'v0.15.121 restores RANDOM entry/render/input/TOP5-result coordination with one disposable event owner. CI is green only after activation; a post-v0.15.121 real-Windows screenshot/video is still required for final acceptance.',
  must_verify:[
    'RANDOM opens without a blank/stale PICK workspace and existing input state renders immediately',
    'PICK and IN GAME do not leak into each other',
    'typing/committing external, party and pool inputs stays responsive without repeated refresh jumps',
    'TOP5 calculation completes and results/detail remain visible',
    'clicking different TOP5 candidates changes the selected name and DNA/AD-AP values',
    'DNA/detail containers do not jump, disappear, or reparent after repeated clicks',
    'repeated RANDOM entry/exit does not create duplicate refresh behavior or progressive slowdown'
  ]
};
const backlog=Array.isArray(c.user_reported_backlog_v015120)?c.user_reported_backlog_v015120:[];
const item2=backlog.find(x=>Number(x.order)===2);
if(item2)item2.status='code_complete_real_windows_pending';
else backlog.unshift({order:2,theme:'RANDOM Practice restore',status:'code_complete_real_windows_pending'});
c.user_reported_backlog_v015120=backlog;
if(JSON.stringify(c.next_planned_work??null)!==plannedBefore)throw new Error('v0.15.121 activation unexpectedly changed next_planned_work');
write(cp,JSON.stringify(c,null,2)+'\n');
console.log('v0.15.121 RANDOM PRACTICE RESTORE ACTIVATION FILES: PREPARED');
