'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const p=x=>path.join(ROOT,x);
const read=x=>fs.readFileSync(p(x),'utf8');
const readJson=x=>JSON.parse(read(x));
const write=(x,s)=>fs.writeFileSync(p(x),s,'utf8');
const sha=x=>crypto.createHash('sha256').update(fs.readFileSync(p(x))).digest('hex');

const manifest=readJson('update/manifest.json');
manifest.version='0.15.134';
manifest.message='v0.15.134 · PATCH NOTES RESOLVED TITLE FIX';
manifest.min_launcher='2.0.2';
const replacements=[
  ['package.json','update/v0.15.134/package.json'],
  ['main-v015134.js','update/v0.15.134/main-v015134.js'],
  ['successor-route-v015134.js','update/v0.15.134/successor-route-v015134.js'],
  ['runtime-source-stability-v015134.js','update/v0.15.134/runtime-source-stability-v015134.js'],
  ['cold-start-promotion-v015134.js','update/v0.15.134/cold-start-promotion-v015134.js']
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
manual.real_world_validation.patch_notes_shell_header_v015133={
  status:'failed_real_windows',
  evidence:'User supplied a real Windows v0.15.133 screenshot. Patch Notes content was healthy but the outer generic 챔피언 상세 / 닫기 row still remained. Root cause: the v0.15.133 follow-up searched only the #dataCard ancestor chain, while the live shell title is resolved separately by syncData() from the detail branch.',
  must_verify:[]
};
manual.real_world_validation.patch_notes_shell_header_v015134={
  status:'pending',
  evidence:'v0.15.134 patches the exact title variable already resolved by the existing ui-stability-v015115 syncData() owner and forces inline display:none!important in Patch Notes mode. Final acceptance requires one real Windows screenshot.',
  must_verify:[
    'Update/relaunch to v0.15.134 and open DATA > 패치노트',
    'Confirm the outer 챔피언 상세 / 닫기 row is absent while Patch Notes hero/champion/item/TOP6/list/quick-nav remain visible',
    'Switch back to 챔피언 티어리스트 and confirm the normal detail header returns'
  ]
};
manual.next_planned_work={
  version:'0.15.135',
  theme:'ARAM RATING v0.3.1 MAINLINE REBASE',
  status:'planned',
  intent:'Rebase the useful research-only ARAM Rating v0.3.1 sampling/B2 work onto the post-v0.15.134 mainline without reviving obsolete v0.15.129 UI/storage code or changing production scoring owners.',
  guardrails:[
    'start from the current mainline after v0.15.134 rather than continuing the diverged PR #74 head directly',
    'preserve the stable aram-fearless-draft userData/checkpoint recovery',
    'reuse current Research UI/storage production files instead of old v0.15.129 copies',
    'keep B2 manual-only until explicit user action',
    'do not change Draft/RANDOM/ROLE/item scoring, AutoSync ownership, or DATA ownership'
  ]
};
write('docs/continuity-manual.json',JSON.stringify(manual,null,2)+'\n');

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.134**');
const marker='## v0.15.134 Patch Notes resolved-title correction';
if(!handoff.includes(marker))handoff+=`\n\n${marker}\n\n- Real Windows v0.15.133 evidence shows the outer \`챔피언 상세 / 닫기\` shell row still survives in Patch Notes mode.\n- The v0.15.133 ancestor-chain helper was structurally incomplete: the live generic title can be a separate panel under the resolved detail branch rather than an ancestor of \`#dataCard\`.\n- v0.15.134 keeps the existing DATA single owner and runtime target. It patches the exact \`title\` variable already resolved by \`syncData()\`, adding inline \`display:none!important\` in Patch Notes mode and restoring the original title in tier mode.\n- The v0.15.134 audit runs the real source through \`patchRuntimeSource('input-interaction-stability-v01539.js', source)\` and asserts the direct resolved-title transform, so an isolated helper cannot mask a production-path miss.\n- Scoring, RANDOM scoring, Rating calculations, AutoSync, item recommendation logic, Research storage, and persistent-state ownership are unchanged.\n`;
write('docs/AI_HANDOFF.md',handoff);

let known=read('docs/KNOWN_ISSUES.md');
const knownMarker='## v0.15.134 Patch Notes shell title correction';
if(!known.includes(knownMarker))known+=`\n\n${knownMarker}\n\n**Status:** \`VERIFY_REAL_WINDOWS\`. v0.15.133 was visually rejected by the user because the generic \`챔피언 상세 / 닫기\` row remained. The follow-up now modifies the exact shell title object resolved by the existing DATA owner instead of inferring topology from \`#dataCard\` ancestors. One post-v0.15.134 Windows screenshot is required before closing issue #79.\n`;
write('docs/KNOWN_ISSUES.md',known);

write('update/manifest.json',JSON.stringify(manifest,null,2)+'\n');
require('./sync-current-state').sync();
console.log('v0.15.134 release metadata prepared',{version:manifest.version,files:manifest.files.length,next:manual.next_planned_work.version});
