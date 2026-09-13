'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>{const abs=path.join(ROOT,p);fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,s,'utf8')};
const exists=p=>fs.existsSync(path.join(ROOT,p));

const VERSION='0.15.130';
const STATIC_SENTINEL='/* ARAM_RATING_RESEARCH_UI_V015130_STATIC */';
const baseProfile=read('update/v0.15.19/player-profile-v01519.js');
const engine=read('update/v0.15.129/rating-engine-v01.js');
const core=read('update/v0.15.129/research-ui-core.js');
const ui=read('update/v0.15.129/research-ui-devtools.js');
if(!baseProfile.includes('__ARAM_PLAYER_PROFILE_V01519__'))throw new Error('v0.15.130 base player-profile marker missing');
if(!engine.includes('ARAMRatingResearchEngineV01'))throw new Error('v0.15.130 rating engine source invalid');
if(!core.includes('ARAMRatingResearchUICoreV01'))throw new Error('v0.15.130 research UI core source invalid');
if(!ui.includes('aramRatingResearchUIV01'))throw new Error('v0.15.130 research UI source invalid');
if(ui.includes('raw.githubusercontent.com'))throw new Error('v0.15.130 Research UI may not fetch runtime source from GitHub');
const staticProfile=[baseProfile,'',STATIC_SENTINEL,engine,';',core,';',ui,''].join('\n');
write('update/v0.15.130/player-profile-v01519.js',staticProfile);

const mp='update/manifest.json';
const m=JSON.parse(read(mp));
const active=String(m.version||'');
if(active!=='0.15.129'&&active!==VERSION)throw new Error(`v0.15.130 activation requires active v0.15.129 or v0.15.130, got ${active}`);
const replace=(out,source)=>{const row=(m.files||[]).find(x=>x.path===out);if(!row)throw new Error(`manifest anchor missing: ${out}`);row.source=source};
const upsert=(out,source,after)=>{m.files=(m.files||[]).filter(x=>x.path!==out);let i=after?m.files.findIndex(x=>x.path===after):-1;if(i<0)i=m.files.length-1;m.files.splice(i+1,0,{path:out,source})};
const remove=new Set(['runtime-source-stability-v015129.js','rating-engine-v01.js','research-ui-core.js','research-ui-devtools.js']);
m.files=(m.files||[]).filter(x=>!remove.has(x.path));
m.version=VERSION;
m.message='v0.15.130 · RESEARCH UI BOOT HOTFIX — preserve v0.15.128 runtime and bundle Research UI directly in Player Profile';
replace('package.json','update/v0.15.130/package.json');
replace('player-profile-v01519.js','update/v0.15.130/player-profile-v01519.js');
upsert('successor-route-v015130.js','update/v0.15.130/successor-route-v015130.js','successor-route-v015129.js');
upsert('main-v015130.js','update/v0.15.130/main-v015130.js','main-v015129.js');
const installed=new Set(m.files.map(x=>x.path));
m.delete=(m.delete||[]).filter(x=>!installed.has(x));
for(const row of m.files){if(!String(row.source||'').startsWith('update/'))throw new Error(`unsafe manifest source: ${row.path} -> ${row.source}`);if(!exists(row.source))throw new Error(`manifest source missing: ${row.path} -> ${row.source}`)}
write(mp,JSON.stringify(m,null,2)+'\n');

let readme=read('README.md');
readme=readme.replace(/Current app\/update version: \*\*v[^*]+\*\*/,'Current app/update version: **v0.15.130**');
const note='- **v0.15.130**: Research UI boot hotfix. Keeps the proven v0.15.128 runtime-stability policy and bundles the local-only ARAM Rating Research card directly into the Player Profile script instead of introducing the v0.15.129 runtime-patcher layer. This specifically targets the real-Windows report where an attempted v0.15.129 update returned to v0.15.128. Scoring, AutoSync, Match History latency, RANDOM, DATA and item logic are unchanged.';
if(!readme.includes('**v0.15.130**: Research UI boot hotfix'))readme+='\n'+note+'\n';
write('README.md',readme);

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.130**');
const section='\n### v0.15.130 — Research UI boot hotfix\n\nThe first v0.15.129 Research UI release was present in the public update manifest, but the real Windows installation reported v0.15.128 again after attempting the update. The repository alone cannot prove whether that was a probation rollback or another local update failure. v0.15.130 therefore removes the new v0.15.129 runtime-source-stability layer from the active manifest, routes the app version through the already-proven v0.15.128 runtime policy, and statically bundles the same local-only Rating Research engine/UI after the existing Player Profile owner. The update-safety rollback root remains enabled. Real Windows update/relaunch evidence is required before accepting the hotfix.\n';
if(!handoff.includes('### v0.15.130 — Research UI boot hotfix'))handoff+=section;
write('docs/AI_HANDOFF.md',handoff);

const cp='docs/continuity-manual.json';
const c=JSON.parse(read(cp));
const plannedBefore=JSON.stringify(c.next_planned_work??null);
c.real_world_validation=c.real_world_validation||{};
c.real_world_validation.aram_rating_research_ui_v015130={
  status:'pending',
  evidence:'User reported that the first v0.15.129 update attempt still opened as v0.15.128. Public raw manifest was verified as 0.15.129, so v0.15.130 removes the new runtime-patcher layer and reuses the proven v0.15.128 runtime policy while statically bundling Research UI into Player Profile. Exact local rollback cause remains unproven until Windows retry/diagnostics.',
  must_verify:[
    'From the currently installed v0.15.128 app, run update and confirm v0.15.130 is offered/applied',
    'Confirm automatic relaunch remains on v0.15.130 instead of returning to v0.15.128',
    'Open 전적검색 > 플레이어 프로필 and confirm the RESEARCH ARAM 실력 분석 card is visible',
    'Confirm existing 전적검색, RANDOM, DATA, AutoSync and item recommendation screens still operate normally'
  ]
};
if(JSON.stringify(c.next_planned_work??null)!==plannedBefore)throw new Error('v0.15.130 activation unexpectedly changed next_planned_work');
write(cp,JSON.stringify(c,null,2)+'\n');
console.log(`v0.15.130 RESEARCH UI BOOT HOTFIX: PREPARED from ${active}`);
