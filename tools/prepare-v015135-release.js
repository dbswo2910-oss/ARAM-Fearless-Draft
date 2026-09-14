'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const p=x=>path.join(ROOT,x);
const read=x=>fs.readFileSync(p(x),'utf8');
const readJson=x=>JSON.parse(read(x));
const write=(x,s)=>fs.writeFileSync(p(x),s,'utf8');
const sha=x=>crypto.createHash('sha256').update(fs.readFileSync(p(x))).digest('hex');

const manifest=readJson('update/manifest.json');
manifest.version='0.15.135';
manifest.message='v0.15.135 · PATCH NOTES SEMANTIC SHELL SWEEP';
manifest.min_launcher='2.0.2';
const replacements=[
  ['package.json','update/v0.15.135/package.json'],
  ['main-v015135.js','update/v0.15.135/main-v015135.js'],
  ['successor-route-v015135.js','update/v0.15.135/successor-route-v015135.js'],
  ['runtime-source-stability-v015135.js','update/v0.15.135/runtime-source-stability-v015135.js'],
  ['cold-start-promotion-v015135.js','update/v0.15.135/cold-start-promotion-v015135.js']
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
manual.real_world_validation.patch_notes_shell_header_v015134={
  status:'failed_real_windows',
  evidence:'User supplied a real Windows v0.15.134 screenshot. The application is on v0.15.134 and Patch Notes content renders, but the outer generic 챔피언 상세 / 닫기 row still remains. This proves the single title node resolved by syncData() was not sufficient to control the live visible shell, or that the base renderer replaces it after syncData().',
  must_verify:[]
};
manual.real_world_validation.patch_notes_shell_header_v015135={
  status:'pending',
  evidence:'v0.15.135 stays inside ui-stability-v015115 ownership but no longer assumes one title topology. It scans only #data for a compact generic shell row containing 챔피언 상세 plus a 닫기 button, excludes Patch Notes body/nav, tags and hides only matches, restores only its tags in tier mode, and re-applies after child-list replacement.',
  must_verify:[
    'Update/relaunch to v0.15.135 and open DATA > 패치노트',
    'Confirm the outer 챔피언 상세 / 닫기 row is absent while Patch Notes hero/champion/item/TOP6/list/quick-nav remain visible',
    'Switch back to 챔피언 티어리스트 and confirm the normal detail header/close behavior returns'
  ]
};
manual.next_planned_work={
  version:'0.15.136',
  theme:'ARAM RATING v0.3.1 MAINLINE REBASE',
  status:'planned',
  intent:'Rebase the useful research-only ARAM Rating v0.3.1 sampling/B2 work onto the post-v0.15.135 mainline without reviving obsolete v0.15.129 UI/storage code or changing production scoring owners.',
  guardrails:[
    'start from the current mainline after v0.15.135 rather than continuing the diverged PR #74 head directly',
    'preserve the stable aram-fearless-draft userData/checkpoint recovery',
    'reuse current Research UI/storage production files instead of old v0.15.129 copies',
    'keep B2 manual-only until explicit user action',
    'do not change Draft/RANDOM/ROLE/item scoring, AutoSync ownership, or DATA ownership'
  ]
};
write('docs/continuity-manual.json',JSON.stringify(manual,null,2)+'\n');

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.135**');
const marker='## v0.15.135 Patch Notes semantic shell correction';
if(!handoff.includes(marker))handoff+=`\n\n${marker}\n\n- Real Windows v0.15.134 evidence still shows the outer \`챔피언 상세 / 닫기\` row, so the v0.15.134 resolved-title assumption is rejected by device evidence.\n- Without a live DOM dump, do not claim one exact structural root cause: the visible row may be a different title node or may be recreated after \`syncData()\`.\n- v0.15.135 stays inside the existing \`ui-stability-v015115\` DATA owner and combined \`input-interaction-stability-v01539.js\` runtime path. It performs a narrow semantic sweep only under \`#data\` for a compact row containing \`챔피언 상세\` plus a \`닫기\` button, excludes the Patch Notes body/nav, and tags/hides only the matched row.\n- A child-list observer re-applies that same narrow rule if the base renderer replaces nodes later. Tier mode restores only rows tagged by v0.15.135.\n- Scoring, RANDOM scoring, Rating calculations, AutoSync, item recommendation logic, Research storage, and persistent-state ownership are unchanged.\n`;
write('docs/AI_HANDOFF.md',handoff);

let known=read('docs/KNOWN_ISSUES.md');
const knownMarker='## v0.15.135 Patch Notes shell semantic correction';
if(!known.includes(knownMarker))known+=`\n\n${knownMarker}\n\n**Status:** \`VERIFY_REAL_WINDOWS\`. v0.15.134 was visually rejected by the user because the generic \`챔피언 상세 / 닫기\` row remained. v0.15.135 no longer assumes one exact title node; it uses a tightly scoped semantic match under \`#data\` plus a child-list replacement observer, while excluding the Patch Notes content itself. One post-v0.15.135 Windows screenshot is required before closing issue #79.\n`;
write('docs/KNOWN_ISSUES.md',known);

write('update/manifest.json',JSON.stringify(manifest,null,2)+'\n');
require('./sync-current-state').sync();
console.log('v0.15.135 release metadata prepared',{version:manifest.version,files:manifest.files.length,next:manual.next_planned_work.version});
