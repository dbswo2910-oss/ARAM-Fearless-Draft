'use strict';
/* ARAM Rating v0.2 developer-only exporter. Not shipped in update/manifest.json. */
(()=>{
  const MAX_MATCHES=100,MIN_TARGET=50;
  const roots=g=>[g,g?.game,g?.match,g?.data,g?.raw,g?.info].filter(Boolean);
  const pick=(g,keys)=>{for(const r of roots(g))for(const k of keys){const v=r?.[k];if(v!==undefined&&v!==null&&v!=='')return v}return null};
  const matchId=g=>{const v=pick(g,['gameId','id','matchId','match_id']);return v===null?'':String(v)};
  const matchTime=g=>{const v=pick(g,['gameEndTimestamp','gameEnd','timestamp','ts','createdAt','gameCreation','gameCreationDate','gameStartTimestamp','game_datetime']);const n=Number(v);return Number.isFinite(n)?n:0};
  function queueId(g){const direct=pick(g,['queueId','queue_id']);if(direct!==null){const n=Number(direct);return Number.isFinite(n)?n:null}for(const r of roots(g)){const n=Number(r?.gameQueueConfig?.id);if(Number.isFinite(n)&&n>0)return n}return null}
  function participants(g){
    for(const r of roots(g)){
      if(Array.isArray(r?.participants)&&r.participants.length)return r.participants;
      const team=Array.isArray(r?.team)?r.team:[],enemy=Array.isArray(r?.enemy)?r.enemy:[];
      if(team.length||enemy.length)return [...team,...enemy];
    }
    return [];
  }
  function participantPuuids(g){
    const ps=participants(g),direct=ps.map(p=>String(p?.puuid||p?.player?.puuid||'').trim()).filter(Boolean);
    if(direct.length)return direct;
    for(const r of roots(g))if(Array.isArray(r?.participantIdentities))return r.participantIdentities.map(x=>String(x?.player?.puuid||x?.puuid||'').trim()).filter(Boolean);
    return [];
  }
  function mergeRows(...lists){const out=[],seen=new Set();for(const list of lists)for(const g of (Array.isArray(list)?list:[])){if(!g||typeof g!=='object')continue;const id=matchId(g),key=id||`t:${matchTime(g)}:${out.length}`;if(seen.has(key))continue;seen.add(key);out.push(g)}out.sort((a,b)=>matchTime(b)-matchTime(a));return out}
  function state(){try{return typeof aramHistoryState!=='undefined'?aramHistoryState:null}catch{return globalThis.aramHistoryState||null}}
  const targetFromState=s=>s?.targetMode==='searched'&&s?.target?{...s.target}:{current:true};
  function stamp(d=new Date()){const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${z(d.getMonth()+1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`}
  function validate(rows){
    let queue450=0,invalidQueue=0,missingQueue=0,missingParticipants=0,missingPuuid=0,duplicateMatchIds=0;const seen=new Set();
    for(const g of rows){const q=queueId(g);if(q===450)queue450++;else if(q===null)missingQueue++;else invalidQueue++;const ps=participants(g);if(ps.length!==10)missingParticipants++;const puuids=participantPuuids(g);if(puuids.length!==10)missingPuuid++;const id=matchId(g);if(id){if(seen.has(id))duplicateMatchIds++;seen.add(id)}}
    return {source_candidates:rows.length,queue_450:queue450,invalid_queue:invalidQueue,missing_queue:missingQueue,missing_participants:missingParticipants,missing_puuid:missingPuuid,duplicate_match_ids:duplicateMatchIds};
  }
  async function downloadJson(envelope,filename){const text=JSON.stringify(envelope,null,2);let downloaded=false,copied=false,error='';try{const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);downloaded=true}catch(e){error=e?.message||String(e)}if(!downloaded){try{if(typeof copy==='function'){copy(text);copied=true}}catch{}if(!copied){try{await navigator.clipboard.writeText(text);copied=true}catch{}}}return {downloaded,copied,error}}
  async function run(){
    if(!window.aramDesktop?.getAramMatchHistory)throw new Error('desktop match-history bridge unavailable');
    const s=state(),target=targetFromState(s),rendererRows=Array.isArray(s?.matches)?s.matches:[];let cacheRows=[],freshRows=[],cacheMeta=null,freshMeta=null;
    try{const cached=await window.aramDesktop.getAramMatchHistory({limit:MAX_MATCHES,scan:0,target,queueMode:'standard',cacheOnly:true,priority:'interactive'});cacheRows=Array.isArray(cached?.matches)?cached.matches:[];cacheMeta=cached?._historyLatency||null}catch{}
    let candidates=mergeRows(rendererRows,cacheRows);const explicitStandard=candidates.filter(g=>queueId(g)===450).length;
    if(explicitStandard<MIN_TARGET){const fresh=await window.aramDesktop.getAramMatchHistory({limit:MAX_MATCHES,scan:MAX_MATCHES,target,queueMode:'standard',priority:'interactive'});if(fresh?.connected===false)throw new Error(fresh?.message||'League Client에 연결되지 않았습니다.');freshRows=Array.isArray(fresh?.matches)?fresh.matches:[];freshMeta=fresh?._historyLatency||null;candidates=mergeRows(rendererRows,cacheRows,freshRows)}
    candidates=candidates.slice(0,MAX_MATCHES*2);const sourceValidation=validate(candidates),standard=candidates.filter(g=>queueId(g)===450).slice(0,MAX_MATCHES),exportValidation=validate(standard);const filename=`aram-rating-real-sample-${stamp()}.json`;
    const envelope={schema:'aram-rating-real-sample-v02',metadata:{source:'local_running_app',exported_at:new Date().toISOString(),region:'KR',queue:450,match_count:standard.length,max_matches:MAX_MATCHES,target_mode:s?.targetMode==='searched'?'searched':'current',retrieval:'renderer/cache first; one bounded existing-program history read only when fewer than 50 explicit queue-450 matches are available',cache_latency:cacheMeta,fresh_latency:freshMeta,validation:{...exportValidation,source_invalid_queue:sourceValidation.invalid_queue,source_missing_queue:sourceValidation.missing_queue}},matches:standard};
    const io=await downloadJson(envelope,filename);window.__ARAM_RATING_EXPORT_LAST_V02__={filename,envelope,io};const summary={'Exported matches':standard.length,'Queue 450':exportValidation.queue_450,'Invalid queue':sourceValidation.invalid_queue,'Missing queue':sourceValidation.missing_queue,'Missing participants':exportValidation.missing_participants,'Missing PUUID':exportValidation.missing_puuid,'Duplicate match IDs':exportValidation.duplicate_match_ids};console.table(summary);console.log('[ARAM Rating v0.2 Phase A] export complete',{filename,...io,metadata:envelope.metadata});if(standard.length<50)console.warn(`[ARAM Rating v0.2] only ${standard.length} explicit queue-450 matches were exportable; Phase A can validate the pipeline, but collect more before model selection.`);if(exportValidation.missing_participants||exportValidation.missing_puuid||exportValidation.duplicate_match_ids)console.warn('[ARAM Rating v0.2] file was kept. The Python Data Audit will reject invalid rows and report exact reasons.');return window.__ARAM_RATING_EXPORT_LAST_V02__;
  }
  window.aramResearchExportV02=run;window.__ARAM_RATING_EXPORT_PROMISE_V02__=run().catch(e=>{console.error('[ARAM Rating v0.2 Phase A] export failed',e);throw e});
})();
