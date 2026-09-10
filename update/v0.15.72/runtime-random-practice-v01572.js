'use strict';
(()=>{
  const V='0.15.72';
  if(window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__)return;
  const now=()=>globalThis.performance?.now?.()||Date.now();
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  // Several historical UI layers attach document/body-wide MutationObservers even though
  // they only decorate one view. Random Practice now performs large DOM replacements, so
  // those observers can turn one click into repeated full-page scans/layout reads.
  const NativeMutationObserver=window.MutationObserver;
  const nativeDocAdd=document.addEventListener.bind(document);
  const nativeDocRemove=document.removeEventListener.bind(document);
  const suppressedObserverOwners=new Set([
    'random-practice-focus-v01549.js',
    'random-pick-density-v01555.js',
    'runtime-performance-v01568.js',
    'in-app-updater-ui-v01523.js',
    'player-profile-data-sticky-v01521.js'
  ]);
  const suppressedDocumentEvents=new Map([
    ['random-pick-density-v01555.js',new Set(['input','click'])],
    ['runtime-performance-v01568.js',new Set(['input','change','click','visibilitychange'])],
    ['player-profile-data-sticky-v01521.js',new Set(['click'])]
  ]);
  const ownerNow=()=>String(window.__ARAM_LOADING_RUNTIME_V01572__||'');
  const counters={observerSuppressed:0,documentListenerSuppressed:0,maintenance:0,maintenanceCoalesced:0,comboRuns:0,comboCancels:0,comboYields:0,comboTeams:0,maxChunkMs:0,analysisDeferred:0,detailsDeferred:0,longTasks:0,maxTaskMs:0,partyPaints:0,partySkips:0};

  if(typeof NativeMutationObserver==='function'){
    window.MutationObserver=class AramScopedMutationObserverV01572{
      constructor(cb){this.owner=ownerNow();this.suppressed=suppressedObserverOwners.has(this.owner);this.native=null;if(this.suppressed){counters.observerSuppressed++;return}this.native=new NativeMutationObserver(cb)}
      observe(...a){return this.native?.observe?.(...a)}
      disconnect(){return this.native?.disconnect?.()}
      takeRecords(){return this.native?.takeRecords?.()||[]}
    };
  }
  document.addEventListener=function(type,listener,options){const owner=ownerNow(),blocked=suppressedDocumentEvents.get(owner);if(blocked?.has(type)){counters.documentListenerSuppressed++;return}return nativeDocAdd(type,listener,options)};
  document.removeEventListener=function(type,listener,options){return nativeDocRemove(type,listener,options)};

  // v0.15.58 is replaced by the single owner below. This prevents its 650 ms poll,
  // subtree observer, and broad input/click listeners while preserving its public contract.
  window.__ARAM_RANDOM_PARTY_PICKS_V01558__=true;

  let maintenanceTimer=0,analysisTimer=0,detailTimer=0,comboTimer=0,comboGeneration=0;
  let maintenanceBusy=false,analysisBusy=false,detailBusy=false,comboBusy=false,lastPartySig='',lastAutoSig='';
  let finished=false;
  const scoreCache=new Map();
  const original={renderInputs:window.renderRandomInputs,renderAnalysis:window.renderRandomAnalysis,renderDetails:window.renderRandomDetails,runCombos:window.runRandomCombos,autoPoll:window.lolAutoSyncPoll};

  function randomMode(){try{if(typeof randomViewMode!=='undefined')return randomViewMode}catch{}return $('#random')?.getAttribute?.('data-random-mode')||'pick'}
  function randomVisible(){return !!$('#random.active')}
  function pickVisible(){return randomVisible()&&randomMode()!=='ingame'}
  function timed(fn){const a=now();try{return fn()}finally{const ms=Math.max(0,now()-a);if(ms>=90)counters.longTasks++;counters.maxTaskMs=Math.max(counters.maxTaskMs,ms)}}
  function resolveChamp(x){try{if(typeof lolAutoSyncResolveChamp==='function')return String(lolAutoSyncResolveChamp(x)||'').trim()}catch{}if(!x)return'';if(typeof x==='string')return x.trim();return String(x.championName||x.name||x.displayName||x.alias||'').trim()}
  function unique(xs){const out=[];for(const x of xs||[]){const n=resolveChamp(x);if(n&&!out.includes(n))out.push(n)}return out}
  function liveState(){try{return typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState:null}catch{return null}}
  function partyPicks(s=liveState()){if(!s||s.phase!=='champ_select'||!s.isAram)return[];const q=Math.max(1,Math.min(5,Number(s.partySize)||1)),external=new Set(unique(s.external||[])),picks=unique(s.party||[]),local=resolveChamp(s.localChampion);if(local&&!picks.includes(local))picks.push(local);if(picks.length<q){for(const n of unique(s.team||[])){if(external.has(n)||picks.includes(n))continue;picks.push(n);if(picks.length>=q)break}}return picks.slice(0,q)}
  function manualAt(i){try{return String(randomState?.manual?.[i]||'').trim()}catch{return''}}
  function profile(n){try{return typeof byName!=='undefined'?byName?.[n]||null:null}catch{return null}}
  function portrait(n){try{if(typeof draftPortraitHtml==='function')return draftPortraitHtml(n,'pick')}catch{}return `<div class="randomMiniPortrait">${esc(n.slice(0,2)||'?')}</div>`}
  function ensurePartyStyle(){if($('#rp72PartyStyle'))return;const st=document.createElement('style');st.id='rp72PartyStyle';st.textContent=`#random #manualPartyInputs .randomDraftRow.rp72LiveParty{border-radius:9px;background:linear-gradient(90deg,#0b2134 0,#091625 62%);box-shadow:inset 2px 0 0 #4ca9e8;padding:4px 5px 4px 4px}#random #manualPartyInputs .rp72PartyGhost{pointer-events:none;position:absolute;z-index:2;left:11px;right:34px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:7px;min-width:0}#random #manualPartyInputs .rp72PartyGhost b{color:#e9f5ff;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#random #manualPartyInputs .rp72PartyGhost small{color:#7698b8;font-size:8px;white-space:nowrap}#random #manualPartyInputs .searchWrap.rp72PartyWrap{position:relative}#random #manualPartyInputs .searchWrap.rp72PartyWrap:focus-within .rp72PartyGhost{display:none}#random #poolInputs .randomPoolItem.rp72TeamPick{border-radius:8px;background:#0c2033;box-shadow:inset 2px 0 0 #4ca9e8;padding-left:3px}#random #poolInputs .rp72PoolBadge{display:block;margin-top:2px;font-size:7px;line-height:1.1;font-weight:950;white-space:nowrap;color:#83d1ff}#random #poolInputs .randomPoolItem.externalTaken .rp72PoolBadge{display:none!important}`;document.head.appendChild(st)}
  function paintPartyState(s=liveState()){if(!pickVisible())return;const picks=partyPicks(s),sig=JSON.stringify([picks,(()=>{try{return randomState?.manual||[]}catch{return[]}})(),(()=>{try{return randomState?.pool||[]}catch{return[]}})(),(()=>{try{return randomState?.external||[]}catch{return[]}})()]);if(sig===lastPartySig){counters.partySkips++;return}lastPartySig=sig;counters.partyPaints++;ensurePartyStyle();$$('#manualPartyInputs .randomDraftRow').forEach((row,i)=>{const locked=manualAt(i),pick=picks[i]||'',wrap=$('.searchWrap',row),portraitHost=$(`[data-random-key="manual-${i}"]`,row),meta=$('.meta',row),tier=$('.tier',row);let ghost=$('.rp72PartyGhost',row);if(locked||!pick){row.classList.remove('rp72LiveParty');wrap?.classList?.remove('rp72PartyWrap');ghost?.remove();if(portraitHost?.dataset?.rp72PartyPick){portraitHost.innerHTML='<div class="randomMiniPortrait">·</div>';delete portraitHost.dataset.rp72PartyPick}return}row.classList.add('rp72LiveParty');wrap?.classList?.add('rp72PartyWrap');if(portraitHost&&portraitHost.dataset.rp72PartyPick!==pick){portraitHost.innerHTML=portrait(pick);portraitHost.dataset.rp72PartyPick=pick}const c=profile(pick);if(meta&&meta.textContent!==(c?.['주 역할']||'-'))meta.textContent=c?.['주 역할']||'-';if(tier&&tier.textContent!==(c?.['종합티어']||'-'))tier.textContent=c?.['종합티어']||'-';if(wrap){if(!ghost){ghost=document.createElement('div');ghost.className='rp72PartyGhost';wrap.appendChild(ghost)}if(ghost.dataset.name!==pick){ghost.dataset.name=pick;ghost.innerHTML=`<b>${esc(pick)}</b><small>팀원 현재픽 · 수동 고정 아님</small>`}}});const team=new Set([...picks,...(()=>{try{return unique(randomState?.manual||[])}catch{return[]}})()]);$$('#poolInputs .randomPoolItem').forEach(item=>{const inp=$('.searchInput',item),name=String(inp?.dataset?.committed||inp?.value||'').trim(),external=!!$('.randomPoolTakenBadge',item),desired=!!name&&team.has(name)&&!external;item.classList.toggle('rp72TeamPick',desired);let badge=$('.rp72PoolBadge',item);if(desired&&!badge){const slot=$('.slot',item);if(slot){badge=document.createElement('span');badge.className='rp72PoolBadge';badge.textContent='팀원픽';badge.title='우리 파티가 현재 들고 있는 챔피언';slot.appendChild(badge)}}else if(!desired&&badge)badge.remove()})}

  function maintenance(){maintenanceTimer=0;if(maintenanceBusy||!randomVisible())return;maintenanceBusy=true;counters.maintenance++;try{window.aramRandomPracticeFocusV01549?.refresh?.();window.aramRandomPickDensityV01555?.refresh?.();paintPartyState();window.aramRuntimePerformanceV01568?.refresh?.()}catch(e){console.warn(`[v${V}] Random maintenance failed`,e)}finally{maintenanceBusy=false}}
  function scheduleMaintenance(delay=35){if(!randomVisible())return;if(maintenanceTimer)counters.maintenanceCoalesced++;clearTimeout(maintenanceTimer);maintenanceTimer=setTimeout(maintenance,Math.max(0,delay|0))}
  function scheduleDetails(delay=130){if(!pickVisible()||typeof original.renderDetails!=='function')return typeof original.renderDetails==='function'?original.renderDetails():undefined;counters.detailsDeferred++;clearTimeout(detailTimer);detailTimer=setTimeout(()=>{detailTimer=0;if(detailBusy||!pickVisible())return;detailBusy=true;try{timed(()=>original.renderDetails())}catch(e){console.warn(`[v${V}] deferred Random details failed`,e)}finally{detailBusy=false;scheduleMaintenance(20)}},Math.max(0,delay|0))}
  function scheduleAnalysis(delay=80){if(!pickVisible()||typeof original.renderAnalysis!=='function')return typeof original.renderAnalysis==='function'?original.renderAnalysis():undefined;counters.analysisDeferred++;clearTimeout(analysisTimer);analysisTimer=setTimeout(()=>{analysisTimer=0;if(analysisBusy||!pickVisible())return;analysisBusy=true;try{timed(()=>original.renderAnalysis())}catch(e){console.warn(`[v${V}] deferred Random analysis failed`,e)}finally{analysisBusy=false;scheduleMaintenance(20)}},Math.max(0,delay|0))}

  if(typeof original.renderInputs==='function'){const wrapped=function(...a){const r=original.renderInputs.apply(this,a);lastPartySig='';scheduleMaintenance(0);return r};try{renderRandomInputs=wrapped}catch{};try{window.renderRandomInputs=wrapped}catch{}}
  if(typeof original.renderDetails==='function'){const wrapped=function(...a){if(pickVisible())return scheduleDetails(130);return original.renderDetails.apply(this,a)};try{renderRandomDetails=wrapped}catch{};try{window.renderRandomDetails=wrapped}catch{}}
  if(typeof original.renderAnalysis==='function'){const wrapped=function(...a){if(pickVisible())return scheduleAnalysis(75);return original.renderAnalysis.apply(this,a)};try{renderRandomAnalysis=wrapped}catch{};try{window.renderRandomAnalysis=wrapped}catch{}}
  if(typeof original.autoPoll==='function'){const wrapped=async function(...a){const s=await original.autoPoll.apply(this,a);const ps=partyPicks(s),sig=JSON.stringify([s?.phase||'',s?.gameId||0,ps,unique(s?.external||[]),unique(s?.candidatePool||[])]);if(sig!==lastAutoSig){lastAutoSig=sig;lastPartySig='';scheduleMaintenance(20)}return s};try{lolAutoSyncPoll=wrapped}catch{};try{window.lolAutoSyncPoll=wrapped}catch{}}

  function modeKey(names,modes){const xs=(names||[]).filter(Boolean);return xs.join('\u0001')+'\u0002'+xs.map(n=>`${n}:${String(modes?.[n]||'자동')}`).join('|')}
  function scoreTeam(names,modes){const k=modeKey(names,modes);if(scoreCache.has(k))return scoreCache.get(k);const v=teamScore(names,modes);scoreCache.set(k,v);if(scoreCache.size>6500)scoreCache.clear();return v}
  function comboCmp(a,b){return b.score-a.score||a.party.join('|').localeCompare(b.party.join('|'),'ko')}
  function makeCombo(plan,sel){const party=[...plan.locked,...sel],names=[...plan.external,...party],ts=scoreTeam(names,randomState.ourModes);return{sel:[...sel],party,locked:[...plan.locked],names,score:ts.s,direction:ts.direction,reason:ts.reason,warning:ts.warning,structure:ts.structure,parts:ts.parts,pair:ts.pair,totalCombos:plan.totalCombos,provisional:plan.provisional}}
  function* comboIter(arr,k,start=0,p=[]){if(p.length===k){yield [...p];return}for(let i=start;i<=arr.length-(k-p.length);i++){p.push(arr[i]);yield* comboIter(arr,k,i+1,p);p.pop()}}
  function finishCombo(plan,raw,token){if(token!==comboGeneration){counters.comboCancels++;return}randomState.combos=raw;randomState.selectedCombo=Math.min(randomState.selectedCombo,Math.max(0,raw.length-1));randomState.shortlist=[...plan.pool];randomState.lastComboCount=plan.totalCombos;try{persist()}catch{};try{renderRandomComboResults()}catch{};try{renderComboDetail()}catch{};try{renderExternalCheck()}catch{};scheduleAnalysis(45);lastPartySig='';scheduleMaintenance(0)}
  function failCombo(plan,token,kind){if(token!==comboGeneration)return;const result=$('#comboResults'),detail=$('#comboDetail');randomState.combos=[];if(kind==='duplicate'){if(result)result.innerHTML=`<div class="emptyState">고정픽 중복: <b>${plan.duplicates.join(' · ')}</b><br>같은 챔피언은 한 팀에 두 번 선택할 수 없습니다.</div>`}else if(result){result.innerHTML=`<div class="emptyState">수동 고정 ${plan.locked.length}명 · 남은 추천 ${plan.needed}명에 필요한 후보가 부족합니다.</div>`}if(detail)detail.innerHTML='';try{persist()}catch{};try{renderExternalCheck()}catch{};scheduleAnalysis(45);lastPartySig='';scheduleMaintenance(0)}
  function runCombosCooperative(){const token=++comboGeneration;counters.comboRuns++;clearTimeout(comboTimer);comboTimer=setTimeout(()=>{comboTimer=0;if(token!==comboGeneration)return;let plan;try{plan=randomDraftPlan()}catch(e){console.error(`[v${V}] Random plan failed`,e);return}if(plan.duplicates?.length){failCombo(plan,token,'duplicate');return}if(plan.pool.length<plan.needed){failCombo(plan,token,'short');return}if(plan.needed===0){finishCombo(plan,[makeCombo(plan,[])],token);return}const iter=comboIter(plan.pool,plan.needed),top=[];let done=false,processed=0;const result=$('#comboResults');if(plan.totalCombos>120&&result)result.innerHTML=`<div class="emptyState" data-rp72-progress>완성 조합 계산 중 · 0 / ${Number(plan.totalCombos).toLocaleString()}<br><span class="muted">화면을 멈추지 않도록 나눠서 전수 계산합니다.</span></div>`;comboBusy=true;const step=()=>{if(token!==comboGeneration){comboBusy=false;counters.comboCancels++;return}const a=now();let n=0;try{while(n<28&&now()-a<11){const it=iter.next();if(it.done){done=true;break}const row=makeCombo(plan,it.value);processed++;counters.comboTeams++;top.push(row);top.sort(comboCmp);if(top.length>5)top.pop();n++}}catch(e){comboBusy=false;console.error(`[v${V}] cooperative combo calculation failed`,e);return}const ms=Math.max(0,now()-a);counters.maxChunkMs=Math.max(counters.maxChunkMs,ms);const progress=$('[data-rp72-progress]');if(progress&&processed%112<28)progress.firstChild.textContent=`완성 조합 계산 중 · ${processed.toLocaleString()} / ${Number(plan.totalCombos).toLocaleString()}`;if(done){comboBusy=false;finishCombo(plan,top.sort(comboCmp),token);return}counters.comboYields++;setTimeout(step,0)};step()},0)}
  if(typeof original.runCombos==='function'){const wrapped=function(){runCombosCooperative()};wrapped.__aramOriginal=original.runCombos;try{runRandomCombos=wrapped}catch{};try{window.runRandomCombos=wrapped}catch{}}

  nativeDocAdd('click',e=>{if(!e.target?.closest?.('#random'))return;const tab=e.target.closest('button[data-rp49]');if(tab&&(tab.dataset.rp49==='analysis'||tab.dataset.rp49==='detail'))setTimeout(()=>{scheduleAnalysis(0);scheduleDetails(20)},0);else scheduleMaintenance(45)},true);
  nativeDocAdd('change',e=>{if(e.target?.closest?.('#random'))scheduleMaintenance(20)},true);
  nativeDocAdd('visibilitychange',()=>{if(document.visibilityState==='visible'&&randomVisible())scheduleMaintenance(20)},{passive:true});
  window.addEventListener('focus',()=>{if(randomVisible())scheduleMaintenance(20)},{passive:true});
  try{if(typeof PerformanceObserver==='function'&&PerformanceObserver.supportedEntryTypes?.includes?.('longtask')){const po=new PerformanceObserver(list=>{for(const e of list.getEntries()){const d=Number(e.duration)||0;counters.longTasks++;counters.maxTaskMs=Math.max(counters.maxTaskMs,d)}});po.observe({entryTypes:['longtask']})}}catch{}

  function finishBootstrap(){if(finished)return;finished=true;window.__ARAM_LOADING_RUNTIME_V01572__='';scheduleMaintenance(0)}
  window.aramRandomPartyPicksV01558={version:V,refresh:()=>{lastPartySig='';paintPartyState()},party_current_pick_is_display_only:true,pool_party_badge:'팀원픽',delegated_to:'v0.15.72 single owner',score_logic_changed:false};
  window.aramRandomPracticeRuntimeV01572={version:V,finishBootstrap,refresh:()=>scheduleMaintenance(0),cancelCombos:()=>{comboGeneration++;clearTimeout(comboTimer);comboBusy=false},getStats:()=>({version:V,finished,randomVisible:randomVisible(),mode:randomMode(),comboBusy,scoreCache:scoreCache.size,counters:{...counters},score_logic_changed:false}),architecture:'bootstrap observer gate + single Random owner + cooperative exhaustive TOP5 + lazy analysis/details',score_logic_changed:false};
  window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__=true;
})();
