'use strict';
(()=>{
  const V='0.15.17';
  const PREF='aram_match_lab_queue_mode_v01517';
  const MODES={standard:{key:'standard',queueId:450,label:'일반 칼바람',short:'일반',source:'LCU Q450 ARAM'},mayhem:{key:'mayhem',queueId:2400,label:'아수라장',short:'아수라장',source:'LCU Q2400 MAYHEM'}};
  const getMode=()=>aramHistoryState?.queueMode==='mayhem'?'mayhem':'standard';
  const meta=()=>MODES[getMode()];
  function initialMode(){try{return localStorage.getItem(PREF)==='mayhem'?'mayhem':'standard'}catch{return 'standard'}}
  function installStyle(){
    if(document.getElementById('matchLabQueueV01517Style'))return;
    const s=document.createElement('style');s.id='matchLabQueueV01517Style';s.textContent=`
.historyQueueSwitch{display:inline-flex;align-items:center;gap:4px;margin-top:7px;padding:3px;border:1px solid #29445e;border-radius:10px;background:#081624}.historyQueueBtn{border:0;border-radius:7px;background:transparent;color:#7891ab;padding:6px 10px;font-size:9px;font-weight:950;cursor:pointer;white-space:nowrap}.historyQueueBtn:hover{background:#10283d;color:#cfe5f5}.historyQueueBtn.active{background:#123a5a;color:#9edaff;box-shadow:inset 0 0 0 1px #3478a6}.historyQueueBtn.mayhem.active{background:#38204e;color:#e2bdff;box-shadow:inset 0 0 0 1px #8453ad}.historyQueueBtn small{font-size:7px;opacity:.72;margin-left:4px}.historyQueueNote{margin-left:7px;color:#657e96;font-size:8px}.historyQueueNote b{color:#9fb8cd}
`;
    document.head.appendChild(s);
  }
  function installUI(){
    const list=document.getElementById('historyMatchList'),panel=list?.closest?.('.panel'),hint=document.getElementById('historyListHint');if(!panel||!hint)return false;
    if(!document.getElementById('historyQueueSwitch')){
      const wrap=document.createElement('div');wrap.id='historyQueueSwitch';wrap.className='historyQueueSwitch';wrap.innerHTML=`<button type="button" class="historyQueueBtn" data-qmode="standard">일반 칼바람 <small>Q450</small></button><button type="button" class="historyQueueBtn mayhem" data-qmode="mayhem">아수라장 <small>Q2400</small></button><span class="historyQueueNote">두 모드는 <b>완전 분리 조회</b></span>`;
      hint.insertAdjacentElement('afterend',wrap);
      wrap.querySelectorAll('[data-qmode]').forEach(b=>b.addEventListener('click',()=>aramHistorySetQueueMode(b.dataset.qmode)));
    }
    return true;
  }
  function renderModeUI(){
    installStyle();installUI();const m=meta();
    document.querySelectorAll('#historyQueueSwitch [data-qmode]').forEach(b=>b.classList.toggle('active',b.dataset.qmode===m.key));
    const src=document.getElementById('historySourceBadge');if(src)src.textContent=m.source;
    const hint=document.getElementById('historyListHint');
    if(hint&&aramHistoryState?.matches?.length){
      const targetLabel=aramHistoryAccountLabel(aramHistoryState.account)||(aramHistoryState.targetMode==='searched'?'검색 계정':'내 계정'),pool=aramHistoryFiltered(),cnt=aramHistoryState.matches.filter(x=>{try{return !!window.aramHistoryReplayV01515?.replayRecord?.(x)}catch{return false}}).length;
      hint.textContent=`${targetLabel} · ${m.label} / Queue ${m.queueId} · 전체 ${aramHistoryState.matches.length}경기 · 현재 ${pool.length}경기 · 10인 상세 ${aramHistoryState.fullTeamCount}/${aramHistoryState.matches.length} · APP REC ${m.key==='standard'?cnt:0}`;
    }else if(hint&&!aramHistoryState?.loading&&!aramHistoryState?.error){hint.textContent=`${m.label}(Queue ${m.queueId}) 전적을 불러오면 최신순으로 표시됩니다.`}
  }
  async function setQueueMode(mode){
    mode=mode==='mayhem'?'mayhem':'standard';if(!aramHistoryState)return;
    const changed=getMode()!==mode;aramHistoryState.queueMode=mode;
    try{localStorage.setItem(PREF,mode)}catch{}
    if(changed){aramHistoryState.matches=[];aramHistoryState.selectedGameId='';aramHistoryState.detailTab='summary';aramHistoryState.error='';aramHistoryState.fullTeamCount=0;aramHistoryState.scanned=0}
    renderModeUI();
    if(changed&&window.aramDesktop?.getAramMatchHistory)await loadAramHistory(true);
  }
  async function load(force=true){
    if(aramHistoryState.loading)return;
    aramHistoryState.limit=Math.max(1,Math.min(30,Number(document.getElementById('historyLimit')?.value)||aramHistoryState.limit||20));
    if(!window.aramDesktop?.getAramMatchHistory){aramHistoryState.error='이 기능은 데스크톱 앱에서 사용할 수 있습니다.';renderAramHistoryFeedback();return}
    aramHistoryState.loading=true;aramHistoryState.error='';renderAramHistoryFeedback();
    try{
      const target=aramHistoryState.targetMode==='searched'?(aramHistoryState.target||{}):{current:true},m=meta();
      const r=await window.aramDesktop.getAramMatchHistory({limit:aramHistoryState.limit,scan:Math.max(100,aramHistoryState.limit*5),target,queueMode:m.key});
      if(!r?.connected)throw new Error(r?.message||'League Client에 연결되지 않았습니다.');
      aramHistoryState.matches=Array.isArray(r.matches)?r.matches:[];aramHistoryState.account=r.account||null;aramHistoryState.localAccount=r.localAccount||lolAutoSync?.lastState?.account||null;aramHistoryState.targetMode=r.targetMode==='searched'?'searched':'current';aramHistoryState.source=r.sourceEndpoint||'LCU Match History';aramHistoryState.scanned=Number(r.scanned)||0;aramHistoryState.fullTeamCount=Number(r.fullTeamCount)||0;aramHistoryState.errors=Array.isArray(r.errors)?r.errors:[];aramHistoryState.loadedAt=Date.now();aramHistoryState.selectedGameId=String(aramHistoryState.matches[0]?.gameId||'');aramHistoryState.detailTab='summary';aramHistoryState.queueMode=r.queueMode==='mayhem'?'mayhem':'standard';
      const input=document.getElementById('historyPlayerSearch');if(input&&aramHistoryState.targetMode==='searched'){const label=aramHistoryAccountLabel(aramHistoryState.account);if(label)input.value=label}
      if(!aramHistoryState.matches.length)aramHistoryState.error=`${aramHistoryAccountLabel(aramHistoryState.account)||'조회 대상'}의 최근 조회 범위에서 ${meta().label}(Queue ${meta().queueId}) 전적을 찾지 못했습니다.`;
    }catch(e){aramHistoryState.error=e?.message||String(e);aramHistoryState.matches=[];aramHistoryState.selectedGameId=''}finally{aramHistoryState.loading=false;renderAramHistoryFeedback()}
  }
  try{
    aramHistoryState.queueMode=initialMode();
    loadAramHistory=load;
    window.aramHistorySetQueueMode=setQueueMode;
    const oldRender=renderAramHistoryFeedback;renderAramHistoryFeedback=function(...args){const r=oldRender.apply(this,args);renderModeUI();return r};
    installStyle();installUI();renderModeUI();
    if(typeof DATA!=='undefined'){
      DATA.version=V;DATA.match_lab_queue_split_v01517={version:'v0.15.17 · ARAM Queue Split',standard_queue:450,mayhem_queue:2400,default:'standard',strict_queue_separation:true,mayhem_game_mode:'KIWI',random_practice_scope:'standard ARAM only'};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    window.aramHistoryQueueV01517={setQueueMode,renderModeUI,meta};window.__ARAM_MATCH_LAB_QUEUE_V01517__=true;
  }catch(e){console.error('[v0.15.17] Match Lab queue split failed',e);window.__ARAM_MATCH_LAB_QUEUE_V01517__=false}
})();
