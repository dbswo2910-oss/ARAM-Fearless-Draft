'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(ROOT,p),s,'utf8');

const mp='update/manifest.json';
const m=JSON.parse(read(mp));
if(String(m.version)!=='0.15.122')throw new Error(`v0.15.123 activation requires active v0.15.122, got ${m.version}`);
const replace=(out,source)=>{const row=(m.files||[]).find(x=>x.path===out);if(!row)throw new Error(`manifest anchor missing: ${out}`);row.source=source};
const upsert=(out,source,after)=>{m.files=(m.files||[]).filter(x=>x.path!==out);let i=after?m.files.findIndex(x=>x.path===after):-1;if(i<0)i=m.files.length-1;m.files.splice(i+1,0,{path:out,source})};

m.version='0.15.123';
m.message='v0.15.123 · PATCH NOTES STARTUP NOTICE — per-patch popup, DATA Patch Notes deep-link, explicit do-not-show';
replace('package.json','update/v0.15.123/package.json');
upsert('patch-notes-startup-notice-v015123.js','update/v0.15.123/patch-notes-startup-notice-v015123.js','input-interaction-stability-v01539.js');
upsert('runtime-source-stability-v015123.js','update/v0.15.123/runtime-source-stability-v015123.js','runtime-source-stability-v015122.js');
upsert('main-v015123.js','update/v0.15.123/main-v015123.js','main-v015122.js');
const installed=new Set((m.files||[]).map(x=>x.path));m.delete=(m.delete||[]).filter(x=>!installed.has(x));
write(mp,JSON.stringify(m,null,2)+'\n');

let readme=read('README.md');
readme=readme.replace(/Current app\/update version: \*\*v[^*]+\*\*/,'Current app/update version: **v0.15.123**');
const note='- **v0.15.123**: Startup Patch Notes notice. On launch, show the latest registered ARAM Patch Notes unless that exact patch version was explicitly dismissed. `패치노트 보러가기` routes through the existing DATA owner into Patch Notes; `다시 보지 않기` suppresses only the current patch version so the next Patch Notes release can appear again. Scoring and existing feature owners are unchanged.';
if(!readme.includes('**v0.15.123**: Startup Patch Notes notice'))readme+='\n'+note+'\n';
write('README.md',readme);

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.123**');
const handoffNote=`\n### v0.15.123 — Startup Patch Notes notice\n\nStartup Patch Notes announcement is a one-shot presentation feature injected into the existing input-interaction runtime before the v0.15.117 state-integrity suffix. It reads the registered Patch Notes version from \`window.aramDataHubV01599.patch.version\`, compares it with the exact version stored in \`aram.patchNotes.notice.dismissedVersion.v1\`, and shows the modal only when they differ. \`패치노트 보러가기\` routes through the existing \`ui-stability-v015115\` DATA owner using \`syncData('patch')\`; it does not create another DATA owner. Only the explicit \`다시 보지 않기\` action stores dismissal. A future Patch Notes version therefore becomes eligible automatically. No scoring/RANDOM/Riot Grade/AutoSync logic changes.\n`;
if(!handoff.includes('### v0.15.123 — Startup Patch Notes notice'))handoff+=handoffNote;
write('docs/AI_HANDOFF.md',handoff);

let agents=read('AGENTS.md');
const agentRule=`\n## v0.15.123 Startup Patch Notes notice baseline\n\n- The startup Patch Notes modal is presentation-only and must not become a second DATA layout owner. Route Patch Notes opening through \`window.aramUiStabilityV015115.syncData('patch')\`.\n- Persist \`다시 보지 않기\` by exact Patch Notes version, not by app release version. A future Patch Notes version must be eligible to show again automatically.\n- Closing the modal or choosing \`패치노트 보러가기\` must not silently persist do-not-show state; only the explicit do-not-show action may do that.\n- Keep the startup notice injection before the v0.15.117 state-integrity suffix and do not add MutationObserver/setInterval repair loops.\n- Preserve v0.15.122 Riot Grade accuracy, v0.15.121 RANDOM restore, v0.15.120 DATA owner, v0.15.119 AutoSync concurrency, v0.15.118 lifecycle, v0.15.117 state integrity, and v0.15.79 safety contracts.\n- CI can prove storage/routing/injection contracts, but final popup appearance and DATA navigation require real-Windows confirmation.\n`;
if(!agents.includes('## v0.15.123 Startup Patch Notes notice baseline'))agents+=agentRule;
write('AGENTS.md',agents);

let issues=read('docs/KNOWN_ISSUES.md');
const issueNote=`\n## Startup Patch Notes notice v0.15.123 real-Windows acceptance\n\nThe v0.15.123 startup notice is structurally audited for per-patch persistence and routing through the existing DATA owner, but final Electron acceptance still requires confirming the popup visually and checking that \`패치노트 보러가기\` lands on DATA > 패치노트 in the installed Windows app.\n`;
if(!issues.includes('## Startup Patch Notes notice v0.15.123 real-Windows acceptance'))issues+=issueNote;
write('docs/KNOWN_ISSUES.md',issues);

const cp='docs/continuity-manual.json';
const c=JSON.parse(read(cp));
const plannedBefore=JSON.stringify(c.next_planned_work??null);
if(c.next_planned_work?.theme!=='SAFE MODE / CRASH-LOOP ISOLATION')throw new Error(`v0.15.123 must preserve existing next_planned_work; got ${c.next_planned_work?.theme||'missing'}`);
c.real_world_validation=c.real_world_validation||{};
c.real_world_validation.patch_notes_startup_notice_v015123={
  status:'pending',
  evidence:'CI validates exact per-patch dismissal semantics, one-shot injection, and routing through the existing DATA owner. Real Windows Electron appearance/navigation still needs confirmation.',
  must_verify:[
    'Launch with the current Patch Notes version not dismissed and confirm the startup modal appears once',
    'Choose 패치노트 보러가기 and confirm DATA > 패치노트 opens',
    'Choose 다시 보지 않기, restart, and confirm the same Patch Notes version no longer shows the modal',
    'After a future Patch Notes version is registered, confirm the modal is eligible to appear again despite the older dismissal value'
  ]
};
const backlog=Array.isArray(c.user_reported_backlog_v015120)?c.user_reported_backlog_v015120:[];
let item5=backlog.find(x=>Number(x.order)===5);
if(!item5){item5={order:5,theme:'Startup Patch Notes announcement popup with per-patch do-not-show persistence',status:'not_started'};backlog.push(item5)}
item5.status='code_complete_real_windows_pending';
c.user_reported_backlog_v015120=backlog.sort((a,b)=>Number(a.order)-Number(b.order));
if(JSON.stringify(c.next_planned_work??null)!==plannedBefore)throw new Error('v0.15.123 activation unexpectedly changed next_planned_work');
write(cp,JSON.stringify(c,null,2)+'\n');
console.log('v0.15.123 PATCH NOTES STARTUP NOTICE ACTIVATION FILES: PREPARED');
