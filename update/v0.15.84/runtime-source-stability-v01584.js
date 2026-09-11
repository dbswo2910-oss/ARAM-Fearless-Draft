'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01583')}catch{prior=require('../v0.15.83/runtime-source-stability-v01583')}

function countOf(src,needle){return String(src).split(needle).length-1}
function insertBefore(src,anchor,text,signature,label){
  if(src.includes(signature))return src;
  const n=countOf(src,anchor);
  if(n!==1)throw new Error(`v0.15.84 source contract mismatch ${label} count=${n}`);
  return src.replace(anchor,text+anchor);
}
function replaceRange(src,start,end,replacement,signature,label){
  if(src.includes(signature))return src;
  const a=src.indexOf(start),b=a>=0?src.indexOf(end,a+start.length):-1;
  if(a<0||b<0||src.indexOf(start,a+1)>=0)throw new Error(`v0.15.84 source contract mismatch ${label}`);
  return src.slice(0,a)+replacement+src.slice(b);
}

const REFERENCE_LAYOUT_HELPERS=`

  // v0.15.84 reference-aligned IN GAME layout.
  // Mirrors the approved preview hierarchy: full-width decision banner -> play/threats -> build/return -> fight status.
  function ensureReferenceLayoutStylesV01584(){
    if($('#riReferenceStyleV01584'))return;
    const st=document.createElement('style');st.id='riReferenceStyleV01584';st.textContent=\`
      #riCoachShellV01550 .riCoachTitle small{font-size:0!important}
      #riCoachShellV01550 .riCoachTitle small::after{content:'INGAME COMMAND CENTER · v0.15.84'!important;font-size:8px;letter-spacing:.06em}
      #riCoachShellV01550 .riCoachBody{padding:10px 12px 12px!important}
      #riCoachShellV01550 .ri84LiveStack{display:grid;gap:10px}
      #riCoachShellV01550 .ri84Decision{position:relative;overflow:hidden;min-height:118px;border:1px solid #7b4050;border-radius:12px;background:linear-gradient(115deg,#2b151d 0%,#171728 50%,#0b2033 100%);padding:15px 17px;box-shadow:inset 0 0 36px rgba(255,74,106,.05)}
      #riCoachShellV01550 .ri84Decision.good{border-color:#2f735b;background:linear-gradient(115deg,#10271f,#102032 58%,#0b2033)}
      #riCoachShellV01550 .ri84Decision.warn{border-color:#7c632c;background:linear-gradient(115deg,#2c2410,#1b1b25 54%,#0b2033)}
      #riCoachShellV01550 .ri84Decision.bad{border-color:#8a4252;background:linear-gradient(115deg,#32171e,#1c1722 54%,#0b2033)}
      #riCoachShellV01550 .ri84Decision::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,12,22,.02) 0%,rgba(5,12,22,.16) 44%,rgba(5,12,22,.68) 100%);pointer-events:none}
      #riCoachShellV01550 .ri84DecisionCopy{position:relative;z-index:2;width:min(62%,760px)}
      #riCoachShellV01550 .ri84DecisionMeta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
      #riCoachShellV01550 .ri84DecisionMeta span{font-size:10px;font-weight:950;color:#dca5af;letter-spacing:.03em}
      #riCoachShellV01550 .ri84DecisionMeta em{font-style:normal;font-size:8px;color:#7fa4bf;font-weight:900}
      #riCoachShellV01550 .ri84Decision h3{margin:0 0 5px;color:#ff9ca9;font-size:24px;line-height:1.2;letter-spacing:-.02em}
      #riCoachShellV01550 .ri84Decision.good h3{color:#9de9c5}
      #riCoachShellV01550 .ri84Decision.warn h3{color:#f1d477}
      #riCoachShellV01550 .ri84Decision p{margin:0;color:#adc2d2;font-size:10px;line-height:1.5}
      #riCoachShellV01550 .ri84DecisionArt{position:absolute;z-index:1;right:255px;top:0;bottom:0;width:290px;display:flex;align-items:center;justify-content:center;gap:0;opacity:.26;filter:saturate(.85) contrast(1.05);pointer-events:none}
      #riCoachShellV01550 .ri84DecisionArt .ri83Portrait{width:86px!important;height:86px!important;border-radius:50%!important;margin-left:-18px;box-shadow:0 0 36px rgba(80,130,190,.25)}
      #riCoachShellV01550 .ri84DecisionActions{position:absolute;z-index:3;right:15px;top:14px;bottom:14px;width:245px;display:grid;align-content:center;gap:7px}
      #riCoachShellV01550 .ri84DecisionAction{display:grid;grid-template-columns:18px minmax(0,1fr);gap:6px;align-items:start;color:#d7e5f0;font-size:9px;line-height:1.35}
      #riCoachShellV01550 .ri84DecisionAction b{display:grid;place-items:center;width:18px;height:18px;border-radius:6px;background:#112b42;color:#a9daf8;font-size:8px}
      #riCoachShellV01550 .ri84Row{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:10px;align-items:stretch}
      #riCoachShellV01550 .ri84Panel{border:1px solid #294d69;border-radius:12px;background:linear-gradient(180deg,#0a1a2a,#081522);padding:0;overflow:hidden;min-width:0}
      #riCoachShellV01550 .ri84PanelHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px 8px;border-bottom:1px solid rgba(59,93,118,.35)}
      #riCoachShellV01550 .ri84PanelTitle{display:flex;align-items:center;gap:8px;min-width:0}
      #riCoachShellV01550 .ri84PanelIcon{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#173452;color:#9bd8ff;font-size:12px;flex:0 0 auto}
      #riCoachShellV01550 .ri84PanelTitle b{display:block;color:#83c9ff;font-size:14px;line-height:1.2}
      #riCoachShellV01550 .ri84PanelTitle small{display:block;color:#6f8aa0;font-size:8px;margin-top:2px}
      #riCoachShellV01550 .ri84PanelHead em{font-style:normal;color:#7593aa;font-size:8px;font-weight:900;white-space:nowrap}
      #riCoachShellV01550 .ri84PanelBody{padding:10px 12px 12px}
      #riCoachShellV01550 .ri84MyPlay{display:grid;grid-template-columns:210px minmax(0,1fr);gap:12px;align-items:stretch}
      #riCoachShellV01550 .ri84HeroCard{border-right:1px solid #233f55;padding-right:12px;min-width:0}
      #riCoachShellV01550 .ri84HeroTop{display:flex;align-items:center;gap:10px}
      #riCoachShellV01550 .ri84HeroTop .ri83Portrait{width:74px!important;height:74px!important;border-radius:12px!important;border-color:#4a81a7}
      #riCoachShellV01550 .ri84HeroName strong{display:block;color:#f4f9fd;font-size:19px;line-height:1.15}
      #riCoachShellV01550 .ri84HeroTags{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
      #riCoachShellV01550 .ri84Tag{border:1px solid #315673;border-radius:7px;background:#0d2538;color:#9cc9e7;padding:4px 7px;font-size:8px;font-weight:900}
      #riCoachShellV01550 .ri84Quote{margin-top:10px;border:1px solid #2b5b79;border-radius:9px;background:#0d2740;padding:10px;color:#b8d4e9;font-size:9px;line-height:1.45;text-align:center}
      #riCoachShellV01550 .ri84PlanList{display:grid;gap:6px}
      #riCoachShellV01550 .ri84PlanStep{display:grid;grid-template-columns:26px minmax(0,1fr);gap:8px;align-items:start;padding:7px 0;border-bottom:1px solid #1f3548;color:#b3c9da;font-size:10px;line-height:1.45}
      #riCoachShellV01550 .ri84PlanStep:last-child{border-bottom:0}
      #riCoachShellV01550 .ri84PlanStep>b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#173957;color:#a9ddff;font-size:9px}
      #riCoachShellV01550 .ri84ThreatGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      #riCoachShellV01550 .ri84ThreatCard{position:relative;border:1px solid #2d4458;border-radius:10px;background:#091522;padding:10px;min-width:0}
      #riCoachShellV01550 .ri84ThreatCard.critical{border-color:#753d49;background:linear-gradient(180deg,#24151b,#0b1620)}
      #riCoachShellV01550 .ri84ThreatRank{position:absolute;left:7px;top:7px;width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#5b2a34;color:#ffd6dc;font-size:9px;font-weight:950;z-index:2}
      #riCoachShellV01550 .ri84ThreatTop{display:flex;align-items:center;gap:9px;padding-left:16px}
      #riCoachShellV01550 .ri84ThreatTop .ri83Portrait{width:57px!important;height:57px!important;border-radius:9px!important;border-color:#754650}
      #riCoachShellV01550 .ri84ThreatName b{display:block;color:#f5f8fb;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #riCoachShellV01550 .ri84ThreatScore{display:block;margin-top:4px;color:#ff7587;font-size:13px;font-weight:950}
      #riCoachShellV01550 .ri84DamageBadge{display:inline-block;margin-top:4px;border-radius:99px;background:#15283a;color:#91abc0;padding:3px 6px;font-size:7px}
      #riCoachShellV01550 .ri84ThreatReason{margin-top:9px;color:#9fb4c5;font-size:9px;line-height:1.5;min-height:42px}
      #riCoachShellV01550 .ri84BuildGrid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(150px,.78fr) minmax(150px,.78fr);gap:8px}
      #riCoachShellV01550 .ri84BuildBox{border:1px solid #263f55;border-radius:9px;background:#081522;padding:9px;min-width:0}
      #riCoachShellV01550 .ri84BuildBox>span{display:block;color:#718da3;font-size:8px;font-weight:900;margin-bottom:7px}
      #riCoachShellV01550 .ri84Items{display:flex;align-items:center;gap:5px;min-height:42px;flex-wrap:wrap}
      #riCoachShellV01550 .ri84Item{display:inline-grid;place-items:center;width:38px;height:38px;overflow:hidden;border:1px solid #3c566c;border-radius:7px;background:#0b1a27;flex:0 0 auto}
      #riCoachShellV01550 .ri84Item img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
      #riCoachShellV01550 .ri84ItemText{font-size:8px;font-weight:950;color:#9bb0bf;text-align:center;padding:2px}
      #riCoachShellV01550 .ri84NextItem{display:flex;align-items:center;gap:8px}
      #riCoachShellV01550 .ri84NextItem strong{display:block;color:#eef8ff;font-size:12px;line-height:1.25}
      #riCoachShellV01550 .ri84NextItem small{display:block;margin-top:4px;color:#819aad;font-size:8px;line-height:1.4}
      #riCoachShellV01550 .ri84ReturnGrid{display:grid;grid-template-columns:1.05fr .75fr 1.2fr;gap:8px}
      #riCoachShellV01550 .ri84ReturnBox{border:1px solid #283f55;border-radius:9px;background:#081522;padding:10px;min-width:0}
      #riCoachShellV01550 .ri84ReturnBox>span{display:block;color:#7890a5;font-size:8px;font-weight:900;margin-bottom:6px}
      #riCoachShellV01550 .ri84ReturnValue{color:#f1f7fb;font-size:13px;font-weight:950;line-height:1.3}
      #riCoachShellV01550 .ri84Gold{color:#f5c95b}
      #riCoachShellV01550 .ri84Respawn{display:flex;align-items:center;gap:8px;color:#d9e8f3;font-size:12px;font-weight:900}
      #riCoachShellV01550 .ri84RespawnIcon{font-size:25px;color:#7fc1ff}
      #riCoachShellV01550 .ri84ReturnAction{display:flex;align-items:center;gap:6px;color:#b8cedd;font-size:9px;line-height:1.45}
      #riCoachShellV01550 .ri84Fight{border:1px solid #28536a;border-radius:12px;background:linear-gradient(180deg,#091b29,#07131f);padding:10px 12px}
      #riCoachShellV01550 .ri84FightHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
      #riCoachShellV01550 .ri84FightHead b{color:#83c9ff;font-size:13px}
      #riCoachShellV01550 .ri84FightHead span{color:#69ad8a;font-size:8px;font-weight:900}
      #riCoachShellV01550 .ri84FightGrid{display:grid;grid-template-columns:minmax(0,1fr) 160px 210px 120px minmax(0,1fr);gap:10px;align-items:center}
      #riCoachShellV01550 .ri84FightTeam>span{display:block;color:#718ca2;font-size:8px;font-weight:900;margin-bottom:4px}
      #riCoachShellV01550 .ri84FightTeam.enemy{text-align:right}
      #riCoachShellV01550 .ri84FightTeam.enemy .ri83Faces{justify-content:flex-end}
      #riCoachShellV01550 .ri84FightMetric{border-left:1px solid #233d51;padding-left:10px;min-width:0}
      #riCoachShellV01550 .ri84FightMetric span{display:block;color:#6e899f;font-size:8px;margin-bottom:3px}
      #riCoachShellV01550 .ri84FightMetric b{display:block;color:#eef7ff;font-size:13px}
      #riCoachShellV01550 .ri84PowerBar{height:9px;border-radius:99px;overflow:hidden;background:#182536;display:flex;margin-top:5px}
      #riCoachShellV01550 .ri84PowerBar i{display:block;height:100%}
      #riCoachShellV01550 .ri84PowerBar .our{background:#2d9df2}
      #riCoachShellV01550 .ri84PowerBar .enemy{background:#ff4f67}
      @media(max-width:1150px){#riCoachShellV01550 .ri84DecisionCopy{width:58%}#riCoachShellV01550 .ri84DecisionArt{right:220px;width:230px}#riCoachShellV01550 .ri84DecisionActions{width:210px}#riCoachShellV01550 .ri84MyPlay{grid-template-columns:180px minmax(0,1fr)}#riCoachShellV01550 .ri84FightGrid{grid-template-columns:1fr 140px 180px 100px 1fr}}
      @media(max-width:940px){#riCoachShellV01550 .ri84DecisionCopy{width:100%;padding-right:0}#riCoachShellV01550 .ri84DecisionArt{display:none}#riCoachShellV01550 .ri84DecisionActions{position:relative;right:auto;top:auto;bottom:auto;width:auto;margin-top:10px}#riCoachShellV01550 .ri84Decision{padding-bottom:13px}#riCoachShellV01550 .ri84Row{grid-template-columns:1fr}#riCoachShellV01550 .ri84FightGrid{grid-template-columns:1fr 1fr}#riCoachShellV01550 .ri84FightTeam.enemy{text-align:left}#riCoachShellV01550 .ri84FightTeam.enemy .ri83Faces{justify-content:flex-start}}
      @media(max-width:700px){#riCoachShellV01550 .ri84MyPlay{grid-template-columns:1fr}#riCoachShellV01550 .ri84HeroCard{border-right:0;border-bottom:1px solid #233f55;padding-right:0;padding-bottom:10px}#riCoachShellV01550 .ri84ThreatGrid{grid-template-columns:1fr}#riCoachShellV01550 .ri84BuildGrid,#riCoachShellV01550 .ri84ReturnGrid{grid-template-columns:1fr}#riCoachShellV01550 .ri84FightGrid{grid-template-columns:1fr}}
    \`;document.head.appendChild(st);
  }
  function itemArtV01584(name,size='md'){
    const n=norm(name);if(!n||n==='-')return '';
    let row=null;try{const r=window.aramItemArtResolverV01566||window.aramItemArtResolverV01565||window.aramItemArtResolverV01564;row=r?.resolve?.(n)||null}catch{}
    const id=String(row?.id||''),url=String(row?.candidates?.[0]||row?.item?.iconPrimaryUrl||'');
    if(id&&url)return \`<span class="ri84Item \${esc(size)}" title="\${esc(n)}"><img data-item-id="\${esc(id)}" src="\${esc(url)}" alt="\${esc(n)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display='none'"></span>\`;
    return \`<span class="ri84Item \${esc(size)}" title="\${esc(n)}"><span class="ri84ItemText">\${esc(n.slice(0,4))}</span></span>\`;
  }
  function currentItemsV01584(m){
    const out=[],seen=new Set(),resolver=window.aramItemArtResolverV01566||window.aramItemArtResolverV01565||window.aramItemArtResolverV01564;
    const add=(name,id)=>{let n=norm(name);if(!n&&id){try{n=norm(resolver?.getCatalog?.()?.items?.[String(id)]?.name)}catch{}}if(!n)return;const k=n.toLowerCase();if(seen.has(k))return;seen.add(k);out.push(n)};
    const visit=v=>{if(v==null)return;if(Array.isArray(v)){v.forEach(visit);return}if(typeof v==='number'||typeof v==='string'){const id=String(v).match(/^\\d+$/)?.[0];if(id)add('',id);return}if(typeof v==='object'){const id=v.itemId||v.id||v.raw?.itemId||v.raw?.id;add(v.displayName||v.name||v.itemName||v.raw?.displayName||v.raw?.name,id)}};
    const c=m?.ctx||{},l=c?.local||m?.local||{};[l?.items,l?.itemIds,l?.inventory,l?.raw?.items,c?.localItems,c?.myItems].forEach(visit);
    if(!out.length&&m?.source==='preview'){
      ['수호자의 뿔피리','헤르메스의 발걸음','영겁의 지팡이',m?.item?.name,...(m?.alts||[])].filter(Boolean).forEach(x=>add(x));
    }
    return out.slice(0,6);
  }
  function threatReasonV01584(x){
    const dmg=norm(x?.damageType),score=num(x?.score);let a=score>=90?'현재 가장 높은 우선순위 위협입니다.':score>=78?'한타에서 먼저 위치를 확인해야 합니다.':'교전 전에 스킬 사용 여부를 확인하세요.';
    if(dmg.includes('물리'))a+=' 물리 피해 압박에 맞춰 방어 선택을 조정하세요.';else if(dmg.includes('마법'))a+=' 마법 피해와 연계 진입을 함께 조심하세요.';else a+=' 한 번에 겹쳐 맞지 않도록 간격을 유지하세요.';
    return a;
  }
  function roleLabelV01584(m){
    if(m?.source==='preview'){let r='tank';try{r=preview?.role||'tank'}catch{}return({tank:'탱커 · 마법사',adc:'원거리 딜러',mage:'마법사',support:'서포터',bruiser:'브루저 · 전사'}[r]||'실시간 역할')}
    return '실시간 역할 분석';
  }
  function decisionActionsV01584(m){
    const xs=(m?.plan?.steps||[]).filter(Boolean).slice(0,3),rows=xs.length?xs:[m?.job,m?.plan?.detail].filter(Boolean).slice(0,3);
    return rows.map((x,i)=>\`<div class="ri84DecisionAction"><b>\${i+1}</b><span>\${inlineChampionsV01583(x,m,92)}</span></div>\`).join('');
  }
  function threatCardsV01584(m){
    const xs=(m?.threats||[]).slice(0,3);if(!xs.length)return '<div class="ri82BuildReason">상대 위협 데이터 대기 중</div>';
    return '<div class="ri84ThreatGrid">'+xs.map((x,i)=>{const critical=num(x?.score)>=88&&!x?.dead;return \`<div class="ri84ThreatCard \${critical?'critical':''}"><span class="ri84ThreatRank">\${i+1}</span><div class="ri84ThreatTop">\${portraitV01583(x?.name,'md')}<div class="ri84ThreatName"><b>\${esc(x?.name||'-')}</b><span class="ri84ThreatScore">위협도 \${Math.round(num(x?.score))}</span><span class="ri84DamageBadge">\${esc(x?.damageType||'피해 유형')}</span></div></div><div class="ri84ThreatReason">\${esc(threatReasonV01584(x))}</div></div>\`}).join('')+'</div>';
  }
  function returnPlanV01584(m){
    const me=localChampionV01583(m),top=m?.threat||{},first=(m?.plan?.steps||[]).filter(Boolean)[0]||m?.plan?.detail||'아군과 합류 후 첫 진입을 확인',gold=Math.round(num(m?.gold)).toLocaleString('ko-KR');
    const respawn=m?.life==='dead'?\`약 \${Math.max(0,Math.ceil(num(m?.respawn)))}초 후\`:m?.source==='preview'?'약 16초 후':'사망 후 자동 계산';
    const buyLabel=m?.life==='dead'?'지금 구매할 아이템':'사망 시 구매 목표';
    return \`<div class="ri84ReturnGrid"><div class="ri84ReturnBox"><span>\${buyLabel}</span><div class="ri84NextItem">\${itemArtV01584(m?.item?.name)}<div><strong>\${esc(m?.item?.name||'-')}</strong><small><span class="ri84Gold">● \${gold}G</span> · 현재 추천 기준</small></div></div></div><div class="ri84ReturnBox"><span>복귀 예상 시간</span><div class="ri84Respawn"><i class="ri84RespawnIcon">⌛</i><b>\${esc(respawn)}</b></div></div><div class="ri84ReturnBox"><span>복귀 후 첫 행동</span><div class="ri84ReturnAction">\${portraitV01583(me,'sm')}<span>아군에 합류 → \${top?.name&&top.name!=='-'?portraitV01583(top.name,'sm'):''} \${inlineChampionsV01583(first,m,82)}</span></div></div></div>\`;
  }
  function fightStatusV01584(m){
    const p=m?.power||{},ours=rosterV01583(m,'our'),enemies=rosterV01583(m,'enemy'),sum=Math.max(1,num(p.our)+num(p.enemy)),ourPct=Math.max(0,Math.min(100,num(p.our)/sum*100)),enemyPct=100-ourPct,life=m?.life==='dead'?\`사망 \${Math.ceil(num(m?.respawn))}초\`:'생존';
    return \`<section class="ri84Fight"><div class="ri84FightHead"><b>⚔ 한타 현황</b><span>● 실시간 업데이트</span></div><div class="ri84FightGrid"><div class="ri84FightTeam"><span>팀 조합</span>\${rosterFacesHtmlV01583(ours)}</div><div class="ri84FightMetric"><span>내 골드</span><b>● \${Math.round(num(m?.gold)).toLocaleString('ko-KR')}G</b></div><div class="ri84FightMetric"><span>팀 전투력</span><b>\${Math.round(num(p.our))}% : \${Math.round(num(p.enemy))}%</b><div class="ri84PowerBar"><i class="our" style="width:\${ourPct}%"></i><i class="enemy" style="width:\${enemyPct}%"></i></div></div><div class="ri84FightMetric"><span>생존 현황</span><b>\${num(m?.alive?.our)} : \${num(m?.alive?.enemy)}</b><small> · \${esc(life)}</small></div><div class="ri84FightTeam enemy"><span>적군 조합</span>\${rosterFacesHtmlV01583(enemies)}</div></div></section>\`;
  }
`;

const LIVE_RENDER=`
  function renderLive(m){
    ensureCommandCenterStylesV01582();ensureVisualStylesV01583();ensureReferenceLayoutStylesV01584();
    if(m.life==='waiting')return \`<div class="riWaiting"><div><b>인게임 연결 대기</b><span>일반 칼바람 게임에 들어가면 자동으로 실시간 커맨드센터가 시작됩니다.<br>상단 <b>인게임 미리보기</b>에서 레퍼런스형 화면을 바로 확인할 수 있습니다.</span></div></div>\`;
    const plan=m.plan||{},tone=plan.tone||'warn',alive=m.alive||{our:0,enemy:0},time=\`\${String(Math.floor(num(m.gameTime)/60)).padStart(2,'0')}:\${String(Math.floor(num(m.gameTime)%60)).padStart(2,'0')}\`,source=m.source==='preview'?'실시간 분석 중':\`LIVE \${time}\`,me=localChampionV01583(m),threats=(m.threats||[]).slice(0,3),items=currentItemsV01584(m),alts=(m.alts||[]).filter(Boolean).slice(0,1),buildBadge=m.buildSame?'추천':'상황별';
    const art=threats.map(x=>portraitV01583(x?.name,'md')).join('');
    const itemHtml=items.length?items.map(n=>itemArtV01584(n,'sm')).join(''):'<span class="ri82BuildReason">현재 아이템 확인 중</span>';
    return \`<div class="ri84LiveStack"><section class="ri84Decision \${esc(tone)}"><div class="ri84DecisionCopy"><div class="ri84DecisionMeta"><span>현재 판단</span><em>\${esc(source)} · 생존 \${alive.our}:\${alive.enemy}</em></div><h3>\${esc(plan.headline||'현재 교전 판단')}</h3><p>\${inlineChampionsV01583(plan.detail||'',m,150)}</p></div><div class="ri84DecisionArt">\${art}</div><div class="ri84DecisionActions">\${decisionActionsV01584(m)}</div></section><div class="ri84Row"><section class="ri84Panel"><div class="ri84PanelHead"><div class="ri84PanelTitle"><i class="ri84PanelIcon">⚑</i><div><b>내 플레이</b><small>지금 내가 해야 할 플레이</small></div></div><em>\${esc(me)} 가이드 ›</em></div><div class="ri84PanelBody ri84MyPlay"><div class="ri84HeroCard"><div class="ri84HeroTop">\${portraitV01583(me,'lg')}<div class="ri84HeroName"><strong>\${esc(me||'내 챔피언')}</strong><div class="ri84HeroTags"><span class="ri84Tag">\${esc(roleLabelV01584(m))}</span></div></div></div><div class="ri84Quote">“지금은 이니시보다 아군과 함께 각을 만들고, 최고위협 위치를 먼저 확인하세요.”</div></div><div class="ri84PlanList">\${(plan.steps||[]).filter(Boolean).slice(0,3).map((x,i)=>\`<div class="ri84PlanStep"><b>\${i+1}</b><span>\${inlineChampionsV01583(x,m,120)}</span></div>\`).join('')||\`<div class="ri84PlanStep"><b>1</b><span>\${inlineChampionsV01583(m.job||plan.detail||'현재 역할 계산 대기',m,120)}</span></div>\`}</div></div></section><section class="ri84Panel"><div class="ri84PanelHead"><div class="ri84PanelTitle"><i class="ri84PanelIcon">☠</i><div><b style="color:#ff7c8c">위협 TOP3</b><small>지금 가장 주의해야 할 적입니다.</small></div></div><em>상세 분석 ›</em></div><div class="ri84PanelBody">\${threatCardsV01584(m)}</div></section></div><div class="ri84Row"><section class="ri84Panel"><div class="ri84PanelHead"><div class="ri84PanelTitle"><i class="ri84PanelIcon">▣</i><div><b>실시간 빌드</b><small>지금 상황에 맞는 아이템 빌드입니다.</small></div></div><em>아이템 가이드 ›</em></div><div class="ri84PanelBody"><div class="ri84BuildGrid"><div class="ri84BuildBox"><span>현재 아이템 (\${items.length}/6)</span><div class="ri84Items">\${itemHtml}</div></div><div class="ri84BuildBox"><span>다음 코어 아이템</span><div class="ri84NextItem">\${itemArtV01584(m?.item?.name)}<div><strong>\${esc(m?.item?.name||'-')}</strong><small>\${esc(buildBadge)} · \${esc(short(m?.item?.reason||m?.advice?.direction||'현재 경기 데이터 반영',72))}</small></div></div></div><div class="ri84BuildBox"><span>대안 아이템</span><div class="ri84NextItem">\${itemArtV01584(alts[0]||'')}<div><strong>\${esc(alts[0]||'상황에 따라 유지')}</strong><small>상대 피해 유형과 생존 필요도에 따라 선택합니다.</small></div></div></div></div></div></section><section class="ri84Panel"><div class="ri84PanelHead"><div class="ri84PanelTitle"><i class="ri84PanelIcon" style="color:#c59cff;background:#2e1d4d">◴</i><div><b style="color:#c790ff">사망 시 복귀 플랜</b><small>사망 중 이렇게 복귀하세요.</small></div></div><em>더 많은 상황별 플랜 ›</em></div><div class="ri84PanelBody">\${returnPlanV01584(m)}</div></section></div>\${fightStatusV01584(m)}</div>\`;
  }
`;

function patchCoach(src){
  src=insertBefore(src,'  function renderLive(m){',REFERENCE_LAYOUT_HELPERS,'function ensureReferenceLayoutStylesV01584()','reference layout helpers');
  src=replaceRange(src,'  function renderLive(m){','  function renderBuild(m){',LIVE_RENDER,'class="ri84LiveStack"','reference-aligned live layout');
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=patchCoach(src);
  return src;
}

module.exports={patchRuntimeSource,score_logic_changed:false,item_recommendation_logic_changed:false,ingame_hud_changed:true,champion_visuals_changed:true,reference_layout_changed:true,policy_version:'0.15.84'};
