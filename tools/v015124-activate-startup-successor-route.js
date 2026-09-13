'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(ROOT,p),s,'utf8');

const mp='update/manifest.json';
const m=JSON.parse(read(mp));
if(String(m.version)!=='0.15.123')throw new Error(`v0.15.124 activation requires active v0.15.123, got ${m.version}`);
const replace=(out,source)=>{const row=(m.files||[]).find(x=>x.path===out);if(!row)throw new Error(`manifest anchor missing: ${out}`);row.source=source};
const upsert=(out,source,after)=>{m.files=(m.files||[]).filter(x=>x.path!==out);let i=after?m.files.findIndex(x=>x.path===after):-1;if(i<0)i=m.files.length-1;m.files.splice(i+1,0,{path:out,source})};

m.version='0.15.124';
m.message='v0.15.124 · STARTUP RECOVERY HOTFIX — repair v0.15.123 main successor route and add boot smoke coverage';
replace('package.json','update/v0.15.124/package.json');
upsert('successor-route-hotfix-v015124.js','update/v0.15.124/successor-route-hotfix-v015124.js','main-v015123.js');
upsert('runtime-source-stability-v015124.js','update/v0.15.124/runtime-source-stability-v015124.js','runtime-source-stability-v015123.js');
upsert('main-v015124.js','update/v0.15.124/main-v015124.js','main-v015123.js');
const installed=new Set((m.files||[]).map(x=>x.path));m.delete=(m.delete||[]).filter(x=>!installed.has(x));
write(mp,JSON.stringify(m,null,2)+'\n');

let readme=read('README.md');
readme=readme.replace(/Current app\/update version: \*\*v[^*]+\*\*/,'Current app/update version: **v0.15.124**');
const note='- **v0.15.124**: Startup recovery hotfix. Repairs the v0.15.123 main-process successor-route crash by routing boot from the known-good v0.15.122 entry through a tested route transformer while preserving the v0.15.123 Patch Notes runtime. Adds an actual predecessor-route smoke audit so this class of main-process boot failure is not accepted by syntax-only CI again.';
if(!readme.includes('**v0.15.124**: Startup recovery hotfix'))readme+='\n'+note+'\n';
write('README.md',readme);

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.124**');
const h='\n### v0.15.124 — Startup successor-route recovery hotfix\n\nv0.15.123 could crash before Electron UI creation because its main successor wrapper exact-matched an escaped nested route string that did not exist in the installed predecessor source. v0.15.124 boots from the known-good `main-v015122.js`, applies a tested unique route-fragment transform to v0.15.124, and keeps the v0.15.123 Patch Notes behavior through `runtime-source-stability-v015124 -> v015123`. The audit executes the exact transform against the real v0.15.122 predecessor source; syntax-only checking is no longer considered sufficient for successor main wrappers.\n';
if(!handoff.includes('### v0.15.124 — Startup successor-route recovery hotfix'))handoff+=h;
write('docs/AI_HANDOFF.md',handoff);

let agents=read('AGENTS.md');
const a='\n## v0.15.124 Main successor boot-smoke rule\n\n- Never accept a new `main-v*` successor wrapper from `new Function`/syntax checks alone. Execute the exact successor transform against the real predecessor source and require exactly one route match.\n- For recovery from the v0.15.123 crash, `main-v015124.js` intentionally uses `main-v015122.js` as its runtime recovery base while preserving v0.15.123 presentation behavior through the runtime-source-stability chain.\n- Do not reintroduce nested escaped-string exact matching for successor routes. Match a small unique semantic route fragment and assert cardinality equals one.\n';
if(!agents.includes('## v0.15.124 Main successor boot-smoke rule'))agents+=a;
write('AGENTS.md',agents);

let issues=read('docs/KNOWN_ISSUES.md');
const i='\n## v0.15.123 main-process successor-route crash\n\nObserved on real Windows after v0.15.123 activation: `main-v015123.js` threw `v0.15.123 main successor contract mismatch: v0.15.122 route missing` before UI creation. Root cause was brittle exact matching of an escaped nested route string; CI had only parsed the wrapper. v0.15.124 replaces that boot path with a tested predecessor-route transform. Real-Windows relaunch is still required to close acceptance.\n';
if(!issues.includes('## v0.15.123 main-process successor-route crash'))issues+=i;
write('docs/KNOWN_ISSUES.md',issues);

const cp='docs/continuity-manual.json';
const c=JSON.parse(read(cp));
const plannedBefore=JSON.stringify(c.next_planned_work??null);
c.real_world_validation=c.real_world_validation||{};
c.real_world_validation.startup_recovery_v015124={
  status:'pending',
  evidence:'Repository CI now executes the exact successor route transform against the real v0.15.122 predecessor source. The user supplied a real Windows screenshot proving v0.15.123 crashed before UI creation; v0.15.124 must be relaunched on Windows to confirm recovery.',
  must_verify:[
    'Launch/update to v0.15.124 and confirm the JavaScript main-process error no longer appears',
    'Confirm the application reaches its normal UI',
    'Confirm the Patch Notes startup notice can appear and 패치노트 보러가기 still opens DATA > 패치노트'
  ]
};
const backlog=Array.isArray(c.user_reported_backlog_v015120)?c.user_reported_backlog_v015120:[];
const item5=backlog.find(x=>Number(x.order)===5);if(item5)item5.status='code_complete_real_windows_pending';
if(JSON.stringify(c.next_planned_work??null)!==plannedBefore)throw new Error('v0.15.124 activation unexpectedly changed next_planned_work');
write(cp,JSON.stringify(c,null,2)+'\n');
console.log('v0.15.124 STARTUP RECOVERY ACTIVATION FILES: PREPARED');
