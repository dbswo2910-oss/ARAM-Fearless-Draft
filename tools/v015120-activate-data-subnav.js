'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(ROOT,p),s,'utf8');

const mp='update/manifest.json';
const m=JSON.parse(read(mp));
if(String(m.version)!=='0.15.119')throw new Error(`v0.15.120 activation requires active v0.15.119, got ${m.version}`);
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
m.version='0.15.120';
m.message='v0.15.120 · DATA SUBMENU RESTORE — Patch Notes again owns the full DATA workspace';
replace('ui-stability-baseline-v015115.js','update/v0.15.120/ui-stability-baseline-v015115.js');
replace('runtime-loader-v01579.js','update/v0.15.120/runtime-loader-v01579.js');
replace('package.json','update/v0.15.120/package.json');
upsert('runtime-source-stability-v015120.js','update/v0.15.120/runtime-source-stability-v015120.js','runtime-source-stability-v015119.js');
upsert('main-v015120.js','update/v0.15.120/main-v015120.js','main-v015119.js');
const installed=new Set((m.files||[]).map(x=>x.path));
m.delete=(m.delete||[]).filter(x=>!installed.has(x));
write(mp,JSON.stringify(m,null,2)+'\n');

let readme=read('README.md');
readme=readme.replace(/Current app\/update version: \*\*v[^*]+\*\*/,'Current app/update version: **v0.15.120**');
const note='- **v0.15.120**: DATA Patch Notes submenu restore. `챔피언 티어리스트 | 패치노트` is again a DATA-wide second navigation. Patch Notes hides the tier browser and spans the workspace. RANDOM, Riot grades, history sync, AutoSync and scoring are unchanged.';
if(!readme.includes('DATA Patch Notes submenu restore'))readme+='\n'+note+'\n';
write('README.md',readme);

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.120**');
const handoffNote=`\n### v0.15.120 — DATA Patch Notes submenu restore\n\nThe existing \`ui-stability-v015115\` DATA owner remains authoritative. v0.15.120 is a maintained owner revision, not a new overlay. DATA host discovery resolves the role-tier panel and exact \`#dataCard\` from their nearest shared ancestor inside exact \`#data\`; \`#dataHubTopNavV015115\` lives inside that common host and spans the workspace. Patch Notes hides the tier branch while the detail branch spans the workspace. v0.15.117 state-integrity and v0.15.118 lifecycle payloads are preserved. RANDOM, Riot grades, history sync, AutoSync and scoring are unchanged. Final visual acceptance requires a post-v0.15.120 Windows screenshot.\n`;
if(!handoff.includes('### v0.15.120 — DATA Patch Notes submenu restore'))handoff+=handoffNote;
write('docs/AI_HANDOFF.md',handoff);

let agents=read('AGENTS.md');
const agentRule=`\n## v0.15.120 DATA submenu baseline\n\n- DATA presentation is still owned by \`ui-stability-v015115\`; v0.15.120 is a maintained owner revision, not a competing overlay.\n- Discover the role-tier branch only inside exact \`#data\`, then resolve its nearest common ancestor with exact \`#dataCard\`. Never restore document-wide panel-title discovery.\n- \`#dataHubTopNavV015115\` belongs inside that common host and spans all host columns. In Patch Notes mode, hide the tier branch and let the detail/Patch Notes branch span the workspace.\n- Do not restore \`card.closest('.grid2')\` as the DATA host shortcut; the Windows screenshot proved it can resolve the right/detail sub-grid and strand the tier browser on the left.\n- Do not reactivate v0.15.103-v0.15.114 UI overlays. RANDOM, Riot-grade, history-sync, AutoSync and scoring are outside v0.15.120 scope.\n- CI proves structure/regression contracts, not final Electron appearance. Require post-update Windows evidence before visual acceptance.\n`;
if(!agents.includes('## v0.15.120 DATA submenu baseline'))agents+=agentRule;
write('AGENTS.md',agents);

const cp='docs/continuity-manual.json';
const c=JSON.parse(read(cp));
c.real_world_validation=c.real_world_validation||{};
c.real_world_validation.data_patch_notes_subnav_v015120={
  status:'pending',
  evidence:'Repository structural/regression audits can validate ownership and routing, but a post-v0.15.120 real-Windows screenshot is still required for visual acceptance.',
  must_verify:[
    'DATA submenu spans the full tier/detail workspace rather than only the right detail column',
    'Patch Notes hides the role-tier browser and uses the full DATA workspace',
    'Champion Tier List restores the normal tier/detail split',
    'Patch Notes champion cards remain compact and readable'
  ]
};
c.user_reported_backlog_v015120=[
  {order:2,theme:'RANDOM Practice restore',status:'not_started'},
  {order:3,theme:'Match-history / Random result recent-match sync latency',status:'not_started'},
  {order:4,theme:'Riot S/A/B grade calibration against actual Riot grade',status:'not_started'},
  {order:5,theme:'Startup Patch Notes announcement popup with per-patch do-not-show persistence',status:'not_started'}
];
c.next_planned_work={
  version:'0.15.121',
  theme:'RANDOM PRACTICE RESTORE',
  status:'planned',
  intent:'Investigate the screenshot-confirmed Random Practice regression without changing recommendation/scoring unless explicitly required.',
  guardrails:[
    'preserve v0.15.115 single-owner UI and v0.15.120 DATA submenu contract',
    'preserve v0.15.116 transactional rollback',
    'preserve v0.15.117 state integrity',
    'preserve v0.15.118 lifecycle disposal',
    'preserve v0.15.119 AutoSync concurrency guards',
    'do not change recommendation or Random scoring unless explicitly requested'
  ]
};
write(cp,JSON.stringify(c,null,2)+'\n');
console.log('v0.15.120 DATA SUBNAV ACTIVATION FILES: PREPARED');
