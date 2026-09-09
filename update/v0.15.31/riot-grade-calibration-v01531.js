'use strict';
(()=>{
  const V='0.15.31';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const avg=a=>a?.length?a.reduce((s,x)=>s+num(x),0)/a.length:0;
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  const canon=v=>{const s=String(v??'').trim(),m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s};
  const coarse=g=>{g=String(g||'').trim().toUpperCase().replace(/_/g,'').replace(/PLUS/g,'+').replace(/MINUS/g,'-');if(g==='S+')return'S+';if(g==='S'||g==='S-')return'S';if(g==='A+')return'A+';if(g==='A'||g==='A-')return'A';if(/^B[+-]?$/.test(g))return'B';if(/^C[+-]?$/.test(g))return'C';if(/^D[+-]?$/.test(g))return'D';return''};
  const GRADE_ORDER=['D','C','B','A','A+','S','S+'];
  const gi=g=>GRADE_ORDER.indexOf(coarse(g));
  const ownGrade=s=>num(s)>=96?'S+':num(s)>=91?'S':num(s)>=84?'A+':num(s)>=76?'A':num(s)>=64?'B':num(s)>=52?'C':'D';
  const bucket=r=>{const x=`${r?.group||''} ${r?.role||''}`.toLowerCase();return /원딜|marksman|adc/.test(x)?'원딜':/탱커|tank/.test(x)?'탱커':/서포|support|enchanter/.test(x)?'서포터':/메이지|mage/.test(x)?'메이지':/브루저|fighter|juggernaut/.test(x)?'브루저':/암살|assassin/.test(x)?'암살자':String(r?.group||r?.role||'기타')};
  function championOf(m){const me=m?.me||{};try{return String(aramHistoryResolveParticipant(me)||me.championName||me.champion||`챔피언 ${me.championId||''}`)}catch{return String(me.championName||me.champion||`챔피언 ${me.championId||''}`)}}
  function targetPuuid(){return String(aramHistoryState?.account?.puuid||aramHistoryState?.target?.puuid||aramHistoryState?.localAccount?.puuid||'')}
  function localPuuid(){return String(aramHistoryState?.localAccount?.puuid||'')}
  function matchRecord(records,m,puuid){const gid=canon(m?.gameId);return records.find(r=>canon(r?.gameId)===gid&&(!puuid||!r?.puuid||String(r.puuid)===puuid))||null}
  function row(m,records,puuid){
    let r;try{r=aramHistoryRoleBreakdown(m)}catch{return null}if(!r||r.score==null)return null;
    const rec=matchRecord(records,m,puuid);if(!rec||!coarse(rec.grade))return null;
    const ours=ownGrade(r.score),riot=coarse(rec.grade),a=gi(ours),b=gi(riot);if(a<0||b<0)return null;
    return{gameId:canon(m.gameId),champion:championOf(m),role:bucket(r),score:num(r.score),ours,riot,riotRaw:String(rec.grade||''),gap:b-a,win:m?.me?.win===true||m?.win===true,capturedAt:num(rec.capturedAt)};
  }
  function summary(rows,label='전체'){
    const n=rows.length;if(!n)return{label,n:0,status:'표본 없음',tone:'wait'};
    const gap=avg(rows.map(x=>x.gap)),up=rows.filter(x=>x.gap>0).length/n,down=rows.filter(x=>x.gap<0).length/n,agree=rows.filter(x=>x.gap===0).length/n,score=avg(rows.map(x=>x.score));
    let status='관찰 중',tone='watch';
    if(n>=5&&gap>=.8&&up>=.68){status='지속 저평가 후보';tone='low'}
    else if(n>=5&&gap<=-.8&&down>=.68){status='지속 고평가 후보';tone='high'}
    else if(n>=3&&gap>=.6&&up>=.60){status='저평가 의심';tone='low'}
    else if(n>=3&&gap<=-.6&&down>=.60){status='고평가 의심';tone='high'}
    else if(n>=3&&Math.abs(gap)<=.34&&(agree+Math.min(up,down))>=.55){status='대체로 정렬';tone='ok'}
    else if(n<3){status='소표본';tone='wait'}
    const dist={};for(const x of rows)dist[x.riotRaw]=(dist[x.riotRaw]||0)+1;
    const riotDist=Object.entries(dist).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,4).map(([g,c])=>`${g}×${c}`).join(' · ');
    return{label,n,gap,up,down,agree,score,status,tone,riotDist,rows};
  }
  function group(rows,key){const g={};for(const x of rows)(g[x[key]]||(g[x[key]]=[])).push(x);return Object.entries(g).map(([label,a])=>summary(a,label)).sort((a,b)=>Math.abs(b.gap||0)-Math.abs(a.gap||0)||b.n-a.n)}
  async function analyze(force=false){
    if(!window.aramDesktop?.getRiotGradeState)return{available:false,reason:'desktop-api-unavailable'};
    const state=await window.aramDesktop.getRiotGradeState();const records=Array.isArray(state?.records)?state.records:[],puuid=targetPuuid(),local=localPuuid(),matches=Array.isArray(aramHistoryState?.matches)?aramHistoryState.matches:[];
    const other=!!(local&&puuid&&local!==puuid),eligible=records.filter(r=>!puuid||!r?.puuid||String(r.puuid)===puuid),rows=other?[]:matches.map(m=>row(m,eligible,puuid)).filter(Boolean);
    return{available:true,other,puuid,records:eligible.length,loaded:matches.length,matched:rows.length,rows,overall:summary(rows),champions:group(rows,'champion'),roles:group(rows,'role'),collector:state,force};
  }
  function style(){if(document.getElementById('rg31css'))return;const s=document.createElement('style');s.id='rg31css';s.textContent=`.rg31{margin-top:10px;border:1px solid #2d506e;border-radius:12px;background:#081725;padding:11px}.rg31h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.rg31h b{font-size:11px;color:#e0f2ff}.rg31h span,.rg31note{display:block;color:#6e8da5;font-size:7px;line-height:1.5}.rg31k{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.rg31pill{padding:5px 7px;border:1px solid #29465f;border-radius:7px;background:#0a1b2b;font-size:7px;color:#9db6ca}.rg31pill strong{color:#e4f1fb}.rg31grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px}.rg31c{border:1px solid #27445b;border-radius:9px;padding:8px;background:#071521}.rg31c>div{display:flex;justify-content:space-between;gap:6px}.rg31c b{font-size:9px;color:#dceeff}.rg31c em{font-style:normal;font-size:7px;font-weight:900}.rg31c.low em{color:#7fd9ff}.rg31c.high em{color:#f2a2a8}.rg31c.ok em{color:#8ed7b0}.rg31c.wait em,.rg31c.watch em{color:#8ca2b4}.rg31c small{display:block;margin-top:4px;color:#708aa0;font-size:6.5px;line-height:1.4}.rg31sec{margin-top:10px}.rg31sec>span{display:block;color:#82a1b8;font-size:7px;font-weight:900;margin-bottom:5px}.rg31empty{padding:9px;border:1px dashed #2b465c;border-radius:8px;color:#71889c;font-size:7px;text-align:center}@media(max-width:850px){.rg31grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
  const gapText=g=>Math.abs(num(g))<.05?'동일 밴드':`${g>0?'Riot +':'우리 +'}${Math.abs(num(g)).toFixed(2)} 밴드`;
  function card(x){return `<div class="rg31c ${x.tone}"><div><b>${esc(x.label)}</b><em>${esc(x.status)}</em></div><small>${x.n}경기 · 우리 ROLE 평균 ${Math.round(x.score||0)} · ${esc(gapText(x.gap))}</small><small>Riot 분포 ${esc(x.riotDist||'-')}</small></div>`}
  function html(a){
    if(!a?.available)return '<div class="rg31empty">Riot Grade 비교 데이터를 불러올 수 없습니다.</div>';
    if(a.other)return '<div class="rg31empty">Riot Grade는 현재 로그인해 직접 플레이한 계정만 수집합니다. 조회 중인 다른 플레이어에는 연결하지 않습니다.</div>';
    const strong=a.champions.filter(x=>x.n>=3).slice(0,6),roles=a.roles.filter(x=>x.n>=2).slice(0,6);
    return `<div class="rg31h"><div><b>ROLE CALIBRATION · Riot Grade 누적 검증</b><span>Riot Grade를 점수에 합산하지 않고, 우리 ROLE의 반복적인 저평가/고평가 패턴만 찾습니다.</span></div><span>scoring use · OFF</span></div><div class="rg31k"><span class="rg31pill">현재 불러온 전적 <strong>${a.loaded}</strong></span><span class="rg31pill">동일 경기 연결 <strong>${a.matched}</strong></span><span class="rg31pill">저장 Grade <strong>${a.records}</strong></span>${a.matched?`<span class="rg31pill">전체 차이 <strong>${esc(gapText(a.overall.gap))}</strong></span>`:''}</div>${a.matched<3?`<div class="rg31note" style="margin-top:8px">아직 비교 표본이 적습니다. 최소 3경기부터 의심 신호만 표시하고, 5경기 이상 + 같은 방향 68% 이상일 때만 '지속 후보'로 올립니다.</div>`:''}<div class="rg31sec"><span>챔피언별 엔진 편향 후보</span>${strong.length?`<div class="rg31grid">${strong.map(card).join('')}</div>`:'<div class="rg31empty">챔피언별 비교는 동일 챔피언 연결 표본이 3경기 이상 쌓이면 표시합니다.</div>'}</div><div class="rg31sec"><span>역할별 비교</span>${roles.length?`<div class="rg31grid">${roles.map(card).join('')}</div>`:'<div class="rg31empty">역할별 비교 표본이 아직 부족합니다.</div>'}</div><div class="rg31note" style="margin-top:9px">※ Riot의 정확한 내부 수식/백분위는 공개되지 않았습니다. 여기서는 Riot이 반환한 경기 Grade를 외부 검증 라벨로만 사용합니다. 등급 체계 차이를 줄이기 위해 B+/B/B- 등은 B 밴드로 접어서 비교합니다.</div>`;
  }
  async function render(force=false){
    try{style();const root=document.getElementById('pp19c');if(!root||!document.getElementById('pp19ov')?.classList?.contains('open'))return false;let box=document.getElementById('rg31');if(!box){box=document.createElement('div');box.id='rg31';box.className='rg31';const body=root.querySelector('.ppbody');const foot=body?.querySelector('.ppfoot');if(foot)foot.insertAdjacentElement('beforebegin',box);else body?.appendChild(box)}box.innerHTML='<div class="rg31empty">Riot Grade 누적 비교 계산 중…</div>';const a=await analyze(force);if(document.getElementById('rg31')===box)box.innerHTML=html(a);return true}catch(e){console.warn('[v0.15.31] calibration render failed',e);return false}
  }
  function schedule(){setTimeout(()=>render(false),80);setTimeout(()=>render(false),260)}
  try{
    const oldOpen=window.openPlayerProfile;window.openPlayerProfile=function(...a){const r=oldOpen?.apply(this,a);schedule();return r};
    const prevCtx=window.aramRoleProfileContextV01523?.postProcess;if(prevCtx&&window.aramRoleProfileContextV01523)window.aramRoleProfileContextV01523.postProcess=function(...a){const r=prevCtx.apply(this,a);schedule();return r};
    const mo=new MutationObserver(()=>{if(document.getElementById('pp19ov')?.classList?.contains('open')&&!document.getElementById('rg31'))schedule()});mo.observe(document.documentElement,{subtree:true,childList:true});
    window.aramRiotGradeCalibrationV01531={analyze,render,summary,coarse,ownGrade};window.__ARAM_RIOT_GRADE_CALIBRATION_V01531__=true;
    if(typeof DATA!=='undefined'){DATA.version=V;DATA.riot_grade_calibration_v01531={version:'v0.15.31 · Riot Grade Calibration Monitor',scoring_use:false,min_signal_games:3,persistent_candidate_games:5,coarse_grade_band_compare:true,player_profile_panel:true}}
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
  }catch(e){console.error('[v0.15.31] calibration init failed',e);window.__ARAM_RIOT_GRADE_CALIBRATION_V01531__=false}
})();
