'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`v0.15.122 audit missing ${label}: ${n}`)};
const mustNot=(src,n,label)=>{if(String(src).includes(n))throw new Error(`v0.15.122 audit forbidden ${label}: ${n}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.122 ${label} parse failed: ${e.message}`)}};
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const report={version:'0.15.122',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const collectorSrc=read('update/v0.15.122/riot-grade-collector-v01532.js');
const rtSrc=read('update/v0.15.122/runtime-source-stability-v015122.js');
const mainSrc=read('update/v0.15.122/main-v015122.js');
const pkg=JSON.parse(read('update/v0.15.122/package.json'));
for(const [name,src] of [['collector',collectorSrc],['runtime successor',rtSrc],['main successor',mainSrc]])parse(src,name);
if(pkg.version!=='0.15.122'||pkg.main!=='main-v015122.js')throw new Error('v0.15.122 package metadata mismatch');
ok('syntax-package');

const collector=require(path.join(ROOT,'update/v0.15.122/riot-grade-collector-v01532.js'));
const payload={gameId:987654321,championId:22,playerId:111,grade:'S',memberGrades:[{championId:99,playerId:222,grade:'A+'},{championId:81,playerId:333,grade:'B'}],levelUpList:[{championId:64,playerId:444,grade:'S+'}]};
const rows=collector.extractPrimaryRows(payload);
if(rows.length!==1)throw new Error(`primary extractor leaked nested grades: ${JSON.stringify(rows)}`);
if(rows[0].championId!==22||rows[0].grade!=='S'||rows[0].gameId!=='987654321')throw new Error('primary extractor selected wrong Riot row');
const envelope=collector.extractPrimaryRows({updates:[payload]});
if(envelope.length!==1||envelope[0].championId!==22)throw new Error('known-envelope primary extraction failed');
if(!collector.trustedRecord({...rows[0],puuid:'p'}))throw new Error('authoritative primary row not trusted');
if(collector.trustedRecord({gameId:'987654321',championId:22,grade:'S'}))throw new Error('legacy/no-provenance row trusted unexpectedly');
ok('primary-vs-memberGrades-parser');

const migrated=collector.migrateLegacyRecords([
  {gameId:'111111',championId:22,grade:'S',puuid:'p'},
  {gameId:'111111',championId:99,grade:'A',puuid:'p'},
  {gameId:'222222',championId:81,grade:'B',puuid:'p'}
]);
if(migrated.changed!==3)throw new Error('legacy migration did not mark every old record');
const ambiguous=migrated.records.filter(r=>r.gameId==='111111');
if(ambiguous.length!==2||ambiguous.some(r=>!r.legacyAmbiguous||r.trustedRiotGrade!==false))throw new Error('legacy multi-champion contamination was not quarantined');
if(migrated.records.some(collector.trustedRecord))throw new Error('legacy migration accidentally created trusted Riot records');
ok('legacy-contamination-quarantine');

for(const [n,l] of [
  ["const envelopes=['updates','championMasteryUpdates','items','data']",'known envelope allowlist'],
  ["gradeProvenance:PRIMARY_PROVENANCE",'authoritative provenance'],
  ["source:'LCU champion-mastery-updates primary'",'primary source label'],
  ["trustedRiotGrade:true",'trusted record stamp'],
  ["trustedRecord(r)&&canonGameId(r.gameId)===s.gameId",'snapshot authoritative filter'],
  ["s.championId!=null&&num(r.championId)===s.championId",'snapshot exact champion match'],
  ["legacy-unverified-v015121",'legacy quarantine provenance'],
  ["score_logic_changed:false",'score neutrality'],
  ["random_scoring_changed:false",'Random score neutrality']
])must(collectorSrc,n,l);
mustNot(collectorSrc,'for(const v of Object.values(x))walk(v,next)','old recursive grade walk');
mustNot(collectorSrc,'memberGrades', 'memberGrades traversal');
// The word memberGrades is allowed in comments explaining the bug, but not as an envelope/traversal expression.
if(/(?:visit|walk)\s*\(\s*x\.memberGrades/.test(collectorSrc))throw new Error('collector traverses memberGrades');
ok('collector-source-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
if(map.size!==(manifest.files||[]).length)throw new Error('manifest duplicate installed path');
for(const f of manifest.files||[])if(!exists(f.source))throw new Error(`manifest source missing: ${f.path} -> ${f.source}`);
const base121=require(path.join(ROOT,'update/v0.15.121/runtime-source-stability-v015121.js'));
const next122=require(path.join(ROOT,'update/v0.15.122/runtime-source-stability-v015122.js'));

const uiSource=map.get('riot-grade-ui-v01528.js');
if(!uiSource||!exists(uiSource))throw new Error('active Riot Grade UI source missing');
const oldUi=base121.patchRuntimeSource('riot-grade-ui-v01528.js',read(uiSource));
const newUi=next122.patchRuntimeSource('riot-grade-ui-v01528.js',read(uiSource));
parse(newUi,'transformed Riot Grade UI');
for(const [n,l] of [
  ["r.gradeProvenance==='riot-primary-update'",'UI provenance gate'],
  ["Number(r.championId)===championId",'UI exact champion match'],
  ["if(!gid||!Number.isFinite(championId))return null",'UI refuses game-only fallback'],
  ["legacy?'이 경기에는 구버전 Grade 기록이 있지만 정확성 검증 대상에서 제외했습니다.'",'legacy warning'],
  ["accuracyVersion:'0.15.122'",'UI accuracy marker']
])must(newUi,n,l);
if(oldUi===newUi)throw new Error('v0.15.122 did not tighten Riot Grade UI');
mustNot(newUi,"find(r=>canon(r.gameId)===gid&&(!puuid",'gameId-only Riot matcher');
ok('riot-grade-ui-exact-match');

const calSource=map.get('riot-grade-calibration-history-v01532.js');
if(!calSource||!exists(calSource))throw new Error('active calibration history source missing');
const oldCal=base121.patchRuntimeSource('riot-grade-calibration-history-v01532.js',read(calSource));
const newCal=next122.patchRuntimeSource('riot-grade-calibration-history-v01532.js',read(calSource));
parse(newCal,'transformed calibration history');
for(const [n,l] of [
  ["function trustedRiotRecord(r)",'calibration trust helper'],
  ["if(s.championId==null)return null",'calibration exact champion requirement'],
  ["trustedRiotRecord(r)&&canon(r?.gameId)===s.gameId",'calibration authoritative matcher'],
  ["if(!trustedRiotRecord(r))return null",'legacy snapshot exclusion'],
  ["eligible=all.filter(r=>trustedRiotRecord(r)", 'authoritative count/filter'],
  ["accuracyVersion:'0.15.122'",'calibration accuracy marker']
])must(newCal,n,l);
if(oldCal===newCal)throw new Error('v0.15.122 did not tighten calibration history');
ok('calibration-authoritative-only');

for(const target of ['runtime-random-practice-v01572.js','random-practice-focus-v01549.js','input-interaction-stability-v01539.js','runtime-live-autosync-v01571.js']){
  const source=map.get(target);if(!source||!exists(source))throw new Error(`active source missing for unchanged target ${target}`);
  const a=base121.patchRuntimeSource(target,read(source)),b=next122.patchRuntimeSource(target,read(source));
  if(a!==b)throw new Error(`v0.15.122 unexpectedly changed ${target}`);
}
ok('random-data-autosync-byte-preserved');

for(const [n,l] of [
  ["require('../v0.15.121/runtime-source-stability-v015121')",'v121 runtime predecessor'],
  ["file==='riot-grade-ui-v01528.js'",'Riot UI transform target'],
  ["file==='riot-grade-calibration-history-v01532.js'",'calibration transform target'],
  ["riot_grade_primary_only:true",'primary-only declaration'],
  ["riot_grade_exact_champion_match:true",'exact match declaration'],
  ["score_logic_changed:false",'runtime scoring neutrality']
])must(rtSrc,n,l);
ok('runtime-successor-contract');

for(const [n,l] of [
  ["path.join(__dirname,'main-v015121.js')",'v121 main predecessor'],
  ["runtime-source-stability-v015122",'v122 runtime route'],
  ["root:'main-v01579.js'",'permanent safety root']
])must(mainSrc,n,l);
ok('main-successor-contract');

const activation=read('tools/v015122-activate-riot-grade-accuracy.js');
for(const [n,l] of [
  ["String(m.version)!=='0.15.121'",'guarded predecessor'],
  ["replace('riot-grade-collector-v01532.js','update/v0.15.122/riot-grade-collector-v01532.js')",'collector remap'],
  ["runtime-source-stability-v015122.js",'runtime successor activation'],
  ["main-v015122.js",'main successor activation'],
  ["item4.status='code_complete_real_windows_pending'",'backlog item 4 status'],
  ["c.next_planned_work?.theme!=='SAFE MODE / CRASH-LOOP ISOLATION'",'continuity plan preservation']
])must(activation,n,l);
ok('activation-contract');

const active=String(manifest.version||'');
if(active==='0.15.122'){
  const expected={
    'riot-grade-collector-v01532.js':'update/v0.15.122/riot-grade-collector-v01532.js',
    'runtime-source-stability-v015122.js':'update/v0.15.122/runtime-source-stability-v015122.js',
    'main-v015122.js':'update/v0.15.122/main-v015122.js',
    'package.json':'update/v0.15.122/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`active v122 manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-v122-manifest');
}else if(active==='0.15.121')ok('preactivation-v121-manifest');
else if(ge(active,'0.15.122'))ok('newer-successor-manifest');
else throw new Error(`unexpected active manifest during v0.15.122 rollout: ${active}`);

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015122-riot-grade-accuracy-report.json'),JSON.stringify({...report,status:'success',activeManifestVersion:active},null,2)+'\n');
console.log('v0.15.122 RIOT GRADE ACCURACY AUDIT: SUCCESS');
