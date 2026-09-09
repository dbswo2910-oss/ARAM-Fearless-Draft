'use strict';
(()=>{
  const V='0.15.22';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const avg=a=>a?.length?a.reduce((s,x)=>s+num(x),0)/a.length:0;
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  const grade=v=>v>=96?'S+':v>=91?'S':v>=84?'A+':v>=76?'A':v>=64?'B':v>=52?'C':'D';
  let selectedRole='';
  let bindScheduled=false;

  const ROLE_METRICS={
    '탱커':[['absorb','피해 흡수'],['frontline','전열'],['engage','이니시'],['cc','CC'],['survival','생존']],
    '메이지':[['damage','딜 생산'],['poke','포킹'],['control','제어'],['cc','CC'],['survival','생존']],
    '원딜':[['damage','딜 생산'],['carry','지속딜'],['survival','생존'],['eff','자원 효율'],['kp','교전 참여']],
    '서포터':[['peel','보호'],['allySustain','아군 유지력'],['utility','유틸'],['cc','CC'],['survival','생존']],
    '브루저':[['damage','딜 생산'],['dive','진입'],['frontline','전열'],['sustainFight','지속전'],['survival','생존']],
    '암살자':[['burst','순간폭딜'],['dive','후방 접근'],['pick','캐치'],['damage','딜 생산'],['survival','생존']]
  };
  const FALLBACK=[['damage','딜 생산'],['kp','교전 참여'],['survival','생존'],['cc','CC'],['eff','자원 효율']];

  function bucket(r){
    const x=`${r?.group||''} ${r?.role||''}`.toLowerCase();
    return /원딜|marksman|adc/.test(x)?'원딜':/탱커|tank/.test(x)?'탱커':/서포|support|enchanter/.test(x)?'서포터':/메이지|mage/.test(x)?'메이지':/브루저|fighter|juggernaut/.test(x)?'브루저':/암살|assassin/.test(x)?'암살자':String(r?.group||r?.role||'기타');
  }
  function championOf(m){
    const me=m?.me||{};
    let n='';
    try{n=aramHistoryResolveParticipant(me)||''}catch{}
    return String(n||me.championName||me.champion||m?.championName||m?.champion||me.rawChampionName||`챔피언 ${me.championId||''}`).trim()||'알 수 없음';
  }
  function row(m,i){
    let r,s;try{r=aramHistoryRoleBreakdown(m);s=aramHistoryBaseSignals(m)}catch{return null}
    if(!r||r.score==null||!s)return null;
    const me=m?.me||{},role=bucket(r);
    return {
      id:String(m?.gameId??i),time:num(m?.gameEndTimestamp||m?.gameCreation||m?.gameStartTimestamp),role,champion:championOf(m),score:clamp(r.score),
      win:me.win===true||me.win===1||m?.win===true,
      kp:clamp(s.kp),survival:clamp(s.survival),damage:clamp(s.damage),eff:clamp(s.eff),absorb:clamp(s.absorb),cc:clamp(s.cc),frontline:clamp(s.frontline),engage:clamp(s.engage),peel:clamp(s.peel),allySustain:clamp(s.allySustain),utility:clamp(s.utility),poke:clamp(s.poke),carry:clamp(s.carry),burst:clamp(s.burst),dive:clamp(s.dive),pick:clamp(s.pick),control:clamp(s.control),sustainFight:clamp(s.sustainFight)
    };
  }
  function rows(){return (Array.isArray(aramHistoryState?.matches)?aramHistoryState.matches:[]).map(row).filter(Boolean).sort((a,b)=>b.time-a.time)}
  function aggregate(role){
    const rs=rows().filter(x=>x.role===role),g={};
    for(const x of rs)(g[x.champion]||(g[x.champion]=[])).push(x);
    return Object.entries(g).map(([champion,a])=>{
      const out={champion,n:a.length,wins:a.filter(x=>x.win).length,score:avg(a.map(x=>x.score)),best:Math.max(...a.map(x=>x.score)),latest:a[0]?.score||0};
      for(const[k]of (ROLE_METRICS[role]||FALLBACK))out[k]=avg(a.map(x=>x[k]));
      if(a.length>=4){const cut=Math.ceil(a.length/2),recent=avg(a.slice(0,cut).map(x=>x.score)),old=avg(a.slice(cut).map(x=>x.score));out.trend=recent-old}else out.trend=null;
      return out;
    }).sort((a,b)=>b.n-a.n||b.score-a.score||a.champion.localeCompare(b.champion,'ko'));
  }
  function installStyle(){
    if(document.getElementById('pp22style'))return;
    const s=document.createElement('style');s.id='pp22style';s.textContent=`
.pprole.pp22click{cursor:pointer;position:relative;transition:border-color .14s ease,background .14s ease,transform .14s ease;padding-bottom:18px!important}.pprole.pp22click:hover{border-color:#4d87ae!important;background:#0b2031!important;transform:translateY(-1px)}.pprole.pp22click:focus{outline:1px solid #74b9e6;outline-offset:2px}.pprole.pp22click.active{border-color:#68b6e8!important;background:#0d263b!important;box-shadow:inset 0 0 0 1px #2c6f99}.pprole.pp22click:after{content:'챔피언별 상세 ›';position:absolute;left:8px;bottom:5px;color:#60839e;font-size:6.5px;font-weight:900}.pprole.pp22click.active:after{content:'상세 닫기 ∧';color:#8fd3ff}
.pp22drill{grid-column:1/-1;margin-top:10px;padding-top:10px;border-top:1px solid #25425a}.pp22drillHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-end;margin-bottom:8px}.pp22drillHead b{display:block;color:#dff1ff;font-size:11px}.pp22drillHead span{display:block;margin-top:2px;color:#6f899f;font-size:7px}.pp22drillHead em{font-style:normal;color:#8fb0c9;font-size:7px;white-space:nowrap}.pp22champGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pp22champ{padding:9px;border:1px solid #28465e;border-radius:9px;background:#071725}.pp22champTop{display:flex;align-items:flex-start;justify-content:space-between;gap:7px}.pp22champName b{display:block;color:#e3f2ff;font-size:10.5px}.pp22champName span{display:block;margin-top:2px;color:#7890a5;font-size:7px}.pp22champScore{text-align:right}.pp22champScore strong{display:block;color:#fff;font-size:17px;line-height:1}.pp22champScore i{font-style:normal;color:#78c8f4;font-size:8px;font-weight:950}.pp22champMeta{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.pp22pill{padding:3px 5px;border:1px solid #29475e;border-radius:6px;background:#0a1c2b;color:#91abc0;font-size:6.5px;font-weight:850}.pp22pill.good{border-color:#315e50;color:#76d4ab}.pp22pill.bad{border-color:#633b48;color:#ef8998}.pp22metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-top:8px}.pp22metric{min-width:0}.pp22metric div{display:flex;justify-content:space-between;gap:3px;color:#718ba1;font-size:6px}.pp22metric b{color:#cce4f5;font-size:7px}.pp22metric i{display:block;height:3px;margin-top:3px;border-radius:3px;background:#173145;overflow:hidden}.pp22metric i:after{content:'';display:block;height:100%;width:var(--w);background:#4ab8d0}.pp22empty{padding:12px;border:1px dashed #29465c;border-radius:8px;color:#718aa0;font-size:8px;text-align:center}.pp22hint{margin:3px 0 7px;color:#607d94;font-size:6.5px}
@media(max-width:900px){.pp22champGrid{grid-template-columns:1fr}.pp22metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;document.head.appendChild(s)
  }
  function roleCardName(el){return String(el?.querySelector?.('div b')?.textContent||'').trim()}
  function renderDrill(role){
    const container=document.querySelector('#pp19c .pproles');if(!container)return;
    let drill=document.getElementById('pp22RoleDrill');
    if(!role){drill?.remove();return}
    const list=aggregate(role),metrics=ROLE_METRICS[role]||FALLBACK,total=list.reduce((s,x)=>s+x.n,0),wins=list.reduce((s,x)=>s+x.wins,0);
    if(!drill){drill=document.createElement('div');drill.id='pp22RoleDrill';drill.className='pp22drill';container.insertAdjacentElement('afterend',drill)}
    const sig=[role,total,wins,...list.map(x=>`${x.champion}:${x.n}:${x.wins}:${x.score.toFixed(2)}:${x.trend==null?'n':x.trend.toFixed(2)}`)].join('|');
    if(drill.dataset.sig===sig)return;
    const cards=list.map(x=>{
      const wr=x.n?x.wins/x.n*100:0,tr=x.trend;
      return `<div class="pp22champ"><div class="pp22champTop"><div class="pp22champName"><b>${esc(x.champion)}</b><span>${x.n}경기 · ${x.wins}승 ${x.n-x.wins}패 · 승률 ${Math.round(wr)}%</span></div><div class="pp22champScore"><strong>${Math.round(x.score)}</strong><i>${grade(x.score)}</i></div></div><div class="pp22champMeta"><span class="pp22pill">최고 ROLE ${Math.round(x.best)}</span>${tr==null?'':`<span class="pp22pill ${tr>=3?'good':tr<=-3?'bad':''}">최근 흐름 ${tr>=0?'+':''}${tr.toFixed(1)}</span>`}${x.n<3?'<span class="pp22pill">소표본</span>':''}</div><div class="pp22metrics">${metrics.map(([k,l])=>`<div class="pp22metric"><div><span>${esc(l)}</span><b>${Math.round(num(x[k]))}</b></div><i style="--w:${Math.round(clamp(x[k]))}%"></i></div>`).join('')}</div></div>`
    }).join('');
    drill.dataset.sig=sig;
    drill.innerHTML=`<div class="pp22drillHead"><div><b>${esc(role)} · 챔피언별 상세</b><span>현재 불러온 전적 중 ${esc(role)} ${total}경기를 챔피언별로 묶었습니다.</span></div><em>${wins}승 ${total-wins}패 · ${list.length}챔피언</em></div><div class="pp22hint">ROLE GRADE와 해당 역할에서 중요한 관측지표 평균입니다. 1~2경기는 소표본으로 참고하세요.</div>${cards?`<div class="pp22champGrid">${cards}</div>`:'<div class="pp22empty">이 역할의 10인 상세 전적이 없습니다.</div>'}`;
  }
  function select(role){
    selectedRole=selectedRole===role?'':role;
    document.querySelectorAll('#pp19c .pprole.pp22click').forEach(el=>{const on=roleCardName(el)===selectedRole;el.classList.toggle('active',on);el.setAttribute('aria-expanded',on?'true':'false')});
    renderDrill(selectedRole);
  }
  function bind(){
    bindScheduled=false;installStyle();
    const modal=document.getElementById('pp19ov');if(!modal?.classList?.contains('open'))return false;
    const container=document.querySelector('#pp19c .pproles');if(!container)return false;
    const cards=[...container.querySelectorAll('.pprole')];
    for(const el of cards){
      const role=roleCardName(el);if(!role)continue;
      el.classList.add('pp22click');el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`${role} 챔피언별 상세 보기`);el.setAttribute('aria-expanded',role===selectedRole?'true':'false');el.classList.toggle('active',role===selectedRole);
      if(el.dataset.pp22!=='1'){
        el.dataset.pp22='1';
        el.addEventListener('click',()=>select(role));
        el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(role)}});
      }
    }
    if(selectedRole&&!cards.some(x=>roleCardName(x)===selectedRole))selectedRole='';
    renderDrill(selectedRole);
    return true;
  }
  function schedule(){if(bindScheduled)return;bindScheduled=true;setTimeout(bind,20)}
  try{
    installStyle();
    const oldOpen=window.openPlayerProfile;window.openPlayerProfile=function(...a){const r=oldOpen?.apply(this,a);schedule();setTimeout(schedule,100);return r};
    const oldClose=window.closePlayerProfile;window.closePlayerProfile=function(...a){selectedRole='';return oldClose?.apply(this,a)};
    try{const oldRender=renderAramHistoryFeedback;renderAramHistoryFeedback=function(...a){const r=oldRender.apply(this,a);schedule();return r}}catch{}
    const mo=new MutationObserver(()=>{if(document.getElementById('pp19ov')?.classList?.contains('open'))schedule()});mo.observe(document.documentElement,{subtree:true,childList:true});
    window.aramRoleMasteryDrilldownV01522={rows,aggregate,bind,select,get selectedRole(){return selectedRole}};
    window.__ARAM_ROLE_MASTERY_DRILLDOWN_V01522__=true;
    if(typeof DATA!=='undefined'){DATA.version=V;DATA.role_mastery_drilldown_v01522={version:'v0.15.22 · Role Mastery Champion Drilldown',flow:'ROLE MASTERY -> role -> champion aggregate',role_specific_metrics:true,current_loaded_matches_only:true}}
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    schedule();
  }catch(e){console.error('[v0.15.22] Role Mastery drilldown failed',e);window.__ARAM_ROLE_MASTERY_DRILLDOWN_V01522__=false}
})();
