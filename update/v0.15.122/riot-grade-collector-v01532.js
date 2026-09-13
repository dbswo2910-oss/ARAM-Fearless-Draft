'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
let integrity;
try{integrity=require('../v0.15.117/state-integrity-v015117')}catch{integrity=require('./state-integrity-v015117')}

const ENDPOINT='/lol-end-of-game/v1/champion-mastery-updates';
const EOG_ENDPOINT='/lol-end-of-game/v1/eog-stats-block';
const MAX_RECORDS=600;
const SNAPSHOT_SCHEMA=1;
const STORE_SCHEMA=3;
const PRIMARY_PROVENANCE='riot-primary-update';
const LEGACY_PROVENANCE='legacy-unverified-v015121';
const str=v=>v==null?'':String(v);
const num=(v,d=null)=>{const n=Number(v);return Number.isFinite(n)?n:d};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function normGrade(v){let s=str(v).trim().toUpperCase().replace(/\s+/g,'').replace(/_/g,'');s=s.replace(/PLUS/g,'+').replace(/MINUS/g,'-');if(/^S\+?$/.test(s)||/^S-$/.test(s)||/^A[+-]?$/.test(s)||/^B[+-]?$/.test(s)||/^C[+-]?$/.test(s)||/^D[+-]?$/.test(s))return s;return''}
function canonGameId(v){const s=str(v).trim();if(!s)return'';const m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s}
function deepFirst(root,keys){const seen=new Set(),want=new Set(keys.map(String));let hit=null;function walk(x){if(hit!==null||x==null||typeof x!=='object'||seen.has(x))return;seen.add(x);if(!Array.isArray(x))for(const k of Object.keys(x))if(want.has(k)&&x[k]!==undefined&&x[k]!==null&&str(x[k]).trim()){hit=x[k];return}for(const v of Array.isArray(x)?x:Object.values(x)){walk(v);if(hit!==null)return}}walk(root);return hit}

/*
 * The LCU ChampionMasteryUpdate object contains the local player's direct
 * grade/championId/gameId and can also contain memberGrades for teammates.
 * Older collectors recursively walked every nested grade and therefore could
 * assign teammate grades to the local account. v0.15.122 only accepts direct
 * primary update objects and traverses known envelope containers; memberGrades
 * and other nested grade-bearing structures are intentionally never walked.
 */
function extractPrimaryRows(root){
  const out=[],seen=new Set();
  const envelopes=['updates','championMasteryUpdates','items','data'];
  function visit(x){
    if(x==null||typeof x!=='object'||seen.has(x))return;seen.add(x);
    if(Array.isArray(x)){for(const v of x)visit(v);return}
    const grade=normGrade(x.grade??x.championGrade??x.masteryGrade);
    const championId=num(x.championId??x.championID);
    const gameId=canonGameId(x.gameId??x.gameID);
    const playerId=num(x.playerId??x.summonerId);
    if(grade&&championId!==null){
      out.push({grade,gameId,championId,playerId,queueId:num(x.queueId??x.queueID),gameMode:str(x.gameMode),gradeProvenance:PRIMARY_PROVENANCE});
    }
    for(const key of envelopes){if(x[key]!=null)visit(x[key])}
  }
  visit(root);
  const uniq=new Map();
  for(const r of out){const k=`${r.gameId}|${r.championId??''}|${r.playerId??''}|${r.grade}`;if(!uniq.has(k))uniq.set(k,r)}
  return [...uniq.values()];
}

function trustedRecord(r){return !!(r&&r.gradeProvenance===PRIMARY_PROVENANCE&&normGrade(r.grade)&&canonGameId(r.gameId)&&num(r.championId)!==null)}
function migrateLegacyRecords(input){
  const rows=Array.isArray(input)?input.map(r=>r&&typeof r==='object'?{...r}:r).filter(r=>r&&typeof r==='object'):[];
  const groups=new Map();
  for(const r of rows){const gid=canonGameId(r.gameId),p=str(r.puuid);if(!gid)continue;const k=`${p}|${gid}`;(groups.get(k)||groups.set(k,[]).get(k)).push(r)}
  let changed=0,ambiguous=0;
  for(const r of rows){
    if(r.gradeProvenance)continue;
    const gid=canonGameId(r.gameId),g=gid?groups.get(`${str(r.puuid)}|${gid}`)||[]:[];
    const champions=new Set(g.map(x=>num(x.championId)).filter(x=>x!==null));
    r.gradeProvenance=LEGACY_PROVENANCE;
    r.legacyAmbiguous=champions.size>1;
    r.trustedRiotGrade=false;
    if(r.legacyAmbiguous){ambiguous++;if(r.roleSnapshot)r.roleSnapshot={...r.roleSnapshot,legacyGradeUntrusted:true}}
    changed++;
  }
  return{records:rows,changed,ambiguous};
}
function safeJsonRead(file){try{const x=JSON.parse(fs.readFileSync(file,'utf8'));return x&&typeof x==='object'?x:null}catch{return null}}
function atomicWrite(file,data){const tmp=`${file}.tmp-${process.pid}`;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(tmp,JSON.stringify(data,null,2),'utf8');try{fs.renameSync(tmp,file)}catch{try{fs.unlinkSync(file)}catch{}fs.renameSync(tmp,file)}}
function validStore(x){if(!x||typeof x!=='object'||Array.isArray(x)||!Array.isArray(x.records)||x.records.length>1000)return false;for(const r of x.records){if(!r||typeof r!=='object'||Array.isArray(r))return false;if(r.grade!=null&&String(r.grade).length>12)return false;if(r.roleSnapshot!=null&&(typeof r.roleSnapshot!=='object'||Array.isArray(r.roleSnapshot)))return false}return true}
function storePath(app){try{return path.join(app.getPath('userData'),'riot-grade-v01528.json')}catch{return path.join(process.cwd(),'riot-grade-v01528.json')}}

function createCollector(core,{app,intervalMs=5000}={}){
  if(!core)throw new Error('core required');
  const file=storePath(app),guardOpts={name:'riot-grade-v01528',validator:validStore,maxBytes:8*1024*1024};
  const initialIntegrity=integrity.guardExternalJson(file,guardOpts);
  const stopWatch=integrity.watchExternalJson(file,guardOpts);
  let timer=null,busy=false,loaded=false,stopped=false,records=[];
  const status={running:false,lastPollAt:0,lastSuccessAt:0,lastCaptureAt:0,lastSnapshotAt:0,lastError:'',lastResult:'대기',endpoint:ENDPOINT,records:0,snapshots:0,trustedRecords:0,legacyRecords:0,legacyAmbiguous:0,ignoredNestedGrades:0,collectorAccuracyVersion:'0.15.122'};
  function refreshCounts(){status.records=records.length;status.snapshots=records.filter(x=>x?.roleSnapshot?.schema===SNAPSHOT_SCHEMA&&trustedRecord(x)).length;status.trustedRecords=records.filter(trustedRecord).length;status.legacyRecords=records.filter(x=>x?.gradeProvenance===LEGACY_PROVENANCE).length;status.legacyAmbiguous=records.filter(x=>x?.legacyAmbiguous).length}
  function rawSave(){refreshCounts();atomicWrite(file,{schema:STORE_SCHEMA,updatedAt:Date.now(),collectorAccuracyVersion:'0.15.122',records:records.slice(0,MAX_RECORDS)})}
  function load(){if(loaded)return;loaded=true;const x=safeJsonRead(file),m=migrateLegacyRecords(Array.isArray(x?.records)?x.records.slice(0,MAX_RECORDS):[]);records=m.records;refreshCounts();if(m.changed)rawSave()}
  function account(){const a=core.account||{};return{puuid:str(a.puuid),riotId:str(a.riotId||a.gameName||a.displayName||a.summonerName),summonerId:num(a.summonerId??a.summonerID)}}
  function fingerprint(r,a){return crypto.createHash('sha1').update([a.puuid||a.riotId,r.gameId,r.championId??'',r.grade,PRIMARY_PROVENANCE].join('|')).digest('hex')}
  async function poll(){
    if(busy)return getState();busy=true;status.lastPollAt=Date.now();load();
    try{
      if(typeof core.refreshCreds==='function'&&!await core.refreshCreds()){status.lastResult='League Client 연결 대기';status.lastError='';return getState()}
      let payload;try{payload=await core.lcuGet(ENDPOINT,3500)}catch{status.lastResult='게임 종료 등급 대기';status.lastError='';return getState()}
      const rows=extractPrimaryRows(payload);status.lastSuccessAt=Date.now();
      if(!rows.length){status.lastResult='Riot primary grade 응답 없음';status.lastError='';return getState()}
      let eog=null;
      if(rows.some(r=>!r.gameId||r.queueId===null||!r.gameMode)){try{eog=await core.lcuGet(EOG_ENDPOINT,3000)}catch{}}
      const fallbackGameId=canonGameId(deepFirst(eog,['gameId','gameID'])),fallbackQueue=num(deepFirst(eog,['queueId','queueID'])),fallbackMode=str(deepFirst(eog,['gameMode']));
      const a=account(),now=Date.now();let added=0,updated=0;
      for(const r0 of rows){
        const r={...r0};if(!r.gameId&&fallbackGameId)r.gameId=fallbackGameId;if(r.queueId===null&&fallbackQueue!==null)r.queueId=fallbackQueue;if(!r.gameMode&&fallbackMode)r.gameMode=fallbackMode;
        if(!r.gameId||r.championId===null||!r.grade)continue;
        const rec={schema:2,grade:r.grade,gameId:r.gameId,championId:r.championId,playerId:r.playerId,queueId:r.queueId,gameMode:r.gameMode||'',puuid:a.puuid,riotId:a.riotId,capturedAt:now,gameIdSource:r0.gameId?'mastery-update':'eog-stats-fallback',gradeProvenance:PRIMARY_PROVENANCE,trustedRiotGrade:true,source:'LCU champion-mastery-updates primary'};
        rec.key=fingerprint(rec,a);
        const i=records.findIndex(x=>canonGameId(x.gameId)===rec.gameId&&num(x.championId)===num(rec.championId)&&(!a.puuid||!x.puuid||x.puuid===a.puuid));
        if(i>=0){records[i]={...records[i],...rec,capturedAt:records[i].capturedAt||now,lastSeenAt:now,roleSnapshot:records[i].roleSnapshot};updated++}
        else{records.unshift({...rec,lastSeenAt:now});added++}
      }
      records=records.sort((a,b)=>num(b.capturedAt,0)-num(a.capturedAt,0)).slice(0,MAX_RECORDS);status.lastCaptureAt=(added||updated)?now:status.lastCaptureAt;status.lastResult=(added||updated)?`Riot 실제 Grade ${added+updated}건 확인`:'Riot 실제 Grade 재확인';status.lastError='';if(added||updated)rawSave();else refreshCounts();
    }catch(e){status.lastError=e?.message||String(e);status.lastResult='수집 오류'}finally{busy=false}
    return getState();
  }
  function sanitizeSnapshot(x,a){if(!x||typeof x!=='object')return null;const gameId=canonGameId(x.gameId),puuid=str(x.puuid||a.puuid),role=str(x.role).trim(),champion=str(x.champion).trim(),engineKey=str(x.engineKey).trim(),score=num(x.roleScore),queueId=num(x.queueId),championId=num(x.championId);if(!gameId||!role||!champion||score===null||score<0||score>100)return null;if(a.puuid&&puuid&&puuid!==a.puuid)return null;if(queueId!==450&&queueId!==2400)return null;const ourGrade=str(x.ourGrade).trim().toUpperCase();return{schema:SNAPSHOT_SCHEMA,gameId,puuid:a.puuid||puuid,champion,championId,role,roleScore:Math.round(clamp(score,0,100)*10)/10,ourGrade,queueId,engineKey:engineKey||'ROLE_FAIRS_MISSION_V01529',engineVersion:str(x.engineVersion||'0.15.32'),snapshotAt:Date.now()}}
  function sameSnapshot(a,b){if(!a||!b)return false;const keys=['schema','gameId','puuid','champion','championId','role','roleScore','ourGrade','queueId','engineKey','engineVersion'];return keys.every(k=>String(a[k]??'')===String(b[k]??''))}
  function annotateSnapshots(input){load();const a=account(),xs=Array.isArray(input)?input:[input],now=Date.now();let updated=0,unchanged=0,rejected=0,unmatched=0;for(const raw of xs){const s=sanitizeSnapshot(raw,a);if(!s){rejected++;continue}const i=records.findIndex(r=>trustedRecord(r)&&canonGameId(r.gameId)===s.gameId&&(!a.puuid||!r.puuid||r.puuid===a.puuid)&&s.championId!=null&&num(r.championId)===s.championId);if(i<0){unmatched++;continue}const prev=records[i].roleSnapshot;if(sameSnapshot(prev,s)){unchanged++;continue}records[i]={...records[i],roleSnapshot:{...(prev||{}),...s},lastAnnotatedAt:now};updated++}if(updated){status.lastSnapshotAt=now;rawSave()}else refreshCounts();return{updated,unchanged,rejected,unmatched,records:status.records,snapshots:status.snapshots,scoringUse:false,authoritativeOnly:true}}
  function getState(){load();return{...status,running:!!timer,records:records.map(x=>({...x,roleSnapshot:x.roleSnapshot?{...x.roleSnapshot}:undefined})),storage:'local-userData',scoringUse:false,snapshotScoringUse:false,authoritativeOnly:true,gradeProvenance:PRIMARY_PROVENANCE}}
  function start(){if(timer)return;load();status.running=true;poll().catch(()=>{});timer=setInterval(()=>poll().catch(()=>{}),Math.max(3000,Number(intervalMs)||5000));timer.unref?.()}
  function stop(){if(timer)clearInterval(timer);timer=null;status.running=false;if(!stopped){stopped=true;try{stopWatch()}catch{}}}
  function getIntegrityState(){const probe=integrity.guardExternalJson(file,guardOpts);return{version:'0.15.122',file,path:path.basename(file),initial:initialIntegrity,probe,score_logic_changed:false}}
  return{start,stop,poll,getState,annotateSnapshots,getIntegrityState,extractRows:extractPrimaryRows,extractPrimaryRows,normGrade,canonGameId,trustedRecord,migrateLegacyRecords};
}
module.exports={createCollector,extractRows:extractPrimaryRows,extractPrimaryRows,normGrade,canonGameId,trustedRecord,migrateLegacyRecords,validStore,PRIMARY_PROVENANCE,LEGACY_PROVENANCE,score_logic_changed:false,random_scoring_changed:false,riot_grade_accuracy_version:'0.15.122'};
