'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01589')}catch{prior=require('../v0.15.89/runtime-source-stability-v01589')}

function countOf(src,needle){return String(src).split(needle).length-1}

function ensurePickReferenceStylesV01590(){
  if(document.querySelector('#rpPickReferenceStyleV01590'))return;
  const st=document.createElement('style');
  st.id='rpPickReferenceStyleV01590';
  st.textContent=`
    /* v0.15.90 · reference-aligned RANDOM pick layout · exact #random scope */
    #random.rpPickReferenceV01590{--rp90-line:#294b67;--rp90-card:#091a2a;--rp90-card2:#0b2033;--rp90-text:#eef8ff;--rp90-muted:#7797b2;--rp90-cyan:#35d9ef;--rp90-teal:#2fe0b5;--rp90-gold:#e4b73e;--rp90-warn:#f1c44e;--rp90-red:#ef6e68;padding-bottom:12px}
    #random.rpPickReferenceV01590>.randomModeNav{margin-bottom:7px!important}
    #random.rpPickReferenceV01590>.randomHero{padding:11px 150px 10px 14px!important;border-radius:10px!important;min-height:0!important}
    #random.rpPickReferenceV01590>.randomHero>.title{font-size:17px!important;margin-bottom:4px!important}
    #random.rpPickReferenceV01590>.randomHero>.sub{font-size:10px!important;margin-bottom:6px!important}
    #random.rpPickReferenceV01590>.randomHero .toolbar{max-width:none!important;grid-template-columns:auto minmax(220px,360px)!important}
    #random.rpPickReferenceV01590>.randomHero #queueSize{height:34px!important}
    #random.rpPickReferenceV01590 #lolAutoSyncPanel.rpSyncCompactV01549{margin-top:7px!important;margin-bottom:7px!important;padding:8px 10px!important;border-radius:10px!important}
    #random.rpPickReferenceV01590 .rpStageHeadV01549{display:none!important}

    #random.rpPickReferenceV01590 #randomInputAnchor{display:grid!important;grid-template-columns:minmax(360px,.86fr) minmax(560px,1.28fr) minmax(245px,.42fr)!important;gap:9px!important;align-items:start!important;margin-top:8px!important}
    #random.rpPickReferenceV01590 #randomInputAnchor>.panel,#random.rpPickReferenceV01590 .rp90CenterStack>.panel{border:1px solid var(--rp90-line)!important;border-radius:10px!important;background:linear-gradient(180deg,#0b1e31,#071522)!important;box-shadow:0 10px 25px rgba(0,0,0,.15)!important;padding:9px!important;margin:0!important;min-width:0!important}
    #random.rpPickReferenceV01590 #randomInputAnchor>.panel>.title,#random.rpPickReferenceV01590 .rp90CenterStack>.panel>.title{font-size:12px!important;margin:0 0 7px!important;color:#eff9ff!important}
    #random.rpPickReferenceV01590 .rp90LeftPanel{grid-column:1;grid-row:1}
    #random.rpPickReferenceV01590 .rp90CenterStack{grid-column:2;grid-row:1;display:grid;gap:9px;min-width:0}
    #random.rpPickReferenceV01590 .rpPickIntelV01589{grid-column:3!important;grid-row:1!important;display:block!important;min-width:0!important;border-radius:10px!important;padding:10px!important}
    #random.rpPickReferenceV01590 #randomRecommendAnchor.rp90RecommendHostEmpty{display:none!important}

    #random.rpPickReferenceV01590 #externalInputs .randomDraftRow,#random.rpPickReferenceV01590 #manualPartyInputs .randomDraftRow{min-height:38px!important;border-radius:7px!important;padding:3px 5px!important}
    #random.rpPickReferenceV01590 #manualPartyInputs .randomMiniPortrait,#random.rpPickReferenceV01590 #manualPartyInputs img{width:30px!important;height:30px!important;border-radius:6px!important}
    #random.rpPickReferenceV01590 #externalCheck .randomCheckGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
    #random.rpPickReferenceV01590 #externalCheck .checkCard{min-height:49px!important;padding:7px 8px!important;border-radius:8px!important}
    #random.rpPickReferenceV01590 #externalCheck .checkCard span{font-size:8px!important}#random.rpPickReferenceV01590 #externalCheck .checkCard b{font-size:10px!important}
    #random.rpPickReferenceV01590 #poolInputs.poolGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}
    #random.rpPickReferenceV01590 #poolInputs .randomPoolItem{min-height:32px!important;border-radius:7px!important}
    #random.rpPickReferenceV01590 #poolInputs .searchInput{min-height:30px!important;font-size:11px!important}
    #random.rpPickReferenceV01590 .rp90CenterStack>.panel:first-child>.toolbar.mt{display:grid!important;grid-template-columns:minmax(0,1.5fr) minmax(120px,.72fr)!important;gap:7px!important;margin-top:8px!important}
    #random.rpPickReferenceV01590 .rp90CenterStack>.panel:first-child>.toolbar.mt .btn{min-height:34px!important;border-radius:7px!important}

    #random.rpPickReferenceV01590 .rp90Top5Panel{padding:8px!important}
    #random.rpPickReferenceV01590 .rp90Top5Panel>:scope>.title{display:none!important}
    #random.rpPickReferenceV01590 .rp90Top5Head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:1px 2px 7px;border-bottom:1px solid #17354d;margin-bottom:5px}
    #random.rpPickReferenceV01590 .rp90Top5Head .left{display:flex;align-items:center;gap:7px;min-width:0}.rpPickReferenceV01590 .rp90Top5Head b{font-size:12px;color:#eef9ff;white-space:nowrap}.rpPickReferenceV01590 .rp90Top5Head small{font-size:8px;color:#789ab6}
    #random.rpPickReferenceV01590 .rp90Top5Head .count{font-size:8px;color:#76ddff;border:1px solid #265979;background:#092338;border-radius:999px;padding:4px 7px;white-space:nowrap}
    #random.rpPickReferenceV01590 #comboResults{display:grid!important;grid-template-columns:1fr!important;gap:4px!important;counter-reset:none!important}
    #random.rpPickReferenceV01590 #comboResults .combo{display:block!important;position:relative!important;padding:0!important;margin:0!important;border:1px solid #24445c!important;border-radius:8px!important;background:linear-gradient(90deg,#081927,#07141f)!important;min-height:56px!important;overflow:hidden!important;transform:none!important}
    #random.rpPickReferenceV01590 #comboResults .combo:before{display:none!important}
    #random.rpPickReferenceV01590 #comboResults .combo:first-child{border-color:#8d7228!important;background:linear-gradient(90deg,#211d0d 0,#0b1c29 34%,#07141f 100%)!important;box-shadow:inset 3px 0 0 #e0b236,0 0 15px rgba(214,172,54,.08)!important}
    #random.rpPickReferenceV01590 #comboResults .combo>:not(.rp90ComboView){display:none!important}
    #random.rpPickReferenceV01590 .rp90ComboView{display:grid;grid-template-columns:26px minmax(120px,.72fr) minmax(100px,.42fr) 62px minmax(160px,1.25fr) auto;align-items:center;gap:7px;min-height:56px;padding:6px 7px}
    #random.rpPickReferenceV01590 .rp90Rank{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;border:1px solid #315979;background:#142f46;color:#d9edfa;font-size:9px;font-weight:950}.rpPickReferenceV01590 .combo:first-child .rp90Rank{border-color:#f0ce6a;background:linear-gradient(180deg,#d8a72c,#9c6b10);color:#161208}
    #random.rpPickReferenceV01590 .rp90PickIdentity{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:6px;min-width:0}.rpPickReferenceV01590 .rp90MiniIcons{display:flex;align-items:center;min-width:0}.rpPickReferenceV01590 .rp90MiniIcons>*{margin-left:-4px}.rpPickReferenceV01590 .rp90MiniIcons>*:first-child{margin-left:0}.rpPickReferenceV01590 .rp90MiniIcons img{width:22px!important;height:22px!important;border-radius:5px!important;object-fit:cover}
    #random.rpPickReferenceV01590 .rp90NameBox{min-width:0}.rpPickReferenceV01590 .rp90Name{font-size:11px;color:#f5fbff;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rpPickReferenceV01590 .rp90Badges{display:flex;gap:3px;flex-wrap:wrap;margin-top:3px}.rpPickReferenceV01590 .rp90Badge{display:inline-flex;align-items:center;border:1px solid #31516a;background:#10263a;color:#9cc3da;border-radius:999px;padding:2px 5px;font-size:7px;font-weight:900}.rpPickReferenceV01590 .rp90Badge.strong{border-color:#8b6d1e;background:#382e0b;color:#ffde72}.rpPickReferenceV01590 .rp90Badge.good{border-color:#27644f;background:#0d2d24;color:#79e6b9}
    #random.rpPickReferenceV01590 .rp90Score{font-size:13px;color:#8ee7ff;font-weight:950;text-align:right;white-space:nowrap}.rpPickReferenceV01590 .combo:first-child .rp90Score{color:#ffe277}
    #random.rpPickReferenceV01590 .rp90Desc{font-size:8px;color:#7f9db5;line-height:1.3;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
    #random.rpPickReferenceV01590 .rp90Damage{font-size:7px;color:#7998b0}.rpPickReferenceV01590 .rp90DamageBar{height:5px;border-radius:999px;overflow:hidden;background:#10283a;display:flex;margin-top:4px}.rpPickReferenceV01590 .rp90DamageBar .ad{background:#ff7b6f;width:var(--ad,50%)}.rpPickReferenceV01590 .rp90DamageBar .ap{background:#56bfff;width:var(--ap,50%)}
    #random.rpPickReferenceV01590 .rp90Detail{border:1px solid #315674;background:#10263b;color:#cfe9f8;border-radius:6px;padding:5px 7px;font-size:8px;font-weight:900;cursor:pointer;white-space:nowrap}.rpPickReferenceV01590 .rp90Detail:hover{border-color:#4fa8d6;color:#fff}

    #random.rpPickReferenceV01590 .rpPickIntelV01589:after{display:none!important}
    #random.rpPickReferenceV01590 .rp89IntelHead{margin-bottom:7px!important}.rpPickReferenceV01590 .rp89IntelHead b{font-size:12px!important}
    #random.rpPickReferenceV01590 .rp89Metric{display:none!important}
    #random.rpPickReferenceV01590 .rp90DnaMetric{padding:6px 0;border-bottom:1px solid #173247}.rpPickReferenceV01590 .rp90DnaTop{display:flex;justify-content:space-between;gap:7px;align-items:center;font-size:8px;color:#85a6be}.rpPickReferenceV01590 .rp90DnaTop b{font-size:8px;color:#dff5ff}.rpPickReferenceV01590 .rp90DnaBar{height:6px;border-radius:999px;background:#102a3d;overflow:hidden;margin-top:4px}.rpPickReferenceV01590 .rp90DnaBar i{display:block;width:var(--v,0%);height:100%;border-radius:inherit;background:linear-gradient(90deg,#24b7dd,#2fe0bf)}.rpPickReferenceV01590 .rp90DnaMetric.missing .rp90DnaBar i{background:linear-gradient(90deg,#d49527,#efc24c)}.rpPickReferenceV01590 .rp90DnaMetric.missing .rp90DnaTop b{color:#f0c95c}
    #random.rpPickReferenceV01590 .rp90DnaDamage{padding:7px 0;border-bottom:1px solid #173247}.rpPickReferenceV01590 .rp90DnaSplit{display:flex;height:7px;margin-top:4px;border-radius:999px;overflow:hidden;background:#11283b}.rpPickReferenceV01590 .rp90DnaSplit .ad{width:var(--ad,50%);background:#ff796f}.rpPickReferenceV01590 .rp90DnaSplit .ap{width:var(--ap,50%);background:#59bcff}.rpPickReferenceV01590 .rp90DnaLegend{display:flex;justify-content:space-between;font-size:7px;color:#7899b2;margin-top:3px}
    #random.rpPickReferenceV01590 .rp89IntelSection{margin-top:8px!important;padding-top:7px!important}.rpPickReferenceV01590 .rp89IntelSection>strong{font-size:9px!important}.rpPickReferenceV01590 .rp89Chips{gap:4px!important}.rpPickReferenceV01590 .rp89Chip{font-size:7px!important;padding:3px 6px!important}
    #random.rpPickReferenceV01590 .rp89Top1{padding:7px!important;border-radius:7px!important}.rpPickReferenceV01590 .rp89Top1 b{font-size:11px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.rpPickReferenceV01590 .rp89Top1 small{font-size:7px!important;-webkit-line-clamp:3;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}

    #random.rpPickReferenceV01590 .rpFocusCardV01549{display:none!important}
    #random.rpPickReferenceV01590 .rpInfoShellV01549{margin-top:9px!important;border-radius:10px!important;padding:0!important}
    #random.rpPickReferenceV01590 .rpInfoHeadV01549{padding:8px 9px!important}.rpPickReferenceV01590 .rpInfoHeadV01549>b{font-size:12px!important}.rpPickReferenceV01590 .rpTabsV01549{gap:4px!important}.rpPickReferenceV01590 .rpTabsV01549 button{font-size:8px!important;padding:4px 7px!important;border-radius:6px!important}
    #random.rpPickReferenceV01590 .rpTabPanelV01549{padding:8px!important}
    #random.rpPickReferenceV01590 .rpQuickGridV01549{display:grid!important;grid-template-columns:1.12fr 1.05fr 1.32fr 1.2fr .9fr 1.25fr!important;gap:6px!important}
    #random.rpPickReferenceV01590 .rpQuickCardV01549{min-height:60px!important;border:1px solid #294c67!important;border-radius:8px!important;background:linear-gradient(180deg,#091b2a,#071522)!important;padding:8px 9px!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
    #random.rpPickReferenceV01590 .rpQuickCardV01549 span{font-size:8px!important;color:#7898b0!important;margin-bottom:4px!important}.rpPickReferenceV01590 .rpQuickCardV01549 b{font-size:10px!important;line-height:1.3!important;color:#e9f7ff!important}.rpPickReferenceV01590 .rpQuickCardV01549.conclusion{border-color:#7d641f!important;background:linear-gradient(180deg,#29230d,#111a1d)!important}.rpPickReferenceV01590 .rpQuickCardV01549.conclusion b{color:#ffe47b!important;font-size:12px!important}.rpPickReferenceV01590 .rpQuickCardV01549.direction{border-color:#2d6a59!important}.rpPickReferenceV01590 .rp90QuickSplit{display:flex;height:6px;border-radius:999px;overflow:hidden;background:#10283b;margin-top:6px}.rpPickReferenceV01590 .rp90QuickSplit .ad{width:var(--ad,50%);background:#ff7a6f}.rpPickReferenceV01590 .rp90QuickSplit .ap{width:var(--ap,50%);background:#58bdff}

    @media(max-width:1450px){#random.rpPickReferenceV01590 #randomInputAnchor{grid-template-columns:minmax(320px,.88fr) minmax(520px,1.25fr)!important}.rpPickReferenceV01590 .rpPickIntelV01589{grid-column:1/-1!important;grid-row:2!important;display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:6px!important}.rpPickReferenceV01590 .rp89IntelHead,.rpPickReferenceV01590 .rp89IntelSection{grid-column:1/-1!important}.rpPickReferenceV01590 .rp90DnaMetric,.rpPickReferenceV01590 .rp90DnaDamage{border:1px solid #173247!important;border-radius:7px!important;padding:7px!important}.rpPickReferenceV01590 .rpQuickGridV01549{grid-template-columns:repeat(3,minmax(0,1fr))!important}.rpPickReferenceV01590 .rp90ComboView{grid-template-columns:26px minmax(140px,.8fr) 62px minmax(180px,1.2fr) auto}.rpPickReferenceV01590 .rp90Damage{display:none!important}}
    @media(max-width:1050px){#random.rpPickReferenceV01590 #randomInputAnchor{grid-template-columns:1fr!important}.rpPickReferenceV01590 .rp90LeftPanel,.rpPickReferenceV01590 .rp90CenterStack,.rpPickReferenceV01590 .rpPickIntelV01589{grid-column:1!important;grid-row:auto!important}.rpPickReferenceV01590 .rpPickIntelV01589{display:block!important}.rpPickReferenceV01590 .rp90ComboView{grid-template-columns:24px minmax(120px,.7fr) 55px minmax(150px,1fr) auto}.rpPickReferenceV01590 .rp90MiniIcons{display:none!important}.rpPickReferenceV01590 .rpQuickGridV01549{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    @media(max-width:680px){#random.rpPickReferenceV01590 #poolInputs.poolGrid{grid-template-columns:1fr!important}.rpPickReferenceV01590 .rp90ComboView{grid-template-columns:22px 1fr auto!important}.rpPickReferenceV01590 .rp90Desc,.rpPickReferenceV01590 .rp90Damage,.rpPickReferenceV01590 .rp90Detail{grid-column:2/-1}.rpPickReferenceV01590 .rpQuickGridV01549{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(st);
}

function canonicalChampionNameV01590(value,row){
  const raw=String(value??'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/🔒\s*고정.*$/,'').replace(/\s+/g,' ').trim();
  if(!raw)return raw;
  const compact=s=>String(s??'').replace(/[\s·•|/()[\]{}:_-]+/g,'').toLowerCase();
  const known=[];
  const add=v=>{v=String(v??'').trim();if(v&&!known.includes(v))known.push(v)};
  document.querySelectorAll('#poolInputs .searchInput,#externalInputs .searchInput,#manualPartyInputs .searchInput').forEach(el=>add(el?.dataset?.committed||el?.value));
  if(row){
    row.querySelectorAll('[data-champion-name],[data-name]').forEach(el=>add(el?.dataset?.championName||el?.dataset?.name));
  }
  const cr=compact(raw);
  known.sort((a,b)=>compact(b).length-compact(a).length);
  const exact=known.find(n=>cr===compact(n));if(exact)return exact;
  const contained=known.filter(n=>compact(n).length>=2&&cr.includes(compact(n)));
  if(contained.length){
    const n=contained[0],cn=compact(n);
    if(cr===cn+cn||cr.startsWith(cn)||cr.endsWith(cn)||cr.includes(cn+cn.slice(0,Math.max(1,Math.floor(cn.length/2)))))return n;
  }
  for(let i=1;i<=Math.floor(raw.length/2);i++){
    const a=raw.slice(0,i).trim();if(!a)continue;
    const ca=compact(a);if(ca&&cr===ca+ca)return a;
  }
  return raw;
}

function roleTagsFromTextV01590(text){
  const s=String(text||'');
  const defs=[['이니시',/이니시|진입|교전|engage/i],['포킹',/포킹|poke/i],['프론트',/프론트|앞라인|탱커|frontline/i],['지속딜',/지속딜|지속 전투|sustain/i],['보호',/보호|쉴드|회복|서포트/i],['CC',/군중|제어|\bcc\b/i],['균형',/균형|밸런스/i]];
  return defs.filter(([,re])=>re.test(s)).slice(0,3).map(([x])=>x);
}

function pickReferenceModelV01590(){
  const q=Math.max(1,Math.min(5,Number(document.querySelector('#queueSize')?.value)||1));
  let manual=[];try{manual=Array.isArray(randomState?.manual)?randomState.manual:[]}catch{}
  const locked=manual.filter(x=>String(x||'').trim()).length;
  const ext=[...document.querySelectorAll('#externalInputs .searchInput')].filter(x=>String(x?.dataset?.committed||x?.value||'').trim()).length;
  const pool=[...document.querySelectorAll('#poolInputs .searchInput')].filter(x=>String(x?.dataset?.committed||x?.value||'').trim()).length;
  const need=Math.max(0,q-locked);
  const teamFixed=Math.max(0,Math.min(5,locked+ext));
  const teamFixedPct=Math.round(teamFixed/5*100);
  const poolPct=need===0?100:Math.max(0,Math.min(100,Math.round(pool/Math.max(1,need)*100)));
  const cards=[...document.querySelectorAll('#externalCheck .randomCheckGrid>.checkCard')];
  const shortages=[...document.querySelectorAll('#externalCheck .rpCheckChipV01558')].map(x=>String(x.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,8);
  const missing=String(cards[0]?.querySelector('b')?.textContent||'').replace(/\s+/g,' ').trim();
  const damage=String(cards[1]?.querySelector('b')?.textContent||'-').replace(/\s+/g,' ').trim();
  const calc=String(cards[2]?.querySelector('b')?.textContent||'후보 계산 대기').replace(/\s+/g,' ').trim();
  const dm=damage.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  const ad=dm?Number(dm[1]):0,ap=dm?Number(dm[2]):0,total=ad+ap;
  const adPct=total>0?Math.round(ad/total*100):50,apPct=100-adPct;
  let top={name:'',score:'',reason:'후보를 입력하면 완성 조합 TOP5에서 핵심 선택을 요약합니다.'};try{top=topCombo()}catch{}
  top={...top,name:canonicalChampionNameV01590(top?.name||'',document.querySelector('#comboResults .combo'))};
  const gapText=(shortages.join(' ')+' '+missing).toLowerCase();
  const coverage=(aliases)=>aliases.some(a=>gapText.includes(a))?{pct:24,state:'부족',missing:true}:{pct:78,state:'확보',missing:false};
  return{q,locked,ext,pool,need,teamFixed,teamFixedPct,poolPct,shortages,missing,damage,calc,adPct,apPct,top,
    dna:{engage:coverage(['이니시','진입','교전']),poke:coverage(['포킹']),front:coverage(['프론트','앞라인','탱커']),sustain:coverage(['지속','유지','보호','회복']),cc:coverage(['군중','cc','제어'])}};
}

function dnaMetricHtmlV01590(label,x){
  return `<div class="rp90DnaMetric${x?.missing?' missing':''}"><div class="rp90DnaTop"><span>${esc(label)}</span><b>${esc(x?.state||'확인')}</b></div><div class="rp90DnaBar" style="--v:${Number(x?.pct)||0}%"><i></i></div></div>`;
}

function refreshDnaV01590(){
  const panel=document.querySelector('#rpPickIntelV01589');if(!panel)return;
  const m=pickReferenceModelV01590();
  const chips=(m.shortages.length?m.shortages:[m.missing||'현재 큰 결손 없음']).filter(Boolean).map(x=>`<span class="rp89Chip${m.shortages.length?'':' good'}">${esc(x)}</span>`).join('');
  panel.innerHTML=`<div class="rp89IntelHead"><b>◆ 조합 DNA</b><span>LIVE PICK INTEL</span></div>
    ${dnaMetricHtmlV01590('한타 개시(Engage)',m.dna.engage)}
    ${dnaMetricHtmlV01590('포킹(Poke)',m.dna.poke)}
    ${dnaMetricHtmlV01590('프론트라인(Frontline)',m.dna.front)}
    ${dnaMetricHtmlV01590('지속 전투(Sustain)',m.dna.sustain)}
    ${dnaMetricHtmlV01590('군중 제어(CC)',m.dna.cc)}
    <div class="rp90DnaDamage"><div class="rp90DnaTop"><span>실전 AD / AP</span><b>${esc(m.damage)}</b></div><div class="rp90DnaSplit" style="--ad:${m.adPct}%;--ap:${m.apPct}%"><i class="ad"></i><i class="ap"></i></div><div class="rp90DnaLegend"><span>AD ${m.adPct}%</span><span>AP ${m.apPct}%</span></div></div>
    <div class="rp89IntelSection"><strong>⚠ 부족한 역할</strong><div class="rp89Chips">${chips}</div></div>
    <div class="rp89IntelSection"><strong>✦ 현재 TOP1</strong><div class="rp89Top1"><span>${esc(m.top?.score||'계산 대기')}</span><b>${esc(m.top?.name||'후보 계산 대기')}</b><small>${esc(m.top?.reason||'후보 입력 후 TOP5를 계산하면 핵심 시너지가 표시됩니다.')}</small></div></div>`;
}

function enhanceTop5V01590(r){
  const panel=r?.resultPanel,results=r?.results;if(!panel||!results)return;
  panel.classList.add('rp90Top5Panel');
  let head=panel.querySelector(':scope>.rp90Top5Head');
  if(!head){head=document.createElement('div');head.className='rp90Top5Head';results.parentElement?.insertBefore(head,results)}
  const rows=[...results.querySelectorAll('.combo')].slice(0,5);
  head.innerHTML=`<div class="left"><b>현재 큐 인원 기준 완성 조합 TOP5</b><small>엔진 점수 순 · 1위 강력 추천</small></div><span class="count">${rows.length}개 계산됨</span>`;
  const m=pickReferenceModelV01590();
  rows.forEach((row,idx)=>{
    const rawName=txt(row.querySelector('.names'));
    const name=canonicalChampionNameV01590(rawName,row)||`추천 ${idx+1}`;
    const score=txt(row.querySelector('.comboScore'))||'-';
    let desc=txt(row.querySelector('.desc'))||'현재 입력 기준 완성 조합 추천입니다.';
    const cn=String(name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    desc=desc.replace(new RegExp('^'+cn+'\\s*[·:|-]?\\s*','i'),'').trim()||'현재 입력 기준 완성 조합 추천입니다.';
    const tags=roleTagsFromTextV01590(desc);
    const iconLine=row.querySelector('.comboIconLine');
    const iconHtml=iconLine?iconLine.innerHTML:'';
    const oldBtn=row.querySelector('button');
    let view=row.querySelector(':scope>.rp90ComboView');
    if(!view){view=document.createElement('div');view.className='rp90ComboView';row.appendChild(view)}
    const tagHtml=(idx===0?['강력 추천',...tags]:tags).slice(0,4).map((x,j)=>`<span class="rp90Badge${idx===0&&j===0?' strong':(x==='균형'?' good':'')}">${esc(x)}</span>`).join('');
    view.innerHTML=`<div class="rp90Rank">${idx+1}</div><div class="rp90PickIdentity"><div class="rp90MiniIcons">${iconHtml}</div><div class="rp90NameBox"><div class="rp90Name">${esc(name)}</div><div class="rp90Badges">${tagHtml||'<span class="rp90Badge">대안 추천</span>'}</div></div></div><div class="rp90Score">${esc(score)}</div><div class="rp90Damage"><span>실전 AD/AP</span><div class="rp90DamageBar" style="--ad:${m.adPct}%;--ap:${m.apPct}%"><i class="ad"></i><i class="ap"></i></div></div><div class="rp90Desc">${esc(desc)}</div><button type="button" class="rp90Detail">상세보기</button>`;
    const b=view.querySelector('.rp90Detail');if(b&&!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',e=>{e.stopPropagation();try{oldBtn?.click()}catch{}})}
  });
}

function arrangeReferenceLayoutV01590(r){
  if(!r?.root||!r?.input)return;
  r.root.classList.add('rpPickReferenceV01590');
  ensurePickReferenceStylesV01590();
  const intel=document.querySelector('#rpPickIntelV01589');
  const pool=r.poolPanel;
  const left=[...r.input.children].find(x=>x.classList?.contains('panel')&&x!==pool&&x!==intel);
  if(left)left.classList.add('rp90LeftPanel');
  let center=r.input.querySelector(':scope>.rp90CenterStack');
  if(!center){center=document.createElement('div');center.className='rp90CenterStack';if(left?.nextSibling)r.input.insertBefore(center,left.nextSibling);else r.input.appendChild(center)}
  if(pool&&pool.parentElement!==center)center.appendChild(pool);
  if(r.resultPanel&&r.resultPanel.parentElement!==center)center.appendChild(r.resultPanel);
  if(intel&&intel.parentElement===r.input)r.input.appendChild(intel);
  if(r.recommend){const useful=[...r.recommend.children].some(x=>x.offsetParent!==null||!x.hidden);r.recommend.classList.toggle('rp90RecommendHostEmpty',!useful||r.recommend.children.length===0)}
}

function quickJudgmentHtmlV01590(){
  const m=pickReferenceModelV01590();
  const qText=`${m.q}인큐 · 외부 확정픽 ${m.ext}명 + 우리 파티 ${m.q}명`;
  const calcText=m.need===0?'고정 완료':`${m.calc} · 고정 ${m.locked}/${m.q}`;
  const topName=m.top?.name||'계산 대기';
  const direction=m.top?.reason||m.missing||'후보를 입력하면 추천 방향이 표시됩니다.';
  return `<div class="rpQuickGridV01549">
    <div class="rpQuickCardV01549"><span>현재 큐</span><b>${esc(qText)}</b></div>
    <div class="rpQuickCardV01549"><span>후보 계산</span><b>${esc(calcText)}</b></div>
    <div class="rpQuickCardV01549 conclusion"><span>현재 결론</span><b>${esc(topName)}</b><small>최우선 추천</small></div>
    <div class="rpQuickCardV01549"><span>실전 AD / AP</span><b>${esc(m.damage)}</b><div class="rp90QuickSplit" style="--ad:${m.adPct}%;--ap:${m.apPct}%"><i class="ad"></i><i class="ap"></i></div></div>
    <div class="rpQuickCardV01549"><span>TOP1 점수</span><b>${esc(m.top?.score||'-')}</b></div>
    <div class="rpQuickCardV01549 direction"><span>추천 방향</span><b>${esc(direction)}</b></div>
  </div>`;
}

function normalizeVisibleNamesV01590(){
  const row=document.querySelector('#comboResults .combo');
  const canonical=canonicalChampionNameV01590(txt(row?.querySelector('.names')),row);
  const focus=document.querySelector('#rpFocusCardV01549 b');
  if(focus&&canonical){const t=String(focus.textContent||'');const dot=t.indexOf(' · ');focus.textContent=canonical+(dot>=0?t.slice(dot):'')}
  const top=document.querySelector('#rpPickIntelV01589 .rp89Top1 b');if(top&&canonical)top.textContent=canonical;
  document.querySelectorAll('.rpQuickCardV01549').forEach(card=>{if(txt(card.querySelector('span'))==='현재 TOP1'||txt(card.querySelector('span'))==='현재 결론'){const b=card.querySelector('b');if(b&&canonical)b.textContent=canonical}});
}

function refreshPickReferenceV01590(r){
  if(!r?.root)return;
  arrangeReferenceLayoutV01590(r);
  enhanceTop5V01590(r);
  refreshDnaV01590();
  normalizeVisibleNamesV01590();
}

function patchRandomPracticeV01590(src){
  const signature='function canonicalChampionNameV01590(value,row)';
  if(src.includes(signature))return src;
  const insertAnchor='  function stageHead(id,title,sub,before){';
  if(countOf(src,insertAnchor)!==1)throw new Error(`v0.15.90 source contract mismatch stageHead count=${countOf(src,insertAnchor)}`);
  const helpers=[ensurePickReferenceStylesV01590,canonicalChampionNameV01590,roleTagsFromTextV01590,pickReferenceModelV01590,dnaMetricHtmlV01590,refreshDnaV01590,enhanceTop5V01590,arrangeReferenceLayoutV01590,quickJudgmentHtmlV01590,normalizeVisibleNamesV01590,refreshPickReferenceV01590].map(fn=>'  '+fn.toString().replace(/\n/g,'\n  ')).join('\n\n')+'\n\n';
  src=src.replace(insertAnchor,helpers+insertAnchor);

  const oldName="    name=dedupeTop1LabelV01588(name.replace(/🔒\\s*고정.*$/,'').replace(/\\s+/g,' ').trim());";
  const newName="    name=canonicalChampionNameV01590(dedupeTop1LabelV01588(name.replace(/🔒\\s*고정.*$/,'').replace(/\\s+/g,' ').trim()),row);";
  if(countOf(src,oldName)!==1)throw new Error(`v0.15.90 source contract mismatch top name count=${countOf(src,oldName)}`);
  src=src.replace(oldName,newName);

  const qStart='  function quickHtml(){';
  const qEnd='  function ensureInfoShell(r){';
  if(countOf(src,qStart)!==1||countOf(src,qEnd)!==1)throw new Error('v0.15.90 source contract mismatch quickHtml anchors');
  const a=src.indexOf(qStart),b=src.indexOf(qEnd,a);
  src=src.slice(0,a)+"  function quickHtml(){\n    return quickJudgmentHtmlV01590();\n  }\n\n"+src.slice(b);

  const applyNeedle="    const quick=shell.querySelector('[data-rp49-panel=\"quick\"]');if(quick)quick.innerHTML=quickHtml();";
  const applyReplacement=applyNeedle+"\n    try{refreshPickReferenceV01590(refs())}catch{}";
  if(countOf(src,applyNeedle)!==1)throw new Error(`v0.15.90 source contract mismatch applyTab hook count=${countOf(src,applyNeedle)}`);
  src=src.replace(applyNeedle,applyReplacement);

  const refreshNeedle="    ensureInfoShell(r);\n    refreshPickCommandCenterV01589(r);\n    updateFocus();applyTab();syncPoolButton(r.poolPanel);";
  const refreshReplacement="    ensureInfoShell(r);\n    refreshPickCommandCenterV01589(r);\n    updateFocus();applyTab();syncPoolButton(r.poolPanel);\n    refreshPickReferenceV01590(r);";
  if(countOf(src,refreshNeedle)!==1)throw new Error(`v0.15.90 source contract mismatch refresh hook count=${countOf(src,refreshNeedle)}`);
  return src.replace(refreshNeedle,refreshReplacement);
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-practice-focus-v01549.js')src=patchRandomPracticeV01590(src);
  return src;
}

module.exports={
  patchRuntimeSource,
  canonicalChampionNameV01590,
  score_logic_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  route_adoption_changed:prior.route_adoption_changed===true,
  ingame_hud_changed:prior.ingame_hud_changed===true,
  champion_visuals_changed:prior.champion_visuals_changed===true,
  reference_layout_changed:prior.reference_layout_changed===true,
  fight_status_scale_changed:prior.fight_status_scale_changed===true,
  build_analysis_changed:prior.build_analysis_changed===true,
  random_top1_label_dedupe_changed:true,
  random_pick_command_center_changed:prior.random_pick_command_center_changed===true,
  random_pick_reference_layout_changed:true,
  policy_version:'0.15.90'
};
