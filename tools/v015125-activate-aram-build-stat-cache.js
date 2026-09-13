'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(ROOT,p),s,'utf8');

const mp='update/manifest.json';
const m=JSON.parse(read(mp));
if(String(m.version)!=='0.15.124')throw new Error(`v0.15.125 activation requires active v0.15.124, got ${m.version}`);
const replace=(out,source)=>{const row=(m.files||[]).find(x=>x.path===out);if(!row)throw new Error(`manifest anchor missing: ${out}`);row.source=source};
const upsert=(out,source,after)=>{m.files=(m.files||[]).filter(x=>x.path!==out);let i=after?m.files.findIndex(x=>x.path===after):-1;if(i<0)i=m.files.length-1;m.files.splice(i+1,0,{path:out,source})};

m.version='0.15.125';
m.message='v0.15.125 · ARAM BUILD STAT CACHE — 173-champion current standard-ARAM statistical baselines with automatic patch refresh';
replace('package.json','update/v0.15.125/package.json');
upsert('aram-build-stats-current.json','data/aram-builds/current.json','build-analysis-logic-v01586.js');
upsert('aram-build-stat-runtime-v015125.js','update/v0.15.125/aram-build-stat-runtime-v015125.js','aram-build-stats-current.json');
upsert('successor-route-v015125.js','update/v0.15.125/successor-route-v015125.js','successor-route-hotfix-v015124.js');
upsert('runtime-source-stability-v015125.js','update/v0.15.125/runtime-source-stability-v015125.js','runtime-source-stability-v015124.js');
upsert('main-v015125.js','update/v0.15.125/main-v015125.js','main-v015124.js');
const installed=new Set((m.files||[]).map(x=>x.path));m.delete=(m.delete||[]).filter(x=>!installed.has(x));
write(mp,JSON.stringify(m,null,2)+'\n');

let readme=read('README.md');
readme=readme.replace(/Current app\/update version: \*\*v[^*]+\*\*/,'Current app/update version: **v0.15.125**');
const note='- **v0.15.125**: ARAM Build Stat Cache. Replaces stale embedded RANDOM in-game statistical baseline item trees with a complete 173-champion standard-ARAM cache generated from current OP.GG ARAM structured statistics, with explicit source/patch/refresh-date display, bundled offline fallback, and one-shot non-blocking repository refresh for future patches. ARAM Mayhem is excluded. RANDOM composition scoring, ROLE scoring, AutoSync, DATA ownership, and Riot Grade logic are unchanged.';
if(!readme.includes('**v0.15.125**: ARAM Build Stat Cache'))readme+='\n'+note+'\n';
write('README.md',readme);

let handoff=read('docs/AI_HANDOFF.md');
handoff=handoff.replace(/- Active updater version: \*\*v[^*]+\*\*/,'- Active updater version: **v0.15.125**');
const h='\n### v0.15.125 — ARAM statistical build cache\n\nRANDOM in-game `통계 사이트 기본 빌드` no longer trusts the old embedded champion `item[기본 트리]` as its primary source. `tools/aram-build-stats-refresh.js` collects all standard-ARAM champions from the OP.GG structured ARAM endpoint, resolves current item IDs through Riot Data Dragon, and writes `data/aram-builds/current.json`. The initial 26.18 cache contains 173 champions and excludes ARAM Mayhem. At runtime, `random-ingame-coach-v01550.js` is patched only at `statBuildFor`: it uses the bundled cache synchronously and performs at most one non-blocking fetch of the repository cache per app session, then falls back to the historical embedded DB if validation fails. The v0.15.81 current-match item engine still consumes the statistical tree as a baseline, so item recommendations benefit from corrected current ARAM cores without changing RANDOM champion/composition score.\n';
if(!handoff.includes('### v0.15.125 — ARAM statistical build cache'))handoff+=h;
write('docs/AI_HANDOFF.md',handoff);

let agents=read('AGENTS.md');
const a='\n## v0.15.125 ARAM statistical baseline ownership\n\n- `runtime-source-stability-v015125.js` owns only the RANDOM in-game statistical baseline source used by `statBuildFor` in `random-ingame-coach-v01550.js`. Do not move RANDOM composition/champion scoring, ROLE scoring, DATA view ownership, AutoSync ownership, or Riot Grade logic into this layer.\n- The primary data artifact is `data/aram-builds/current.json`: standard ARAM only; `ARAM_MAYHEM` must remain explicitly excluded; a publishable cache must cover the full current roster (170+ and 173 at the initial 26.18 release).\n- Do not fetch OP.GG or another statistics provider in the live render loop. Use bundled cache synchronously; an external freshness check may run once per app session and must fail closed to the bundled/embedded fallback.\n- Provider patch labels may use Riot static-data numbering (for example OP.GG/Data Dragon 16.18) while the public client patch is 26.18. Treat the +10 major alias as equivalent only when the minor version matches.\n- New main successors must continue the v0.15.124 boot-smoke rule: transform the known-good v0.15.122 entry and execute the exact successor transform in CI.\n';
if(!agents.includes('## v0.15.125 ARAM statistical baseline ownership'))agents+=a;
write('AGENTS.md',agents);

let issues=read('docs/KNOWN_ISSUES.md');
const i='\n## Historical RANDOM statistical baseline drift (v0.15.124 and earlier)\n\n`통계 사이트 기본 빌드` previously read `item[기본 트리]` from the embedded champion database. Those rows were not automatically refreshed per live ARAM patch and could diverge substantially from current Howling Abyss builds. v0.15.125 changes the primary source to a validated 173-champion standard-ARAM cache generated from OP.GG structured ARAM data, with source/patch/date provenance and a bundled fallback. Real-Windows visual acceptance is still required for the Build tab and representative champions.\n';
if(!issues.includes('## Historical RANDOM statistical baseline drift'))issues+=i;
write('docs/KNOWN_ISSUES.md',issues);

const cp='docs/continuity-manual.json';
const c=JSON.parse(read(cp));
const plannedBefore=JSON.stringify(c.next_planned_work??null);
c.real_world_validation=c.real_world_validation||{};
c.real_world_validation.aram_build_stat_cache_v015125={
  status:'pending',
  evidence:'CI validates 173 standard-ARAM rows, current patch/source provenance, Ahri current-core sanity, one-shot remote refresh, embedded fallback, v0.15.81 gate preservation, and byte-neutral outputs for RANDOM scoring/DATA/AutoSync/Riot Grade targets.',
  must_verify:[
    'Update/relaunch on Windows and confirm v0.15.125 reaches the normal UI',
    'Open RANDOM > in-game Build and confirm 통계 사이트 기본 빌드 shows OP.GG ARAM, public patch, and refresh date',
    'Spot-check Ahri plus several tank/marksman/support champions against current standard ARAM statistics',
    'Confirm current-match optimized build still changes with enemy threat while the statistical baseline remains the reference path'
  ]
};
if(JSON.stringify(c.next_planned_work??null)!==plannedBefore)throw new Error('v0.15.125 activation unexpectedly changed next_planned_work');
write(cp,JSON.stringify(c,null,2)+'\n');
console.log('v0.15.125 ARAM BUILD STAT CACHE ACTIVATION FILES: PREPARED');
