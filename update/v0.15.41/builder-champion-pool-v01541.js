(()=>{
  'use strict';
  if(window.__ARAM_BUILDER_CHAMPION_POOL_V01541__)return;
  window.__ARAM_BUILDER_CHAMPION_POOL_V01541__=true;

  let builderPoolRole='전체';
  const ROLES=['전체','원딜','메이지','서포터','탱커','AD브루저','AP브루저','암살자'];
  const championList=()=>typeof champs!=='undefined'&&Array.isArray(champs)?champs:[];
  const tierOrder=()=>typeof DATA_TIER_ORDER!=='undefined'&&Array.isArray(DATA_TIER_ORDER)?DATA_TIER_ORDER:['S+','S','A+','A','B','C','D'];
  const rank=t=>{const i=tierOrder().indexOf(t);return i<0?99:i};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function ensureStyle(){
    if(document.getElementById('aram-builder-pool-v01541-style'))return;
    const s=document.createElement('style');
    s.id='aram-builder-pool-v01541-style';
    s.textContent=`
      #builderPoolMount{margin-top:12px}
      #builderPoolMount .onlineChampPool{margin-top:0;border-color:#355271;background:linear-gradient(145deg,#0a1829,#07121f)}
      #builderPoolMount .builderPoolLegend{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-top:5px}
      #builderPoolMount .builderPoolLegend span{display:inline-flex;align-items:center;gap:4px;padding:3px 6px;border-radius:999px;border:1px solid #2c4562;background:#0b1727;color:#8ea7c4;font-size:8px;font-weight:900}
      #builderPoolMount .builderPoolLegend i{width:7px;height:7px;border-radius:50%;display:inline-block;background:#4fa6ff}
      #builderPoolMount .builderPoolLegend .used i{background:#8a6ad6}#builderPoolMount .builderPoolLegend .pick i{background:#49d992}#builderPoolMount .builderPoolLegend .ban i{background:#ff6574}
      #builderPoolMount .onlinePoolCard.builderPoolAvailable{cursor:pointer}
      #builderPoolMount .onlinePoolCard.builderPoolWaiting{cursor:default}
      #builderPoolMount .onlinePoolCard.builderPoolPicked{border-color:#2f7b5c;background:#0d2a20}
      #builderPoolMount .onlinePoolCard.builderPoolPicked.enemy{border-color:#7b3a47;background:#2b1820}
      #builderPoolMount .onlinePoolCard.builderPoolBanned{border-color:#6c3942;background:#24151a;filter:grayscale(.72) saturate(.35);opacity:.56}
      #builderPoolMount .onlinePoolCard.builderPoolUsed{border-color:#584477;background:#1b1728;filter:grayscale(.55) saturate(.5);opacity:.48}
      #builderPoolMount .builderPoolStatus{position:absolute;right:4px;bottom:3px;z-index:2;font-size:7px;font-weight:1000;line-height:1;padding:2px 4px;border-radius:4px;border:1px solid #ffffff22;background:#10253a;color:#b9dfff;box-shadow:0 2px 7px #0007;pointer-events:none}
      #builderPoolMount .builderPoolStatus.our{background:#103226;border-color:#2f7659;color:#92efbd}
      #builderPoolMount .builderPoolStatus.enemy{background:#351922;border-color:#763846;color:#ffadb7}
      #builderPoolMount .builderPoolStatus.ban{background:#491a22;border-color:#853644;color:#ffadb7}
      #builderPoolMount .builderPoolStatus.used{background:#2b2140;border-color:#66508c;color:#d9c6ff}
      #builderPoolMount .builderPoolCurrent{margin-left:5px;color:#ffe58a;font-weight:950}
      #builderPoolMount .onlinePoolCard:not(.builderPoolAvailable){transform:none!important;box-shadow:none!important}
      @media(max-width:767px){#builderPoolMount .onlinePoolGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:390px){#builderPoolMount .onlinePoolGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(s);
  }

  function exhaustedInfo(name){
    const hit=(state?.history||[]).find(h=>(h.our||[]).includes(name)||(h.enemy||[]).includes(name));
    if(!hit)return null;
    const team=(hit.our||[]).includes(name)?'우리':'상대';
    return{set:Number(hit.set)||((state.history||[]).indexOf(hit)+1),team};
  }
  function statusOf(name){
    const used=exhaustedInfo(name);if(used)return{kind:'used',label:`소진 S${used.set}`,detail:`${used.team} 사용 · SET ${used.set}`};
    const oi=(state?.our||[]).indexOf(name);if(oi>=0)return{kind:'ourPick',label:`우리 P${oi+1}`,detail:`현재 세트 우리 ${oi+1}픽`};
    const ei=(state?.enemy||[]).indexOf(name);if(ei>=0)return{kind:'enemyPick',label:`상대 P${ei+1}`,detail:`현재 세트 상대 ${ei+1}픽`};
    const ob=(state?.ourBans||[]).indexOf(name);if(ob>=0)return{kind:'ban',label:`우리 B${ob+1}`,detail:`현재 세트 우리 ${ob+1}밴`};
    const eb=(state?.enemyBans||[]).indexOf(name);if(eb>=0)return{kind:'ban',label:`상대 B${eb+1}`,detail:`현재 세트 상대 ${eb+1}밴`};
    return{kind:'available',label:'',detail:'사용 가능'};
  }
  function currentStep(){try{return typeof localDraftProgress==='function'?localDraftProgress().current:null}catch{return null}}
  function stripHtml(x){const d=document.createElement('div');d.innerHTML=String(x||'');return d.textContent||d.innerText||''}
  function currentLabel(){const s=currentStep();if(!s)return'밴픽 완료';try{return typeof localStepLabel==='function'?stripHtml(localStepLabel(s)):`${s.side==='our'?'우리':'상대'} ${s.type==='ban'?'BAN':'PICK'} ${Number(s.index)+1}`}catch{return'현재 차례'}}
  function filtered(){
    return championList().filter(c=>builderPoolRole==='전체'||c['주 역할']===builderPoolRole).slice().sort((a,b)=>rank(a['종합티어'])-rank(b['종합티어'])||(Number(b['종합점수'])||0)-(Number(a['종합점수'])||0)||String(a['챔피언']).localeCompare(String(b['챔피언']),'ko'));
  }
  function summary(){
    let available=0,used=0,pick=0,ban=0;
    for(const c of championList()){const k=statusOf(c['챔피언']).kind;k==='available'?available++:k==='used'?used++:(k==='ourPick'||k==='enemyPick')?pick++:ban++}
    return{available,used,pick,ban};
  }
  function cardHtml(c){
    const n=c['챔피언'],st=statusOf(n),step=currentStep(),canAct=st.kind==='available'&&!!step;
    const cls=st.kind==='available'?(canAct?'builderPoolAvailable':'builderPoolWaiting'):st.kind==='used'?'builderPoolUsed':st.kind==='ban'?'builderPoolBanned':`builderPoolPicked ${st.kind==='enemyPick'?'enemy':'our'}`;
    const badge=st.kind==='available'?'':`<span class="builderPoolStatus ${st.kind==='used'?'used':st.kind==='ban'?'ban':st.kind==='enemyPick'?'enemy':'our'}">${esc(st.label)}</span>`;
    const click=canAct?`onclick="builderPoolPick(decodeURIComponent('${encodeURIComponent(n)}'))"`:'';
    const icon=typeof championIconHtml==='function'?championIconHtml(n,'mini'):'';
    return `<button type="button" class="onlinePoolCard ${cls}" data-name="${esc(n)}" data-role="${esc(c['주 역할'])}" data-tier="${esc(c['종합티어'])}" ${click} title="${esc(st.detail)} · ${esc(c['주 역할'])} · ${esc(c['종합티어'])}">${icon}<span class="n"><b>${esc(n)}</b><small>${esc(c['주 역할'])} · ${Math.round(Number(c['종합점수'])||0)}점</small></span><span class="t">${esc(c['종합티어'])}</span>${badge}</button>`;
  }
  function innerHtml(){
    const pool=filtered(),counts=Object.fromEntries(ROLES.map(r=>[r,r==='전체'?championList().length:championList().filter(c=>c['주 역할']===r).length])),s=summary(),step=currentStep();
    return `<div class="onlineChampPool builderChampPool"><div class="onlinePoolHead"><div><div class="title">챔피언 풀 · 현재 세트 / 하드피어리스 상태</div><div class="sub">실시간 모의밴픽과 같은 티어순 초상화 목록입니다. <b>소진·현재 픽·현재 밴</b>을 한눈에 확인합니다.${step?` <span class="builderPoolCurrent">NOW ${esc(currentLabel())} · 사용 가능 카드를 클릭하면 현재 슬롯에 입력</span>`:' <span class="builderPoolCurrent">밴픽 완료</span>'}</div><div class="builderPoolLegend"><span><i></i>사용 가능 ${s.available}</span><span class="used"><i></i>피어리스 소진 ${s.used}</span><span class="pick"><i></i>현재 픽 ${s.pick}</span><span class="ban"><i></i>현재 밴 ${s.ban}</span></div></div><span class="onlinePoolCount">${esc(builderPoolRole)} ${pool.length}명</span></div><div class="onlinePoolFilters">${ROLES.map(r=>`<button type="button" class="onlinePoolFilter ${builderPoolRole===r?'active':''}" onclick="builderPoolSetRole('${r}')">${r}<b>${counts[r]}</b></button>`).join('')}</div><div class="onlinePoolGrid">${pool.map(cardHtml).join('')}</div></div>`;
  }
  function ensureMount(){
    const phase2=document.getElementById('banPhase2');if(!phase2)return null;
    let m=document.getElementById('builderPoolMount');
    if(!m){m=document.createElement('div');m.id='builderPoolMount';phase2.insertAdjacentElement('afterend',m)}
    return m;
  }
  function renderBuilderPool(){ensureStyle();const m=ensureMount();if(m)m.innerHTML=innerHtml()}
  function setRole(role){builderPoolRole=ROLES.includes(role)?role:'전체';renderBuilderPool();try{playUISound?.('select')}catch{}}
  function pick(name){
    const st=statusOf(name),step=currentStep();if(st.kind!=='available'||!step)return;
    try{if(typeof localEditGuard==='function'&&!localEditGuard())return}catch{}
    let ok=false;
    if(step.type==='ban'){
      try{ok=typeof canSetBan==='function'?canSetBan(step.side,step.index,name):true}catch{ok=false}
      if(ok){state[step.side==='our'?'ourBans':'enemyBans'][step.index]=name}
    }else if(step.type==='pick'){
      try{ok=typeof canSetDraftChamp==='function'?canSetDraftChamp(step.side,step.index,name):true}catch{ok=false}
      if(ok){state[step.side][step.index]=name}
    }
    if(!ok)return;
    try{persist?.()}catch{}
    try{renderBuilder?.()}catch{}
    try{renderLive?.()}catch{}
    try{animateDraftEvent?.(step.type,step.side,step.index,name)}catch{}
    try{playUISound?.('select')}catch{}
  }

  window.builderPoolSetRole=setRole;
  window.builderPoolPick=pick;
  window.renderBuilderPool=renderBuilderPool;
  window.__aramBuilderPoolStatusV01541=statusOf;

  if(typeof window.renderBuilder==='function'&&!window.renderBuilder.__aramBuilderPoolV01541){
    const old=window.renderBuilder;
    const wrapped=function(...args){const r=old.apply(this,args);try{renderBuilderPool()}catch(e){console.warn('[v0.15.41] builder pool render failed',e)}return r};
    wrapped.__aramBuilderPoolV01541=true;wrapped.__aramOriginal=old;window.renderBuilder=wrapped;
  }
  try{renderBuilderPool()}catch(e){console.warn('[v0.15.41] builder pool init failed',e)}
})();
