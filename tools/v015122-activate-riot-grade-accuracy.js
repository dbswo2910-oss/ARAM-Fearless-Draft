'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(ROOT,p),s,'utf8');

const mp='update/manifest.json';
const m=JSON.parse(read(mp));
if(String(m.version)!=='0.15.121')throw new Error(`v0.15.122 activation requires active v0.15.121, got ${m.version}`);
const replace=(out,source)=>{const row=(m.files||[]).find(x=>x.path===out);if(!row)throw new Error(`manifest anchor missing: ${out}`);row.source=source};
const upsert=(out,source,after)=>{m.files=(m.files||[]).filter(x=>x.path!==out);let i=after?m.files.findIndex(x=>x.path===after):-1;if(i<0)i=m.files.length-1;m.files.splice(i+1,0,{path:out,source})};

m.version='0.15.122';
m.message='v0.15.122 · RIOT GRADE ACCURACY — primary Riot mastery grade only, exact game+champion matching';
replace('riot-grade-collector-v01532.js','update/v0.15.122/riot-grade-collector-v01532.js');
replace('package.json','update/v0.15.122/package.json');
upsert('runtime-source-stability-v015122.js','update/v0.15.122/runtime-source-stability-v015122.js','runtime-source-stability-v015121.js');
upsert('main-v015122.js','update/v0.15.122/main-v015122.js','main-v015121.js');
const installed=new Set((m.files||[]).map(x=>x.path));m.delete=(m.delete||[]).filter(x=>!installed.has(x));
write(mp,JSON.stringify(m,null,2)+'\n');

let readme=read('README.md');
readme=readme.replace(/Current app\/update version: \*\*v[^*]+\*\*/,'Current app/update version: **v0.15.122**');
const note='- **v0.15.122**: Riot Grade accuracy. Collect only the local player primary ChampionMasteryUpdate, ignore nested memberGrades, and connect an actual Riot Grade only when gameId + championId + local account match exactly. Legacy v0.15.121-and-earlier grade rows are retained but excluded from authoritative display/calibration. ROLE/Random scoring is unchanged.';
if(!readme.includes('**v0.15.122**: Riot Grade accuracy'))readme+='\n'+note+'\n';
write('README.md',readme);

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.122**');
const handoffNote=`\n### v0.15.122 — Riot Grade accuracy\n\nThe Riot Grade collector is authoritative only when the LCU value comes from the direct local-player ChampionMasteryUpdate. The collector must not recursively consume \`memberGrades\`; those are other members' grade rows. Authoritative records use \`gradeProvenance: riot-primary-update\`. Match-detail and calibration linkage requires exact local account + gameId + championId. Records captured by v0.15.121 and earlier are migrated to \`legacy-unverified-v015121\` and excluded from authoritative display/calibration until replaced by a new primary record. Never synthesize or infer a Riot S/A/B grade when no authoritative row exists. ROLE/recommendation/Random scoring is unchanged.\n`;
if(!handoff.includes('### v0.15.122 — Riot Grade accuracy'))handoff+=handoffNote;
write('docs/AI_HANDOFF.md',handoff);

let agents=read('AGENTS.md');
const agentRule=`\n## v0.15.122 Riot Grade accuracy baseline\n\n- Treat only the direct LCU ChampionMasteryUpdate grade as the user's actual Riot Grade. \`memberGrades\` are not local-player truth and must never be recursively collected.\n- Authoritative grade rows use \`gradeProvenance: riot-primary-update\`. v0.15.121-and-earlier rows without that provenance are legacy/unverified and may be retained for diagnostics but must not drive displayed Riot Grade or calibration.\n- Link Riot Grade to a match only with local account + canonical gameId + exact championId. If championId is unavailable or no exact authoritative record exists, display no Riot Grade rather than guessing.\n- Riot Grade remains an external validation label only. Do not feed it into ROLE, recommendation, champion, item, or RANDOM scoring without a separate explicit request.\n- Preserve v0.15.121 RANDOM restore, v0.15.120 DATA owner, v0.15.119 AutoSync concurrency, v0.15.118 lifecycle, v0.15.117 state integrity, and v0.15.79 permanent safety contracts.\n- CI proves parser/matching contracts. Final real-world acceptance requires one newly completed League game where the Riot client grade and v0.15.122 card are compared directly.\n`;
if(!agents.includes('## v0.15.122 Riot Grade accuracy baseline'))agents+=agentRule;
write('AGENTS.md',agents);

let issues=read('docs/KNOWN_ISSUES.md');
const issueNote=`\n## Riot Grade mismatch before v0.15.122\n\nBefore v0.15.122 the collector recursively traversed the ChampionMasteryUpdate payload, so nested \`memberGrades\` could be stored under the local account and the match-detail card could choose a same-game row without requiring the played champion. v0.15.122 changes collection to primary-only and requires exact gameId + championId linkage. Historical rows from v0.15.121 and earlier are intentionally treated as unverified; a new real-game comparison is still required before marking the user-reported mismatch fully accepted.\n`;
if(!issues.includes('## Riot Grade mismatch before v0.15.122'))issues+=issueNote;
write('docs/KNOWN_ISSUES.md',issues);

const cp='docs/continuity-manual.json';
const c=JSON.parse(read(cp));
const plannedBefore=JSON.stringify(c.next_planned_work??null);
if(c.next_planned_work?.theme!=='SAFE MODE / CRASH-LOOP ISOLATION')throw new Error(`v0.15.122 must preserve existing next_planned_work; got ${c.next_planned_work?.theme||'missing'}`);
c.real_world_validation=c.real_world_validation||{};
c.real_world_validation.riot_grade_accuracy_v015122={
  status:'pending',
  evidence:'Synthetic LCU parser and exact-link CI prove that memberGrades are excluded and only primary gameId+championId records are authoritative. One newly completed real League game still needs direct client-grade comparison.',
  must_verify:[
    'Finish a new ARAM while v0.15.122 is running and note the Riot client S/A/B grade',
    'Open the same game in Match Lab and confirm Riot Grade is identical',
    'Confirm a teammate grade from the same game never appears as the local Riot Grade',
    'If no authoritative primary row was captured, the app shows no Riot Grade rather than a guessed value'
  ]
};
const backlog=Array.isArray(c.user_reported_backlog_v015120)?c.user_reported_backlog_v015120:[];
let item4=backlog.find(x=>Number(x.order)===4);
if(!item4){item4={order:4,theme:'Riot S/A/B grade calibration against actual Riot grade',status:'not_started'};backlog.push(item4)}
item4.status='code_complete_real_windows_pending';
c.user_reported_backlog_v015120=backlog.sort((a,b)=>Number(a.order)-Number(b.order));
if(JSON.stringify(c.next_planned_work??null)!==plannedBefore)throw new Error('v0.15.122 activation unexpectedly changed next_planned_work');
write(cp,JSON.stringify(c,null,2)+'\n');
console.log('v0.15.122 RIOT GRADE ACCURACY ACTIVATION FILES: PREPARED');
