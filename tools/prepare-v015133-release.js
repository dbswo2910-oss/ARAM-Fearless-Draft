'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const p=x=>path.join(ROOT,x);
const read=x=>fs.readFileSync(p(x),'utf8');
const readJson=x=>JSON.parse(read(x));
const write=(x,s)=>fs.writeFileSync(p(x),s,'utf8');
const sha=x=>crypto.createHash('sha256').update(fs.readFileSync(p(x))).digest('hex');

const manifest=readJson('update/manifest.json');
manifest.version='0.15.133';
manifest.message='v0.15.133 · REAL-WINDOWS PATCH NOTES SHELL FIX + CONTINUITY CLEANUP';
manifest.min_launcher='2.0.2';
const replacements=[
  ['package.json','update/v0.15.133/package.json'],
  ['main-v015133.js','update/v0.15.133/main-v015133.js'],
  ['successor-route-v015133.js','update/v0.15.133/successor-route-v015133.js'],
  ['runtime-source-stability-v015133.js','update/v0.15.133/runtime-source-stability-v015133.js'],
  ['cold-start-promotion-v015133.js','update/v0.15.133/cold-start-promotion-v015133.js']
];
const files=Array.isArray(manifest.files)?manifest.files:[];
for(const [out,source] of replacements){
  if(!fs.existsSync(p(source)))throw new Error('missing release source '+source);
  const next={path:out,source,sha256:sha(source)};
  const i=files.findIndex(x=>x.path===out);
  if(i>=0)files[i]={...files[i],...next};else files.push(next);
}
manifest.files=files;

const manual=readJson('docs/continuity-manual.json');
manual.real_world_validation=manual.real_world_validation||{};
manual.real_world_validation.v015132_storage_root_and_cold_start={
  status:'verified',
  evidence:'User supplied a real Windows v0.15.132 screenshot showing the preserved 159-match Research checkpoint and confirmed repeated full exit/relaunch stays on v0.15.132 instead of falling back to an older version.',
  must_verify:[]
};
manual.real_world_validation.patch_notes_shell_header_v015133={
  status:'pending',
  evidence:'A real Windows v0.15.132 screenshot proved the Patch Notes content renders but the outer generic 챔피언 상세 / 닫기 shell row survives. v0.15.133 adds an exact #dataCard-ancestor fix and a nested-DOM regression fixture; final acceptance still requires a post-update Windows screenshot.',
  must_verify:[
    'Update/relaunch to v0.15.133 and open DATA > 패치노트',
    'Confirm the outer 챔피언 상세 / 닫기 row is absent while Patch Notes hero/champion/item/TOP6/list/quick-nav remain visible',
    'Switch back to 챔피언 티어리스트 and confirm the normal detail header behavior returns'
  ]
};
if(manual.real_world_validation.data_patch_notes_subnav_v015120){
  manual.real_world_validation.data_patch_notes_subnav_v015120.evidence='A real Windows v0.15.132 screenshot now confirms Patch Notes uses the broad DATA workspace, hides the tier branch, and renders compact champion cards. Switching back to Champion Tier List remains the final visual check; the separate generic shell-header defect is tracked by patch_notes_shell_header_v015133.';
}
manual.next_planned_work={
  version:'0.15.134',
  theme:'ARAM RATING v0.3.1 MAINLINE REBASE',
  status:'planned',
  intent:'Rebase the useful research-only ARAM Rating v0.3.1 sampling/B2 work onto the post-v0.15.133 mainline without reviving obsolete v0.15.129 UI/storage code or changing production scoring owners.',
  guardrails:[
    'start from the current mainline after v0.15.133 rather than continuing the diverged PR #74 head directly',
    'preserve v0.15.132 stable userData/checkpoint recovery',
    'reuse current v0.15.131+ Research UI/storage production files instead of old v0.15.129 copies',
    'keep B2 manual-only until explicit user action',
    'do not change Draft/RANDOM/ROLE/item scoring, AutoSync ownership, or DATA ownership'
  ]
};
if(Array.isArray(manual.user_reported_backlog_v015120)){
  const history=manual.user_reported_backlog_v015120.find(x=>x.order===3);
  if(history)history.status='code_complete_real_windows_pending';
}
write('docs/continuity-manual.json',JSON.stringify(manual,null,2)+'\n');

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.133**');
const handoffMarker='## v0.15.133 real-Windows Patch Notes shell baseline';
if(!handoff.includes(handoffMarker)){
  handoff+=`\n\n${handoffMarker}\n\n- Real Windows v0.15.132 evidence confirms the stable \`aram-fearless-draft\` userData root sees the preserved 159-match Research checkpoint and cold relaunch no longer falls back to an older app version.\n- The same screenshot proves v0.15.132 did **not** fully remove the outer \`챔피언 상세 / 닫기\` DATA shell row in Patch Notes mode even though source-contract CI passed.\n- v0.15.133 keeps DATA ownership in \`ui-stability-v015115\` and only extends the already injected \`input-interaction-stability-v01539.js\` transform. It walks the exact \`#dataCard\` ancestor chain inside the resolved detail branch and hides only generic champion-detail/close title rows with inline \`display:none!important\` while Patch Notes is active, restoring them in tier mode.\n- The v0.15.133 audit includes a nested-DOM fixture reproducing the topology missed by v0.15.132. CI still does not replace the final Windows screenshot.\n- Scoring, RANDOM scoring, Rating calculations, AutoSync, item recommendation logic, and persistent-state ownership are unchanged.\n- After this cleanup, the next planned development line is ARAM Rating v0.3.1 rebased from the current mainline rather than continuing the stale PR #74 head directly.\n`;
}
write('docs/AI_HANDOFF.md',handoff);

let known=read('docs/KNOWN_ISSUES.md');
const knownMarker='## v0.15.132 real-Windows storage recovery + v0.15.133 Patch Notes shell follow-up';
if(!known.includes(knownMarker)){
  known+=`\n\n${knownMarker}\n\n**Storage/cold-start:** \`VERIFIED_REAL_WINDOWS\`. The user supplied v0.15.132 Windows evidence showing the preserved 159-match Research checkpoint is visible again and confirmed repeated full exit/relaunch stays on v0.15.132 rather than resurrecting an older version.\n\n**Patch Notes shell:** \`VERIFY_REAL_WINDOWS\`. The same v0.15.132 screenshot still showed the outer generic \`챔피언 상세 / 닫기\` row above otherwise-correct Patch Notes content. v0.15.132 CI missed the real nesting and CSS-priority behavior. v0.15.133 fixes this inside the existing DATA owner by walking only the exact \`#dataCard\` ancestor chain, forcing the generic shell row to \`display:none!important\` in Patch Notes mode, and restoring it in tier mode. A post-v0.15.133 Windows screenshot is required before closing GitHub issue #79.\n`;
}
write('docs/KNOWN_ISSUES.md',known);

write('update/manifest.json',JSON.stringify(manifest,null,2)+'\n');
require('./sync-current-state').sync();
console.log('v0.15.133 release metadata prepared',{version:manifest.version,files:manifest.files.length,next:manual.next_planned_work.version});
