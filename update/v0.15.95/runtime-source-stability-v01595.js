'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01594')}catch{prior=require('../v0.15.94/runtime-source-stability-v01594')}

function countOf(src,needle){return String(src).split(needle).length-1}

function ensureResultStylesV01595(){
  if(document.querySelector('#riResultStyleV01595'))return;
  const st=document.createElement('style');st.id='riResultStyleV01595';st.textContent=`
    #riCoachShellV01550 .ri95Result{display:grid;gap:10px;color:#eaf7ff}
    #riCoachShellV01550 .ri95Hero{position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:14px;min-height:104px;border:1px solid #315f85;border-radius:12px;padding:14px 16px;background:linear-gradient(100deg,#0a233a 0%,#0d2e52 44%,#081a2d 100%)}
    #riCoachShellV01550 .ri95Hero:after{content:'';position:absolute;inset:0 0 0 48%;pointer-events:none;background:radial-gradient(circle at 60% 35%,rgba(64,145,225,.18),transparent 44%),linear-gradient(90deg,transparent,rgba(31,91,154,.12))}
    #riCoachShellV01550 .ri95Trophy{position:relative;z-index:1;width:62px;height:62px;display:grid;place-items:center;border:2px solid #42bfff;border-radius:50%;background:#0a3153;color:#87ddff;font-size:29px;box-shadow:0 0 20px rgba(46,177,255,.18)}
    #riCoachShellV01550 .ri95HeroCopy{position:relative;z-index:1;min-width:0}
    #riCoachShellV01550 .ri95HeroCopy h2{margin:0 0 5px;font-size:24px;color:#f3fbff}.ri95HeroCopy h2 b{color:#55caff}.ri95HeroCopy p{margin:0;color:#9dbbd1;font-size:11px}.ri95HeroCopy small{display:block;margin-top:7px;color:#6f91ad;font-size:9px}
    #riCoachShellV01550 .ri95HeroTag{position:relative;z-index:1;border:1px solid #38617f;border-radius:999px;padding:7px 10px;background:#0b2033;color:#b7d5e9;font-size:9px;font-weight:900;white-space:nowrap}
    #riCoachShellV01550 .ri95GridTop{display:grid;grid-template-columns:1.3fr .9fr .78fr;gap:10px}
    #riCoachShellV01550 .ri95GridBottom{display:grid;grid-template-columns:1.02fr 1.18fr;gap:10px}
    #riCoachShellV01550 .ri95Panel{min-width:0;border:1px solid #284b68;border-radius:11px;background:linear-gradient(180deg,#0b2032,#071725);overflow:hidden}
    #riCoachShellV01550 .ri95PanelHead{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid #173952;background:#0d2438}.ri95PanelHead b{font-size:14px;color:#77cfff}.ri95PanelHead small{font-size:8px;color:#7192ad}
    #riCoachShellV01550 .ri95Summary{display:grid;grid-template-columns:126px minmax(0,1fr);gap:12px;padding:11px}
    #riCoachShellV01550 .ri95Champ{border:1px solid #30577a;border-radius:10px;background:#081927;padding:9px;min-width:0}.ri95ChampIcon{width:74px;height:74px;margin:0 auto 7px;display:grid;place-items:center;border-radius:10px;overflow:hidden;background:#0f2a42;border:1px solid #4e86ac;font-size:24px}.ri95ChampIcon img{width:100%;height:100%;object-fit:cover}.ri95Champ b{display:block;text-align:center;font-size:14px}.ri95Champ small{display:block;text-align:center;margin-top:3px;color:#79a2bf;font-size:8px}.ri95Quote{margin-top:8px;border:1px solid #274c68;border-radius:8px;background:#0b1b2a;padding:7px;color:#b4c9d8;font-size:8px;line-height:1.4;text-align:center}
    #riCoachShellV01550 .ri95Stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-content:start}.ri95Stat{min-height:62px;padding:8px 10px;border-right:1px solid #17364d;border-bottom:1px solid #17364d}.ri95Stat:nth-child(3n){border-right:0}.ri95Stat span{display:block;color:#7193ae;font-size:8px}.ri95Stat b{display:block;margin-top:3px;font-size:17px;color:#f4fbff}.ri95Stat small{display:block;margin-top:3px;color:#79a0bb;font-size:8px}.ri95Stat.good small{color:#63dba3}.ri95Stat.bad small{color:#ff7e89}
    #riCoachShellV01550 .ri95Reasons{padding:8px 11px}.ri95Reason{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;padding:8px 0;border-bottom:1px solid #15334a}.ri95Reason:last-child{border-bottom:0}.ri95Reason i{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;font-style:normal;background:#174c7b;color:#d8f3ff;font-size:12px;font-weight:950}.ri95Reason b{display:block;font-size:10px}.ri95Reason span{display:block;margin-top:2px;color:#88a9c0;font-size:8px;line-height:1.4}
    #riCoachShellV01550 .ri95Build{padding:10px}.ri95Items{display:flex;gap:5px;flex-wrap:wrap}.ri95Item{width:43px;height:43px;border:1px solid #3b6280;border-radius:7px;background:#0a1c2c;display:grid;place-items:center;overflow:hidden;color:#86a6bc;font-size:7px;text-align:center}.ri95Item img{width:100%;height:100%;object-fit:cover}.ri95BuildVerdict{margin-top:9px;border:1px solid #2c674f;border-radius:8px;background:#0c2a20;padding:9px;color:#8ee8b8;font-size:10px;font-weight:900}.ri95BuildText{margin-top:7px;color:#8daac0;font-size:8px;line-height:1.5}
    #riCoachShellV01550 .ri95Recent{padding:5px 10px 9px}.ri95Match{display:grid;grid-template-columns:54px minmax(125px,.7fr) 80px 80px minmax(105px,1fr) 42px;align-items:center;gap:8px;min-height:43px;border-bottom:1px solid #14334a;font-size:9px}.ri95Match:last-child{border-bottom:0}.ri95ResultBadge{display:inline-grid;place-items:center;border-radius:6px;padding:5px 6px;font-weight:950}.ri95ResultBadge.win{background:#0e5136;border:1px solid #2ba96e;color:#8cf2bb}.ri95ResultBadge.loss{background:#4b202a;border:1px solid #ad485b;color:#ffabb5}.ri95ResultBadge.unknown{background:#243344;border:1px solid #456078;color:#b3c7d8}.ri95MatchChamp{display:flex;align-items:center;gap:6px;min-width:0}.ri95MiniChamp{width:29px;height:29px;flex:0 0 auto;border-radius:6px;overflow:hidden;background:#112b42;display:grid;place-items:center}.ri95MiniChamp img{width:100%;height:100%;object-fit:cover}.ri95MatchChamp b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ri95Kda b,.ri95Damage b{display:block}.ri95Kda small,.ri95Damage small{color:#7194ae}.ri95MiniItems{display:flex;gap:2px;overflow:hidden}.ri95MiniItem{width:24px;height:24px;border-radius:4px;overflow:hidden;background:#10273a;border:1px solid #294b63;display:grid;place-items:center;color:#7391a7;font-size:6px}.ri95MiniItem img{width:100%;height:100%;object-fit:cover}.ri95Grade{font-size:15px;font-weight:950;text-align:center;color:#f1c95a}
    #riCoachShellV01550 .ri95Trend{padding:12px}.ri95TrendTop{display:grid;grid-template-columns:118px repeat(3,minmax(0,1fr));gap:8px;align-items:center}.ri95Ring{width:82px;height:82px;margin:auto;display:grid;place-items:center;border-radius:50%;background:conic-gradient(#43d59b var(--win,0%),#1a3044 0);position:relative}.ri95Ring:after{content:'';position:absolute;inset:9px;border-radius:50%;background:#091a29}.ri95Ring b{position:relative;z-index:1;font-size:17px}.ri95TrendStat{border-left:1px solid #17374f;padding-left:10px}.ri95TrendStat span{display:block;font-size:8px;color:#7596af}.ri95TrendStat b{display:block;margin-top:3px;font-size:14px}.ri95TrendStat small{display:block;margin-top:2px;font-size:8px;color:#68d6a2}.ri95Strip{display:flex;gap:3px;margin-top:12px;align-items:center}.ri95Strip span{width:22px;height:20px;display:grid;place-items:center;border-radius:4px;font-size:7px;font-weight:950}.ri95Strip .w{background:#166843;color:#99f0c0}.ri95Strip .l{background:#642a35;color:#ffb0b9}.ri95Strip .u{background:#263a4c;color:#afc5d6}
    #riCoachShellV01550 .ri95Improve{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px}.ri95ImproveCard{border:1px solid #294b68;border-radius:9px;background:#091a29;padding:10px}.ri95ImproveCard b{display:block;font-size:10px;color:#eef8ff}.ri95ImproveCard span{display:block;margin-top:4px;font-size:8px;line-height:1.5;color:#89a9bf}.ri95ImproveCard.warn{border-color:#684449}.ri95ImproveCard.good{border-color:#35634f}
    #riCoachShellV01550 .ri95Empty{min-height:240px;display:grid;place-items:center;text-align:center;border:1px dashed #36536c;border-radius:11px;background:#081724;color:#8da8bc;padding:24px}.ri95Empty b{display:block;color:#eef8ff;font-size:16px;margin-bottom:6px}
    @media(max-width:1120px){#riCoachShellV01550 .ri95GridTop{grid-template-columns:1fr 1fr}.ri95GridTop>.ri95Panel:last-child{grid-column:1/-1}#riCoachShellV01550 .ri95GridBottom{grid-template-columns:1fr}#riCoachShellV01550 .ri95Match{grid-template-columns:52px minmax(120px,1fr) 76px 76px minmax(90px,.8fr) 38px}}
    @media(max-width:760px){#riCoachShellV01550 .ri95Hero{grid-template-columns:auto 1fr}.ri95HeroTag{display:none}#riCoachShellV01550 .ri95GridTop{grid-template-columns:1fr}.ri95GridTop>.ri95Panel:last-child{grid-column:auto}#riCoachShellV01550 .ri95Summary{grid-template-columns:1fr}.ri95Stats{grid-template-columns:1fr 1fr!important}.ri95Stat:nth-child(3n){border-right:1px solid #17364d}.ri95TrendTop{grid-template-columns:1fr 1fr}.ri95Improve{grid-template-columns:1fr}.ri95Match{grid-template-columns:48px minmax(110px,1fr) 70px 36px}.ri95Damage,.ri95MiniItems{display:none}}
  `;document.head.appendChild(st);
}

const resultStateV01595={sawLive:false,lastGameKey:'',endedAt:0};
function historyStateV01595(){
  try{if(typeof aramHistoryState!=='undefined'&&aramHistoryState){return typeof aramHistoryState==='function'?aramHistoryState():aramHistoryState}}catch{}
  try{const s=globalThis.aramHistoryState;return typeof s==='function'?s():s||{}}catch{return{}}
}
function historyGamesV01595(){
  const h=historyStateV01595()||{};let xs=h.matches||h.games||h.history||[];if(!Array.isArray(xs))xs=[];
  return xs.slice().sort((a,b)=>resultTimeV01595(b)-resultTimeV01595(a));
}
function resultTimeV01595(g){return num(g?.gameEndTimestamp??g?.gameEnd??g?.timestamp??g?.ts??g?.createdAt??g?.gameCreation,0)}
function resultParticipantV01595(g){
  try{if(typeof aramHistoryResolveParticipant==='function'){const p=aramHistoryResolveParticipant(g);if(p)return p}}catch{}
  const direct=g?.me||g?.participant||g?.player||g?.localParticipant||g?.self;if(direct&&typeof direct==='object')return direct;
  const ps=Array.isArray(g?.participants)?g.participants:[];return ps.find(x=>x?.isMe||x?.isLocal||x?.localPlayer)||{};
}
function resultItemsV01595(g,p){
  let xs=p?.items||g?.items||[];if(!Array.isArray(xs))xs=[];
  if(!xs.length){xs=[p?.item0,p?.item1,p?.item2,p?.item3,p?.item4,p?.item5,p?.item6].filter(x=>x!==undefined&&x!==null&&Number(x)!==0)}
  return xs.slice(0,7);
}
function resultWinV01595(g,p){
  const v=p?.win??g?.win??g?.victory??g?.result??g?.outcome;if(typeof v==='boolean')return v?'WIN':'LOSS';const s=String(v??'').toUpperCase();if(/WIN|VICTORY|승/.test(s))return'WIN';if(/LOSS|DEFEAT|패/.test(s))return'LOSS';return'UNKNOWN';
}
function resultNumV01595(...xs){for(const x of xs){const n=Number(x);if(Number.isFinite(n))return n}return null}
function normalizeResultGameV01595(g){
  const p=resultParticipantV01595(g)||{};const kills=resultNumV01595(p.kills,p?.scores?.kills,g?.kills),deaths=resultNumV01595(p.deaths,p?.scores?.deaths,g?.deaths),assists=resultNumV01595(p.assists,p?.scores?.assists,g?.assists);
  const damage=resultNumV01595(p.totalDamageDealtToChampions,p.damageDealtToChampions,p.damageDealt,g.totalDamageDealtToChampions,g.damageDealt,g.damage);
  const taken=resultNumV01595(p.totalDamageTaken,p.damageTaken,g.totalDamageTaken,g.damageTaken);
  const cc=resultNumV01595(p.timeCCingOthers,p.totalTimeCCDealt,p.ccTime,g.timeCCingOthers,g.totalTimeCCDealt,g.cc);
  const vision=resultNumV01595(p.visionScore,g.visionScore,g.vision);
  const champ=norm(p.championName||p.champion||g.championName||g.champion||g.champ||g.actualChampion||'챔피언 미확인');
  const duration=resultNumV01595(g.gameDuration,g.duration,g.gameTime);const role=norm(p.role||p.teamPosition||p.individualPosition||g.role||g.position||'');
  return{raw:g,p,result:resultWinV01595(g,p),champ,kills,deaths,assists,damage,taken,cc,vision,items:resultItemsV01595(g,p),duration,time:resultTimeV01595(g),role};
}
function kdaV01595(x){if(x.kills===null||x.deaths===null||x.assists===null)return'-';return`${x.kills} / ${x.deaths} / ${x.assists}`}
function ratioV01595(x){if(x.kills===null||x.deaths===null||x.assists===null)return'-';return((x.kills+x.assists)/Math.max(1,x.deaths)).toFixed(1)+':1'}
function fmtV01595(v){return Number.isFinite(Number(v))?Math.round(Number(v)).toLocaleString('ko-KR'):'-'}
function durationV01595(v){if(!Number.isFinite(Number(v)))return'-';const n=Math.max(0,Number(v));const sec=n>100000?n/1000:n;return`${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`}
function dateV01595(t){if(!Number.isFinite(Number(t))||Number(t)<=0)return'전적 시간 미확인';try{return new Date(Number(t)).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return'-'}}
function champIconV01595(name,mini=false){
  try{if(typeof aramHistoryIcon==='function'){const h=aramHistoryIcon(name,'draft');if(h)return`<div class="${mini?'ri95MiniChamp':'ri95ChampIcon'}">${h}</div>`}}catch{}
  return`<div class="${mini?'ri95MiniChamp':'ri95ChampIcon'}">${esc(String(name||'?').slice(0,1))}</div>`;
}
function itemMetaV01595(x){
  if(x&&typeof x==='object')return{id:String(x.itemID??x.itemId??x.id??''),name:norm(x.name||x.itemName||''),url:x.iconUrl||x.iconURL||x.icon||x.image||''};
  const id=String(x??'');let meta=null;try{if(typeof itemById!=='undefined')meta=itemById?.[id]||itemById?.[Number(id)]}catch{};try{meta=meta||globalThis.itemById?.[id]||globalThis.ITEMS_BY_ID?.[id]}catch{};
  return{id,name:norm(meta?.name||''),url:meta?.iconUrl||meta?.iconURL||meta?.icon||''};
}
function itemHtmlV01595(x,mini=false){const m=itemMetaV01595(x),cls=mini?'ri95MiniItem':'ri95Item';const label=esc(m.name||m.id||'아이템');return m.url?`<span class="${cls}" title="${label}"><img src="${esc(m.url)}" alt="${label}"></span>`:`<span class="${cls}" title="${label}">${label==='아이템'?'?':label.slice(0,5)}</span>`}
function gradeV01595(x){if(x.kills===null||x.deaths===null||x.assists===null)return'-';const r=(x.kills+x.assists)/Math.max(1,x.deaths);if(r>=4.5)return'S';if(r>=3)return'A';if(r>=2)return'B';return'C'}
function resultReasonsV01595(x){
  const out=[];if(x.result==='WIN')out.push(['승리 기여','최근 경기 데이터 기준 승리로 기록된 경기입니다.']);else if(x.result==='LOSS')out.push(['패배 복기','최근 경기 데이터 기준 패배로 기록된 경기입니다.']);else out.push(['결과 확인','경기 결과 동기화를 기다리고 있습니다.']);
  if(x.deaths!==null)out.push([x.deaths<=6?'안정적인 생존':'데스 관리 필요',x.deaths<=6?`데스 ${x.deaths}회로 비교적 안정적으로 전투를 이어갔습니다.`:`데스 ${x.deaths}회입니다. 다음 경기에서는 진입 후 이탈 타이밍을 우선 점검하세요.`]);
  if(x.cc!==null)out.push(['군중 제어 기여',`확인된 CC 기여 값은 ${fmtV01595(x.cc)}입니다. 한타 개시와 후속 제어 타이밍을 같이 보세요.`]);
  if(x.damage!==null)out.push(['딜 기여 확인',`챔피언 대상 피해 ${fmtV01595(x.damage)}를 기록했습니다. KDA와 함께 딜 유지 구간을 복기하세요.`]);
  return out.slice(0,4);
}
function resultReviewV01595(x){const r=x.deaths===null?null:(x.kills+x.assists)/Math.max(1,x.deaths);if(x.result==='WIN'&&r!==null&&r>=3)return'높은 교전 효율로 승리에 기여한 경기입니다.';if(x.result==='LOSS'&&x.deaths!==null&&x.deaths>=9)return'다음 경기에서는 포지셔닝과 진입 타이밍을 먼저 줄여보세요.';return'최근 경기 수치를 기준으로 다음 플레이 포인트를 확인하세요.'}
function improvementV01595(x){
  const cards=[];cards.push(['포지셔닝',x.deaths!==null&&x.deaths>=8?'데스가 높은 편입니다. 한타 시작 직후보다 핵심 CC가 빠진 뒤 진입하는 선택을 우선하세요.':'현재 생존 흐름을 유지하면서 딜/CC를 넣을 수 있는 거리를 반복하세요.','warn']);
  cards.push(['우선 타겟 설정',x.assists!==null&&x.assists>=10?'교전 관여가 확인됩니다. 다음에는 아군 이니시에 맞춰 같은 대상을 빠르게 집중하세요.':'아군 이니시에 맞춰 가장 가까운 고가치 타겟부터 함께 치는 연습이 좋습니다.','good']);
  cards.push(['빌드 점검',x.items.length?'최종 아이템을 최근 경기와 비교해 상대 조합에 따른 방어/관통/유틸 전환 시점을 확인하세요.':'최종 아이템 데이터가 동기화되면 빌드 전환 시점을 함께 평가합니다.','']);return cards;
}
function historySignatureV01595(){const xs=historyGamesV01595().slice(0,5);return xs.map(g=>[g?.gameId||g?.id||'',resultTimeV01595(g),g?.result||g?.win||'']).join('|')}
function syncResultTransitionV01595(m){
  if(preview.active)return;const live=m?.source==='live';if(live){resultStateV01595.sawLive=true;try{const s=typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState:null;resultStateV01595.lastGameKey=String(s?.game?.gameId||s?.gameId||'')}catch{};return}
  if(resultStateV01595.sawLive){resultStateV01595.sawLive=false;resultStateV01595.endedAt=Date.now();ui.tab='result';ui.lastRenderSig=''}
}
function resultHistorySignatureV01595(){return ui.tab==='result'?historySignatureV01595():''}
function renderResultV01595(){
  ensureResultStylesV01595();const games=historyGamesV01595().map(normalizeResultGameV01595);if(!games.length)return`<div class="ri95Empty"><div><b>결과 동기화 대기</b><span>게임 종료 후 Match Lab 전적이 저장되면 경기 요약과 최근 기록이 자동으로 표시됩니다.</span></div></div>`;
  const x=games[0],recent=games.slice(0,5),trend=games.slice(0,20),wins=trend.filter(g=>g.result==='WIN').length,known=trend.filter(g=>g.result!=='UNKNOWN').length,wr=known?Math.round(wins/known*100):0;
  const avg=(key)=>{const a=trend.map(g=>g[key]).filter(v=>Number.isFinite(Number(v)));return a.length?Math.round(a.reduce((s,v)=>s+Number(v),0)/a.length):null};
  const avgKda=trend.filter(g=>g.kills!==null&&g.deaths!==null&&g.assists!==null);const ak=avgKda.length?(avgKda.reduce((s,g)=>s+(g.kills+g.assists)/Math.max(1,g.deaths),0)/avgKda.length).toFixed(1):'-';
  const reasons=resultReasonsV01595(x),improve=improvementV01595(x),resultText=x.result==='WIN'?'승리':x.result==='LOSS'?'패배':'결과 확인 중';
  const recentHtml=recent.map(g=>`<div class="ri95Match"><span class="ri95ResultBadge ${g.result==='WIN'?'win':g.result==='LOSS'?'loss':'unknown'}">${g.result==='WIN'?'승리':g.result==='LOSS'?'패배':'-'}</span><div class="ri95MatchChamp">${champIconV01595(g.champ,true)}<b>${esc(g.champ)}</b></div><div class="ri95Kda"><b>${esc(kdaV01595(g))}</b><small>${esc(ratioV01595(g))}</small></div><div class="ri95Damage"><b>${fmtV01595(g.damage)}</b><small>가한 피해</small></div><div class="ri95MiniItems">${g.items.slice(0,6).map(it=>itemHtmlV01595(it,true)).join('')||'<span class="ri95MiniItem">-</span>'}</div><div class="ri95Grade">${gradeV01595(g)}</div></div>`).join('');
  return`<div class="ri95Result"><section class="ri95Hero"><div class="ri95Trophy">${x.result==='LOSS'?'↘':'🏆'}</div><div class="ri95HeroCopy"><h2>게임 종료 · <b>${resultText}</b></h2><p>${esc(resultReviewV01595(x))}</p><small>ARAM · ${durationV01595(x.duration)} · ${dateV01595(x.time)}</small></div><span class="ri95HeroTag">최근 전적 자동 동기화</span></section>
  <div class="ri95GridTop"><section class="ri95Panel"><div class="ri95PanelHead"><b>▣ 내 경기 요약</b><small>실제 전적 데이터</small></div><div class="ri95Summary"><div class="ri95Champ">${champIconV01595(x.champ)}<b>${esc(x.champ)}</b><small>${esc(x.role||'ARAM')}</small><div class="ri95Quote">${esc(resultReviewV01595(x))}</div></div><div class="ri95Stats"><div class="ri95Stat"><span>KDA</span><b>${esc(kdaV01595(x))}</b><small>${esc(ratioV01595(x))}</small></div><div class="ri95Stat"><span>가한 피해</span><b>${fmtV01595(x.damage)}</b><small>챔피언 대상</small></div><div class="ri95Stat"><span>받은 피해</span><b>${fmtV01595(x.taken)}</b><small>확인 가능 데이터</small></div><div class="ri95Stat"><span>킬 관여</span><b>${x.kills===null||x.assists===null?'-':fmtV01595(x.kills+x.assists)}</b><small>킬 + 어시스트</small></div><div class="ri95Stat"><span>CC 기여</span><b>${fmtV01595(x.cc)}</b><small>전적 제공 값</small></div><div class="ri95Stat"><span>시야 점수</span><b>${fmtV01595(x.vision)}</b><small>제공 시 표시</small></div></div></div></section>
  <section class="ri95Panel"><div class="ri95PanelHead"><b>💡 핵심 결과 분석</b><small>확인된 수치 기반</small></div><div class="ri95Reasons">${reasons.map((r,i)=>`<div class="ri95Reason"><i>${i+1}</i><div><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div></div>`).join('')}</div></section>
  <section class="ri95Panel"><div class="ri95PanelHead"><b>🛒 최종 빌드</b><small>${x.items.length?'동기화 완료':'데이터 대기'}</small></div><div class="ri95Build"><div class="ri95Items">${x.items.map(it=>itemHtmlV01595(it,false)).join('')||'<span class="ri95Item">-</span>'}</div><div class="ri95BuildVerdict">${x.items.length?'실제 경기 종료 아이템을 기준으로 표시합니다.':'최종 아이템 데이터 동기화를 기다리는 중입니다.'}</div><div class="ri95BuildText">이번 판 추천 빌드와 실제 최종 빌드 비교는 확인 가능한 아이템 데이터만 사용합니다.</div></div></section></div>
  <div class="ri95GridBottom"><section class="ri95Panel"><div class="ri95PanelHead"><b>▰ 최근 몇 경기</b><small>최근 ${recent.length}경기</small></div><div class="ri95Recent">${recentHtml}</div></section><section class="ri95Panel"><div class="ri95PanelHead"><b>▥ 최근 경기 추이</b><small>최대 최근 20경기</small></div><div class="ri95Trend"><div class="ri95TrendTop"><div class="ri95Ring" style="--win:${wr}%"><b>${known?wr+'%':'-'}</b></div><div class="ri95TrendStat"><span>최근 전적</span><b>${known?wins+'승 '+(known-wins)+'패':'-'}</b><small>${known}경기 확인</small></div><div class="ri95TrendStat"><span>평균 KDA</span><b>${ak}</b><small>최근 경기 기준</small></div><div class="ri95TrendStat"><span>평균 가한 피해</span><b>${fmtV01595(avg('damage'))}</b><small>제공 경기 평균</small></div></div><div class="ri95Strip">${trend.slice().reverse().map(g=>`<span class="${g.result==='WIN'?'w':g.result==='LOSS'?'l':'u'}">${g.result==='WIN'?'승':g.result==='LOSS'?'패':'-'}</span>`).join('')}</div></div></section></div>
  <section class="ri95Panel"><div class="ri95PanelHead"><b>▥ 다음 개선점 및 추천</b><small>최근 경기 기반 코칭</small></div><div class="ri95Improve">${improve.map(c=>`<div class="ri95ImproveCard ${c[2]||''}"><b>${esc(c[0])}</b><span>${esc(c[1])}</span></div>`).join('')}</div></section></div>`;
}

function patchCoachV01595(src){
  if(src.includes('function ensureResultStylesV01595()'))return src;
  const helperAnchor='  function renderDetail(m){';
  if(countOf(src,helperAnchor)!==1)throw new Error(`v0.15.95 coach contract mismatch result helper anchor=${countOf(src,helperAnchor)}`);
  const helpers=[ensureResultStylesV01595,historyStateV01595,historyGamesV01595,resultTimeV01595,resultParticipantV01595,resultItemsV01595,resultWinV01595,resultNumV01595,normalizeResultGameV01595,kdaV01595,ratioV01595,fmtV01595,durationV01595,dateV01595,champIconV01595,itemMetaV01595,itemHtmlV01595,gradeV01595,resultReasonsV01595,resultReviewV01595,improvementV01595,historySignatureV01595,syncResultTransitionV01595,resultHistorySignatureV01595,renderResultV01595].map(fn=>'  '+fn.toString().replace(/\n/g,'\n  ')).join('\n\n');
  src=src.replace(helperAnchor,'  const resultStateV01595={sawLive:false,lastGameKey:\'\',endedAt:0};\n\n'+helpers+'\n\n'+helperAnchor);
  const oldTab='<button type="button" data-ri-tab="detail">상세</button>';
  const newTab='<button type="button" data-ri-tab="result">결과</button>';
  if(countOf(src,oldTab)!==1)throw new Error(`v0.15.95 coach contract mismatch detail tab=${countOf(src,oldTab)}`);src=src.replace(oldTab,newTab);
  const oldBody="if(body)body.innerHTML=ui.tab==='build'?renderBuild(m):ui.tab==='detail'?renderDetail(m):renderLive(m);";
  const newBody="if(body)body.innerHTML=ui.tab==='build'?renderBuild(m):ui.tab==='result'?renderResultV01595():renderLive(m);";
  if(countOf(src,oldBody)!==1)throw new Error(`v0.15.95 coach contract mismatch body mode=${countOf(src,oldBody)}`);src=src.replace(oldBody,newBody);
  const lifeHook="else if(!ui.auto&&m.life!==ui.lastLife)ui.lastLife=m.life;\n    const sig=JSON.stringify([";
  const lifeNew="else if(!ui.auto&&m.life!==ui.lastLife)ui.lastLife=m.life;\n    syncResultTransitionV01595(m);\n    const sig=JSON.stringify([";
  if(countOf(src,lifeHook)!==1)throw new Error(`v0.15.95 coach contract mismatch transition hook=${countOf(src,lifeHook)}`);src=src.replace(lifeHook,lifeNew);
  const sigTail='m.matchup,m.warning?.text]);';
  const sigNew='m.matchup,m.warning?.text,resultHistorySignatureV01595()]);';
  if(countOf(src,sigTail)!==1)throw new Error(`v0.15.95 coach contract mismatch result signature=${countOf(src,sigTail)}`);src=src.replace(sigTail,sigNew);
  src=src.replace("tabs:['LIVE','빌드','상세']","tabs:['LIVE','빌드','결과']");
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=patchCoachV01595(src);
  return src;
}

module.exports={
  patchRuntimeSource,
  score_logic_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  route_adoption_changed:prior.route_adoption_changed===true,
  ingame_hud_changed:true,
  poro_snax_filtered:prior.poro_snax_filtered===true,
  random_pick_candidate_full_dna_preview_changed:prior.random_pick_candidate_full_dna_preview_changed===true,
  ingame_results_changed:true,
  ingame_results_auto_transition:true,
  ingame_results_history_source:'existing Match Lab / aramHistoryState',
  policy_version:'0.15.95'
};
