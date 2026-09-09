'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const ENDPOINT='/lol-end-of-game/v1/champion-mastery-updates';
const EOG_ENDPOINT='/lol-end-of-game/v1/eog-stats-block';
const MAX_RECORDS=600;
const SNAPSHOT_SCHEMA=1;
const str=v=>v==null?'':String(v);
const num=(v,d=null)=>{const n=Number(v);return Number.isFinite(n)?n:d};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function normGrade(v){let s=str(v).trim().toUpperCase().replace(/\s+/g,'').replace(/_/g,'');s=s.replace(/PLUS/g,'+').replace(/MINUS/g,'-');if(/^S\+?$/.test(s)||/^S-$/.test(s)||/^A[+-]?$/.test(s)||/^B[+-]?$/.test(s)||/^C[+-]?$/.test(s)||/^D[+-]?$/.test(s))return s;return''}
function canonGameId(v){const s=str(v).trim();if(!s)return'';const m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s}
function deepFirst(root,keys){const seen=new Set(),want=new Set(keys.map(String));let hit=null;function walk(x){if(hit!==null||x==null||typeof x!=='object'||seen.has(x))return;seen.add(x);if(!Array.isArray(x))for(const k of Object.keys(x))if(want.has(k)&&x[k]!==undefined&&x[k]!==null&&str(x[k]).trim()){hit=x[k];return}for(const v of Array.isArray(x)?x:Object.values(x)){walk(v);if(hit!==null)return}}walk(root);return hit}
function extractRows(root){const out=[],seen=new Set();function walk(x,ctx={}){if(x==null||typeof x!=='object'||seen.has(x))return;seen.add(x);if(Array.isArray(x)){for(const v of x)walk(v,ctx);return}const next={gameId:x.gameId??x.gameID??x.game?.gameId??ctx.gameId,championId:x.championId??x.championID??x.champion?.id??ctx.championId,queueId:x.queueId??x.queueID??ctx.queueId,gameMode:x.gameMode??ctx.gameMode};const grade=normGrade(x.grade??x.championGrade??x.masteryGrade??x?.championMastery?.grade);if(grade)out.push({grade,gameId:canonGameId(next.gameId),championId:num(next.championId),queueId:num(next.queueId),gameMode:str(next.gameMode)});for(const v of Object.values(x))walk(v,next)}walk(root,{});const uniq=new Map();for(const r of out){const k=`${r.gameId}|${r.championId??''}|${r.grade}`;if(!uniq.has(k))uniq.set(k,r)}return[...uniq.values()]}
function safeJsonRead(file){try{const x=JSON.parse(fs.readFileSync(file,'utf8'));return x&&typeof x==='object'?x:null}catch{return null}}
function atomicWrite(file,data){const tmp=`${file}.tmp-${process.pid}`;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(tmp,JSON.stringify(data,null,2),'utf8');try{fs.renameSync(tmp,file)}catch{try{fs.unlinkSync(file)}catch{}fs.renameSync(tmp,file)}}
function createCollector(core,{app,intervalMs=5000}={}){
  if(!core)throw new Error('core required');
  let timer=null,busy=false,loaded=false,records=[];
  const status={running:false,lastPollAt:0,lastSuccessAt:0,lastCaptureAt:0,lastSnapshotAt:0,lastError:'',lastResult:'대기',endpoint:ENDPOINT,records:0,snapshots:0};
  const storePath=()=>{try{return path.join(app.getPath('userData'),'riot-grade-v01528.json')}catch{return path.join(process.cwd(),'riot-grade-v01528.json')}};
  function load(){if(loaded)return;loaded=true;const x=safeJsonRead(storePath());records=Array.isArray(x?.records)?x.records.slice(0,MAX_RECORDS):[];refreshCounts()}
  function refreshCounts(){status.records=records.length;status.snapshots=records.filter(x=>x?.roleSnapshot?.schema===SNAPSHOT_SCHEMA).length}
  function save(){refreshCounts();atomicWrite(storePath(),{schema:2,updatedAt:Date.now(),records:records.slice(0,MAX_RECORDS)})}
  function account(){const a=core.account||{};return{puuid:str(a.puuid),riotId:str(a.riotId||a.gameName||a.displayName||a.summonerName)}}
  function fingerprint(r,a){return crypto.createHash('sha1').update([a.puuid||a.riotId,r.gameId,r.championId??'',r.grade].join('|')).digest('hex')}
  async function poll(){if(busy)return getState();busy=true;status.lastPollAt=Date.now();load();try{if(typeof core.refreshCreds==='function'&&!await core.refreshCreds()){status.lastResult='League Client 연결 대기';status.lastError='';return getState()}let payload;try{payload=await core.lcuGet(ENDPOINT,3500)}catch{status.lastResult='게임 종료 등급 대기';status.lastError='';return getState()}let rows=extractRows(payload);status.lastSuccessAt=Date.now();if(!rows.length){status.lastResult='등급 응답은 있으나 grade 없음';status.lastError='';return getState()}let fallbackGameId='';if(rows.some(r=>!r.gameId)){try{const eog=await core.lcuGet(EOG_ENDPOINT,3000);fallbackGameId=canonGameId(deepFirst(eog,['gameId','gameID']))}catch{}}const a=account(),now=Date.now();let added=0;for(const r0 of rows){const r={...r0};if(!r.gameId&&fallbackGameId){r.gameId=fallbackGameId;r.gameIdSource='eog-stats-fallback'}else r.gameIdSource=r.gameId?'mastery-update':'unlinked';const rec={schema:1,grade:r.grade,gameId:r.gameId||'',championId:r.championId,queueId:r.queueId,gameMode:r.gameMode||'',puuid:a.puuid,riotId:a.riotId,capturedAt:now,gameIdSource:r.gameIdSource,source:'LCU champion-mastery-updates'};rec.key=fingerprint(rec,a);const i=records.findIndex(x=>x.key===rec.key||(rec.gameId&&canonGameId(x.gameId)===rec.gameId&&num(x.championId)===num(rec.championId)&&x.grade===rec.grade&&(!a.puuid||!x.puuid||x.puuid===a.puuid)));if(i>=0)records[i]={...records[i],...rec,capturedAt:records[i].capturedAt||now,lastSeenAt:now,roleSnapshot:records[i].roleSnapshot};else{records.unshift({...rec,lastSeenAt:now});added++}}records=records.sort((a,b)=>num(b.capturedAt,0)-num(a.capturedAt,0)).slice(0,MAX_RECORDS);status.lastCaptureAt=added?now:status.lastCaptureAt;status.lastResult=added?`Riot Grade ${added}건 저장`:'기존 Riot Grade 재확인';status.lastError='';if(added)save();else refreshCounts()}catch(e){status.lastError=e?.message||String(e);status.lastResult='수집 오류'}finally{busy=false}return getState()}
  function sanitizeSnapshot(x,a){
    if(!x||typeof x!=='object')return null;
    const gameId=canonGameId(x.gameId),puuid=str(x.puuid||a.puuid),role=str(x.role).trim(),champion=str(x.champion).trim(),engineKey=str(x.engineKey).trim();
    const score=num(x.roleScore),queueId=num(x.queueId),championId=num(x.championId);
    if(!gameId||!role||!champion||score===null||score<0||score>100)return null;
    if(a.puuid&&puuid&&puuid!==a.puuid)return null;
    if(queueId!==450&&queueId!==2400)return null;
    const ourGrade=str(x.ourGrade).trim().toUpperCase();
    return{schema:SNAPSHOT_SCHEMA,gameId,puuid:a.puuid||puuid,champion,championId,role,roleScore:Math.round(clamp(score,0,100)*10)/10,ourGrade,queueId,engineKey:engineKey||'ROLE_FAIRS_MISSION_V01529',engineVersion:str(x.engineVersion||'0.15.32'),snapshotAt:Date.now()};
  }
  function annotateSnapshots(input){
    load();const a=account(),xs=Array.isArray(input)?input:[input],now=Date.now();let updated=0,rejected=0,unmatched=0;
    for(const raw of xs){const s=sanitizeSnapshot(raw,a);if(!s){rejected++;continue}const i=records.findIndex(r=>canonGameId(r.gameId)===s.gameId&&(!a.puuid||!r.puuid||r.puuid===a.puuid)&&(s.championId==null||r.championId==null||num(r.championId)===s.championId));if(i<0){unmatched++;continue}const prev=records[i].roleSnapshot;records[i]={...records[i],roleSnapshot:{...(prev||{}),...s,snapshotAt:prev?.engineKey===s.engineKey&&num(prev?.roleScore)===s.roleScore?prev.snapshotAt:s.snapshotAt},lastAnnotatedAt:now};updated++}
    if(updated){status.lastSnapshotAt=now;save()}else refreshCounts();return{updated,rejected,unmatched,records:status.records,snapshots:status.snapshots,scoringUse:false}
  }
  function getState(){load();return{...status,running:!!timer,records:records.map(x=>({...x,roleSnapshot:x.roleSnapshot?{...x.roleSnapshot}:undefined})),storage:'local-userData',scoringUse:false,snapshotScoringUse:false}}
  function start(){if(timer)return;load();status.running=true;poll().catch(()=>{});timer=setInterval(()=>poll().catch(()=>{}),Math.max(3000,Number(intervalMs)||5000));timer.unref?.()}
  function stop(){if(timer)clearInterval(timer);timer=null;status.running=false}
  return{start,stop,poll,getState,annotateSnapshots,extractRows,normGrade,canonGameId};
}
module.exports={createCollector,extractRows,normGrade,canonGameId};
