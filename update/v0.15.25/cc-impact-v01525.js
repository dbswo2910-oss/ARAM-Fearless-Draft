'use strict';
(()=>{
  const V='0.15.25';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const num=(v,d=null)=>{const n=Number(v);return Number.isFinite(n)?n:d};
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  const curve=(v,pts)=>{v=Number(v)||0;if(v<=pts[0][0])return pts[0][1];for(let i=1;i<pts.length;i++){const [x1,y1]=pts[i-1],[x2,y2]=pts[i];if(v<=x2){const t=(v-x1)/Math.max(.000001,x2-x1);return y1+(y2-y1)*t}}return pts[pts.length-1][1]};
  const raw=(me,key)=>{
    const bags=[me,me?.ccImpactRaw,me?.challenges,me?.stats,me?.raw,me?.raw?.challenges,me?.raw?.stats];
    for(const b of bags){if(b&&typeof b==='object'&&b[key]!==undefined&&b[key]!==null){const n=num(b[key]);if(n!==null)return n}}
    return null;
  };
  const expectedCc=name=>{try{const f=aramHistoryFunctionProfile(name)||{};const v=num(f.CC??f.cc);if(v!==null)return clamp(v,0,5)}catch{}try{const v=num(aramHistoryExpectedAxisValue(name,'cc'));if(v!==null)return clamp(v,0,5)}catch{}return null};
  function impact(m,base){
    const me=m?.me||{},mins=Math.max(1,(Number(m?.gameDuration)||1)/60),volume=clamp(base?.cc),immob=raw(me,'enemyChampionImmobilizations'),linked=raw(me,'immobilizeAndKillWithAlly'),knock=raw(me,'knockEnemyIntoTeamAndKill'),highest=raw(me,'highestCrowdControlScore'),name=(()=>{try{return aramHistoryResolveParticipant(me)}catch{return me?.championName||''}})(),expected=expectedCc(name);
    const hardAvailable=immob!==null,linkAvailable=linked!==null,knockAvailable=knock!==null,hasQuality=hardAvailable||linkAvailable||knockAvailable;
    const takedowns=Math.max(0,num(me?.kills,0)+num(me?.assists,0)),immobPer10=hardAvailable?immob/mins*10:null,linkedPer10=linkAvailable?linked/mins*10:null,linkedRate=linkAvailable&&takedowns>0?clamp(linked/takedowns,0,1):null;
    const hardScore=hardAvailable?clamp(curve(immobPer10,[[0,10],[1,20],[2,30],[4,45],[7,60],[10,72],[14,84],[20,94],[28,100]])):null;
    const linkedAbs=linkAvailable?clamp(curve(linkedPer10,[[0,10],[.5,20],[1.5,35],[3,52],[5,68],[7.5,82],[10,92],[14,100]])):null;
    const linkedRateScore=linkedRate!==null?clamp(curve(linkedRate,[[0,15],[.08,25],[.15,38],[.25,55],[.4,72],[.55,85],[.7,94],[.9,100]])):null;
    const conversionScore=linkAvailable?Math.round(linkedRateScore===null?linkedAbs:linkedAbs*.55+linkedRateScore*.45):null;
    let blended=volume;
    if(hardAvailable&&linkAvailable)blended=volume*.50+hardScore*.18+conversionScore*.32;
    else if(linkAvailable)blended=volume*.62+conversionScore*.38;
    else if(hardAvailable)blended=volume*.78+hardScore*.22;
    let delta=blended-volume;
    const canPenalize=hardAvailable&&linkAvailable&&immob>=3;
    delta=clamp(delta,canPenalize?-4:0,12);
    const knockBonus=knockAvailable&&knock>0?Math.min(4,knock*1.8):0;
    const score=hasQuality?Math.round(clamp(volume+delta+knockBonus)):Math.round(volume);
    let coreLabel='보조 기능';if(expected!==null&&expected>=4.2)coreLabel='최우선 핵심 기능';else if(expected!==null&&expected>=3.2)coreLabel='핵심 기능';else if(expected!==null&&expected>=2)coreLabel='주요 기능';
    let verdict='CC 수행량 기준 평가';
    if(linkAvailable){
      if(linked>=8||(linkedRate!==null&&linkedRate>=.5))verdict='처치 전환이 매우 강한 CC';
      else if(linked>=4||(linkedRate!==null&&linkedRate>=.3))verdict='처치로 잘 연결된 CC';
      else if(hardAvailable&&immob>=6&&linked<=1)verdict='CC 양 대비 처치 전환은 낮은 편';
      else verdict='CC 수행량과 처치 전환을 함께 반영';
    }else if(hardAvailable)verdict='하드 CC 횟수까지 반영 · 처치 연결 데이터는 없음';
    return{score,volume,delta:Math.round((score-volume)*10)/10,hasQuality,hardAvailable,linkAvailable,knockAvailable,immob,immobPer10,hardScore,linked,linkedPer10,linkedRate,linkedAbs,linkedRateScore,conversionScore,knock,highest,expected,coreLabel,verdict,takedowns};
  }
  function recompute(s,cc){
    const out={...s,cc:cc.score,ccQuantity:cc.volume,ccImpact:cc.score,ccImpactDelta:cc.delta,ccImpactEvidence:cc};
    out.engage=Math.round(out.cc*.50+out.kp*.30+out.absorb*.20);
    out.peel=Math.round(out.cc*.38+out.allySustain*.37+out.kp*.25);
    out.utility=Math.round(out.cc*.32+out.allySustain*.40+out.kp*.28);
    out.control=Math.round(out.cc*.50+out.kp*.28+out.damage*.17+out.survival*.05);
    out.pick=Math.round(out.burst*.32+out.cc*.28+out.kp*.24+out.dive*.12+out.survival*.04);
    return out;
  }
  const oldBaseSignals=window.aramHistoryBaseSignals;
  if(typeof oldBaseSignals!=='function')throw new Error('aramHistoryBaseSignals unavailable');
  window.aramHistoryBaseSignals=function(m){const s=oldBaseSignals.apply(this,arguments);if(!s)return s;try{return recompute(s,impact(m,s))}catch(e){console.warn('[v0.15.25] CC impact fallback',e);return s}};

  try{ARAM_ROLE_METRIC_DEFS.cc={label:'CC 영향력',detail:'CC 수행량 + 하드 CC + 처치 연결 증거를 중복 없이 반영'}}catch{}

  const match=()=>aramHistoryState?.matches?.find(x=>String(x.gameId)===String(aramHistoryState.selectedGameId));
  const fact=(a,b,c='')=>`<div class="rmFact"><span>${esc(a)}</span><b>${esc(b)}</b>${c?`<small>${esc(c)}</small>`:''}</div>`;
  const fmtPct=v=>v==null?'-':`${Math.round(v*100)}%`;
  function coachText(c){
    if(!c.hasQuality)return '이번 경기 데이터에는 Riot의 CC 처치 연결 보조 필드가 없어 기존 CC 수행량만 사용했습니다. 없는 장면을 추정해서 점수를 만들지는 않습니다.';
    if(c.linkAvailable&&(c.linked>=8||(c.linkedRate!==null&&c.linkedRate>=.5)))return 'CC가 실제 처치로 연결된 비중이 높습니다. 단순히 오래 묶은 것보다 팀이 후속딜을 넣을 수 있는 타이밍에 CC를 사용한 경기로 해석할 수 있습니다.';
    if(c.linkAvailable&&c.hardAvailable&&c.immob>=6&&c.linked<=1)return '하드 CC 자체는 여러 번 기록됐지만 처치 연결 수는 낮았습니다. 다음 복기에서는 핵심 대상에 걸었는지, 아군이 후속딜 가능한 거리였는지를 확인해보는 편이 좋습니다.';
    if(c.linkAvailable)return 'CC의 양과 처치 연결을 함께 반영했습니다. 전환 수치가 높을수록 단순 누적 CC보다 실제 교전 결과에 연결된 증거가 강합니다.';
    return '하드 CC 횟수는 확인됐지만 처치 연결 필드는 제공되지 않았습니다. 따라서 해당 부분은 추정하지 않고 CC 수행량과 하드 CC 증거만 사용했습니다.';
  }
  function enhanceCcModal(){
    const m=match();if(!m)return;const s=aramHistoryBaseSignals(m),r=aramHistoryRoleBreakdown(m),it=r?.items?.find(x=>x.key==='cc'),c=s?.ccImpactEvidence;if(!it||!c)return;
    const root=document.getElementById('rmDetailContent');if(!root)return;
    const title=root.querySelector('.rmHead>div>b');if(title)title.textContent='CC 영향력 상세';
    const lead=root.querySelector('.rmLead');if(lead)lead.innerHTML=`<b>${esc(c.verdict)}</b><br>기존 CC 수행량에 Riot 경기 데이터에서 확인 가능한 하드 CC·처치 연결 증거가 있을 때만 제한적으로 보정합니다.`;
    const flow=root.querySelector('.rmFlow');if(flow)flow.innerHTML=`${fact('CC 수행량',String(Math.round(c.volume)),'기존 양 지표')}${fact('전환 보정',`${c.delta>=0?'+':''}${c.delta}`,'최대 +12 / -4')}${fact('최종 CC 영향력',String(Math.round(c.score)))}${fact('챔피언 기대 역할',c.coreLabel,c.expected==null?'Function18 확인 불가':`Function18 CC ${c.expected.toFixed(1)}/5`)}`;
    const facts=root.querySelector('.rmFacts');if(facts){
      const me=m.me||{},mm=Math.max(1,num(m.gameDuration,60)/60),baseFacts=[
        fact('총 CC 시간',`${num(me.timeCCingOthers,0).toFixed(1)}초`,`${(num(me.timeCCingOthers,0)/mm*10).toFixed(1)}초 / 10분`),
        fact('팀 CC 비중',(()=>{try{return aramHistoryPct(me.ccShare)}catch{return `${Math.round(num(me.ccShare,0)*100)}%`}})(),'기존 수행량 구성'),
        fact('하드 CC 횟수',c.hardAvailable?String(Math.round(c.immob)):'미제공',c.hardAvailable?`${c.immobPer10.toFixed(1)}회 / 10분`:'점수에 추정값 미사용'),
        fact('CC → 처치 연결',c.linkAvailable?String(Math.round(c.linked)):'미제공',c.linkAvailable?`${c.linkedPer10.toFixed(1)}회 / 10분`:'점수에 추정값 미사용'),
        fact('처치 관여 중 CC 연결',c.linkAvailable&&c.linkedRate!==null?fmtPct(c.linkedRate):'미제공',`${Math.round(c.takedowns)} K+A 기준`),
        fact('밀쳐내기 → 처치',c.knockAvailable?String(Math.round(c.knock)):'미제공',c.knockAvailable&&c.knock>0?'고가치 직접 증거':'추가 보정 없음')
      ];facts.innerHTML=baseFacts.join('')}
    const formula=root.querySelector('.rmFormula');if(formula)formula.innerHTML=`<b>1) CC 수행량</b> = 팀 CC 비중 65% + 10분당 CC 시간 35%<br><b>2) 품질 증거</b> = 적 챔피언 이동불가 횟수 + immobilizeAndKillWithAlly 처치 연결. 제공되는 경우에만 반영합니다.<br><b>3) 안전장치</b> = 기존 CC 수행량 대비 보정폭을 최대 +12점으로 제한하고, 하드 CC가 실제로 충분히 있었는데 처치 전환이 낮은 경우에만 최대 -4점까지 허용합니다.<br><b>4) 핵심 CC</b> = Function18의 CC 기대치를 표시하며, 챔피언이 원래 CC가 핵심인 경우 기존 기대축 정규화가 더 엄격하게 적용됩니다.`;
    const coach=root.querySelector('.rmCoach');if(coach)coach.textContent=coachText(c);
    const note=root.querySelector('.rmNote');if(note)note.textContent='※ 이 평가는 경기 결과에 기록된 집계값만 사용합니다. 어떤 스킬이 몇 명에게 적중했는지, 특정 CC 한 번이 정확히 어느 킬의 직접 원인이었는지는 리플레이 없이 단정하지 않습니다. 처치 연결 필드가 없는 경기는 기존 CC 수행량으로 자동 폴백합니다.';
  }
  const oldOpen=window.openRoleMetricDetail;
  function openCc(){if(typeof oldOpen==='function')oldOpen('cc');setTimeout(enhanceCcModal,0);setTimeout(enhanceCcModal,30)}
  function annotate(){
    if(aramHistoryState?.detailTab!=='feedback')return;const m=match();if(!m)return;const r=aramHistoryRoleBreakdown(m),cards=[...document.querySelectorAll('#historyMatchDetail .historyRoleGrid .historyRoleMetric')],idx=(r.items||[]).findIndex(x=>x.key==='cc');if(idx<0||!cards[idx])return;
    const card=cards[idx];card.classList.add('rmClick');card.tabIndex=0;card.title='CC 영향력 상세보기';card.onclick=e=>{e?.preventDefault?.();e?.stopImmediatePropagation?.();openCc()};card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();openCc()}};
  }
  try{
    const oldFeedback=window.renderAramHistoryFeedback;
    if(typeof oldFeedback==='function')window.renderAramHistoryFeedback=function(...a){const r=oldFeedback.apply(this,a);setTimeout(annotate,0);return r};
    window.openCcImpactDetailV01525=openCc;
    window.aramCcImpactV01525={impact,recompute,annotate,enhanceCcModal};
    window.__ARAM_CC_IMPACT_V01525__=true;
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.cc_impact_v01525={version:'v0.15.25 · Match Lab CC Impact',quantity_formula:'team cc share 65% + cc time per 10 35%',quality_fields:['enemyChampionImmobilizations','immobilizeAndKillWithAlly','knockEnemyIntoTeamAndKill'],bounded_adjustment:{up:12,down:4},missing_quality_fallback:'quantity only',exact_spell_scene_inference:false};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    setTimeout(annotate,0);
  }catch(e){console.error('[v0.15.25] CC impact patch failed',e);window.__ARAM_CC_IMPACT_V01525__=false}
})();
