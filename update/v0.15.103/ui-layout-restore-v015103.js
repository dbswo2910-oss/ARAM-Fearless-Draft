'use strict';
(()=>{
  const V='0.15.103';
  if(window.__ARAM_UI_LAYOUT_RESTORE_V015103__)return;
  window.__ARAM_UI_LAYOUT_RESTORE_V015103__=true;
  let randomTimer=0,lastAutoSig='';
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function ensureStyle(){
    if($('#uiLayoutRestoreStyleV015103'))return;
    const st=document.createElement('style');st.id='uiLayoutRestoreStyleV015103';st.textContent=`
      /* v0.15.103 · restore the proven v0.15.90 RANDOM pick layout */
      #random.rpLayoutRestoreV015103{position:relative;left:50%;transform:translateX(-50%);width:min(1580px,calc(100vw - 46px))!important;max-width:none!important;margin-left:0!important;margin-right:0!important}
      #random.rpLayoutRestoreV015103>.randomModeNav{margin-bottom:8px!important}
      #random.rpLayoutRestoreV015103>.randomHero{padding:12px 150px 11px 14px!important;border-radius:10px!important;min-height:0!important}
      #random.rpLayoutRestoreV015103 #lolAutoSyncPanel{margin-top:8px!important;margin-bottom:8px!important}
      #random.rpLayoutRestoreV015103 .rpStageHeadV01549{display:none!important}
      #random.rpLayoutRestoreV015103 #randomInputAnchor{display:grid!important;grid-template-columns:minmax(360px,.88fr) minmax(560px,1.28fr) minmax(245px,.44fr)!important;gap:10px!important;align-items:start!important;margin-top:8px!important}
      #random.rpLayoutRestoreV015103 .rp103Left{grid-column:1;grid-row:1;min-width:0!important}
      #random.rpLayoutRestoreV015103 .rp103Center{grid-column:2;grid-row:1;display:grid;gap:10px;min-width:0}
      #random.rpLayoutRestoreV015103 #rpPickIntelV01589{grid-column:3!important;grid-row:1!important;display:block!important;min-width:0!important;margin:0!important;border:1px solid #294b67!important;border-radius:10px!important;background:linear-gradient(180deg,#0b1e31,#071522)!important;padding:11px!important;box-sizing:border-box}
      #random.rpLayoutRestoreV015103 #randomInputAnchor>.panel,#random.rpLayoutRestoreV015103 .rp103Center>.panel{border:1px solid #294b67!important;border-radius:10px!important;background:linear-gradient(180deg,#0b1e31,#071522)!important;box-shadow:0 10px 25px rgba(0,0,0,.15)!important;margin:0!important;min-width:0!important}
      #random.rpLayoutRestoreV015103 #randomRecommendAnchor.rp103Empty{display:none!important}
      #random.rpLayoutRestoreV015103 #poolInputs.poolGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}
      #random.rpLayoutRestoreV015103 .rp103Top5Panel{padding:8px!important}
      #random.rpLayoutRestoreV015103 .rp103Top5Panel>:scope>.title{display:none!important}
      #random.rpLayoutRestoreV015103 .rp103Top5Head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 3px 8px;border-bottom:1px solid #17354d;margin-bottom:5px}
      #random.rpLayoutRestoreV015103 .rp103Top5Head .left{display:flex;align-items:center;gap:7px;min-width:0}.rp103Top5Head b{font-size:13px;color:#eef9ff;white-space:nowrap}.rp103Top5Head small{font-size:8px;color:#789ab6}.rp103Top5Head .count{font-size:8px;color:#76ddff;border:1px solid #265979;background:#092338;border-radius:999px;padding:4px 7px;white-space:nowrap}
      #random.rpLayoutRestoreV015103 #comboResults{display:grid!important;grid-template-columns:1fr!important;gap:5px!important}
      #random.rpLayoutRestoreV015103 #comboResults .combo{position:relative!important;margin:0!important;border:1px solid #24445c!important;border-radius:8px!important;background:linear-gradient(90deg,#081927,#07141f)!important;min-height:56px!important;overflow:hidden!important;transform:none!important}
      #random.rpLayoutRestoreV015103 #comboResults .combo:first-child{border-color:#8d7228!important;background:linear-gradient(90deg,#211d0d 0,#0b1c29 34%,#07141f 100%)!important;box-shadow:inset 3px 0 0 #e0b236,0 0 15px rgba(214,172,54,.08)!important}
      #random.rpLayoutRestoreV015103 #comboResults .rp90ComboView{display:grid!important}
      #random.rpLayoutRestoreV015103 .rp89IntelHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}.rp89IntelHead b{font-size:12px;color:#eef9ff}.rp89IntelHead span{font-size:7px;color:#55e8c7;font-weight:900}
      #random.rpLayoutRestoreV015103 .rp103DnaMetric{padding:7px 0;border-bottom:1px solid #173247}.rp103DnaTop{display:flex;justify-content:space-between;gap:7px;align-items:center;font-size:8px;color:#85a6be}.rp103DnaTop b{font-size:8px;color:#dff5ff}.rp103DnaMetric.missing .rp103DnaTop b{color:#efc24c}.rp103DnaBar{height:6px;border-radius:999px;background:#102a3d;overflow:hidden;margin-top:4px}.rp103DnaBar i{display:block;height:100%;width:var(--v,0%);border-radius:inherit;background:linear-gradient(90deg,#24b7dd,#2fe0bf)}.rp103DnaMetric.missing .rp103DnaBar i{background:linear-gradient(90deg,#d49527,#efc24c)}
      #random.rpLayoutRestoreV015103 .rp103Damage{padding:8px 0;border-bottom:1px solid #173247}.rp103Split{height:7px;display:flex;overflow:hidden;border-radius:999px;background:#11283b;margin-top:5px}.rp103Split .ad{width:var(--ad,50%);background:#ff796f}.rp103Split .ap{width:var(--ap,50%);background:#59bcff}.rp103Legend{display:flex;justify-content:space-between;font-size:7px;color:#7899b2;margin-top:3px}
      #random.rpLayoutRestoreV015103 .rp103IntelSection{padding-top:8px;margin-top:7px}.rp103IntelSection strong{font-size:9px;color:#dceefa}.rp103Chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}.rp103Chip{font-size:7px;padding:3px 6px;border:1px solid #725b1d;border-radius:999px;background:#2b250d;color:#f0c95c}.rp103Top1{margin-top:5px;padding:8px;border:1px solid #755f1f;border-radius:7px;background:#211d0c}.rp103Top1 span{display:block;font-size:8px;color:#ffe277}.rp103Top1 b{display:block;margin-top:3px;color:#fff;font-size:12px}.rp103Top1 small{display:block;margin-top:4px;color:#9cb5c7;font-size:7px;line-height:1.35}
      @media(max-width:1450px){#random.rpLayoutRestoreV015103 #randomInputAnchor{grid-template-columns:minmax(330px,.9fr) minmax(520px,1.25fr)!important}#random.rpLayoutRestoreV015103 #rpPickIntelV01589{grid-column:1/-1!important;grid-row:2!important;display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:6px!important}#random.rpLayoutRestoreV015103 .rp89IntelHead,#random.rpLayoutRestoreV015103 .rp103IntelSection{grid-column:1/-1!important}.rp103DnaMetric,.rp103Damage{border:1px solid #173247!important;border-radius:7px!important;padding:7px!important}}
      @media(max-width:1050px){#random.rpLayoutRestoreV015103{width:calc(100vw - 24px)!important}#random.rpLayoutRestoreV015103 #randomInputAnchor{grid-template-columns:1fr!important}#random.rpLayoutRestoreV015103 .rp103Left,#random.rpLayoutRestoreV015103 .rp103Center,#random.rpLayoutRestoreV015103 #rpPickIntelV01589{grid-column:1!important;grid-row:auto!important}#random.rpLayoutRestoreV015103 #rpPickIntelV01589{display:block!important}}

      /* DATA: top-level second navigation, never inside champion detail */
      #dataHubNavV01599{display:none!important}
      #dataHubTopNavV015103{grid-column:1/-1!important;width:100%;box-sizing:border-box;display:flex;align-items:center;gap:7px;margin:0 0 10px;padding:7px;border:1px solid #244e6b;border-radius:10px;background:linear-gradient(180deg,#0b2236,#081a2a);box-shadow:0 8px 24px rgba(0,0,0,.13)}
      #dataHubTopNavV015103 button{appearance:none;border:1px solid #2c5b7d;background:#081a2a;color:#9ebbd0;border-radius:8px;padding:8px 14px;font-size:11px;font-weight:900;cursor:pointer}#dataHubTopNavV015103 button.active{border-color:#54bcff;background:linear-gradient(180deg,#143d5f,#0d2d49);color:#fff;box-shadow:inset 0 -2px 0 #55d8ff}#dataHubTopNavV015103 .badge{margin-left:4px;padding:2px 5px;border-radius:5px;background:#8b6516;color:#ffe79a;font-size:7px}
      .dataHubHostV015103.dataHubPatchV015103>.dataHubTierPaneV015103{display:none!important}.dataHubHostV015103.dataHubPatchV015103>.dataHubDetailPaneV015103{grid-column:1/-1!important;width:100%!important;max-width:none!important}.dataHubHostV015103.dataHubPatchV015103 #dataCard{width:100%!important;max-width:none!important}
    `;document.head.appendChild(st);
  }

  function poolNames(){return $$('#poolInputs .searchInput').map(x=>String(x.dataset.committed||x.value||'').trim()).filter(Boolean)}
  function manualNames(){return $$('#manualPartyInputs .searchInput').map(x=>String(x.dataset.committed||x.value||'').trim()).filter(Boolean)}
  function externalNames(){return $$('#externalInputs .searchInput').map(x=>String(x.dataset.committed||x.value||'').trim()).filter(Boolean)}
  function topModel(){
    const row=$('#comboResults .combo');
    const name=txt(row?.querySelector('.rp90Name'))||txt(row?.querySelector('.names'))||'후보 계산 대기';
    const score=txt(row?.querySelector('.rp90Score'))||txt(row?.querySelector('.comboScore'))||'계산 대기';
    const reason=txt(row?.querySelector('.rp90Desc'))||txt(row?.querySelector('.desc'))||'후보를 입력하면 완성 조합 TOP5에서 핵심 선택을 요약합니다.';
    const checks=$$('#externalCheck .checkCard');const missing=txt(checks[0]?.querySelector('b'))||'현재 큰 결손 없음';const damage=txt(checks[1]?.querySelector('b'))||'50 / 50';
    const dm=damage.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);const a=dm?Number(dm[1]):50,p=dm?Number(dm[2]):50,t=a+p||100;const ad=Math.round(a/t*100),ap=100-ad;
    const shortageText=(txt($('#externalCheck'))+' '+missing).toLowerCase();
    const metric=(keys)=>keys.some(k=>shortageText.includes(k))?{v:24,label:'부족',missing:true}:{v:78,label:'확보',missing:false};
    return{name,score,reason,missing,ad,ap,dna:{engage:metric(['이니시','진입','교전']),poke:metric(['포킹']),front:metric(['프론트','앞라인','탱커']),sustain:metric(['지속','유지','보호','회복']),cc:metric(['군중','cc','제어'])}};
  }
  function dnaMetric(label,m){return `<div class="rp103DnaMetric${m.missing?' missing':''}"><div class="rp103DnaTop"><span>${esc(label)}</span><b>${esc(m.label)}</b></div><div class="rp103DnaBar" style="--v:${m.v}%"><i></i></div></div>`}
  function renderFallbackIntel(panel){
    if(panel.querySelector('.rp89IntelHead'))return;
    const m=topModel();panel.innerHTML=`<div class="rp89IntelHead"><b>◆ 조합 DNA</b><span>LIVE PICK INTEL</span></div>${dnaMetric('한타 개시(Engage)',m.dna.engage)}${dnaMetric('포킹(Poke)',m.dna.poke)}${dnaMetric('프론트라인(Frontline)',m.dna.front)}${dnaMetric('지속 전투(Sustain)',m.dna.sustain)}${dnaMetric('군중 제어(CC)',m.dna.cc)}<div class="rp103Damage"><div class="rp103DnaTop"><span>실전 AD / AP</span><b>${m.ad} / ${m.ap}</b></div><div class="rp103Split" style="--ad:${m.ad}%;--ap:${m.ap}%"><i class="ad"></i><i class="ap"></i></div><div class="rp103Legend"><span>AD ${m.ad}%</span><span>AP ${m.ap}%</span></div></div><div class="rp103IntelSection"><strong>⚠ 부족한 역할</strong><div class="rp103Chips"><span class="rp103Chip">${esc(m.missing)}</span></div></div><div class="rp103IntelSection"><strong>✦ 현재 TOP1</strong><div class="rp103Top1"><span>${esc(m.score)}</span><b>${esc(m.name)}</b><small>${esc(m.reason)}</small></div></div>`;
  }
  function enhanceTop5(panel,results){
    panel.classList.add('rp103Top5Panel');let head=panel.querySelector(':scope>.rp103Top5Head');if(!head){head=document.createElement('div');head.className='rp103Top5Head';results.parentElement?.insertBefore(head,results)}
    const n=results.querySelectorAll('.combo').length;head.innerHTML=`<div class="left"><b>현재 큐 인원 기준 완성 조합 TOP5</b><small>엔진 점수 순 · 후보 클릭 시 오른쪽 DNA 미리보기</small></div><span class="count">${n}개 계산됨</span>`;
  }
  function autoCalculate(){
    const results=$('#comboResults');if(!results||results.querySelector('.combo'))return;
    const q=Math.max(1,Math.min(5,Number($('#queueSize')?.value)||1)),need=Math.max(0,q-manualNames().length),pool=poolNames();if(need<1||pool.length<need)return;
    const sig=[q,manualNames().join('|'),externalNames().join('|'),pool.join('|')].join('::');if(sig===lastAutoSig)return;
    const btn=$$('#random button').find(b=>txt(b).includes('완성 조합 TOP5 계산'));if(!btn||btn.disabled)return;lastAutoSig=sig;try{btn.click()}catch{}
  }
  function syncRandom(){
    ensureStyle();const root=$('#random'),input=$('#randomInputAnchor'),results=$('#comboResults');if(!root||!input||!results)return;
    root.classList.add('rpLayoutRestoreV015103');const pool=$('#poolInputs')?.closest('.panel'),resultPanel=results.closest('.panel');
    let intel=$('#rpPickIntelV01589');if(!intel){intel=document.createElement('aside');intel.id='rpPickIntelV01589';intel.className='rpPickIntelV01589 randomPickOnly';input.appendChild(intel)}
    const panels=$$('.panel',input);const left=panels.find(x=>x!==pool&&x!==resultPanel&&x!==intel&&!x.classList.contains('rp103Center'));if(left)left.classList.add('rp103Left');
    let center=$(':scope>.rp103Center',input);if(!center){center=document.createElement('div');center.className='rp103Center';left?.nextSibling?input.insertBefore(center,left.nextSibling):input.appendChild(center)}
    if(pool&&pool.parentElement!==center)center.appendChild(pool);if(resultPanel&&resultPanel.parentElement!==center)center.appendChild(resultPanel);if(intel.parentElement!==input)input.appendChild(intel);
    if(resultPanel)enhanceTop5(resultPanel,results);renderFallbackIntel(intel);
    const rec=$('#randomRecommendAnchor');if(rec){const useful=[...rec.children].some(x=>!x.hidden);rec.classList.toggle('rp103Empty',!useful||rec.children.length===0)}
    autoCalculate();
  }
  function scheduleRandom(){clearTimeout(randomTimer);randomTimer=setTimeout(()=>{syncRandom();setTimeout(syncRandom,80)},35)}
  function wrapRefresh(obj,key){const fn=obj?.[key];if(typeof fn!=='function'||fn.__v015103)return;const wrapped=function(...a){const r=fn.apply(this,a);scheduleRandom();return r};wrapped.__v015103=true;obj[key]=wrapped}
  function bindRandom(){const root=$('#random');if(!root||root.dataset.v015103Bound==='1')return;root.dataset.v015103Bound='1';root.addEventListener('input',scheduleRandom,true);root.addEventListener('change',scheduleRandom,true);root.addEventListener('click',e=>{if(e.target.closest('button,.combo,.randomPoolItem'))scheduleRandom()},true);wrapRefresh(window.aramRandomPracticeFocusV01549,'refresh');wrapRefresh(window.aramRandomPracticeRuntimeV01572,'refresh');scheduleRandom()}

  function nearestCommon(a,b){let p=a?.parentElement;while(p&&!p.contains(b))p=p.parentElement;return p}
  function directChild(host,node){let x=node;while(x&&x.parentElement!==host)x=x.parentElement;return x}
  function syncData(){
    ensureStyle();window.__aramDataHubMountV01599?.();const card=$('#dataCard'),orig=$('#dataHubNavV01599');if(!card||!orig)return;
    const tierPanel=$$('.panel').find(p=>/역할별 티어 브라우저/.test(txt(p)));if(!tierPanel)return;const host=nearestCommon(tierPanel,card);if(!host)return;
    const tierPane=directChild(host,tierPanel),detailPane=directChild(host,card);if(!tierPane||!detailPane||tierPane===detailPane)return;
    host.classList.add('dataHubHostV015103');tierPane.classList.add('dataHubTierPaneV015103');detailPane.classList.add('dataHubDetailPaneV015103');
    let nav=$('#dataHubTopNavV015103');if(!nav){nav=document.createElement('nav');nav.id='dataHubTopNavV015103';nav.innerHTML='<button type="button" data-v103-tab="tier">챔피언 티어리스트</button><button type="button" data-v103-tab="patch">패치노트 <span class="badge">26.18</span></button>';host.insertBefore(nav,host.firstChild);nav.addEventListener('click',e=>{const b=e.target.closest('[data-v103-tab]');if(!b)return;orig.querySelector(`[data-dh99-tab="${b.dataset.v103Tab}"]`)?.click();setTimeout(syncData,0)})}
    const patchMode=card.classList.contains('dataHubPatchModeV01599');host.classList.toggle('dataHubPatchV015103',patchMode);$$('[data-v103-tab]',nav).forEach(b=>b.classList.toggle('active',b.dataset.v103Tab===(patchMode?'patch':'tier')));
  }
  function bindData(){const dataBtn=$$('button,[role="button"]').find(x=>txt(x)==='데이터');if(dataBtn&&!dataBtn.dataset.v103Bound){dataBtn.dataset.v103Bound='1';dataBtn.addEventListener('click',()=>setTimeout(syncData,30))}setTimeout(syncData,80)}

  function init(){ensureStyle();bindRandom();bindData();window.aramUiLayoutRestoreV015103={version:V,syncRandom,syncData,score_logic_changed:false}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();
