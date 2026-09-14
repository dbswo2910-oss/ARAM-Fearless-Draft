'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const PRIMARY_PROVENANCE='riot-primary-update';
const LEGACY_PROVENANCE='legacy-unverified-v015121';
const STORE_SCHEMA=3;
const MAX_RECORDS=600;
const str=v=>v==null?'':String(v);
const num=(v,d=null)=>{const n=Number(v);return Number.isFinite(n)?n:d};
function normGrade(v){let s=str(v).trim().toUpperCase().replace(/\s+/g,'').replace(/_/g,'');s=s.replace(/PLUS/g,'+').replace(/MINUS/g,'-');if(/^S\+?$/.test(s)||/^S-$/.test(s)||/^A[+-]?$/.test(s)||/^B[+-]?$/.test(s)||/^C[+-]?$/.test(s)||/^D[+-]?$/.test(s))return s;return''}
function canonGameId(v){const s=str(v).trim();if(!s)return'';const m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s}
function extractPrimaryRows(root){
  const out=[],seen=new Set(),envelopes=['updates','championMasteryUpdates','items','data'];
  function visit(x){
    if(x==null||typeof x!=='object'||seen.has(x))return;seen.add(x);
    if(Array.isArray(x)){for(const v of x)visit(v);return}
    const grade=normGrade(x.grade??x.championGrade??x.masteryGrade),championId=num(x.championId??x.championID),gameId=canonGameId(x.gameId??x.gameID),playerId=num(x.playerId??x.summonerId);
    if(grade&&championId!==null)out.push({grade,gameId,championId,playerId,queueId:num(x.queueId??x.queueID),gameMode:str(x.gameMode),gradeProvenance:PRIMARY_PROVENANCE});
    for(const key of envelopes)if(x[key]!=null)visit(x[key]);
  }
  visit(root);
  const uniq=new Map();for(const r of out){const key=`${r.gameId}|${r.championId??''}|${r.playerId??''}|${r.grade}`;if(!uniq.has(key))uniq.set(key,r)}return[...uniq.values()];
}
function trustedRecord(r){return!!(r&&r.gradeProvenance===PRIMARY_PROVENANCE&&normGrade(r.grade)&&canonGameId(r.gameId)&&num(r.championId)!==null)}
function migrateLegacyRecords(input){
  const rows=Array.isArray(input)?input.map(r=>r&&typeof r==='object'?{...r}:r).filter(r=>r&&typeof r==='object'):[],groups=new Map();
  for(const r of rows){const gid=canonGameId(r.gameId),p=str(r.puuid);if(!gid)continue;const key=`${p}|${gid}`;(groups.get(key)||groups.set(key,[]).get(key)).push(r)}
  let changed=0,ambiguous=0;
  for(const r of rows){if(r.gradeProvenance)continue;const gid=canonGameId(r.gameId),group=gid?groups.get(`${str(r.puuid)}|${gid}`)||[]:[],champions=new Set(group.map(x=>num(x.championId)).filter(x=>x!==null));r.gradeProvenance=LEGACY_PROVENANCE;r.legacyAmbiguous=champions.size>1;r.trustedRiotGrade=false;if(r.legacyAmbiguous){ambiguous++;if(r.roleSnapshot)r.roleSnapshot={...r.roleSnapshot,legacyGradeUntrusted:true}}changed++}
  return{records:rows,changed,ambiguous};
}
function validStore(x){if(!x||typeof x!=='object'||Array.isArray(x)||!Array.isArray(x.records)||x.records.length>1000)return false;for(const r of x.records){if(!r||typeof r!=='object'||Array.isArray(r))return false;if(r.grade!=null&&String(r.grade).length>12)return false;if(r.roleSnapshot!=null&&(typeof r.roleSnapshot!=='object'||Array.isArray(r.roleSnapshot)))return false}return true}
module.exports={IMPLEMENTATION_VERSION,PRIMARY_PROVENANCE,LEGACY_PROVENANCE,STORE_SCHEMA,MAX_RECORDS,normGrade,canonGameId,extractPrimaryRows,trustedRecord,migrateLegacyRecords,validStore,production_active:false,score_logic_changed:false,random_scoring_changed:false};
