'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01595')}catch{prior=require('../v0.15.95/runtime-source-stability-v01595')}

function countOf(src,needle){return String(src).split(needle).length-1}

function patchCoachV01596(src){
  if(src.includes('const resultSyncV01596='))return src;

  const stateAnchor="  const resultStateV01595={sawLive:false,lastGameKey:'',endedAt:0};";
  if(countOf(src,stateAnchor)!==1)throw new Error(`v0.15.96 result-sync contract mismatch state=${countOf(src,stateAnchor)}`);
  const helpers=`  const resultSyncV01596={active:false,blocking:false,synced:false,failed:false,inFlight:false,attempt:0,nextAt:0,reason:'',baselineKey:'',expectedKey:'',handledEndedAt:0,lastError:''};

  function resultGameKeyV01596(g){return String(g?.gameId||g?.id||g?.metadata?.matchId||'')}
  function newestResultKeyV01596(){const g=historyGamesV01595()[0];return g?resultGameKeyV01596(g):''}
  function requestResultHistorySyncV01596(reason='tab'){
    resultSyncV01596.active=true;resultSyncV01596.blocking=reason==='game-end';resultSyncV01596.synced=false;resultSyncV01596.failed=false;resultSyncV01596.inFlight=false;resultSyncV01596.attempt=0;resultSyncV01596.nextAt=Date.now();resultSyncV01596.reason=reason;resultSyncV01596.baselineKey=newestResultKeyV01596();resultSyncV01596.expectedKey=String(resultStateV01595.lastGameKey||'');resultSyncV01596.lastError='';ui.lastRenderSig='';
  }
  function resultHistoryLoaderV01596(){
    try{const h=historyStateV01595();if(h&&typeof h==='object'){h.queueMode='standard';h.targetMode='current';h.target=null}}
    catch{}
    try{if(typeof loadAramHistory==='function')return Promise.resolve(loadAramHistory(true))}catch(e){return Promise.reject(e)}
    try{if(typeof globalThis.loadAramHistory==='function')return Promise.resolve(globalThis.loadAramHistory(true))}catch(e){return Promise.reject(e)}
    return Promise.reject(new Error('Match Lab history loader unavailable'));
  }
  function freshEndedGameV01596(){
    const key=newestResultKeyV01596();if(!key)return false;if(resultSyncV01596.expectedKey&&key===resultSyncV01596.expectedKey)return true;if(!resultSyncV01596.baselineKey)return true;return key!==resultSyncV01596.baselineKey;
  }
  function finishResultHistorySyncV01596(ok,error=''){
    resultSyncV01596.inFlight=false;resultSyncV01596.lastError=error?String(error):'';
    if(ok){resultSyncV01596.active=false;resultSyncV01596.blocking=false;resultSyncV01596.synced=true;resultSyncV01596.failed=false;ui.lastRenderSig='';return}
    if(resultSyncV01596.attempt>=10){resultSyncV01596.active=false;resultSyncV01596.blocking=resultSyncV01596.reason==='game-end';resultSyncV01596.failed=true;ui.lastRenderSig='';return}
    const waits=[0,1200,2200,3500,5000,8000,12000,15000,15000,15000,15000];resultSyncV01596.nextAt=Date.now()+waits[Math.min(resultSyncV01596.attempt,waits.length-1)];ui.lastRenderSig='';
  }
  function pumpResultHistorySyncV01596(){
    if(!resultSyncV01596.active||resultSyncV01596.inFlight||Date.now()<resultSyncV01596.nextAt)return;if(resultSyncV01596.attempt>=10){finishResultHistorySyncV01596(false,resultSyncV01596.lastError);return}
    resultSyncV01596.inFlight=true;resultSyncV01596.attempt+=1;
    resultHistoryLoaderV01596().then(()=>finishResultHistorySyncV01596(resultSyncV01596.reason==='tab'||freshEndedGameV01596())).catch(e=>finishResultHistorySyncV01596(false,e?.message||e));
  }
  function syncResultHistoryV01596(m){
    if(preview.active)return;if(m?.source==='live')return;
    if(resultStateV01595.endedAt&&resultStateV01595.endedAt!==resultSyncV01596.handledEndedAt){resultSyncV01596.handledEndedAt=resultStateV01595.endedAt;requestResultHistorySyncV01596('game-end')}
    pumpResultHistorySyncV01596();
  }
  function resultSyncSignatureV01596(){return [resultSyncV01596.active,resultSyncV01596.blocking,resultSyncV01596.synced,resultSyncV01596.failed,resultSyncV01596.attempt,resultSyncV01596.lastError].join('|')}
  function renderResultSyncV01596(){
    const tries=Math.min(10,resultSyncV01596.attempt||0);if(resultSyncV01596.failed)return '<div class="ri95Empty"><div><b>방금 경기 결과를 아직 불러오지 못했습니다</b><span>League Client의 전적 반영이 늦을 수 있습니다. 결과 탭을 다시 누르면 즉시 다시 조회합니다.</span></div></div>';
    return '<div class="ri95Empty"><div><b>방금 경기 결과 동기화 중</b><span>League Client / Match Lab에서 종료된 경기를 확인하고 있습니다. 잠시만 기다려 주세요.'+(tries?' · '+tries+'/10회 확인':'')+'</span></div></div>';
  }`;
  src=src.replace(stateAnchor,stateAnchor+'\n'+helpers);

  const resultStart="  function renderResultV01595(){\n    ensureResultStylesV01595();const games=";
  const resultNew="  function renderResultV01595(){\n    ensureResultStylesV01595();if(resultSyncV01596.blocking&&!resultSyncV01596.synced)return renderResultSyncV01596();const games=";
  if(countOf(src,resultStart)!==1)throw new Error(`v0.15.96 result-sync contract mismatch renderer=${countOf(src,resultStart)}`);src=src.replace(resultStart,resultNew);

  const renderHook="    syncResultTransitionV01595(m);\n    const sig=JSON.stringify([";
  const renderNew="    syncResultTransitionV01595(m);\n    syncResultHistoryV01596(m);\n    const sig=JSON.stringify([";
  if(countOf(src,renderHook)!==1)throw new Error(`v0.15.96 result-sync contract mismatch heartbeat=${countOf(src,renderHook)}`);src=src.replace(renderHook,renderNew);

  const sigHook='resultHistorySignatureV01595()]);';
  const sigNew='resultHistorySignatureV01595(),resultSyncSignatureV01596()]);';
  if(countOf(src,sigHook)!==1)throw new Error(`v0.15.96 result-sync contract mismatch signature=${countOf(src,sigHook)}`);src=src.replace(sigHook,sigNew);

  const tabHook="ui.tab=b.dataset.riTab||'live';render(true)";
  const tabNew="ui.tab=b.dataset.riTab||'live';if(ui.tab==='result')requestResultHistorySyncV01596('tab');render(true)";
  if(countOf(src,tabHook)!==1)throw new Error(`v0.15.96 result-sync contract mismatch tab=${countOf(src,tabHook)}`);src=src.replace(tabHook,tabNew);

  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=patchCoachV01596(src);
  return src;
}

module.exports={
  patchRuntimeSource,
  score_logic_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  route_adoption_changed:prior.route_adoption_changed===true,
  ingame_hud_changed:true,
  poro_snax_filtered:prior.poro_snax_filtered===true,
  random_pick_candidate_full_dna_preview_changed:prior.random_pick_candidate_full_dna_preview_changed===true,
  ingame_results_changed:true,
  ingame_results_auto_transition:true,
  ingame_results_history_autorefresh:true,
  ingame_results_retry_count:10,
  ingame_results_force_current_account:true,
  ingame_results_force_standard_aram:true,
  ingame_results_stale_guard:true,
  ingame_results_history_source:'existing Match Lab loader / aramHistoryState',
  policy_version:'0.15.96'
};