'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>{const abs=path.join(ROOT,p);fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,s,'utf8')};

const mp='update/manifest.json';
const m=JSON.parse(read(mp));
const active=String(m.version||'');
if(active!=='0.15.125'&&active!=='0.15.126')throw new Error(`v0.15.126 activation requires active v0.15.125 or v0.15.126, got ${active}`);
const replace=(out,source)=>{const row=(m.files||[]).find(x=>x.path===out);if(!row)throw new Error(`manifest anchor missing: ${out}`);row.source=source};
const upsert=(out,source,after)=>{m.files=(m.files||[]).filter(x=>x.path!==out);let i=after?m.files.findIndex(x=>x.path===after):-1;if(i<0)i=m.files.length-1;m.files.splice(i+1,0,{path:out,source})};

m.version='0.15.126';
m.message='v0.15.126 · MATCH SEARCH LABEL — visible Match Lab naming unified to 전적검색';
replace('package.json','update/v0.15.126/package.json');
upsert('match-search-labels-v015126.js','update/v0.15.126/match-search-labels-v015126.js','patch-notes-startup-notice-v015123.js');
upsert('successor-route-v015126.js','update/v0.15.126/successor-route-v015126.js','successor-route-v015125.js');
upsert('runtime-source-stability-v015126.js','update/v0.15.126/runtime-source-stability-v015126.js','runtime-source-stability-v015125.js');
upsert('main-v015126.js','update/v0.15.126/main-v015126.js','main-v015125.js');
const installed=new Set((m.files||[]).map(x=>x.path));
m.delete=(m.delete||[]).filter(x=>!installed.has(x));
for(const row of m.files||[])if(!String(row.source||'').startsWith('update/'))throw new Error(`unsafe manifest source: ${row.path} -> ${row.source}`);
write(mp,JSON.stringify(m,null,2)+'\n');

let readme=read('README.md');
readme=readme.replace(/Current app\/update version: \*\*v[^*]+\*\*/,'Current app/update version: **v0.15.126**');
const note='- **v0.15.126**: visible `매치 랩` / `매치랩` / `Match Lab` product naming is unified to **`전적검색`** in the top navigation and Match Lab screen titles while preserving internal `match-lab-*` / `history*` identifiers and all history, Riot Grade, AutoSync, RANDOM, DATA, and scoring behavior.';
if(!readme.includes('**v0.15.126**: visible'))readme+='\n'+note+'\n';
write('README.md',readme);

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.126**');
const section='\n### v0.15.126 — 전적검색 visible naming\n\nThe user-facing feature name formerly shown as `매치 랩` / `매치랩` / `Match Lab` is now `전적검색`. This is presentation-only. Internal `match-lab-*`, `historyMatchDetail`, history state/storage, Riot Grade linkage, AutoSync and result-sync identifiers remain unchanged. The label patch is scoped to the exact `#history` view plus the header history navigation, runs only with a bounded startup settle, and adds no MutationObserver or interval repair owner.\n';
if(!handoff.includes('### v0.15.126 — 전적검색 visible naming'))handoff+=section;
write('docs/AI_HANDOFF.md',handoff);

const cp='docs/continuity-manual.json';
const c=JSON.parse(read(cp));
const plannedBefore=JSON.stringify(c.next_planned_work??null);
c.real_world_validation=c.real_world_validation||{};
c.real_world_validation.match_search_label_v015126={
  status:'pending',
  evidence:'CI can prove the label payload is scoped to #history/header and that internal Match Lab/history identifiers and scoring owners are byte-preserved, but final visible wording requires the installed Windows UI.',
  must_verify:[
    'After updating to v0.15.126, confirm the top navigation says 전적검색 instead of 매치 랩/매치랩/Match Lab',
    'Open 전적검색 and confirm any feature title uses 전적검색 while LAB badge styling remains intact if present',
    'Confirm player search, recent matches, match detail, Riot Grade, favorites and result synchronization still work normally'
  ]
};
if(JSON.stringify(c.next_planned_work??null)!==plannedBefore)throw new Error('v0.15.126 activation unexpectedly changed next_planned_work');
write(cp,JSON.stringify(c,null,2)+'\n');
console.log(`v0.15.126 MATCH SEARCH LABEL ACTIVATION: PREPARED from ${active}`);
