'use strict';
const fs=require('fs');
const path=require('path');

const CACHE_PATHS=[path.join(__dirname,'aram-build-stats-current.json'),path.resolve(__dirname,'..','..','data','aram-builds','current.json')];
const REMOTE_URL='https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/main/data/aram-builds/current.json';
const FALLBACK_STAT_FN="  function statBuildFor(name){try{const c=typeof byName!=='undefined'?byName?.[name]:null,it=c?.item||{};return{tree:norm(it['기본 트리']||''),source:norm(it['통계 기준']||it['기준']||'앱 기본 DB'),verified:norm(it['통계 검증등급']||'')}}catch{return{tree:'',source:'앱 기본 DB',verified:''}}}";

function countOf(src,needle){return String(src).split(needle).length-1}
function readCache(){
  const p=CACHE_PATHS.find(x=>fs.existsSync(x));if(!p)throw new Error('v0.15.125 bundled ARAM cache missing');
  const x=JSON.parse(fs.readFileSync(p,'utf8'));
  const rows=Object.values(x?.champions||{});
  if(x?.mode!=='ARAM'||!Array.isArray(x?.excludes)||!x.excludes.includes('ARAM_MAYHEM')||rows.length<170)throw new Error('v0.15.125 bundled ARAM cache contract invalid');
  return x;
}
function rendererPatch(cache){
  const embedded=JSON.stringify(cache).replace(/</g,'\\u003c');
  return `  // v0.15.125 ARAM statistical build cache.\n  // The HUD reads the bundled cache synchronously, then checks the repository cache once per app session.\n  // It never blocks or polls the live game loop on a statistics website.\n  const aramBuildStatsEmbeddedV015125=${embedded};\n  let aramBuildStatsActiveV015125=aramBuildStatsEmbeddedV015125;\n  let aramBuildStatsByNameV015125=new Map();\n  let aramBuildStatsRefreshStartedV015125=false;\n  function aramBuildStatsKeyV015125(s){return norm(s||'').toLowerCase().replace(/[\\s.'’_-]+/g,'')}\n  function aramBuildStatsValidV015125(x){try{const rows=Object.values(x?.champions||{});return x?.mode==='ARAM'&&Array.isArray(x?.excludes)&&x.excludes.includes('ARAM_MAYHEM')&&rows.length>=170&&rows.every(r=>r&&r.championId&&Array.isArray(r.coreNames)&&r.coreNames.length>=2&&norm(r.tree||''))}catch{return false}}\n  function aramBuildPatchRankV015125(v){const m=String(v||'').match(/^(\\d+)\\.(\\d+)/);return m?(Number(m[1])*100+Number(m[2])):0}\n  function aramBuildStatsIndexV015125(x){const m=new Map();for(const r of Object.values(x?.champions||{})){for(const n of [r?.name,r?.nameEn,r?.slug]){const k=aramBuildStatsKeyV015125(n);if(k&&!m.has(k))m.set(k,r)}}return m}\n  function aramBuildStatsApplyV015125(x){if(!aramBuildStatsValidV015125(x))return false;if(aramBuildPatchRankV015125(x.canonicalPatch)<aramBuildPatchRankV015125(aramBuildStatsActiveV015125?.canonicalPatch))return false;aramBuildStatsActiveV015125=x;aramBuildStatsByNameV015125=aramBuildStatsIndexV015125(x);return true}\n  function aramBuildStatsDateV015125(x){const raw=String(x?.providerAnalyzedAt||x?.generatedAt||'');const m=raw.match(/\\d{4}-\\d{2}-\\d{2}/);return m?m[0]:'날짜 확인 중'}\n  function aramBuildStatsSourceV015125(x){return 'OP.GG ARAM · '+norm(x?.canonicalPatch||'현재')+' · 갱신 '+aramBuildStatsDateV015125(x)}\n  function ensureAramBuildStatsFreshV015125(){\n    if(aramBuildStatsRefreshStartedV015125)return;aramBuildStatsRefreshStartedV015125=true;\n    try{\n      const f=(typeof fetch==='function')?fetch:null;if(!f)return;\n      f('${REMOTE_URL}',{cache:'no-store'}).then(r=>r?.ok?r.json():Promise.reject(new Error('http '+(r?.status||0)))).then(x=>{const before=aramBuildStatsActiveV015125;if(aramBuildStatsApplyV015125(x)&&before!==aramBuildStatsActiveV015125){try{render(true)}catch{}}}).catch(()=>{});\n    }catch{}\n  }\n  aramBuildStatsApplyV015125(aramBuildStatsEmbeddedV015125);\n  function statBuildFor(name){\n    try{\n      ensureAramBuildStatsFreshV015125();\n      const row=aramBuildStatsByNameV015125.get(aramBuildStatsKeyV015125(name));\n      if(row&&norm(row.tree||''))return{tree:norm(row.tree),source:aramBuildStatsSourceV015125(aramBuildStatsActiveV015125),verified:'자동 갱신',provider:'OP.GG',patch:norm(aramBuildStatsActiveV015125?.canonicalPatch||''),updated:norm(aramBuildStatsActiveV015125?.providerAnalyzedAt||aramBuildStatsActiveV015125?.generatedAt||''),starterNames:Array.isArray(row.starterNames)?row.starterNames:[],bootsName:norm(row.bootsName||''),popularNames:Array.isArray(row.popularNames)?row.popularNames:[],topCorePickRate:num(row.topCorePickRate)};\n      const c=typeof byName!=='undefined'?byName?.[name]:null,it=c?.item||{};return{tree:norm(it['기본 트리']||''),source:norm(it['통계 기준']||it['기준']||'앱 기본 DB'),verified:norm(it['통계 검증등급']||'')}\n    }catch{return{tree:'',source:'앱 기본 DB',verified:''}}\n  }`;
}
function patchCoach(src){
  const cache=readCache();
  const n=countOf(src,FALLBACK_STAT_FN);
  if(n!==1)throw new Error(`v0.15.125 statBuildFor contract mismatch count=${n}`);
  return src.replace(FALLBACK_STAT_FN,rendererPatch(cache));
}
module.exports={patchCoach,readCache,REMOTE_URL,score_logic_changed:false,random_scoring_changed:false,item_recommendation_logic_changed:true,policy_version:'0.15.125'};
