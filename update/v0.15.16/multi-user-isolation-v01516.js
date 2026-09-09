'use strict';
(()=>{
  const V='0.15.16';
  const SCOPE_TAG='::aram-user::';
  const MIGRATION_KEY='aram_multiuser_isolation_migration_v01516';
  const ISOLATED=new Set([
    'aram_fearless_v04_state','aram_fearless_v02_state',
    'aram_match_lab_favorites_v1',
    'aramFearless_matchLabSession_v1','aramFearless_aramHistoryTracked_v2','aramFearless_aramHistoryTracked_v1',
    'aram_online_session_v078','aram_online_spectator_name','aram_online_guest_team','aram_online_host_team',
    'aramRandomViewMode','aramRandomIngameTab'
  ]);
  const TRANSIENT_COPY_ON_ACTIVATE=new Set(['aram_online_session_v078','aram_online_spectator_name','aram_online_guest_team','aram_online_host_team']);
  let activeOwner='',activeAccount=null,switching=false;

  function ownerHash(puuid){
    const s=String(puuid||'');let h=1469598103934665603n;
    for(let i=0;i<s.length;i++){h^=BigInt(s.charCodeAt(i));h=BigInt.asUintN(64,h*1099511628211n)}
    return h.toString(36);
  }
  const scoped=(key,owner=activeOwner)=>`${String(key)}${SCOPE_TAG}${ownerHash(owner)}`;
  const storage=window.localStorage;
  const proto=(typeof Storage!=='undefined'&&storage instanceof Storage)?Storage.prototype:null;
  const nativeGet=proto?Storage.prototype.getItem:storage.getItem;
  const nativeSet=proto?Storage.prototype.setItem:storage.setItem;
  const nativeRemove=proto?Storage.prototype.removeItem:storage.removeItem;
  const rawGet=k=>nativeGet.call(storage,String(k));
  const rawSet=(k,v)=>nativeSet.call(storage,String(k),String(v));
  const rawRemove=k=>nativeRemove.call(storage,String(k));
  const routeKey=k=>activeOwner&&ISOLATED.has(String(k))?scoped(k):String(k);
  function getItem(k){return nativeGet.call(this,this===storage?routeKey(k):String(k))}
  function setItem(k,v){return nativeSet.call(this,this===storage?routeKey(k):String(k),String(v))}
  function removeItem(k){return nativeRemove.call(this,this===storage?routeKey(k):String(k))}
  try{
    if(proto){Object.defineProperty(proto,'getItem',{value:getItem,writable:true,configurable:true});Object.defineProperty(proto,'setItem',{value:setItem,writable:true,configurable:true});Object.defineProperty(proto,'removeItem',{value:removeItem,writable:true,configurable:true})}
    else{storage.getItem=getItem.bind(storage);storage.setItem=setItem.bind(storage);storage.removeItem=removeItem.bind(storage)}
  }catch(e){console.error('[v0.15.16] storage routing install failed',e)}

  const puuidOf=a=>String(a?.puuid||'').trim();
  const currentStateAccount=()=>{
    try{return lolAutoSync?.lastState?.account||aramHistoryState?.localAccount||null}catch{return null}
  };
  function migrateFirstOwner(owner){
    let marker=null;try{marker=JSON.parse(rawGet(MIGRATION_KEY)||'null')}catch{}
    const first=!marker?.ownerHash;
    for(const key of ISOLATED){
      const base=rawGet(key),dest=scoped(key,owner);
      if(base!==null&&rawGet(dest)===null&&(first||TRANSIENT_COPY_ON_ACTIVATE.has(key)))rawSet(dest,base);
    }
    if(first)rawSet(MIGRATION_KEY,JSON.stringify({version:1,ownerHash:ownerHash(owner),migratedAt:Date.now()}));
    // Base keys are never a shared user profile after isolation is active. Removing them also
    // prevents a previous Riot user's draft/favorites from flashing on the next app boot.
    for(const key of ISOLATED)rawRemove(key);
  }
  function enrichOwnerData(owner){
    try{
      const k=scoped('aramFearless_aramHistoryTracked_v2',owner),x=JSON.parse(rawGet(k)||'{}')||{};let changed=false;
      for(const [gid,rec] of Object.entries(x)){if(rec&&typeof rec==='object'&&!rec.ownerPuuid){x[gid]={...rec,ownerPuuid:owner,ownerRiotId:String(activeAccount?.riotId||rec.riotId||'')};changed=true}}
      if(changed)rawSet(k,JSON.stringify(x));
    }catch{}
    try{
      const k=scoped('aramFearless_matchLabSession_v1',owner),x=JSON.parse(rawGet(k)||'null');if(x&&typeof x==='object'&&!x.ownerPuuid)rawSet(k,JSON.stringify({...x,ownerPuuid:owner,ownerRiotId:String(activeAccount?.riotId||x.riotId||'')}));
    }catch{}
  }
  function clearHistoryRuntime(){
    try{Object.assign(aramHistoryState,{loading:false,error:'',matches:[],selectedGameId:'',loadedAt:0,account:null,localAccount:activeAccount?{...activeAccount}:null,target:null,targetMode:'current',source:'',scanned:0,fullTeamCount:0,errors:[],filter:'all',detailTab:'summary'})}catch{}
  }
  function applyUserState(){
    try{
      const loaded=loadAppState();state=loaded.state;randomState=loaded.randomState;
      clearHistoryRuntime();
      if(typeof renderAll==='function')renderAll();
      window.aramHistoryFavoritesV01514?.render?.();
    }catch(e){console.error('[v0.15.16] user state restore failed',e)}
  }
  function beforeOwnerSwitch(){
    try{persist?.()}catch{}
    try{onlinePersistSession?.()}catch{}
    try{if(typeof onlineRole!=='undefined'&&onlineRole)onlineCleanup(false,false)}catch{}
  }
  function activateOwner(puuid,account=null){
    puuid=String(puuid||'').trim();if(!puuid||puuid===activeOwner||switching)return !!puuid;
    switching=true;
    try{
      if(activeOwner)beforeOwnerSwitch();
      activeOwner=puuid;activeAccount=account&&typeof account==='object'?{...account,puuid}:({puuid});
      migrateFirstOwner(activeOwner);enrichOwnerData(activeOwner);applyUserState();
      try{setTimeout(()=>{if(typeof onlineRestoreSavedSession==='function')onlineRestoreSavedSession()},80)}catch{}
      try{const meta=document.getElementById('lolSyncAccountMeta');if(meta&&!String(meta.textContent||'').includes('사용자별 저장소'))meta.textContent=(meta.textContent?meta.textContent+' · ':'')+'사용자별 저장소 격리 ON'}catch{}
      return true;
    }finally{switching=false}
  }

  // Do not auto-restore a shared mock-draft session before the Riot account owner is known.
  try{
    const baseRestore=onlineRestoreSavedSession;
    onlineRestoreSavedSession=function(...args){if(!activeOwner)return false;return baseRestore.apply(this,args)};
  }catch{}

  // Tag every REC/session written after v0.15.16 with its local Riot owner.
  try{
    const oldSaveSession=aramMatchLabSaveSession;
    aramMatchLabSaveSession=function(v){if(v&&activeOwner)v={...v,ownerPuuid:activeOwner,ownerRiotId:String(activeAccount?.riotId||v.riotId||'')};return oldSaveSession(v)};
    const oldSaveTracked=aramHistorySaveTracked;
    aramHistorySaveTracked=function(v){
      if(v&&activeOwner){const x={};for(const [gid,rec] of Object.entries(v||{}))x[gid]=rec&&typeof rec==='object'?{...rec,ownerPuuid:rec.ownerPuuid||activeOwner,ownerRiotId:rec.ownerRiotId||String(activeAccount?.riotId||rec.riotId||'')}:rec;v=x}
      return oldSaveTracked(v)
    };
    const oldTrack=aramTrackLinkedGame;
    aramTrackLinkedGame=function(s){
      const p=puuidOf(s?.account);if(p&&!activeOwner)activateOwner(p,s.account);if(!activeOwner||!p||p!==activeOwner)return;
      return oldTrack(s)
    };
  }catch(e){console.error('[v0.15.16] REC owner tagging failed',e)}

  function viewedPuuid(m){return String(m?.me?.player?.puuid||m?.me?.puuid||aramHistoryState?.account?.puuid||'').trim()}
  function safeReplayRecord(m){
    try{
      const rec=window.aramHistoryReplayV01515?.replayRecord?.(m);if(!rec||!activeOwner)return null;
      const rp=String(rec.ownerPuuid||'').trim(),mp=viewedPuuid(m);
      return rp===activeOwner&&(!mp||mp===activeOwner)?rec:null
    }catch{return null}
  }
  function replayEmpty(){return '<div class="matchReplayEmpty"><b>LCU 전적</b><span>이 경기는 현재 로그인 Riot 계정 소유의 APP REC가 아닙니다. 친구 전적이나 다른 Riot 계정의 기록에는 내 픽 리플레이를 표시하지 않습니다.</span></div>'}
  try{
    const oldReplayHtml=aramHistoryPickReplayHtml;aramHistoryPickReplayHtml=function(m){return safeReplayRecord(m)?oldReplayHtml(m):replayEmpty()};
    const oldFiltered=aramHistoryFiltered;aramHistoryFiltered=function(){if(aramHistoryState.filter!=='app')return oldFiltered();return (aramHistoryState.matches||[]).filter(m=>!!safeReplayRecord(m))};
    const oldOverall=aramHistoryOverall;aramHistoryOverall=function(matches){const o=oldOverall(matches);if(o)o.appN=(matches||[]).filter(m=>!!safeReplayRecord(m)).length;return o};
    const oldRow=aramHistoryMatchRowHtml;aramHistoryMatchRowHtml=function(m){let h=String(oldRow(m)||'');if(!safeReplayRecord(m))h=h.replace('<span class="historyTracked">● APP REC</span>','');return h};
    const oldSummary=aramHistorySummaryTab;aramHistorySummaryTab=function(m){let h=String(oldSummary(m)||'');if(!safeReplayRecord(m))h=h.replace('<span class="historyTracked">● APP REC</span>','');return h};
    aramHistoryDetailTabsHtml=function(m){const tracked=!!safeReplayRecord(m),tabs=[['summary','요약'],['comp','조합'],['combat','전투'],['build','빌드'],['pick',tracked?'픽 리플레이 · REC':'픽 리플레이'],['feedback','피드백']];return `<div class="matchLabTabs">${tabs.map(([k,l])=>`<button class="matchLabTab ${aramHistoryState.detailTab===k?'active':''} ${k==='pick'&&tracked?'recorded':''}" onclick="aramHistorySetDetailTab('${k}')">${l}</button>`).join('')}</div>`};
    const oldRender=renderAramHistoryFeedback;renderAramHistoryFeedback=function(...args){const r=oldRender.apply(this,args);try{const hint=document.getElementById('historyListHint');if(hint&&aramHistoryState.matches?.length){const targetLabel=aramHistoryAccountLabel(aramHistoryState.account)||(aramHistoryState.targetMode==='searched'?'검색 계정':'내 계정'),pool=aramHistoryFiltered(),cnt=aramHistoryState.matches.filter(m=>!!safeReplayRecord(m)).length;hint.textContent=`${targetLabel} · Queue 450 · 전체 ${aramHistoryState.matches.length}경기 · 현재 ${pool.length}경기 · 10인 상세 ${aramHistoryState.fullTeamCount}/${aramHistoryState.matches.length} · APP REC ${cnt}`}}catch{}return r};
  }catch(e){console.error('[v0.15.16] REC ownership gate failed',e)}

  function syncOwner(){
    try{const a=currentStateAccount(),p=puuidOf(a);if(p&&p!==activeOwner)activateOwner(p,a)}catch{}
  }
  const timer=setInterval(syncOwner,320);setTimeout(syncOwner,0);
  window.addEventListener('beforeunload',()=>{try{persist?.();onlinePersistSession?.()}catch{}});

  try{
    if(typeof DATA!=='undefined'){
      DATA.version=V;DATA.multi_user_isolation_v01516={version:'v0.15.16 · Riot PUUID User Isolation',scope:'per local Riot PUUID',isolated:['draft/series/random state','Match Lab favorites','APP REC/session','mock-draft restore session'],shared_machine_preferences:['BGM/SFX','AutoSync toggle','regression UI'],rec_owner_gate:true,friend_history_rec_leak:false,cross_device_live_state:false};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    const info=document.querySelector?.('.dataInfoPanel .callout');if(info&&!String(info.innerHTML||'').includes('Riot PUUID User Isolation'))info.innerHTML=`<b>v0.15.16:</b> <b>Riot PUUID User Isolation</b> — 같은 PC에서 Riot 계정을 바꿔도 드래프트/시리즈/랜덤연습 상태, 친구 즐겨찾기, Match Lab APP REC, 모의밴픽 복구 세션을 로그인 계정 PUUID별 로컬 저장소로 분리합니다. 계정 변경 시 이전 계정의 임시 픽창 세션과 온라인 연결을 넘기지 않으며, 친구 전적을 볼 때 내 APP REC가 그 친구의 REC처럼 표시되지 않도록 소유자 PUUID를 검증합니다. BGM/SFX와 AutoSync ON/OFF 같은 장치 환경설정만 PC 공용으로 유지합니다.<br><br>`+info.innerHTML;
  }catch{}
  window.aramMultiUserIsolationV01516={activateOwner,get activeOwner(){return activeOwner},ownerHash,scoped,safeReplayRecord,isolated:[...ISOLATED],rawGet,rawSet,rawRemove,syncOwner};
  window.__ARAM_MULTI_USER_ISOLATION_V01516__=true;
})();
