'use strict';
(()=>{
  const V='0.15.28';
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const canon=v=>{const s=String(v??'').trim(),m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s};
  let cache={at:0,state:null,pending:null};
  function ownGrade(score){score=num(score);if(score>=96)return'S+';if(score>=91)return'S';if(score>=84)return'A+';if(score>=76)return'A';if(score>=64)return'B';if(score>=52)return'C';return'D'}
  const rank=g=>({'D-':0,'D':1,'D+':2,'C-':3,'C':4,'C+':5,'B-':6,'B':7,'B+':8,'A-':9,'A':10,'A+':11,'S-':12,'S':13,'S+':14}[String(g||'').toUpperCase()]??null);
  async function state(force=false){
    if(!window.aramDesktop?.getRiotGradeState)return null;const now=Date.now();if(!force&&cache.state&&now-cache.at<4000)return cache.state;if(cache.pending)return cache.pending;
    cache.pending=window.aramDesktop.getRiotGradeState().then(x=>(cache={at:Date.now(),state:x,pending:null},x)).catch(()=>(cache.pending=null,cache.state));return cache.pending;
  }
  function targetPuuid(){return String(aramHistoryState?.account?.puuid||'')}
  function findRecord(s,m){
    const gid=canon(m?.gameId),puuid=targetPuuid(),championId=Number(m?.championId);
    if(!gid||!puuid||!Number.isInteger(championId)||championId<=0)return null;
    return (s?.records||[]).find(r=>r.gameIdSource==='mastery-update'&&canon(r.gameId)===gid&&String(r.puuid||'')===puuid&&Number(r.championId)===championId)||null;
  }
  function verdict(roleGrade,riotGrade){const a=rank(roleGrade),b=rank(riotGrade);if(a==null||b==null)return'외부 검증값 수집 완료';const d=b-a;if(d>=3)return`Riot 등급이 우리보다 ${d}단계 높음 · 저평가 검토`;if(d<=-3)return`우리 등급이 Riot보다 ${-d}단계 높음 · 고평가 검토`;if(Math.abs(d)<=1)return'두 평가가 비슷한 구간';return d>0?'Riot 평가가 다소 높음':'우리 평가가 다소 높음'}
  function style(){if(document.getElementById('rg28Style'))return;const s=document.createElement('style');s.id='rg28Style';s.textContent=`.rg28{margin:9px 0;border:1px solid #314b69;background:linear-gradient(135deg,#0b1a2b,#0c1724);border-radius:11px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px}.rg28main span,.rg28side span{display:block;color:#7f98b5;font-size:8px}.rg28main b{display:block;margin-top:3px;font-size:13px;color:#dcecff}.rg28duel{display:flex;align-items:center;gap:9px}.rg28grade{min-width:48px;text-align:center;border:1px solid #3b5d7e;border-radius:9px;padding:6px 8px;background:#0b2236}.rg28grade small{display:block;font-size:7px;color:#7590aa}.rg28grade strong{display:block;font-size:18px;margin-top:2px}.rg28grade.riot strong{color:#7de2ff}.rg28grade.role strong{color:#f1c96b}.rg28note{font-size:8px;color:#7088a2;margin-top:4px;line-height:1.35}.rg28.wait{opacity:.72}.rg28 button{border:1px solid #355473;background:#10243a;color:#a9c3dc;border-radius:7px;padding:5px 8px;font-size:8px;cursor:pointer}@media(max-width:760px){.rg28{align-items:flex-start;flex-direction:column}.rg28duel{width:100%}}`;document.head.appendChild(s)}
  function card(m,s){
    const rec=findRecord(s,m),r=(()=>{try{return aramHistoryRoleBreakdown(m)}catch{return null}})(),score=num(r?.score),roleGrade=String(r?.grade||ownGrade(score));
    if(rec)return `<div class="rg28"><div class="rg28main"><span>RIOT GRADE CHECK · 동일 경기 검증</span><b>${esc(verdict(roleGrade,rec.grade))}</b><div class="rg28note">Riot Grade는 ROLE 계산에 아직 반영하지 않고 검증 앵커로만 저장합니다. · Game ${esc(canon(m.gameId))}</div></div><div class="rg28duel"><div class="rg28grade role"><small>우리 ROLE</small><strong>${esc(roleGrade)}</strong><small>${Math.round(score)}점</small></div><div>↔</div><div class="rg28grade riot"><small>Riot Grade</small><strong>${esc(rec.grade)}</strong><small>${rec.gameIdSource==='mastery-update'?'직접 gameId':'EOG gameId 연결'}</small></div></div></div>`;
    const local=String(aramHistoryState?.localAccount?.puuid||aramHistoryState?.account?.puuid||''),target=targetPuuid(),other=local&&target&&local!==target;
    const msg=other?'Riot Grade는 현재 로그인된 내 계정의 종료 경기만 자동 수집합니다.':`이 경기 Riot Grade 기록 없음 · ${esc(s?.lastResult||'다음 게임 종료 후 자동 수집')}`;
    return `<div class="rg28 wait"><div class="rg28main"><span>RIOT GRADE CHECK</span><b>${msg}</b><div class="rg28note">v0.15.28 이후 앱이 실행된 상태에서 게임 종료 화면의 LCU 등급을 자동 저장합니다. 과거 경기 등급은 소급 복원하지 않습니다.</div></div><button onclick="aramRiotGradeRefreshV01528()">다시 확인</button></div>`;
  }
  async function annotate(force=false){
    try{style();const root=document.getElementById('historyMatchDetail'),m=aramHistoryState?.matches?.find(x=>String(x.gameId)===String(aramHistoryState.selectedGameId));if(!root||!m)return;const puuid=targetPuuid(),selected=String(aramHistoryState.selectedGameId);const s=await state(force);if(document.getElementById('historyMatchDetail')!==root||String(aramHistoryState.selectedGameId)!==selected||targetPuuid()!==puuid)return;root.querySelector('#riotGradeCheckV01528')?.remove();const wrap=document.createElement('div');wrap.id='riotGradeCheckV01528';wrap.innerHTML=card(m,s);const tabs=root.querySelector('.matchLabTabs');if(tabs?.parentNode)tabs.insertAdjacentElement('afterend',wrap);else root.prepend(wrap)}catch(e){console.warn('[v0.15.28] Riot Grade UI annotate failed',e)}
  }
  async function refresh(){cache.at=0;try{if(window.aramDesktop?.pollRiotGrade)await window.aramDesktop.pollRiotGrade()}catch{}await annotate(true)}
  try{
    window.aramRiotGradeRefreshV01528=refresh;
    const old=window.renderAramHistoryFeedback;if(typeof old==='function')window.renderAramHistoryFeedback=function(...a){const r=old.apply(this,a);setTimeout(()=>annotate(false),0);return r};
    window.aramRiotGradeV01528={state,findRecord,annotate,ownGrade,verdict};window.__ARAM_RIOT_GRADE_V01528__=true;
    if(typeof DATA!=='undefined'){DATA.version=V;DATA.riot_grade_v01528={version:'v0.15.28 · Riot Grade Collector',source:'LCU /lol-end-of-game/v1/champion-mastery-updates',scoring_use:false,local_only:true,retroactive:false}}
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();setTimeout(()=>annotate(false),300);setInterval(()=>{if(document.getElementById('historyMatchDetail'))annotate(false)},7000);
  }catch(e){console.error('[v0.15.28] Riot Grade UI failed',e);window.__ARAM_RIOT_GRADE_V01528__=false}
})();
