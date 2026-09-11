'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01581')}catch{prior=require('../v0.15.81/runtime-source-stability-v01581')}

function countOf(src,needle){return String(src).split(needle).length-1}
function insertBefore(src,anchor,text,signature,label){
  if(src.includes(signature))return src;
  const n=countOf(src,anchor);
  if(n!==1)throw new Error(`v0.15.82 source contract mismatch ${label} count=${n}`);
  return src.replace(anchor,text+anchor);
}
function replaceRange(src,start,end,replacement,signature,label){
  if(src.includes(signature))return src;
  const a=src.indexOf(start),b=a>=0?src.indexOf(end,a+start.length):-1;
  if(a<0||b<0||src.indexOf(start,a+1)>=0)throw new Error(`v0.15.82 source contract mismatch ${label}`);
  return src.slice(0,a)+replacement+src.slice(b);
}
function replaceExact(src,oldText,newText,label){
  if(src.includes(newText))return src;
  const n=countOf(src,oldText);
  if(n!==1)throw new Error(`v0.15.82 source contract mismatch ${label} count=${n}`);
  return src.replace(oldText,newText);
}

const HUD_HELPERS=`

  // v0.15.82 IN GAME Command Center.
  // UI-only successor: reuse the existing live model and v0.15.81 recommendation engine,
  // but present the decision hierarchy in the order a player needs during combat.
  function ensureCommandCenterStylesV01582(){
    if($('#riCommandStyleV01582'))return;
    const st=document.createElement('style');st.id='riCommandStyleV01582';st.textContent=\`
      #riCoachShellV01550 .riCoachTitle small{font-size:0!important}
      #riCoachShellV01550 .riCoachTitle small::after{content:'INGAME COMMAND CENTER · v0.15.82'!important;font-size:8px;letter-spacing:.06em}
      #riCoachShellV01550 .riCoachBody{padding:10px 12px 12px!important}
      #riCoachShellV01550 .ri82Grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.85fr);gap:10px;align-items:stretch}
      #riCoachShellV01550 .ri82Left,#riCoachShellV01550 .ri82Right{display:grid;gap:10px;min-width:0}
      #riCoachShellV01550 .ri82Now{border:1px solid #365774;border-left:5px solid #63b7ea;border-radius:11px;background:linear-gradient(135deg,#0d2236,#0b1928);padding:13px 14px}
      #riCoachShellV01550 .ri82Now.good{border-color:#34735b;border-left-color:#59d99e;background:linear-gradient(135deg,#0d291f,#0a1d18)}
      #riCoachShellV01550 .ri82Now.warn{border-color:#75632f;border-left-color:#e4bc55;background:linear-gradient(135deg,#2a240f,#151b22)}
      #riCoachShellV01550 .ri82Now.bad{border-color:#7d424d;border-left-color:#ff7486;background:linear-gradient(135deg,#2d181d,#171820)}
      #riCoachShellV01550 .ri82Kicker{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:5px}
      #riCoachShellV01550 .ri82Kicker span{font-size:9px;font-weight:950;letter-spacing:.07em;color:#8eb2cf}
      #riCoachShellV01550 .ri82Kicker em{font-style:normal;font-size:9px;font-weight:850;color:#8098ad;white-space:nowrap}
      #riCoachShellV01550 .ri82Now h3{margin:4px 0 5px;color:#f4f9fd;font-size:21px;line-height:1.25}
      #riCoachShellV01550 .ri82Now p{margin:0;color:#adbfce;font-size:11px;line-height:1.5}
      #riCoachShellV01550 .ri82Warning{display:flex;align-items:flex-start;gap:7px;margin-top:9px;border:1px solid #62404a;border-radius:8px;background:#25171c;padding:8px 9px;color:#efb2bc;font-size:10px;font-weight:850;line-height:1.4}
      #riCoachShellV01550 .ri82Warning.good{border-color:#2f6d56;background:#0c251c;color:#9ce8c2}
      #riCoachShellV01550 .ri82Warning.warn{border-color:#6e5d2d;background:#28220f;color:#efd37a}
      #riCoachShellV01550 .ri82Panel{border:1px solid #29465f;border-radius:11px;background:#091725;padding:11px 12px;min-width:0}
      #riCoachShellV01550 .ri82PanelHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
      #riCoachShellV01550 .ri82PanelHead span{font-size:9px;font-weight:950;letter-spacing:.05em;color:#7897b2}
      #riCoachShellV01550 .ri82PanelHead em{font-style:normal;font-size:8px;font-weight:900;color:#70879a;white-space:nowrap}
      #riCoachShellV01550 .ri82Role{font-size:14px;font-weight:950;line-height:1.45;color:#eef7ff;margin-bottom:9px}
      #riCoachShellV01550 .ri82Steps{display:grid;gap:5px}
      #riCoachShellV01550 .ri82Step{display:grid;grid-template-columns:20px minmax(0,1fr);gap:7px;align-items:flex-start;color:#a9bfd1;font-size:10px;line-height:1.4}
      #riCoachShellV01550 .ri82Step b{display:grid;place-items:center;width:20px;height:20px;border-radius:6px;background:#15314a;color:#a8d8fa;font-size:8px}
      #riCoachShellV01550 .ri82Threats{display:grid;gap:6px}
      #riCoachShellV01550 .ri82Threat{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:7px;align-items:center;border:1px solid #303f50;border-radius:8px;background:#0a141e;padding:7px 8px}
      #riCoachShellV01550 .ri82Threat.critical{border-color:#71404a;background:#25161b}
      #riCoachShellV01550 .ri82Threat.dead{opacity:.68;border-color:#31524b;background:#0b1b19}
      #riCoachShellV01550 .ri82Threat i{font-style:normal;font-size:9px;font-weight:950;color:#738da5}
      #riCoachShellV01550 .ri82ThreatMain{min-width:0}
      #riCoachShellV01550 .ri82ThreatMain b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#eef7ff;font-size:11px}
      #riCoachShellV01550 .ri82ThreatMain small{display:block;margin-top:2px;color:#71899e;font-size:8px}
      #riCoachShellV01550 .ri82ThreatState{font-size:9px;font-weight:950;color:#d89ca5;white-space:nowrap}
      #riCoachShellV01550 .ri82Threat.dead .ri82ThreatState{color:#84c7aa}
      #riCoachShellV01550 .ri82BuildTarget{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
      #riCoachShellV01550 .ri82BuildTarget strong{display:block;color:#f0fff7;font-size:17px;line-height:1.25}
      #riCoachShellV01550 .ri82BuildTarget i{font-style:normal;border-radius:99px;background:#133929;color:#88dfb1;padding:4px 7px;font-size:7px;font-weight:950;white-space:nowrap}
      #riCoachShellV01550 .ri82BuildReason{margin-top:6px;color:#8fa9ba;font-size:9px;line-height:1.45}
      #riCoachShellV01550 .ri82AltRow{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
      #riCoachShellV01550 .ri82Alt{border:1px solid #2f5067;border-radius:99px;background:#0b1c2a;color:#a7c0d3;padding:4px 7px;font-size:8px;font-weight:850}
      #riCoachShellV01550 .ri82StatusBar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:9px}
      #riCoachShellV01550 .ri82Status{border:1px solid #263f56;border-radius:8px;background:#081420;padding:8px 9px;min-width:0}
      #riCoachShellV01550 .ri82Status span{display:block;color:#6e899f;font-size:8px;margin-bottom:2px}
      #riCoachShellV01550 .ri82Status b{display:block;color:#eaf4fb;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #riCoachShellV01550 .ri82DeathHeadline{margin:0 0 9px;border:1px solid #5d4550;border-left:4px solid #e17888;border-radius:9px;background:#21171b;padding:9px 10px}
      #riCoachShellV01550 .ri82DeathHeadline span{display:block;color:#a78791;font-size:8px;font-weight:900;margin-bottom:3px}
      #riCoachShellV01550 .ri82DeathHeadline b{display:block;color:#f1dde1;font-size:13px;line-height:1.4}
      #riCoachShellV01550 .ri82ReturnPlan{margin-top:9px;border:1px solid #31536b;border-radius:10px;background:#091827;padding:10px 11px}
      #riCoachShellV01550 .ri82ReturnPlan h4{margin:0 0 7px;color:#dceefa;font-size:11px}
      #riCoachShellV01550 .ri82ReturnPlan .ri82Step{font-size:10px}
      #riCoachShellV01550 .riBuildCompare{grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr)!important}
      @media(max-width:980px){
        #riCoachShellV01550 .ri82Grid{grid-template-columns:1fr}
        #riCoachShellV01550 .ri82Right{grid-template-columns:1fr 1fr}
      }
      @media(max-width:720px){
        #riCoachShellV01550 .ri82Right{grid-template-columns:1fr}
        #riCoachShellV01550 .ri82StatusBar{grid-template-columns:1fr 1fr}
        #riCoachShellV01550 .ri82Kicker{align-items:flex-start;flex-direction:column;gap:3px}
      }
    \`;document.head.appendChild(st);
  }
  function dangerLabelV01582(score){
    score=num(score);return score>=90?'매우 높음':score>=75?'높음':score>=58?'보통':'낮음';
  }
  function threatStateTextV01582(x){
    const dead=!!x?.isDead||!!x?.dead||num(x?.respawnTimer)>0||num(x?.respawn)>0;
    const sec=Math.ceil(num(x?.respawnTimer||x?.respawn));
    return dead?(sec>0?\`사망 \${sec}초\`:'사망'):\`\${dangerLabelV01582(x?.score)} \${Math.round(num(x?.score))}\`;
  }
  function threatTop3HtmlV01582(m){
    const xs=(m?.threats||[]).slice(0,3);
    if(!xs.length)return '<div class="ri82BuildReason">상대 위협 데이터 대기 중</div>';
    return '<div class="ri82Threats">'+xs.map((x,i)=>{
      const dead=!!x?.isDead||!!x?.dead||num(x?.respawnTimer)>0||num(x?.respawn)>0,critical=!dead&&num(x?.score)>=88;
      return \`<div class="ri82Threat \${critical?'critical':''} \${dead?'dead':''}"><i>#\${i+1}</i><div class="ri82ThreatMain"><b>\${esc(x?.name||'-')}</b><small>\${esc(x?.damageType||'피해 유형 확인 중')}</small></div><span class="ri82ThreatState">\${esc(threatStateTextV01582(x))}</span></div>\`;
    }).join('')+'</div>';
  }
  function planStepsHtmlV01582(m){
    const plan=m?.plan||{},xs=(plan.steps||[]).filter(Boolean).slice(0,3);
    const fallback=[m?.job,plan.detail].filter(Boolean).slice(0,2);
    const rows=xs.length?xs:fallback;
    if(!rows.length)return '<div class="ri82BuildReason">행동 지침 계산 대기 중</div>';
    return '<div class="ri82Steps">'+rows.map((x,i)=>\`<div class="ri82Step"><b>\${i+1}</b><span>\${esc(short(x,100))}</span></div>\`).join('')+'</div>';
  }
`;

const LIVE_RENDER=`
  function renderLive(m){
    ensureCommandCenterStylesV01582();
    if(m.life==='waiting')return \`<div class="riWaiting"><div><b>인게임 연결 대기</b><span>일반 칼바람 게임에 들어가면 자동으로 실시간 커맨드센터가 시작됩니다.<br>지금 디자인을 확인하려면 상단 <b>인게임 미리보기</b>를 누르세요.</span></div></div>\`;
    const plan=m.plan||{},tone=plan.tone||'warn',alive=m.alive||{our:0,enemy:0},p=m.power||{},time=\`\${String(Math.floor(num(m.gameTime)/60)).padStart(2,'0')}:\${String(Math.floor(num(m.gameTime)%60)).padStart(2,'0')}\`;
    const source=m.source==='preview'?'가상 경기':\`LIVE \${time}\`,warning=m.warning?.text||'',alts=(m.alts||[]).filter(Boolean).slice(0,2),life=m.life==='dead'?\`사망 \${m.respawn||0}초\`:m.life==='respawn'?\`부활 \${m.respawn||0}초\`:'생존';
    const buildBadge=m.buildSame?'기본트리 유지':'상황 보정';
    return \`<div class="ri82Grid"><div class="ri82Left"><section class="ri82Now \${esc(tone)}"><div class="ri82Kicker"><span>현재 판단</span><em>\${esc(source)} · 생존 \${alive.our}:\${alive.enemy}</em></div><h3>\${esc(plan.headline||'현재 교전 판단')}</h3><p>\${esc(short(plan.detail||'',150))}</p>\${warning?\`<div class="ri82Warning \${esc(m.warning?.tone||'warn')}"><span>\${m.warning?.tone==='good'?'✓':'!'}</span><b>\${esc(short(warning,125))}</b></div>\`:''}</section><section class="ri82Panel"><div class="ri82PanelHead"><span>내 플레이</span><em>지금 해야 할 순서</em></div><div class="ri82Role">\${esc(m.job||'내 역할 계산 대기')}</div>\${planStepsHtmlV01582(m)}</section></div><div class="ri82Right"><section class="ri82Panel"><div class="ri82PanelHead"><span>위협 TOP3</span><em>상대 우선순위</em></div>\${threatTop3HtmlV01582(m)}</section><section class="ri82Panel"><div class="ri82PanelHead"><span>실시간 빌드</span><em>\${esc(buildBadge)}</em></div><div class="ri82BuildTarget"><strong>\${esc(m.item?.name||'-')}</strong><i>다음 코어</i></div><div class="ri82BuildReason">\${esc(short(m.item?.reason||m.advice?.direction||'추천 이유 계산 대기',105))}</div>\${alts.length?\`<div class="ri82AltRow">\${alts.map(x=>\`<span class="ri82Alt">대안 · \${esc(x)}</span>\`).join('')}</div>\`:''}</section></div></div><div class="ri82StatusBar"><div class="ri82Status"><span>현재 구도</span><b>\${esc(m.matchup||'-')} · \${alive.our}:\${alive.enemy}</b></div><div class="ri82Status"><span>LIVE 파워</span><b>\${Math.round(num(p.our))} : \${Math.round(num(p.enemy))}</b></div><div class="ri82Status"><span>보유 골드</span><b>\${Math.round(num(m.gold)).toLocaleString('ko-KR')}G</b></div><div class="ri82Status"><span>내 상태</span><b>\${esc(life)}</b></div></div>\`;
  }
`;

const BUILD_RENDER=`
  function renderBuild(m){
    ensureCommandCenterStylesV01582();
    if(m.life==='waiting')return renderLive(m);
    const source=m.stat?.source||'앱 기본 DB',basic=m.stat?.tree||'통계 기본트리 정보 없음',same=m.buildSame,alts=(m.alts||[]).filter(Boolean),steps=(m.plan?.steps||[]).filter(Boolean),top=m.threat||{},first=steps[0]||m.plan?.detail||m.job||'복귀 직후 아군 위치와 상대 핵심 스킬을 먼저 확인';
    const respawn=m.life==='dead'?\`<div class="riRespawnStrip"><strong>\${m.respawn||0}초</strong><span>부활까지 · 구매 → 위협 확인 → 복귀 계획</span><b>보유 골드 \${Math.round(num(m.gold)).toLocaleString('ko-KR')}</b></div>\`:\`<div class="riRespawnStrip"><strong>\${m.life==='respawn'?\`\${m.respawn||0}초\`:'LIVE'}</strong><span>\${m.life==='respawn'?'곧 부활 · 복귀 첫 행동 확인':'현재 생존 · 필요할 때만 빌드 확인'}</span><b>보유 골드 \${Math.round(num(m.gold)).toLocaleString('ko-KR')}</b></div>\`;
    const threatLine=top?.name&&top.name!=='-'?(top.dead?\`\${top.name} 사망 중 · 부활 타이밍에 맞춰 전진 여부 재판단\`:\`\${top.name} 위치 확인 전 무리 진입 금지 · 최고위협 우선 대응\`):'상대 최고위협 위치부터 확인';
    return \`\${respawn}<div class="ri82DeathHeadline"><span>사망 시간 우선순위</span><b>지금 살 것부터 확정하고, 부활 직후 첫 행동까지 준비</b></div><div class="riBuildCompare"><div class="riBuildCard"><div class="riBuildCardHead"><span>통계 기본트리</span><i>\${esc(m.stat?.verified?\`검증 \${m.stat.verified}\`:'BASE')}</i></div><div class="riBuildTree">\${esc(basic)}</div><div class="riBuildSub">\${esc(source)}</div></div><div class="riBuildCard opt"><div class="riBuildCardHead"><span>이번 판 다음 코어</span><i class="\${same?'same':''}">\${same?'기본과 일치':'상황 대응'}</i></div><div class="riBuildMain">\${esc(m.item?.name||'-')}</div><div class="riBuildSub">\${esc(short(m.item?.reason||m.advice?.direction||'',110))}</div>\${alts.length?\`<div class="riAltRow">\${alts.map(x=>\`<span class="riAltChip">대안 · \${esc(x)}</span>\`).join('')}</div>\`:''}</div></div><div class="ri82ReturnPlan"><h4>복귀 후 첫 행동</h4><div class="ri82Steps"><div class="ri82Step"><b>1</b><span>\${esc(short(m.job||'내 역할 재확인',105))}</span></div><div class="ri82Step"><b>2</b><span>\${esc(short(first,105))}</span></div><div class="ri82Step"><b>3</b><span>\${esc(short(threatLine,105))}</span></div></div></div>\`;
  }
`;

function patchCoach(src){
  src=insertBefore(src,'\n\n  function stateMeta(m)',HUD_HELPERS,'function ensureCommandCenterStylesV01582()','command center helpers');
  src=replaceRange(src,'  function renderLive(m){','  function renderBuild(m){',LIVE_RENDER,'class="ri82Grid"','live command center');
  src=replaceRange(src,'  function renderBuild(m){','  function detailThreats(m){',BUILD_RENDER,'class="ri82ReturnPlan"','death return plan');
  src=replaceExact(src,'<button type="button" data-ri-tab="live">LIVE</button>','<button type="button" data-ri-tab="live">실시간</button>','live tab label');
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=patchCoach(src);
  return src;
}

module.exports={patchRuntimeSource,score_logic_changed:false,item_recommendation_logic_changed:false,ingame_hud_changed:true,policy_version:'0.15.82'};
