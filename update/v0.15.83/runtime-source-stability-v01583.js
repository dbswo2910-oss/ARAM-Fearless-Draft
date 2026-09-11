'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01582')}catch{prior=require('../v0.15.82/runtime-source-stability-v01582')}

function countOf(src,needle){return String(src).split(needle).length-1}
function insertBefore(src,anchor,text,signature,label){
  if(src.includes(signature))return src;
  const n=countOf(src,anchor);
  if(n!==1)throw new Error(`v0.15.83 source contract mismatch ${label} count=${n}`);
  return src.replace(anchor,text+anchor);
}
function replaceRange(src,start,end,replacement,signature,label){
  if(src.includes(signature))return src;
  const a=src.indexOf(start),b=a>=0?src.indexOf(end,a+start.length):-1;
  if(a<0||b<0||src.indexOf(start,a+1)>=0)throw new Error(`v0.15.83 source contract mismatch ${label}`);
  return src.slice(0,a)+replacement+src.slice(b);
}

const VISUAL_HELPERS=`

  // v0.15.83 IN GAME visual intelligence.
  // Reuse the app's existing championIconHtml renderer instead of introducing another image source.
  // Images supplement actionable text; if artwork is unavailable, champion names remain visible.
  function ensureVisualStylesV01583(){
    if($('#riVisualStyleV01583'))return;
    const st=document.createElement('style');st.id='riVisualStyleV01583';st.textContent=\`
      #riCoachShellV01550 .riCoachTitle small{font-size:0!important}
      #riCoachShellV01550 .riCoachTitle small::after{content:'INGAME COMMAND CENTER · v0.15.83'!important;font-size:8px;letter-spacing:.06em}
      #riCoachShellV01550 .ri83Portrait{display:inline-grid;place-items:center;overflow:hidden;border-radius:7px;border:1px solid #35536b;background:#091421;flex:0 0 auto;vertical-align:middle;box-shadow:0 1px 5px rgba(0,0,0,.28)}
      #riCoachShellV01550 .ri83Portrait.sm{width:24px;height:24px}
      #riCoachShellV01550 .ri83Portrait.md{width:34px;height:34px;border-radius:8px}
      #riCoachShellV01550 .ri83Portrait.lg{width:58px;height:58px;border-radius:11px;border-color:#46779b}
      #riCoachShellV01550 .ri83Portrait>*,#riCoachShellV01550 .ri83Portrait img{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:cover!important;margin:0!important;border:0!important;border-radius:inherit!important}
      #riCoachShellV01550 .ri83PortraitFallback{font-size:10px;font-weight:950;color:#91abc0}
      #riCoachShellV01550 .ri83Name{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;color:inherit;font-weight:900}
      #riCoachShellV01550 .ri83Name .ri83Portrait{transform:translateY(-1px)}
      #riCoachShellV01550 .ri83PlayerHead{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px;padding:9px;border:1px solid #2e526d;border-radius:10px;background:linear-gradient(135deg,#0b2235,#091826)}
      #riCoachShellV01550 .ri83PlayerHead strong{display:block;color:#f0f8ff;font-size:17px;line-height:1.2}
      #riCoachShellV01550 .ri83PlayerHead small{display:block;margin-top:4px;color:#81a2ba;font-size:8px;line-height:1.45}
      #riCoachShellV01550 .ri83PlayerHead p{margin:5px 0 0;color:#abc0d1;font-size:9px;line-height:1.4}
      #riCoachShellV01550 .ri83DecisionFaces{display:flex;align-items:center;gap:5px;margin-top:8px}
      #riCoachShellV01550 .ri83DecisionFaces>span:first-child{font-size:8px;font-weight:900;color:#7892a8;margin-right:2px}
      #riCoachShellV01550 .ri83ThreatCard{grid-template-columns:24px 34px minmax(0,1fr) auto!important}
      #riCoachShellV01550 .ri83ThreatCard .ri83Portrait{border-color:#5e4650}
      #riCoachShellV01550 .ri83ThreatCard.dead .ri83Portrait{filter:grayscale(.75);opacity:.72}
      #riCoachShellV01550 .ri83ThreatMeta{display:flex;align-items:center;gap:5px;margin-top:3px;color:#71899e;font-size:8px}
      #riCoachShellV01550 .ri83ThreatMeta i{width:auto;height:auto;background:none;color:#71899e;font-size:8px}
      #riCoachShellV01550 .ri83BuildHero{display:flex;align-items:center;gap:8px;margin-bottom:8px}
      #riCoachShellV01550 .ri83BuildHero .ri83Portrait{border-color:#426753}
      #riCoachShellV01550 .ri83Roster{margin-top:10px;border:1px solid #28516a;border-radius:11px;background:linear-gradient(180deg,#091a29,#07131f);padding:10px 11px}
      #riCoachShellV01550 .ri83RosterHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
      #riCoachShellV01550 .ri83RosterHead b{font-size:10px;color:#d8ecf9}
      #riCoachShellV01550 .ri83RosterHead span{font-size:8px;color:#6e8ba1}
      #riCoachShellV01550 .ri83RosterGrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(210px,.72fr) minmax(0,1fr);gap:10px;align-items:center}
      #riCoachShellV01550 .ri83Team{min-width:0}
      #riCoachShellV01550 .ri83Team>span{display:block;margin-bottom:5px;color:#728ea4;font-size:8px;font-weight:900}
      #riCoachShellV01550 .ri83Team.enemy{text-align:right}
      #riCoachShellV01550 .ri83Faces{display:flex;align-items:center;gap:5px;min-width:0;flex-wrap:nowrap}
      #riCoachShellV01550 .ri83Team.enemy .ri83Faces{justify-content:flex-end}
      #riCoachShellV01550 .ri83FaceChip{display:inline-flex;align-items:center;gap:4px;min-width:0}
      #riCoachShellV01550 .ri83FaceChip small{max-width:62px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8fa9bb;font-size:7px}
      #riCoachShellV01550 .ri83RosterStatus{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      #riCoachShellV01550 .ri83RosterStat{border:1px solid #263f56;border-radius:8px;background:#081420;padding:7px 8px;text-align:center}
      #riCoachShellV01550 .ri83RosterStat span{display:block;color:#68869d;font-size:7px;margin-bottom:2px}
      #riCoachShellV01550 .ri83RosterStat b{display:block;color:#edf7fe;font-size:10px}
      #riCoachShellV01550 .ri83ReturnTarget{display:inline-flex;align-items:center;gap:5px}
      #riCoachShellV01550 .ri83StepText{min-width:0}
      @media(max-width:980px){#riCoachShellV01550 .ri83RosterGrid{grid-template-columns:1fr}#riCoachShellV01550 .ri83Team.enemy{text-align:left}#riCoachShellV01550 .ri83Team.enemy .ri83Faces{justify-content:flex-start}}
      @media(max-width:720px){#riCoachShellV01550 .ri83PlayerHead{grid-template-columns:auto minmax(0,1fr)}#riCoachShellV01550 .ri83Portrait.lg{width:50px;height:50px}#riCoachShellV01550 .ri83FaceChip small{display:none}}
    \`;document.head.appendChild(st);
  }
  function portraitV01583(name,size='sm'){
    const n=norm(name);if(!n||n==='-')return '';
    let html='';try{if(typeof championIconHtml==='function')html=championIconHtml(n,'mini')||''}catch{}
    if(html)return \`<span class="ri83Portrait \${esc(size)}" title="\${esc(n)}">\${html}</span>\`;
    return \`<span class="ri83Portrait ri83PortraitFallback \${esc(size)}" title="\${esc(n)}">\${esc(n.slice(0,1))}</span>\`;
  }
  function localChampionV01583(m){
    const live=norm(m?.local?.name);if(live)return live;
    if(m?.source==='preview'){
      let role='tank';try{role=preview?.role||'tank'}catch{}
      return({tank:'그라가스',adc:'제리',mage:'오리아나',support:'브라움',bruiser:'이렐리아'}[role]||'그라가스');
    }
    return norm(m?.ours?.[0]||'');
  }
  function rosterV01583(m,side){
    const live=(side==='our'?m?.ours:m?.enemies)||[];
    if(Array.isArray(live)&&live.filter(Boolean).length)return live.filter(Boolean).slice(0,5);
    if(m?.source==='preview'){
      if(side==='our'){const me=localChampionV01583(m);return [me,'제리','룰루','브라움','오리아나'].filter((x,i,a)=>x&&a.indexOf(x)===i).slice(0,5)}
      return ['징크스','말파이트','브랜드','카타리나','애쉬'];
    }
    return [];
  }
  function knownChampionNamesV01583(m){
    const s=new Set([localChampionV01583(m),...rosterV01583(m,'our'),...rosterV01583(m,'enemy'),...(m?.threats||[]).map(x=>x?.name),m?.threat?.name].map(norm).filter(Boolean));
    return [...s].sort((a,b)=>b.length-a.length);
  }
  function regexEscapeV01583(s){return String(s).replace(/[.*+?^\${}()|[\]\\]/g,'\\$&')}
  function inlineChampionsV01583(text,m,limit=120){
    const raw=short(text||'',limit),names=knownChampionNamesV01583(m);if(!names.length)return esc(raw);
    const rx=new RegExp('('+names.map(regexEscapeV01583).join('|')+')','g');
    return esc(raw).replace(rx,n=>\`<span class="ri83Name">\${portraitV01583(n,'sm')}<span>\${esc(n)}</span></span>\`);
  }
  function threatTop3HtmlV01583(m){
    const xs=(m?.threats||[]).slice(0,3);
    if(!xs.length)return '<div class="ri82BuildReason">상대 위협 데이터 대기 중</div>';
    return '<div class="ri82Threats">'+xs.map((x,i)=>{
      const dead=!!x?.isDead||!!x?.dead||num(x?.respawnTimer)>0||num(x?.respawn)>0,critical=!dead&&num(x?.score)>=88;
      return \`<div class="ri82Threat ri83ThreatCard \${critical?'critical':''} \${dead?'dead':''}"><i>#\${i+1}</i>\${portraitV01583(x?.name,'md')}<div class="ri82ThreatMain"><b>\${esc(x?.name||'-')}</b><div class="ri83ThreatMeta"><span>\${esc(x?.damageType||'피해 유형 확인 중')}</span></div></div><span class="ri82ThreatState">\${esc(threatStateTextV01582(x))}</span></div>\`;
    }).join('')+'</div>';
  }
  function planStepsHtmlV01583(m){
    const plan=m?.plan||{},xs=(plan.steps||[]).filter(Boolean).slice(0,3),fallback=[m?.job,plan.detail].filter(Boolean).slice(0,2),rows=xs.length?xs:fallback;
    if(!rows.length)return '<div class="ri82BuildReason">행동 지침 계산 대기 중</div>';
    return '<div class="ri82Steps">'+rows.map((x,i)=>\`<div class="ri82Step"><b>\${i+1}</b><span class="ri83StepText">\${inlineChampionsV01583(x,m,105)}</span></div>\`).join('')+'</div>';
  }
  function rosterFacesHtmlV01583(names){
    if(!names?.length)return '<span class="ri82BuildReason">조합 확인 중</span>';
    return '<div class="ri83Faces">'+names.map(n=>\`<span class="ri83FaceChip">\${portraitV01583(n,'sm')}<small>\${esc(n)}</small></span>\`).join('')+'</div>';
  }
  function fightStatusHtmlV01583(m){
    const p=m?.power||{},ours=rosterV01583(m,'our'),enemies=rosterV01583(m,'enemy'),life=m?.life==='dead'?\`사망 \${m?.respawn||0}초\`:m?.life==='respawn'?\`부활 \${m?.respawn||0}초\`:'생존';
    return \`<section class="ri83Roster"><div class="ri83RosterHead"><b>⚔ 한타 현황</b><span>챔피언 초상화 · LIVE 전투 정보</span></div><div class="ri83RosterGrid"><div class="ri83Team"><span>아군 조합</span>\${rosterFacesHtmlV01583(ours)}</div><div class="ri83RosterStatus"><div class="ri83RosterStat"><span>LIVE 파워</span><b>\${Math.round(num(p.our))} : \${Math.round(num(p.enemy))}</b></div><div class="ri83RosterStat"><span>생존</span><b>\${num(m?.alive?.our)} : \${num(m?.alive?.enemy)}</b></div><div class="ri83RosterStat"><span>보유 골드</span><b>\${Math.round(num(m?.gold)).toLocaleString('ko-KR')}G</b></div><div class="ri83RosterStat"><span>내 상태</span><b>\${esc(life)}</b></div></div><div class="ri83Team enemy"><span>적군 조합</span>\${rosterFacesHtmlV01583(enemies)}</div></div></section>\`;
  }
`;

const LIVE_RENDER=`
  function renderLive(m){
    ensureCommandCenterStylesV01582();ensureVisualStylesV01583();
    if(m.life==='waiting')return \`<div class="riWaiting"><div><b>인게임 연결 대기</b><span>일반 칼바람 게임에 들어가면 자동으로 실시간 커맨드센터가 시작됩니다.<br>상단 <b>인게임 미리보기</b>에서 챔피언 이미지가 포함된 화면을 바로 확인할 수 있습니다.</span></div></div>\`;
    const plan=m.plan||{},tone=plan.tone||'warn',alive=m.alive||{our:0,enemy:0},p=m.power||{},time=\`\${String(Math.floor(num(m.gameTime)/60)).padStart(2,'0')}:\${String(Math.floor(num(m.gameTime)%60)).padStart(2,'0')}\`;
    const source=m.source==='preview'?'가상 경기':\`LIVE \${time}\`,warning=m.warning?.text||'',alts=(m.alts||[]).filter(Boolean).slice(0,2),life=m.life==='dead'?\`사망 \${m.respawn||0}초\`:m.life==='respawn'?\`부활 \${m.respawn||0}초\`:'생존',me=localChampionV01583(m),threats=(m.threats||[]).slice(0,3),buildBadge=m.buildSame?'기본트리 유지':'상황 보정';
    const decisionFaces=threats.length?\`<div class="ri83DecisionFaces"><span>주의 대상</span>\${threats.map(x=>portraitV01583(x?.name,'sm')).join('')}</div>\`:'';
    return \`<div class="ri82Grid"><div class="ri82Left"><section class="ri82Now \${esc(tone)}"><div class="ri82Kicker"><span>현재 판단</span><em>\${esc(source)} · 생존 \${alive.our}:\${alive.enemy}</em></div><h3>\${esc(plan.headline||'현재 교전 판단')}</h3><p>\${inlineChampionsV01583(plan.detail||'',m,155)}</p>\${decisionFaces}\${warning?\`<div class="ri82Warning \${esc(m.warning?.tone||'warn')}"><span>\${m.warning?.tone==='good'?'✓':'!'}</span><b>\${inlineChampionsV01583(warning,m,125)}</b></div>\`:''}</section><section class="ri82Panel"><div class="ri82PanelHead"><span>내 플레이</span><em>지금 해야 할 순서</em></div><div class="ri83PlayerHead">\${portraitV01583(me,'lg')}<div><strong>\${esc(me||'내 챔피언')}</strong><small>현재 역할 · \${esc(m.job||'역할 계산 대기')}</small><p>챔피언과 대상을 이미지로 빠르게 구분합니다.</p></div></div>\${planStepsHtmlV01583(m)}</section></div><div class="ri82Right"><section class="ri82Panel"><div class="ri82PanelHead"><span>위협 TOP3</span><em>상대 우선순위</em></div>\${threatTop3HtmlV01583(m)}</section><section class="ri82Panel"><div class="ri82PanelHead"><span>실시간 빌드</span><em>v0.15.81 추천엔진 유지</em></div><div class="ri83BuildHero">\${m.threat?.name&&m.threat.name!=='-'?portraitV01583(m.threat.name,'md'):''}<div><div class="ri82BuildTarget"><strong>\${esc(m.item?.name||'-')}</strong><i>\${esc(buildBadge)}</i></div><div class="ri82BuildReason">\${esc(short(m.item?.reason||m.advice?.direction||'현재 경기 데이터 반영',105))}</div></div></div>\${alts.length?\`<div class="ri82AltRow">\${alts.map(x=>\`<span class="ri82Alt">대안 · \${esc(x)}</span>\`).join('')}</div>\`:''}</section></div></div>\${fightStatusHtmlV01583(m)}\`;
  }
`;

const BUILD_RENDER=`
  function renderBuild(m){
    ensureCommandCenterStylesV01582();ensureVisualStylesV01583();
    if(m.life==='waiting')return renderLive(m);
    const source=m.stat?.source||'앱 기본 DB',basic=m.stat?.tree||'통계 기본트리 정보 없음',same=m.buildSame,alts=(m.alts||[]).filter(Boolean),goldKnown=Number.isFinite(Number(m.gold)),goldText=goldKnown?Math.round(num(m.gold)).toLocaleString('ko-KR')+'G':'확인 중';
    const respawn=m.life==='dead'?\`<div class="riRespawnStrip"><strong>\${m.respawn||0}초</strong><span>부활까지 · 지금은 구매/분석 확인 시간</span><b>보유 골드 \${goldText}</b></div>\`:\`<div class="riRespawnStrip"><strong>\${m.life==='respawn'?\`\${m.respawn||0}초\`:'LIVE'}</strong><span>\${m.life==='respawn'?'곧 부활 · 구매보다 다음 한타 준비':'현재 생존 · 필요할 때만 빌드 확인'}</span><b>보유 골드 \${goldText}</b></div>\`;
    const first=(m.plan?.steps||[]).filter(Boolean)[0]||m.plan?.detail||'아군 합류 후 상대 첫 진입을 확인',top=m.threat||{},me=localChampionV01583(m);
    const threatLine=top?.name&&top.name!=='-'?(top.dead?\`\${top.name} 사망 중 · 부활 타이밍에 맞춰 전진 여부 재판단\`:\`\${top.name} 위치 확인 전 무리 진입 금지 · 최고위협 우선 대응\`):'상대 최고위협 위치부터 확인';
    return \`\${respawn}<div class="ri82DeathHeadline"><span>사망 시간 우선순위</span><b>지금 살 것부터 확정하고, 부활 직후 첫 행동까지 준비</b></div><div class="riBuildCompare"><div class="riBuildCard"><div class="riBuildCardHead"><span>통계 기본트리</span><i>\${esc(m.stat?.verified?\`검증 \${m.stat.verified}\`:'BASE')}</i></div><div class="riBuildTree">\${esc(basic)}</div><div class="riBuildSub">\${esc(source)}</div></div><div class="riBuildCard opt"><div class="riBuildCardHead"><span>이번 판 다음 코어</span><i class="\${same?'same':''}">\${same?'기본과 일치':'상황 대응'}</i></div><div class="riBuildMain">\${esc(m.item?.name||'-')}</div><div class="riBuildSub">\${esc(short(m.item?.reason||m.advice?.direction||'',110))}</div>\${alts.length?\`<div class="riAltRow">\${alts.map(x=>\`<span class="riAltChip">대안 · \${esc(x)}</span>\`).join('')}</div>\`:''}</div></div><div class="ri82ReturnPlan"><h4>복귀 후 첫 행동</h4><div class="ri83PlayerHead">\${portraitV01583(me,'md')}<div><strong>\${esc(me||'내 챔피언')}</strong><small>부활 후 역할과 최고위협을 이미지로 재확인</small></div></div><div class="ri82Steps"><div class="ri82Step"><b>1</b><span>\${inlineChampionsV01583(m.job||'내 역할 재확인',m,105)}</span></div><div class="ri82Step"><b>2</b><span>\${inlineChampionsV01583(first,m,105)}</span></div><div class="ri82Step"><b>3</b><span class="ri83ReturnTarget">\${top?.name&&top.name!=='-'?portraitV01583(top.name,'sm'):''}<span>\${esc(short(threatLine,105))}</span></span></div></div></div>\`;
  }
`;

function patchCoach(src){
  src=insertBefore(src,'  function stateMeta(m)',VISUAL_HELPERS,'function ensureVisualStylesV01583()','visual helpers');
  src=replaceRange(src,'  function renderLive(m){','  function renderBuild(m){',LIVE_RENDER,'champion 이미지가 포함된 화면','visual live command center');
  src=replaceRange(src,'  function renderBuild(m){','  function detailThreats(m){',BUILD_RENDER,'부활 후 역할과 최고위협을 이미지로 재확인','visual death return plan');
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=patchCoach(src);
  return src;
}

module.exports={patchRuntimeSource,score_logic_changed:false,item_recommendation_logic_changed:false,ingame_hud_changed:true,champion_visuals_changed:true,policy_version:'0.15.83'};
