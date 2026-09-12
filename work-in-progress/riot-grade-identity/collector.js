'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const ENDPOINT='/lol-end-of-game/v1/champion-mastery-updates';
const EOG_ENDPOINT='/lol-end-of-game/v1/eog-stats-block';
const MAX_RECORDS=600;

const str=v=>v==null?'':String(v);
const num=(v,d=null)=>{if(v==null||String(v).trim()==='')return d;const n=Number(v);return Number.isFinite(n)?n:d};
function normGrade(v){
  let s=str(v).trim().toUpperCase().replace(/\s+/g,'').replace(/_/g,'');
  s=s.replace(/PLUS/g,'+').replace(/MINUS/g,'-');
  if(/^S\+?$/.test(s)||/^S-$/.test(s)||/^A[+-]?$/.test(s)||/^B[+-]?$/.test(s)||/^C[+-]?$/.test(s)||/^D[+-]?$/.test(s))return s;
  return '';
}
function canonGameId(v){
  const s=str(v).trim();if(!s)return'';
  const m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s;
}
function deepFirst(root,keys){
  const seen=new Set(),want=new Set(keys.map(String));let hit=null;
  function walk(x){
    if(hit!==null||x==null||typeof x!=='object'||seen.has(x))return;seen.add(x);
    if(!Array.isArray(x))for(const k of Object.keys(x))if(want.has(k)&&x[k]!==undefined&&x[k]!==null&&str(x[k]).trim()){hit=x[k];return}
    for(const v of Array.isArray(x)?x:Object.values(x)){walk(v);if(hit!==null)return}
  }walk(root);return hit;
}
function extractRows(root){
  const out=[],seen=new Set();
  function walk(x,ctx={}){
    if(x==null||typeof x!=='object'||seen.has(x))return;seen.add(x);
    if(Array.isArray(x)){for(const v of x)walk(v,ctx);return}
    const next={
      gameId:x.gameId??x.gameID??x.game?.gameId??ctx.gameId,
      championId:x.championId??x.championID??x.champion?.id??ctx.championId,
      queueId:x.queueId??x.queueID??ctx.queueId,
      gameMode:x.gameMode??ctx.gameMode
    };
    const grade=normGrade(x.grade??x.championGrade??x.masteryGrade??x?.championMastery?.grade);
    if(grade)out.push({grade,gameId:canonGameId(next.gameId),championId:num(next.championId),queueId:num(next.queueId),gameMode:str(next.gameMode)});
    for(const v of Object.values(x))walk(v,next);
  }walk(root,{});
  const uniq=new Map();
  for(const r of out){const k=`${r.gameId}|${r.championId??''}|${r.grade}`;if(!uniq.has(k))uniq.set(k,r)}
  return [...uniq.values()];
}
function safeJsonRead(file){try{const x=JSON.parse(fs.readFileSync(file,'utf8'));return x&&typeof x==='object'?x:null}catch{return null}}
function atomicWrite(file,data){
  const tmp=`${file}.tmp-${process.pid}`;
  try{
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(tmp,JSON.stringify(data,null,2),'utf8');
    // Never delete the last valid store when replacement fails.
    fs.renameSync(tmp,file);
  }finally{try{fs.unlinkSync(tmp)}catch{}}
}
function createCollector(core,{app,intervalMs=5000}={}){
  if(!core)throw new Error('core required');
  let timer=null,busy=false,loaded=false,dirty=false,records=[];
  const status={running:false,lastPollAt:0,lastSuccessAt:0,lastCaptureAt:0,lastError:'',lastResult:'대기',endpoint:ENDPOINT,records:0};
  const storePath=()=>{try{return path.join(app.getPath('userData'),'riot-grade-v01528.json')}catch{return path.join(process.cwd(),'riot-grade-v01528.json')}};
  function load(){if(loaded)return;loaded=true;const x=safeJsonRead(storePath());records=Array.isArray(x?.records)?x.records.slice(0,MAX_RECORDS):[];status.records=records.length}
  function save(){atomicWrite(storePath(),{schema:1,updatedAt:Date.now(),records:records.slice(0,MAX_RECORDS)})}
  function flush(){if(!dirty)return;save();dirty=false;status.lastError='';}
  function account(){const a=core.account||{};return{puuid:str(a.puuid),riotId:str(a.riotId||a.gameName||a.displayName||a.summonerName)}}
  function fingerprint(r,a){return crypto.createHash('sha1').update([a.puuid||a.riotId,r.gameId,r.championId??'',r.grade].join('|')).digest('hex')}
  async function poll(){
    if(busy)return getState();busy=true;status.lastPollAt=Date.now();load();
    try{
      // Persist pending records even when the client has gone away.
      flush();
      if(typeof core.refreshCreds==='function'&&!await core.refreshCreds()){status.lastResult='League Client 연결 대기';status.lastError='';return getState()}
      const before=account();if(!before.puuid){status.lastResult='계정 확인 대기';return getState()}
      let payload;try{payload=await core.lcuGet(ENDPOINT,3500)}catch(e){status.lastResult='게임 종료 등급 대기';status.lastError='';return getState()}
      let rows=extractRows(payload);status.lastSuccessAt=Date.now();
      if(!rows.length){status.lastResult='등급 응답은 있으나 grade 없음';status.lastError='';return getState()}
      // Missing game identity is not enough evidence to join a separate EOG response.
      const a=account(),now=Date.now();let added=0;
      if(!a.puuid||a.puuid!==before.puuid){status.lastResult='계정 변경 감지 · 응답 제외';return getState()}
      for(const r0 of rows){
        const r={...r0};
        if(!r.gameId||!Number.isInteger(r.championId)||r.championId<=0)continue;
        r.gameIdSource='mastery-update';
        const rec={schema:1,grade:r.grade,gameId:r.gameId||'',championId:r.championId,queueId:r.queueId,gameMode:r.gameMode||'',puuid:a.puuid,riotId:a.riotId,capturedAt:now,gameIdSource:r.gameIdSource,source:'LCU champion-mastery-updates'};
        rec.key=fingerprint(rec,a);
        const i=records.findIndex(x=>x.key===rec.key||(rec.gameId&&canonGameId(x.gameId)===rec.gameId&&num(x.championId)===num(rec.championId)&&x.grade===rec.grade&&(x.puuid===a.puuid)));
        if(i>=0)records[i]={...records[i],...rec,capturedAt:records[i].capturedAt||now,lastSeenAt:now};else{records.unshift({...rec,lastSeenAt:now});added++;dirty=true}
      }
      records=records.sort((a,b)=>num(b.capturedAt,0)-num(a.capturedAt,0)).slice(0,MAX_RECORDS);status.records=records.length;status.lastCaptureAt=added?now:status.lastCaptureAt;status.lastResult=added?`Riot Grade ${added}건 저장`:`새로 저장할 확정 등급 없음 · 경기/챔피언 식별 정보 확인 필요`;status.lastError='';flush();
    }catch(e){status.lastError=e?.message||String(e);status.lastResult=dirty?'등급 저장 재시도 대기':'수집 오류'}finally{busy=false}
    return getState();
  }
  function getState(){load();return{...status,running:!!timer,records:records.map(x=>({...x})),storage:'local-userData',persistencePending:dirty,scoringUse:false}}
  function start(){if(timer)return;load();status.running=true;poll().catch(()=>{});timer=setInterval(()=>poll().catch(()=>{}),Math.max(3000,Number(intervalMs)||5000));timer.unref?.()}
  function stop(){if(timer)clearInterval(timer);timer=null;status.running=false}
  return{start,stop,poll,getState,extractRows,normGrade,canonGameId};
}
module.exports={createCollector,extractRows,normGrade,canonGameId};
