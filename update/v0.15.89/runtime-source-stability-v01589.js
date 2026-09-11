'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01588')}catch{prior=require('../v0.15.88/runtime-source-stability-v01588')}

function countOf(src,needle){return String(src).split(needle).length-1}
function escInsert(s){return String(s)}

function ensurePickCommandCenterStylesV01589(){
  if(document.querySelector('#rpPickCommandStyleV01589'))return;
  const st=document.createElement('style');
  st.id='rpPickCommandStyleV01589';
  st.textContent=`
    /* v0.15.89 · RANDOM pick command center · exact #random scope */
    #random.rpPickCommandV01589{position:relative;isolation:isolate;padding-bottom:16px}
    #random.rpPickCommandV01589:before{content:"";position:absolute;inset:0;pointer-events:none;z-index:-1;background:radial-gradient(900px 460px at 86% 6%,rgba(34,111,176,.13),transparent 68%),radial-gradient(700px 480px at 0 72%,rgba(17,99,126,.10),transparent 72%)}
    #random.rpPickCommandV01589>.randomModeNav{border:1px solid #274a67;border-radius:12px;background:linear-gradient(180deg,#0c1d30,#081625);padding:7px 9px;box-shadow:0 14px 32px rgba(0,0,0,.18)}
    #random.rpPickCommandV01589>.randomModeNav .randomModeBtn{border-radius:8px!important;min-height:34px;font-weight:900;letter-spacing:.01em}
    #random.rpPickCommandV01589>.randomModeNav .randomModeBtn.active{background:linear-gradient(180deg,#164f78,#123b5c)!important;border-color:#55bff8!important;color:#fff!important;box-shadow:0 0 0 1px rgba(76,193,255,.24),0 0 22px rgba(31,153,220,.16)}
    #random.rpPickCommandV01589>.randomHero{border:1px solid #2c516e!important;border-top:2px solid #3fa9ea!important;border-radius:14px!important;background:linear-gradient(105deg,#10233a 0,#0b1a2b 66%,#0a1726 100%)!important;box-shadow:0 16px 34px rgba(0,0,0,.18);padding:15px 170px 14px 16px!important}
    #random.rpPickCommandV01589>.randomHero>.title{font-size:19px!important;color:#f1f8ff!important;font-weight:950!important;letter-spacing:-.02em}
    #random.rpPickCommandV01589>.randomHero>.sub{color:#91abc4!important;line-height:1.45!important}
    #random.rpPickCommandV01589>.randomHero .toolbar{display:grid!important;grid-template-columns:auto minmax(180px,1fr);align-items:center;gap:8px;max-width:720px}
    #random.rpPickCommandV01589>.randomHero #queueSize{height:38px;border-color:#315a78!important;background:#071627!important;font-weight:900}
    #random.rpPickCommandV01589>.randomHero .randomResetAll{right:15px!important;top:14px!important;border-radius:9px!important;box-shadow:0 0 18px rgba(205,70,81,.13)}

    #random.rpPickCommandV01589 #lolAutoSyncPanel.rpSyncCompactV01549{border:1px solid #1ca586!important;border-top:2px solid #34e4bd!important;border-radius:13px!important;background:linear-gradient(90deg,#09241f,#091a27 55%,#0b1c2c)!important;box-shadow:0 0 0 1px rgba(39,225,185,.06),0 0 26px rgba(27,200,157,.08)!important;padding:9px 12px!important}
    #random.rpPickCommandV01589 #lolAutoSyncPanel .lolSyncTitleLine .title{font-size:14px!important;color:#effffb!important}
    #random.rpPickCommandV01589 #lolAutoSyncPanel .lolSyncLiveBadge{border-radius:999px!important}
    #random.rpPickCommandV01589 #lolAutoSyncPanel .lolSyncToolbar .btn,#random.rpPickCommandV01589 .rpSyncDetailsBtnV01549{min-height:34px;border-radius:8px!important;font-weight:900!important}

    #random.rpPickCommandV01589 .rpStageHeadV01549{margin:13px 2px 8px!important}
    #random.rpPickCommandV01589 .rpStageHeadV01549 b{font-size:14px!important;color:#dff4ff!important}
    #random.rpPickCommandV01589 .rpStageHeadV01549 span{color:#6688a8!important}
    #random.rpPickCommandV01589 #randomInputAnchor{display:grid!important;grid-template-columns:minmax(0,.95fr) minmax(0,1.08fr) minmax(220px,.36fr)!important;gap:11px!important;align-items:start!important}
    #random.rpPickCommandV01589 #randomInputAnchor>.panel{border:1px solid #2c4f6b!important;border-radius:13px!important;background:linear-gradient(180deg,#0d1f33,#091827)!important;box-shadow:0 12px 28px rgba(0,0,0,.14)!important;padding:12px!important}
    #random.rpPickCommandV01589 #randomInputAnchor>.panel>.title{font-size:14px!important;color:#f0f7ff!important;font-weight:950!important}
    #random.rpPickCommandV01589 #randomInputAnchor .section{margin-top:12px!important;margin-bottom:7px!important;color:#cde5f8!important;font-size:12px!important;font-weight:900!important}
    #random.rpPickCommandV01589 #externalInputs{min-height:34px}
    #random.rpPickCommandV01589 #externalCheck .randomCheckGrid{gap:7px!important}
    #random.rpPickCommandV01589 #externalCheck .checkCard{border:1px solid #34516a!important;background:linear-gradient(180deg,#0a1b2b,#081624)!important;box-shadow:none!important}
    #random.rpPickCommandV01589 #externalCheck .checkCard:first-child{border-color:#856a28!important;background:linear-gradient(180deg,#2c250d,#171a16)!important}
    #random.rpPickCommandV01589 #manualPartyInputs{display:grid;gap:6px}
    #random.rpPickCommandV01589 #manualPartyInputs .randomDraftRow{min-height:45px!important;border:1px solid #17344c;border-radius:9px!important;background:linear-gradient(90deg,#092030,#081725)!important;padding:4px 6px!important;transition:border-color .12s ease,transform .12s ease}
    #random.rpPickCommandV01589 #manualPartyInputs .randomDraftRow:hover{border-color:#2a6b91;transform:translateY(-1px)}
    #random.rpPickCommandV01589 #manualPartyInputs .randomMiniPortrait,#random.rpPickCommandV01589 #manualPartyInputs img{width:34px!important;height:34px!important;border-radius:7px!important}
    #random.rpPickCommandV01589 #manualPartyInputs .tier{font-size:13px!important;font-weight:950!important}
    #random.rpPickCommandV01589 #poolInputs.poolGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
    #random.rpPickCommandV01589 #poolInputs .randomPoolItem{min-height:36px;border-radius:8px!important}
    #random.rpPickCommandV01589 #poolInputs .searchInput{min-height:34px!important;background:#071625!important;border-color:#27465f!important}
    #random.rpPickCommandV01589 #randomInputAnchor>.panel:nth-child(2)>.toolbar.mt{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(120px,.75fr);gap:8px;margin-top:11px!important}
    #random.rpPickCommandV01589 #randomInputAnchor>.panel:nth-child(2)>.toolbar.mt .btn:first-child{background:linear-gradient(180deg,#1373ae,#0d5686)!important;border-color:#38b9ff!important;box-shadow:0 0 18px rgba(40,173,241,.13);font-weight:950!important}

    #random.rpPickCommandV01589 .rpPickIntelV01589{position:relative;overflow:hidden;border:1px solid #2c5972!important;border-top:2px solid #36d6b4!important;background:linear-gradient(180deg,#0b2030,#081623)!important;padding:12px!important}
    #random.rpPickCommandV01589 .rpPickIntelV01589:after{content:"";position:absolute;right:-42px;top:-55px;width:145px;height:145px;border-radius:50%;background:radial-gradient(circle,rgba(54,214,180,.10),transparent 68%);pointer-events:none}
    #random.rpPickCommandV01589 .rp89IntelHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
    #random.rpPickCommandV01589 .rp89IntelHead b{font-size:14px;color:#dff9f1}.rp89IntelHead span{font-size:8px;color:#5ddab9;font-weight:900}
    #random.rpPickCommandV01589 .rp89Metric{padding:7px 0;border-bottom:1px solid #173147}.rp89Metric:last-of-type{border-bottom:0}
    #random.rpPickCommandV01589 .rp89MetricTop{display:flex;justify-content:space-between;gap:8px;font-size:9px;color:#89a9c1}.rp89MetricTop b{font-size:10px;color:#eef9ff}
    #random.rpPickCommandV01589 .rp89Bar{height:7px;margin-top:5px;border-radius:999px;background:#112b3e;overflow:hidden}.rp89Bar i{display:block;height:100%;width:var(--v,0%);border-radius:inherit;background:linear-gradient(90deg,#20a6d7,#35e1c2)}
    #random.rpPickCommandV01589 .rp89Split{display:flex;height:8px;margin-top:5px;border-radius:999px;overflow:hidden;background:#11283b}.rp89Split .ad{width:var(--ad,50%);background:linear-gradient(90deg,#ff9367,#ff6678)}.rp89Split .ap{width:var(--ap,50%);background:linear-gradient(90deg,#6c8cff,#55c9ff)}
    #random.rpPickCommandV01589 .rp89IntelSection{margin-top:11px;padding-top:10px;border-top:1px solid #1e3b50}.rp89IntelSection>strong{display:block;font-size:10px;color:#cce7f6;margin-bottom:7px}
    #random.rpPickCommandV01589 .rp89Chips{display:flex;flex-wrap:wrap;gap:5px}.rp89Chip{display:inline-flex;padding:4px 7px;border-radius:999px;border:1px solid #776028;background:#2a240f;color:#f1d469;font-size:8px;font-weight:950}.rp89Chip.good{border-color:#27765b;background:#0f3025;color:#78e3b0}
    #random.rpPickCommandV01589 .rp89Top1{border:1px solid #6f5b25;border-radius:9px;background:linear-gradient(135deg,#29230d,#0c1a24);padding:9px}.rp89Top1 span{display:block;font-size:8px;color:#d2b855;margin-bottom:3px}.rp89Top1 b{display:block;font-size:13px;color:#fff4c4;line-height:1.25;overflow-wrap:anywhere}.rp89Top1 small{display:block;margin-top:5px;color:#81a0b7;line-height:1.35;font-size:8px}

    #random.rpPickCommandV01589 .rpFocusCardV01549{border-left:0!important;border:1px solid #2a5a78!important;border-radius:11px!important;background:linear-gradient(90deg,#092237,#0a192a)!important;box-shadow:inset 3px 0 0 #36b9ef!important;margin:10px 0 8px!important}
    #random.rpPickCommandV01589 #randomRecommendAnchor>.panel{border:1px solid #2a506c!important;border-radius:13px!important;background:linear-gradient(180deg,#0d2034,#081725)!important;padding:12px!important;box-shadow:0 12px 28px rgba(0,0,0,.14)!important}
    #random.rpPickCommandV01589 #randomRecommendAnchor>.panel>.title{font-size:14px!important;font-weight:950!important;color:#eff8ff!important;margin-bottom:8px!important}
    #random.rpPickCommandV01589 #comboResults{counter-reset:rp89rank}
    #random.rpPickCommandV01589 #comboResults .combo{counter-increment:rp89rank;position:relative;border:1px solid #25465e!important;border-radius:9px!important;background:linear-gradient(90deg,#091a2a,#071522)!important;padding:8px 9px 8px 38px!important;margin:6px 0!important;box-shadow:none!important;transition:border-color .12s ease,transform .12s ease}
    #random.rpPickCommandV01589 #comboResults .combo:hover{border-color:#347399!important;transform:translateY(-1px)}
    #random.rpPickCommandV01589 #comboResults .combo:before{content:counter(rp89rank);position:absolute;left:8px;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#17324a;border:1px solid #315b78;color:#dcecff;font-size:10px;font-weight:950}
    #random.rpPickCommandV01589 #comboResults .combo:first-child{border-color:#8b722d!important;background:linear-gradient(90deg,#231f0f,#0a1926 38%,#071522)!important;box-shadow:0 0 0 1px rgba(218,180,74,.05)!important}
    #random.rpPickCommandV01589 #comboResults .combo:first-child:before{background:linear-gradient(180deg,#d7a52c,#9f6c0e);border-color:#f3cf68;color:#17130a;box-shadow:0 0 12px rgba(224,177,50,.18)}
    #random.rpPickCommandV01589 #comboResults .combo .names{font-weight:900!important;color:#eef7ff!important}.rpPickCommandV01589 #comboResults .combo .comboScore{font-size:13px!important;color:#9be4ff!important;font-weight:950!important}.rpPickCommandV01589 #comboResults .combo:first-child .comboScore{color:#ffe18a!important}
    #random.rpPickCommandV01589 #comboResults .combo .desc{color:#82a1bb!important;font-size:9px!important}

    #random.rpPickCommandV01589 .rpInfoShellV01549{border:1px solid #2c526e!important;border-top:2px solid #d7a62d!important;border-radius:13px!important;background:linear-gradient(180deg,#0c1f32,#081624)!important;box-shadow:0 12px 28px rgba(0,0,0,.14)!important}
    #random.rpPickCommandV01589 .rpInfoHeadV01549{padding:10px 12px!important;background:linear-gradient(90deg,rgba(20,65,93,.16),transparent)}
    #random.rpPickCommandV01589 .rpTabsV01549 button{border-radius:7px!important}.rpPickCommandV01589 .rpTabsV01549 button.active{background:linear-gradient(180deg,#1a79ad,#145581)!important}
    #random.rpPickCommandV01589 .rpQuickGridV01549{grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:7px!important}
    #random.rpPickCommandV01589 .rpQuickCardV01549{min-height:66px;border-color:#294b65!important;background:linear-gradient(180deg,#091a2a,#071522)!important;padding:9px!important;display:flex;flex-direction:column;justify-content:center}
    #random.rpPickCommandV01589 .rpQuickCardV01549:nth-child(5){border-color:#6f5c27!important;background:linear-gradient(180deg,#28220d,#141a1b)!important}.rpPickCommandV01589 .rpQuickCardV01549:nth-child(5) b{color:#ffe28a!important}
    #random.rpPickCommandV01589 .rpQuickCardV01549.wide{grid-column:1/-1!important;min-height:48px!important;border-left:3px solid #3fa9e8!important}

    @media(max-width:1500px){#random.rpPickCommandV01589 #randomInputAnchor{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}#random.rpPickCommandV01589 .rpPickIntelV01589{grid-column:1/-1!important;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}#random.rpPickCommandV01589 .rp89IntelHead,#random.rpPickCommandV01589 .rp89IntelSection{grid-column:1/-1}.rpPickCommandV01589 .rp89Metric{border:1px solid #173147!important;border-radius:8px;padding:8px!important}.rpPickCommandV01589 .rpQuickGridV01549{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
    @media(max-width:1050px){#random.rpPickCommandV01589 #randomInputAnchor{grid-template-columns:1fr!important}#random.rpPickCommandV01589 .rpPickIntelV01589{grid-column:auto!important;display:block}.rpPickCommandV01589 .rpQuickGridV01549{grid-template-columns:repeat(2,minmax(0,1fr))!important}#random.rpPickCommandV01589>.randomHero{padding-right:16px!important;padding-top:54px!important}}
    @media(max-width:680px){#random.rpPickCommandV01589 #poolInputs.poolGrid{grid-template-columns:1fr!important}.rpPickCommandV01589 .rpQuickGridV01549{grid-template-columns:1fr!important}.rpPickCommandV01589 .rpQuickCardV01549.wide{grid-column:auto!important}}
  `;
  document.head.appendChild(st);
}

function pickIntelModelV01589(){
  const q=Math.max(1,Math.min(5,Number(document.querySelector('#queueSize')?.value)||1));
  let manual=[];
  try{manual=Array.isArray(randomState?.manual)?randomState.manual:[]}catch{}
  const locked=manual.filter(x=>String(x||'').trim()).length;
  const ext=[...document.querySelectorAll('#externalInputs .searchInput')].filter(x=>String(x?.dataset?.committed||x?.value||'').trim()).length;
  const pool=[...document.querySelectorAll('#poolInputs .searchInput')].filter(x=>String(x?.dataset?.committed||x?.value||'').trim()).length;
  const need=Math.max(0,q-locked-ext);
  const lockPct=Math.max(0,Math.min(100,Math.round(((locked+ext)/q)*100)));
  const poolPct=need===0?100:Math.max(0,Math.min(100,Math.round((pool/Math.max(1,need))*100)));
  const cards=[...document.querySelectorAll('#externalCheck .randomCheckGrid>.checkCard')];
  const shortages=[...document.querySelectorAll('#externalCheck .rpCheckChipV01558')].map(x=>String(x.textContent||'').trim()).filter(Boolean).slice(0,6);
  const damage=String(cards[1]?.querySelector('b')?.textContent||'-').replace(/\s+/g,' ').trim();
  const calc=String(cards[2]?.querySelector('b')?.textContent||'계산 대기').replace(/\s+/g,' ').trim();
  const dm=damage.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  const ad=dm?Number(dm[1]):0,ap=dm?Number(dm[2]):0,total=ad+ap;
  const adPct=total>0?Math.round(ad/total*100):50,apPct=100-adPct;
  let top={name:'',score:'',reason:'후보를 입력하면 완성 조합 TOP5에서 핵심 선택을 요약합니다.'};
  try{top=topCombo()}catch{}
  return{q,locked,ext,pool,need,lockPct,poolPct,shortages,damage,calc,adPct,apPct,top};
}

function ensurePickIntelV01589(r){
  if(!r?.input)return;
  let panel=document.querySelector('#rpPickIntelV01589');
  if(!panel){panel=document.createElement('aside');panel.id='rpPickIntelV01589';panel.className='panel rpPickIntelV01589';r.input.appendChild(panel)}
  const m=pickIntelModelV01589();
  const chips=(m.shortages.length?m.shortages:['현재 큰 결손 없음']).map((x,i)=>`<span class="rp89Chip${m.shortages.length?'':' good'}">${esc(x)}</span>`).join('');
  const topName=m.top?.name||'계산 대기';
  const topReason=m.top?.reason||'후보 입력 후 TOP5를 계산하면 핵심 시너지가 표시됩니다.';
  panel.innerHTML=`<div class="rp89IntelHead"><b>◆ 조합 DNA</b><span>LIVE PICK INTEL</span></div>
    <div class="rp89Metric"><div class="rp89MetricTop"><span>픽 고정 진행도</span><b>${m.locked+m.ext}/${m.q}</b></div><div class="rp89Bar" style="--v:${m.lockPct}%"><i></i></div></div>
    <div class="rp89Metric"><div class="rp89MetricTop"><span>후보 준비도</span><b>${m.pool}명 · 필요 ${m.need}명</b></div><div class="rp89Bar" style="--v:${m.poolPct}%"><i></i></div></div>
    <div class="rp89Metric"><div class="rp89MetricTop"><span>실전 AD / AP</span><b>${esc(m.damage)}</b></div><div class="rp89Split" style="--ad:${m.adPct}%;--ap:${m.apPct}%"><i class="ad"></i><i class="ap"></i></div></div>
    <div class="rp89Metric"><div class="rp89MetricTop"><span>추천 계산</span><b>${esc(m.calc)}</b></div></div>
    <div class="rp89IntelSection"><strong>⚠ 부족 역할 / 보완 포인트</strong><div class="rp89Chips">${chips}</div></div>
    <div class="rp89IntelSection"><strong>✦ 현재 TOP1 핵심</strong><div class="rp89Top1"><span>${esc(m.top?.score||'TOP1')}</span><b>${esc(topName)}</b><small>${esc(topReason)}</small></div></div>`;
}

function refreshPickCommandCenterV01589(r){
  const root=document.querySelector('#random');if(!root)return;
  root.classList.add('rpPickCommandV01589');
  ensurePickCommandCenterStylesV01589();
  ensurePickIntelV01589(r);
}

function patchRandomPracticeV01589(src){
  const signature='function ensurePickCommandCenterStylesV01589()';
  if(src.includes(signature))return src;
  const insertAnchor='  function stageHead(id,title,sub,before){';
  if(countOf(src,insertAnchor)!==1)throw new Error(`v0.15.89 source contract mismatch stageHead count=${countOf(src,insertAnchor)}`);
  const helpers=[ensurePickCommandCenterStylesV01589,pickIntelModelV01589,ensurePickIntelV01589,refreshPickCommandCenterV01589].map(fn=>'  '+fn.toString().replace(/\n/g,'\n  ')).join('\n\n')+'\n\n';
  src=src.replace(insertAnchor,helpers+insertAnchor);
  const oldRefresh="    ensureInfoShell(r);\n    updateFocus();applyTab();syncPoolButton(r.poolPanel);";
  const newRefresh="    ensureInfoShell(r);\n    refreshPickCommandCenterV01589(r);\n    updateFocus();applyTab();syncPoolButton(r.poolPanel);";
  if(countOf(src,oldRefresh)!==1)throw new Error(`v0.15.89 source contract mismatch refresh hook count=${countOf(src,oldRefresh)}`);
  return src.replace(oldRefresh,newRefresh);
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-practice-focus-v01549.js')src=patchRandomPracticeV01589(src);
  return src;
}

module.exports={
  patchRuntimeSource,
  score_logic_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  route_adoption_changed:prior.route_adoption_changed===true,
  ingame_hud_changed:prior.ingame_hud_changed===true,
  champion_visuals_changed:prior.champion_visuals_changed===true,
  reference_layout_changed:prior.reference_layout_changed===true,
  fight_status_scale_changed:prior.fight_status_scale_changed===true,
  build_analysis_changed:prior.build_analysis_changed===true,
  random_top1_label_dedupe_changed:prior.random_top1_label_dedupe_changed===true,
  random_pick_command_center_changed:true,
  policy_version:'0.15.89'
};
