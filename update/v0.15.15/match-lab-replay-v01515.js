'use strict';
(()=>{
  const V='0.15.15';
  const SCHEMA=3;
  const MAX_TRACKED=100;
  const esc=v=>typeof aramHistoryEsc==='function'?aramHistoryEsc(v):String(v??'');
  const names=xs=>(xs||[]).map(x=>typeof lolAutoSyncResolveChamp==='function'?lolAutoSyncResolveChamp(x):String(x?.name||x||'')).filter(Boolean);
  const uniq=xs=>[...new Set((xs||[]).filter(Boolean))];
  function validRec(rec){
    return !!rec && Array.isArray(rec.recommendations) && rec.recommendations.length>0 && (rec.pickSnapshot===true || rec.replaySchema>=SCHEMA || rec.kind==='champ_select' || Number(rec.startedAt)>0);
  }
  function scoreSnapshot(x){
    if(!x)return 0;
    return (x.recommendations?.length||0)*60+(x.candidatePool?.length||0)*5+(x.bench?.length||0)*4+(x.team?.length||0)*3+(x.external?.length||0)*3+(x.localChampion?4:0)+(x.partySize?2:0);
  }
  function recommendationsFromState(s){
    try{
      const p=lolAutoSyncPlanFromState(s);if(!p||p.kind!=='champ_select')return[];
      const q=Math.max(1,Math.min(5,Number(p.queue)||1)),external=uniq(p.external).filter(Boolean),pool=uniq(p.pool).filter(n=>byName[n]);
      if(external.length<5-q||pool.length<q)return[];
      const choices=combinations(pool,q),out=[];
      for(const party of choices){
        const all=[...external,...party];if(all.length!==5||new Set(all).size!==5)continue;
        const ts=teamScore(all,randomState?.ourModes||{});
        out.push({party:[...party],names:all,score:Number(ts?.s)||0,direction:String(ts?.direction||''),reason:String(ts?.reason||''),warning:String(ts?.warning||''),structure:String(ts?.structure||'')});
      }
      out.sort((a,b)=>b.score-a.score||a.party.join('|').localeCompare(b.party.join('|'),'ko'));
      return out.slice(0,5).map((x,i)=>({...x,rank:i+1}));
    }catch(e){console.warn('[v0.15.15] replay recommendation snapshot failed',e);return[]}
  }
  function snapshotFromState(s){
    const recs=recommendationsFromState(s),pick=lolAutoSyncResolveChamp(s?.localChampion||{})||'';
    return{
      replaySchema:SCHEMA,pickSnapshot:recs.length>0,kind:'champ_select',capturedAt:Date.now(),riotId:s?.account?.riotId||'',partySize:Math.max(1,Math.min(5,Number(s?.partySize)||1)),localChampion:pick,
      team:names(s?.team),external:names(s?.external),party:names(s?.party),bench:names(s?.bench),candidatePool:names(s?.candidatePool),rerollsRemaining:Number(s?.rerollsRemaining)||0,recommendations:recs,
      source:{team:Number(s?.champSelectTeamCount)||0,bench:(s?.bench||[]).length,pool:(s?.candidatePool||[]).length,queue:Number(s?.queueId)||0,aramSource:String(s?.aramSource||'')}
    };
  }
  function saveTrackedRecord(gid,rec){
    const t=aramHistoryTracked(),now=Date.now();t[String(gid)]={...(t[String(gid)]||{}),...rec,gameId:String(gid),at:Number(rec?.at)||now,updatedAt:now};
    const keys=Object.keys(t).sort((a,b)=>(t[b]?.at||t[b]?.updatedAt||0)-(t[a]?.at||t[a]?.updatedAt||0)).slice(0,MAX_TRACKED),out={};for(const k of keys)out[k]=t[k];aramHistorySaveTracked(out);
  }
  function track(s){
    if(!s||!s.isAram)return;const now=Date.now();
    if(s.phase==='champ_select'){
      const prev=aramMatchLabSession(),same=prev?.kind==='champ_select'&&now-(Number(prev.updatedAt)||0)<12*60*1000,base=same?prev:{kind:'champ_select',replaySchema:SCHEMA,startedAt:now,bestSnapshot:null,latestSnapshot:null};
      const snap=snapshotFromState(s),best=!base.bestSnapshot||scoreSnapshot(snap)>=scoreSnapshot(base.bestSnapshot)?snap:base.bestSnapshot;
      aramMatchLabSaveSession({...base,kind:'champ_select',replaySchema:SCHEMA,startedAt:base.startedAt||now,updatedAt:now,riotId:s?.account?.riotId||base.riotId||'',bestSnapshot:best,latestSnapshot:snap});
      return;
    }
    if(s.phase!=='in_game')return;
    const gid=String(s?.game?.gameId||s?.gameId||s?.game?.id||'').trim();if(!gid)return;
    const old=aramHistoryTracked()[gid];
    if(validRec(old)){
      saveTrackedRecord(gid,{...old,actualChampion:lolAutoSyncResolveChamp(s?.localChampion||{})||old.actualChampion||old.localChampion||'',our:names(s?.inGameOur||s?.ourTeam||s?.team),enemy:names(s?.inGameEnemy||s?.enemyTeam||s?.enemy)});return;
    }
    const sess=aramMatchLabSession(),fresh=sess?.kind==='champ_select'&&now-(Number(sess.updatedAt)||0)<15*60*1000,best=fresh?(sess.bestSnapshot||sess.latestSnapshot):null;
    if(!validRec(best))return;
    const actual=lolAutoSyncResolveChamp(s?.localChampion||{})||best.localChampion||'',our=names(s?.inGameOur||s?.ourTeam||s?.team),enemy=names(s?.inGameEnemy||s?.enemyTeam||s?.enemy),finalParty=our.length===5?our.filter(n=>!(best.external||[]).includes(n)).slice(0,best.partySize||1):[];
    saveTrackedRecord(gid,{...best,replaySchema:SCHEMA,pickSnapshot:true,startedAt:sess.startedAt||best.capturedAt||now,at:now,riotId:s?.account?.riotId||best.riotId||'',actualChampion:actual,finalParty,our,enemy});
    aramMatchLabSaveSession({...sess,kind:'linked',linkedGameId:gid,updatedAt:now});
  }
  function replayRecord(m){const rec=aramHistoryTracked()[String(m?.gameId||'')];return validRec(rec)?rec:null}
  function replayHtml(m){
    const rec=replayRecord(m);if(!rec)return'<div class="matchReplayEmpty"><b>LCU 전적</b><span>유효한 픽창 추천 snapshot이 없습니다. v0.15.15부터는 실제 픽창에서 후보 Pool과 TOP 추천을 기록한 경기만 APP REC로 표시합니다.</span></div>';
    const actual=rec.actualChampion||rec.localChampion||aramHistoryResolveParticipant(m?.me),recs=rec.recommendations||[],top=recs[0],actualParty=(rec.finalParty?.length?rec.finalParty:[actual]).filter(Boolean),withActual=recs.find(x=>actualParty.every(n=>(x.party||[]).includes(n)))||recs.find(x=>(x.party||[]).includes(actual)),captured=rec.capturedAt?new Date(rec.capturedAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'-';
    return `<div class="matchReplayHero"><div><span>APP REC · 실제 픽창 기록</span><b>${esc(actual||'실제 픽 미확인')}</b><small>${rec.partySize||1}인큐 · 리롤 잔여 ${Number(rec.rerollsRemaining)||0} · snapshot ${captured}</small></div><div class="matchReplayVerdict"><span>당시 추천 완성조합</span><b>${top?`#1 · ${(top.party||[]).map(esc).join(' + ')}`:'추천 snapshot 없음'}</b><small>${withActual?`실제 최종픽 포함 최고 추천 #${withActual.rank} · ${Number(withActual.score).toFixed(1)}점`:'실제 최종픽이 TOP5 완성조합에 없었음'}</small></div></div><div class="matchReplayGrid"><div><div class="matchReplayLabel">당시 팀 확정픽</div><div class="historyTeamChips">${(rec.team||[]).map(n=>`<span class="historyChampChip">${aramHistoryIcon(n,'draft')}<span>${esc(n)}</span></span>`).join('')||'-'}</div></div><div><div class="matchReplayLabel">벤치</div><div class="historyTeamChips">${(rec.bench||[]).map(n=>`<span class="historyChampChip">${aramHistoryIcon(n,'draft')}<span>${esc(n)}</span></span>`).join('')||'-'}</div></div><div><div class="matchReplayLabel">후보 Pool</div><div class="historyTeamChips">${(rec.candidatePool||[]).map(n=>`<span class="historyChampChip">${aramHistoryIcon(n,'draft')}<span>${esc(n)}</span></span>`).join('')||'-'}</div></div></div><div class="matchReplayRanks">${recs.map(x=>`<div class="matchReplayRank ${x.rank===1?'top':''}"><span>#${x.rank}</span><b>${(x.party||[]).map(esc).join(' + ')}</b><em>${Number(x.score).toFixed(1)}</em><small>${esc(x.direction||x.reason||'')}</small></div>`).join('')}</div>`;
  }
  try{
    aramTrackLinkedGame=track;
    aramHistoryPickReplayHtml=replayHtml;
    const oldFiltered=aramHistoryFiltered;aramHistoryFiltered=function(){if(aramHistoryState.filter!=='app')return oldFiltered();return (aramHistoryState.matches||[]).filter(m=>!!replayRecord(m))};
    const oldOverall=aramHistoryOverall;aramHistoryOverall=function(matches){const o=oldOverall(matches);if(o)o.appN=(matches||[]).filter(m=>!!replayRecord(m)).length;return o};
    const oldRow=aramHistoryMatchRowHtml;aramHistoryMatchRowHtml=function(m){let h=String(oldRow(m)||'');if(!replayRecord(m))h=h.replace('<span class="historyTracked">● APP REC</span>','');return h};
    const oldSummaryTab=aramHistorySummaryTab;aramHistorySummaryTab=function(m){let h=String(oldSummaryTab(m)||'');if(!replayRecord(m))h=h.replace('<span class="historyTracked">● APP REC</span>','');return h};
    aramHistoryDetailTabsHtml=function(m){const tracked=!!replayRecord(m),tabs=[['summary','요약'],['comp','조합'],['combat','전투'],['build','빌드'],['pick',tracked?'픽 리플레이 · REC':'픽 리플레이'],['feedback','피드백']];return `<div class="matchLabTabs">${tabs.map(([k,l])=>`<button class="matchLabTab ${aramHistoryState.detailTab===k?'active':''} ${k==='pick'&&tracked?'recorded':''}" onclick="aramHistorySetDetailTab('${k}')">${l}</button>`).join('')}</div>`};
    const oldRender=renderAramHistoryFeedback;renderAramHistoryFeedback=function(...args){const r=oldRender.apply(this,args),hint=document.getElementById('historyListHint');if(hint&&aramHistoryState.matches?.length){const targetLabel=aramHistoryAccountLabel(aramHistoryState.account)||(aramHistoryState.targetMode==='searched'?'검색 계정':'내 계정'),pool=aramHistoryFiltered(),cnt=aramHistoryState.matches.filter(m=>!!replayRecord(m)).length;hint.textContent=`${targetLabel} · Queue 450 · 전체 ${aramHistoryState.matches.length}경기 · 현재 ${pool.length}경기 · 10인 상세 ${aramHistoryState.fullTeamCount}/${aramHistoryState.matches.length} · APP REC ${cnt}`};return r};
    if(typeof DATA!=='undefined'){DATA.version=V;DATA.match_lab_replay_v01515={version:'v0.15.15 · Pick Replay REC v2',schema:SCHEMA,valid_rec_requires:'real champ-select recommendation snapshot',state_derived:true,random_tab_required:false,legacy_empty_records_hidden:true}}
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    const info=document.querySelector?.('.dataInfoPanel .callout');if(info&&!String(info.innerHTML||'').includes('Pick Replay REC v2'))info.innerHTML=`<b>v0.15.15:</b> <b>Pick Replay REC v2</b> — 인게임을 봤다는 이유만으로 APP REC를 붙이던 오류를 제거했습니다. 이제 실제 ARAM 픽창에서 팀/벤치/후보 Pool을 읽고 추천 TOP5를 계산한 snapshot이 있어야 REC로 표시합니다. 추천 snapshot 계산은 랜덤연습 탭을 열어두지 않아도 AutoSync 상태에서 직접 수행하며, 픽창 중 가장 정보가 풍부한 snapshot을 게임 ID에 연결합니다.<br><br>`+info.innerHTML;
    window.aramHistoryReplayV01515={validRec,replayRecord,recommendationsFromState,snapshotFromState,scoreSnapshot,track};
    window.__ARAM_MATCH_LAB_REPLAY_V01515__=true;
  }catch(e){console.error('[v0.15.15] Match Lab replay patch failed',e);window.__ARAM_MATCH_LAB_REPLAY_V01515__=false}
})();
