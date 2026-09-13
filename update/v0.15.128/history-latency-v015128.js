'use strict';
(()=>{
  const V='0.15.128';
  if(window.__ARAM_HISTORY_LATENCY_V015128__)return;
  const now=()=>globalThis.performance?.now?.()||Date.now();
  const counters={loads:0,rendererCachePaints:0,mainCacheHits:0,quickLoads:0,deepLoads:0,deepCoalesces:0,probeLoads:0,probeHits:0,staleDrops:0,errors:0,lastCacheMs:0,lastQuickMs:0,lastDeepMs:0,lastProbeMs:0,maxQuickMs:0,maxDeepMs:0,maxProbeMs:0,lastQuickScan:0,lastDeepScan:0};
  const deepByKey=new Map();
  let generation=0,lastAppliedKey='';
  const baseLoad=(()=>{try{return typeof loadAramHistory==='function'?loadAramHistory:null}catch{return null}})();

  function state(){try{if(typeof aramHistoryState!=='undefined'&&aramHistoryState)return aramHistoryState}catch{}return globalThis.aramHistoryState||null}
  function render(){try{if(typeof renderAramHistoryFeedback==='function')renderAramHistoryFeedback()}catch{}}
  function accountLabel(a){try{if(typeof aramHistoryAccountLabel==='function')return aramHistoryAccountLabel(a)}catch{}return String(a?.riotId||a?.gameName||a?.displayName||'조회 대상')}
  function gameKey(g){for(const r of [g,g?.game,g?.match,g?.data,g?.raw,g?.info]){const v=r?.gameId??r?.id??r?.metadata?.matchId??r?.matchId;if(v!==undefined&&v!==null&&String(v))return String(v)}return ''}
  function gameTime(g){for(const r of [g,g?.game,g?.match,g?.data,g?.raw,g?.info]){for(const v of [r?.gameEndTimestamp,r?.gameEnd,r?.timestamp,r?.ts,r?.createdAt,r?.gameCreation,r?.gameCreationDate,r?.gameStartTimestamp]){const n=Number(v);if(Number.isFinite(n)&&n>0)return n}}return 0}
  function mergeRows(a,b,max=40){const out=[],seen=new Set();for(const g of [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])]){const k=gameKey(g)||`t:${gameTime(g)}:${out.length}`;if(seen.has(k))continue;seen.add(k);out.push(g)}out.sort((x,y)=>gameTime(y)-gameTime(x));return out.slice(0,max)}
  function targetIdentity(target){if(target?.current===true)return'current';const xs=['puuid','summonerId','accountId','riotId','gameName','tagLine','name'].map(k=>String(target?.[k]??'').trim().toLowerCase()).filter(Boolean);return xs.length?xs.join('#'):'current'}
  function keyFor(target,queueMode){return `${queueMode==='mayhem'?'mayhem':'standard'}|${targetIdentity(target)}`}
  function queueModeOf(s){return s?.queueMode==='mayhem'?'mayhem':'standard'}
  function targetOf(s){return s?.targetMode==='searched'?(s.target||{}):{current:true}}
  function currentLocalAccount(){try{return typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState?.account||null:null}catch{return null}}
  function freshOptions(s,{limit,scan,priority='interactive',probe=false}={}){const target=targetOf(s),queueMode=queueModeOf(s);return{limit,scan,target,queueMode,priority,historyProbe:probe}}

  function applyResult(r,key,{merge=false,preserveSelection=true}={}){
    const s=state();if(!s||!r||r.connected===false)return false;
    const incoming=Array.isArray(r.matches)?r.matches:[];
    const rows=merge?mergeRows(incoming,s.matches,Math.max(40,Number(s.limit)||20)):incoming;
    const selected=preserveSelection?String(s.selectedGameId||''):'';
    s.matches=rows;s.account=r.account||s.account||null;s.localAccount=r.localAccount||s.localAccount||currentLocalAccount();s.targetMode=r.targetMode==='searched'?'searched':(s.targetMode==='searched'?'searched':'current');s.source=r.sourceEndpoint||s.source||'LCU Match History';s.scanned=Math.max(Number(s.scanned)||0,Number(r.scanned)||0);s.fullTeamCount=Math.max(Number(s.fullTeamCount)||0,Number(r.fullTeamCount)||0);s.errors=Array.isArray(r.errors)?r.errors:[];s.loadedAt=Date.now();s.queueMode=r.queueMode==='mayhem'?'mayhem':queueModeOf(s);s.__latencyKeyV015128=key;lastAppliedKey=key;
    const ids=new Set(rows.map(gameKey).filter(Boolean));s.selectedGameId=selected&&ids.has(selected)?selected:String(rows[0]?.gameId||rows[0]?.id||gameKey(rows[0])||'');if(!s.detailTab)s.detailTab='summary';
    const input=document.getElementById('historyPlayerSearch');if(input&&s.targetMode==='searched'){const label=accountLabel(s.account);if(label)input.value=label}
    return true;
  }

  async function desktopHistory(opts){if(!window.aramDesktop?.getAramMatchHistory)throw new Error('이 기능은 데스크톱 앱에서 사용할 수 있습니다.');return window.aramDesktop.getAramMatchHistory(opts)}
  function deepScanFor(limit){return Math.max(100,Math.max(1,Number(limit)||20)*5)}
  function quickScanFor(limit){return Math.max(20,Math.min(50,Math.max(1,Number(limit)||20)*2))}
  function isCurrentGeneration(token,key){const s=state();return token===generation&&key===keyFor(targetOf(s),queueModeOf(s))}

  function scheduleDeep(token,key,snapshot){
    if(deepByKey.has(key)){counters.deepCoalesces++;return deepByKey.get(key)}
    const limit=Math.max(1,Math.min(30,Number(snapshot.limit)||20)),scan=deepScanFor(limit);counters.lastDeepScan=scan;
    const p=Promise.resolve().then(async()=>{
      counters.deepLoads++;const a=now();
      try{
        const r=await desktopHistory({...freshOptions(snapshot,{limit,scan,priority:'background'}),target:targetOf(snapshot),queueMode:queueModeOf(snapshot)});const ms=Math.max(0,now()-a);counters.lastDeepMs=ms;counters.maxDeepMs=Math.max(counters.maxDeepMs,ms);
        if(!isCurrentGeneration(token,key)){counters.staleDrops++;return r}
        if(r?.connected){const s=state();applyResult(r,key,{merge:false,preserveSelection:true});s.loading=false;s.error='';if(!s.matches.length)s.error=`${accountLabel(s.account)}의 최근 조회 범위에서 ${queueModeOf(s)==='mayhem'?'아수라장':'일반 칼바람'} 전적을 찾지 못했습니다.`;render()}
        return r;
      }catch(e){counters.errors++;return null}
      finally{deepByKey.delete(key)}
    });
    deepByKey.set(key,p);return p;
  }

  async function load(force=true){
    const s=state();if(!s)return baseLoad?baseLoad(force):undefined;if(s.loading)return;
    if(!window.aramDesktop?.getAramMatchHistory)return baseLoad?baseLoad(force):undefined;
    counters.loads++;const token=++generation;
    s.limit=Math.max(1,Math.min(30,Number(document.getElementById('historyLimit')?.value)||s.limit||20));
    const limit=s.limit,target=targetOf(s),queueMode=queueModeOf(s),key=keyFor(target,queueMode),quickScan=quickScanFor(limit);counters.lastQuickScan=quickScan;
    const existingOkay=Array.isArray(s.matches)&&s.matches.length&&(s.__latencyKeyV015128===key||(!s.__latencyKeyV015128&&target?.current===true));
    if(existingOkay){counters.rendererCachePaints++;lastAppliedKey=key;s.__latencyKeyV015128=key;s.loading=false;s.error='';render()}
    const cacheAt=now();
    try{
      const cached=await desktopHistory({limit,scan:0,target,queueMode,cacheOnly:true,priority:'interactive'});counters.lastCacheMs=Math.max(0,now()-cacheAt);
      if(isCurrentGeneration(token,key)&&cached?._historyLatency?.cacheHit&&Array.isArray(cached.matches)&&cached.matches.length){counters.mainCacheHits++;applyResult(cached,key,{merge:false,preserveSelection:true});s.loading=false;s.error='';render()}
    }catch{}
    if(!isCurrentGeneration(token,key)){counters.staleDrops++;return}
    s.loading=true;s.error='';render();counters.quickLoads++;const a=now();
    try{
      const r=await desktopHistory({limit,scan:quickScan,target,queueMode,priority:'interactive'});const ms=Math.max(0,now()-a);counters.lastQuickMs=ms;counters.maxQuickMs=Math.max(counters.maxQuickMs,ms);
      if(!isCurrentGeneration(token,key)){counters.staleDrops++;return r}
      if(!r?.connected)throw new Error(r?.message||'League Client에 연결되지 않았습니다.');
      applyResult(r,key,{merge:false,preserveSelection:true});s.loading=false;s.error='';
      if(!s.matches.length)s.error=`${accountLabel(s.account)}의 최근 조회 범위에서 ${queueMode==='mayhem'?'아수라장':'일반 칼바람'} 전적을 아직 찾지 못했습니다.`;
      render();
      if((Array.isArray(r.matches)?r.matches.length:0)<limit)scheduleDeep(token,key,{...s,target,queueMode,limit});
      return r;
    }catch(e){
      counters.errors++;if(!isCurrentGeneration(token,key))return;
      s.loading=false;if(!Array.isArray(s.matches)||!s.matches.length)s.error=e?.message||String(e);render();
      scheduleDeep(token,key,{...s,target,queueMode,limit});return null;
    }
  }

  async function probeLatest(){
    const s=state();if(!s||!window.aramDesktop?.getAramMatchHistory)return baseLoad?baseLoad(true):null;
    const target={current:true},queueMode='standard',key=keyFor(target,queueMode);counters.probeLoads++;const a=now();
    try{
      const r=await desktopHistory({limit:1,scan:12,target,queueMode,priority:'interactive',historyProbe:true});const ms=Math.max(0,now()-a);counters.lastProbeMs=ms;counters.maxProbeMs=Math.max(counters.maxProbeMs,ms);
      if(!r?.connected)return r;const incoming=Array.isArray(r.matches)?r.matches:[];if(incoming.length)counters.probeHits++;
      s.queueMode='standard';s.targetMode='current';s.target=null;applyResult(r,key,{merge:true,preserveSelection:true});s.loading=false;s.error='';render();return r;
    }catch(e){counters.errors++;throw e}
  }

  try{loadAramHistory=load}catch{};try{globalThis.loadAramHistory=load}catch{}
  window.aramHistoryLatencyV015128={version:V,load,probeLatest,getStats:()=>({version:V,generation,lastAppliedKey,deepInFlight:deepByKey.size,counters:{...counters}}),score_logic_changed:false,random_scoring_changed:false,architecture:'renderer-cache-first + main session cache + interactive quick scan + background deep backfill + bounded latest-game probe'};
  window.__ARAM_HISTORY_LATENCY_V015128__=true;
})();
