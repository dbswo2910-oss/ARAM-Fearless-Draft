'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01597')}catch{prior=require('../v0.15.97/runtime-source-stability-v01597')}

function countOf(src,needle){return String(src).split(needle).length-1}
function replaceSectionV01598(src,start,end,replacement,label){
  const n=countOf(src,start);if(n!==1)throw new Error(`v0.15.98 ${label} start contract mismatch=${n}`);
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);if(a<0||b<0)throw new Error(`v0.15.98 ${label} end contract mismatch`);
  return src.slice(0,a)+replacement+'\n\n'+src.slice(b);
}
function injectFnV01598(fn){return '  '+fn.toString().replace(/\n/g,'\n  ')}

function ensureResultStylesV01595(){
  let st=document.querySelector('#riResultStyleV01595');
  if(!st){st=document.createElement('style');st.id='riResultStyleV01595';document.head.appendChild(st)}
  st.textContent=`
    #riCoachShellV01550 .ri95Result{display:grid;gap:12px;color:#edf8ff}
    #riCoachShellV01550 .ri95Hero{position:relative;isolation:isolate;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:18px;min-height:118px;border:1px solid #2876ac;border-radius:13px;padding:16px 18px;background:linear-gradient(102deg,#071c30 0%,#0b3157 48%,#07192b 100%);box-shadow:inset 0 0 0 1px rgba(80,184,255,.04),0 9px 28px rgba(0,0,0,.16)}
    #riCoachShellV01550 .ri95Hero:before{content:'';position:absolute;z-index:-2;inset:0;background:radial-gradient(circle at 78% 32%,rgba(61,158,237,.28),transparent 28%),radial-gradient(circle at 63% 88%,rgba(20,91,160,.26),transparent 36%)}
    #riCoachShellV01550 .ri95Hero:after{content:'';position:absolute;z-index:-1;right:-4%;top:-65%;width:52%;height:210%;opacity:.38;transform:rotate(-7deg);background:repeating-linear-gradient(90deg,transparent 0 31px,rgba(77,161,229,.12) 32px 34px)}
    #riCoachShellV01550 .ri95Trophy{width:66px;height:66px;display:grid;place-items:center;border:2px solid #45c3ff;border-radius:50%;background:linear-gradient(180deg,#104875,#0a2d4d);color:#8be0ff;font-size:30px;box-shadow:0 0 0 7px rgba(50,169,236,.06),0 0 24px rgba(46,177,255,.24)}
    #riCoachShellV01550 .ri95HeroCopy{min-width:0}.ri95HeroCopy h2{margin:0 0 5px;font-size:25px;letter-spacing:-.02em;color:#f5fbff}.ri95HeroCopy h2 b{color:#53c9ff}.ri95HeroCopy p{margin:0;color:#b2ccdf;font-size:11px;line-height:1.55}.ri95HeroCopy small{display:block;margin-top:7px;color:#78a2c1;font-size:9px;font-weight:750}
    #riCoachShellV01550 .ri95HeroTag{border:1px solid #3b769d;border-radius:999px;padding:8px 12px;background:rgba(7,30,50,.82);color:#bfe7ff;font-size:9px;font-weight:950;white-space:nowrap;box-shadow:inset 0 0 12px rgba(64,177,241,.05)}
    #riCoachShellV01550 .ri95GridTop{display:grid;grid-template-columns:1.38fr .94fr .88fr;gap:11px}
    #riCoachShellV01550 .ri95GridBottom{display:grid;grid-template-columns:1.04fr 1.16fr;gap:11px}
    #riCoachShellV01550 .ri95Panel{min-width:0;border:1px solid #28516f;border-radius:12px;background:linear-gradient(180deg,#0a2032,#071725);overflow:hidden;box-shadow:0 7px 18px rgba(0,0,0,.12)}
    #riCoachShellV01550 .ri95PanelHead{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:42px;padding:9px 12px;border-bottom:1px solid #19415d;background:linear-gradient(180deg,#0d293f,#0b2235)}.ri95PanelHead b{font-size:14px;color:#73cfff;letter-spacing:-.01em}.ri95PanelHead small{font-size:8px;color:#6f9ab9;font-weight:800}
    #riCoachShellV01550 .ri95Summary{display:grid;grid-template-columns:148px minmax(0,1fr);gap:13px;padding:12px}
    #riCoachShellV01550 .ri95Champ{display:flex;flex-direction:column;align-items:center;border:1px solid #2f5c7d;border-radius:11px;background:linear-gradient(180deg,#0a2031,#071825);padding:11px 9px 9px;min-width:0}
    #riCoachShellV01550 .ri95ChampIcon{position:relative;isolation:isolate;width:92px;height:92px;flex:0 0 92px;margin:0 auto 8px;border-radius:11px;overflow:hidden;background:#102b42;border:1px solid #5a9bc7;box-shadow:0 5px 16px rgba(0,0,0,.28);font-size:25px;display:grid;place-items:center}
    #riCoachShellV01550 .ri95ChampIcon>*{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border-radius:inherit!important;overflow:hidden!important}
    #riCoachShellV01550 .ri95ChampIcon img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:100%!important;min-height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;display:block!important;object-fit:cover!important;object-position:50% 50%!important;border-radius:inherit!important;transform:none!important}
    #riCoachShellV01550 .ri95Champ>b{display:block;text-align:center;font-size:15px;color:#f5fbff;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ri95Champ>small{display:block;text-align:center;margin-top:3px;color:#7fb2d3;font-size:8px}.ri95Quote{width:100%;box-sizing:border-box;margin-top:9px;border:1px solid #294e69;border-radius:8px;background:#091b2a;padding:7px;color:#b6cede;font-size:8px;line-height:1.45;text-align:center}
    #riCoachShellV01550 .ri95Stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-content:start;border:1px solid #173a53;border-radius:9px;overflow:hidden}.ri95Stat{min-height:65px;padding:9px 10px;box-sizing:border-box;border-right:1px solid #173a53;border-bottom:1px solid #173a53;background:rgba(7,25,39,.42)}.ri95Stat:nth-child(3n){border-right:0}.ri95Stat:nth-last-child(-n+3){border-bottom:0}.ri95Stat span{display:block;color:#78a0bc;font-size:8px;font-weight:800}.ri95Stat b{display:block;margin-top:3px;font-size:18px;line-height:1.15;color:#f6fbff;white-space:nowrap}.ri95Stat small{display:block;margin-top:4px;color:#83a9c3;font-size:8px}.ri95Stat.good small{color:#62dda5}.ri95Stat.bad small{color:#ff808d}
    #riCoachShellV01550 .ri95Reasons{padding:7px 12px}.ri95Reason{display:grid;grid-template-columns:31px minmax(0,1fr);gap:9px;padding:9px 0;border-bottom:1px solid #16384f}.ri95Reason:last-child{border-bottom:0}.ri95Reason i{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;font-style:normal;background:linear-gradient(180deg,#1a5b91,#123f68);color:#e0f5ff;font-size:12px;font-weight:950;box-shadow:inset 0 0 0 1px rgba(117,207,255,.08)}.ri95Reason b{display:block;font-size:10px;color:#f0f8fe}.ri95Reason span{display:block;margin-top:3px;color:#91b0c6;font-size:8px;line-height:1.5}
    #riCoachShellV01550 .ri95Build{padding:11px}.ri95Items{display:flex;gap:6px;flex-wrap:wrap}.ri95Item{position:relative;width:46px;height:46px;flex:0 0 46px;border:1px solid #47708c;border-radius:8px;background:#0b1e2d;display:grid;place-items:center;overflow:hidden;color:#86a6bc;font-size:8px;text-align:center}.ri95Item img{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important}.ri95BuildVerdict{margin-top:10px;border:1px solid #337158;border-radius:8px;background:linear-gradient(180deg,#0d3024,#0b271e);padding:9px 10px;color:#91e9ba;font-size:10px;font-weight:900;line-height:1.45}.ri95BuildText{margin-top:8px;color:#8faec3;font-size:8px;line-height:1.55}
    #riCoachShellV01550 .ri95Recent{padding:0 10px 8px}.ri98RecentHeader,.ri95Match{display:grid;grid-template-columns:55px minmax(130px,.74fr) 83px 82px minmax(118px,1fr) 42px;align-items:center;gap:8px}.ri98RecentHeader{min-height:30px;border-bottom:1px solid #21455f;color:#6e98b5;font-size:7px;font-weight:900;text-transform:uppercase}.ri95Match{min-height:48px;border-bottom:1px solid #15384f;font-size:9px}.ri95Match:last-child{border-bottom:0}.ri95ResultBadge{display:inline-grid;place-items:center;border-radius:6px;padding:5px 6px;font-weight:950}.ri95ResultBadge.win{background:#0d5437;border:1px solid #28ac6d;color:#91f1bd}.ri95ResultBadge.loss{background:#4d202b;border:1px solid #ae4659;color:#ffadb7}.ri95ResultBadge.unknown{background:#243344;border:1px solid #456078;color:#b3c7d8}.ri95MatchChamp{display:flex;align-items:center;gap:7px;min-width:0}.ri95MiniChamp{position:relative;isolation:isolate;width:31px;height:31px;flex:0 0 31px;border-radius:6px;overflow:hidden;background:#112b42;border:1px solid #355d79;display:grid;place-items:center}.ri95MiniChamp>*{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border-radius:inherit!important;overflow:hidden!important}.ri95MiniChamp img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:100%!important;min-height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;display:block!important;object-fit:cover!important;object-position:50% 50%!important;border-radius:inherit!important;transform:none!important}.ri95MatchChamp b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#eef8ff}.ri95Kda b,.ri95Damage b{display:block}.ri95Kda small,.ri95Damage small{color:#729ab6;font-size:7px}.ri95MiniItems{display:flex;gap:2px;overflow:hidden}.ri95MiniItem{position:relative;width:25px;height:25px;flex:0 0 25px;border-radius:4px;overflow:hidden;background:#10273a;border:1px solid #2e536c;display:grid;place-items:center;color:#7391a7;font-size:6px}.ri95MiniItem img{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important}.ri95Grade{font-size:16px;font-weight:950;text-align:center;color:#f0c85b;text-shadow:0 0 10px rgba(240,200,91,.12)}
    #riCoachShellV01550 .ri95Trend{padding:13px}.ri95TrendTop{display:grid;grid-template-columns:122px repeat(3,minmax(0,1fr));gap:9px;align-items:center}.ri95Ring{width:84px;height:84px;margin:auto;display:grid;place-items:center;border-radius:50%;background:conic-gradient(#45d79d var(--win,0%),#1a3449 0);position:relative;box-shadow:0 0 18px rgba(69,215,157,.08)}.ri95Ring:after{content:'';position:absolute;inset:9px;border-radius:50%;background:#091b2a}.ri95Ring b{position:relative;z-index:1;font-size:18px}.ri95TrendStat{border-left:1px solid #1a4059;padding-left:11px}.ri95TrendStat span{display:block;font-size:8px;color:#769db8}.ri95TrendStat b{display:block;margin-top:3px;font-size:15px}.ri95TrendStat small{display:block;margin-top:3px;font-size:8px;color:#68d6a2}.ri95Strip{display:flex;gap:4px;margin-top:13px;align-items:center;flex-wrap:wrap}.ri95Strip span{width:22px;height:20px;display:grid;place-items:center;border-radius:4px;font-size:7px;font-weight:950}.ri95Strip .w{background:#176b46;color:#9bf0c1}.ri95Strip .l{background:#652b36;color:#ffb1ba}.ri95Strip .u{background:#263a4c;color:#afc5d6}
    #riCoachShellV01550 .ri95Improve{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding:11px}.ri95ImproveCard{border:1px solid #2b516e;border-radius:9px;background:linear-gradient(180deg,#091d2c,#081824);padding:10px 11px}.ri95ImproveCard b{display:block;font-size:10px;color:#eef8ff}.ri95ImproveCard span{display:block;margin-top:5px;font-size:8px;line-height:1.55;color:#8eaec3}.ri95ImproveCard.warn{border-color:#6b474c}.ri95ImproveCard.good{border-color:#39705a}
    #riCoachShellV01550 .ri95Empty{min-height:240px;display:grid;place-items:center;text-align:center;border:1px dashed #365b75;border-radius:11px;background:#081826;color:#91adbf;padding:24px}.ri95Empty b{display:block;color:#eef8ff;font-size:16px;margin-bottom:6px}
    @media(max-width:1120px){#riCoachShellV01550 .ri95GridTop{grid-template-columns:1fr 1fr}.ri95GridTop>.ri95Panel:last-child{grid-column:1/-1}#riCoachShellV01550 .ri95GridBottom{grid-template-columns:1fr}#riCoachShellV01550 .ri98RecentHeader,#riCoachShellV01550 .ri95Match{grid-template-columns:52px minmax(120px,1fr) 78px 78px minmax(96px,.8fr) 38px}}
    @media(max-width:760px){#riCoachShellV01550 .ri95Hero{grid-template-columns:auto 1fr}.ri95HeroTag{display:none}#riCoachShellV01550 .ri95GridTop{grid-template-columns:1fr}.ri95GridTop>.ri95Panel:last-child{grid-column:auto}#riCoachShellV01550 .ri95Summary{grid-template-columns:1fr}.ri95Stats{grid-template-columns:1fr 1fr!important}.ri95Stat{border-right:1px solid #173a53!important;border-bottom:1px solid #173a53!important}.ri95TrendTop{grid-template-columns:1fr 1fr}.ri95Improve{grid-template-columns:1fr}.ri98RecentHeader{display:none}.ri95Match{grid-template-columns:48px minmax(110px,1fr) 72px 38px}.ri95Damage,.ri95MiniItems{display:none}}
  `;
}

function champIconV01595(name,mini=false){
  const cls=mini?'ri95MiniChamp':'ri95ChampIcon';
  try{if(typeof aramHistoryIcon==='function'){const h=aramHistoryIcon(name,'draft');if(h)return`<div class="${cls}" title="${esc(name)}">${h}</div>`}}catch{}
  return`<div class="${cls}" title="${esc(name)}">${esc(String(name||'?').slice(0,1))}</div>`;
}

function itemMetaV01595(x){
  let id='',name='',url='';
  if(x&&typeof x==='object'){id=String(x.itemID??x.itemId??x.id??'');name=norm(x.name||x.itemName||'');url=x.iconPrimaryUrl||x.iconUrl||x.iconURL||x.icon||x.image||''}
  else id=String(x??'');
  let meta=null;try{if(typeof itemById!=='undefined')meta=itemById?.[id]||itemById?.[Number(id)]}catch{};try{meta=meta||globalThis.itemById?.[id]||globalThis.ITEMS_BY_ID?.[id]}catch{}
  if(meta){name=name||norm(meta?.name||'');url=url||meta?.iconPrimaryUrl||meta?.iconUrl||meta?.iconURL||meta?.icon||''}
  try{
    const resolver=globalThis.aramItemArtResolverV01566||globalThis.aramItemArtResolverV01565||globalThis.aramItemArtResolverV01564;
    const hit=resolver?.resolve?.(id||name);
    if(hit){id=id||String(hit.id||'');name=name||norm(hit.item?.name||'');url=url||hit.item?.iconPrimaryUrl||hit.item?.iconUrl||hit.candidates?.[0]||''}
  }catch{}
  return{id,name,url};
}
function itemHtmlV01595(x,mini=false){
  const m=itemMetaV01595(x),cls=mini?'ri95MiniItem':'ri95Item',label=esc(m.name||'아이템');
  if(!m.id&&!m.url)return`<span class="${cls}" title="${label}">?</span>`;
  const ph='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
  const data=m.id?` data-item-id="${esc(m.id)}"`:'';
  return`<span class="${cls}"${data} title="${label}"><img${data} src="${esc(m.url||ph)}" alt="${label}"></span>`;
}

function resultRawParticipantsV01598(g){
  const out=[],seen=new Set();
  const push=p=>{if(!p||typeof p!=='object')return;const k=String(p?.puuid||p?.summonerId||p?.accountId||p?.participantId||p?.id||('champ:'+String(p?.championId||'')+':'+out.length));if(seen.has(k))return;seen.add(k);out.push(p)};
  for(const r of resultObjectsV01597(g)){for(const xs of [r?.participants,r?.playerParticipants,r?.participantStats,r?.info?.participants])if(Array.isArray(xs))for(const p of xs)push(p)}
  return out;
}
function resultPNumV01598(p,keys){
  const s=resultStatsV01597(p)||{};for(const k of keys){const n=resultNumV01595(s?.[k],p?.[k]);if(n!==null)return n}return null;
}
function resultTeamIdV01598(p){const s=resultStatsV01597(p)||{};const v=p?.teamId??s?.teamId??p?.team?.id;return v===undefined||v===null?'':String(v)}
function resultTeamContextV01598(x){
  const all=resultRawParticipantsV01598(x.raw),me=x.p||{};if(!all.length)return{size:0,teamKills:null,kp:null,damageRank:null,takenRank:null,damageShare:null,takenShare:null};
  const teamId=resultTeamIdV01598(me),pid=Number(me?.participantId??me?.id);let team=teamId?all.filter(p=>resultTeamIdV01598(p)===teamId):[];
  if(!team.length&&Number.isFinite(pid)&&pid>0)team=all.filter(p=>{const n=Number(p?.participantId??p?.id);return Number.isFinite(n)&&n>0&&Math.ceil(n/5)===Math.ceil(pid/5)});
  if(!team.length&&all.length===5)team=all.slice();if(!team.length)return{size:0,teamKills:null,kp:null,damageRank:null,takenRank:null,damageShare:null,takenShare:null};
  const rows=team.map(p=>({kills:resultPNumV01598(p,['kills']),damage:resultPNumV01598(p,['totalDamageDealtToChampions','damageDealtToChampions','damageDealt']),taken:resultPNumV01598(p,['totalDamageTaken','damageTaken'])}));
  const sum=k=>rows.reduce((s,r)=>s+(Number.isFinite(Number(r[k]))?Number(r[k]):0),0),teamKills=sum('kills'),totalDamage=sum('damage'),totalTaken=sum('taken');
  const rank=(k,v)=>Number.isFinite(Number(v))?1+rows.filter(r=>Number.isFinite(Number(r[k]))&&Number(r[k])>Number(v)).length:null;
  const kp=teamKills>0&&x.kills!==null&&x.assists!==null?Math.max(0,Math.min(100,Math.round((Number(x.kills)+Number(x.assists))/teamKills*100))):null;
  return{size:team.length,teamKills,kp,damageRank:rank('damage',x.damage),takenRank:rank('taken',x.taken),damageShare:totalDamage>0&&x.damage!==null?Math.round(Number(x.damage)/totalDamage*100):null,takenShare:totalTaken>0&&x.taken!==null?Math.round(Number(x.taken)/totalTaken*100):null};
}
function resultCcMetaV01598(x){
  const p=x.p||{},s=resultStatsV01597(p)||{},timed=['timeCCingOthers','totalTimeCCDealt','totalTimeCrowdControlDealt','ccTime'].some(k=>Number.isFinite(Number(s?.[k]??p?.[k])));return{suffix:timed?'초':'',sub:timed?'적 챔피언 제어 시간':'전적 제공 CC 값'};
}
function gradeV01595(x){
  if(x.kills===null||x.deaths===null||x.assists===null)return'-';const c=x.ctx||resultTeamContextV01598(x),r=(x.kills+x.assists)/Math.max(1,x.deaths);let s=r>=5?2.4:r>=3.5?1.8:r>=2.5?1.2:r>=1.8?.6:0;
  if(c.kp>=80)s+=1.6;else if(c.kp>=70)s+=1.2;else if(c.kp>=60)s+=.8;if(c.damageRank===1)s+=1.1;else if(c.damageRank===2)s+=.7;else if(c.damageRank===3)s+=.35;if(c.takenRank===1&&x.deaths<=9)s+=.35;if(x.result==='WIN')s+=.35;if(x.deaths>=12)s-=.7;
  return s>=4.25?'S':s>=3?'A':s>=1.8?'B':'C';
}
function resultReasonsV01595(x){
  const c=x.ctx||resultTeamContextV01598(x),out=[],ratio=x.kills===null?null:(x.kills+x.assists)/Math.max(1,x.deaths);
  if(x.result==='WIN')out.push(['승리 기여',ratio!==null?`KDA 효율 ${ratio.toFixed(1)}로 승리한 경기입니다. 단순 승패보다 교전 관여와 팀 내 지표를 함께 평가했습니다.`:'승리한 경기입니다.']);else if(x.result==='LOSS')out.push(['패배 복기',ratio!==null?`KDA 효율 ${ratio.toFixed(1)}였습니다. 패배 원인은 단일 수치가 아니라 팀 내 기여 지표와 함께 확인하세요.`:'패배한 경기입니다.']);else out.push(['결과 확인','경기 결과 동기화를 확인하고 있습니다.']);
  if(c.kp!==null)out.push([`한타 관여도 ${c.kp}%`,`팀 ${fmtV01595(c.teamKills)}킬 중 ${fmtV01595((x.kills||0)+(x.assists||0))}킬에 관여했습니다. 교전 합류 빈도를 직접 반영한 수치입니다.`]);
  if(c.damageRank!==null&&c.takenRank!==null){if(c.takenRank<=2&&c.damageRank>=3)out.push(['전방 수행',`받은 피해 팀 내 ${c.takenRank}위 · 챔피언 피해 ${c.damageRank}위입니다. 앞선에서 받아낸 압박과 공격 기여를 같이 봐야 하는 경기입니다.`]);else out.push(['딜 기여',`챔피언 피해 팀 내 ${c.damageRank}위${c.damageShare!==null?` · 팀 피해의 ${c.damageShare}%`:''}를 기록했습니다.`])}else if(x.damage!==null)out.push(['딜 기여',`챔피언 대상 피해 ${fmtV01595(x.damage)}를 기록했습니다.`]);
  if(x.cc!==null&&Number(x.cc)>0){const cm=resultCcMetaV01598(x);out.push(['군중 제어 기여',`CC ${fmtV01595(x.cc)}${cm.suffix}를 기록했습니다. 한타 개시뿐 아니라 아군 딜러를 지키는 제어까지 함께 복기하세요.`])}
  return out.slice(0,4);
}
function resultReviewV01595(x){
  const c=x.ctx||resultTeamContextV01598(x),parts=[];if(c.kp!==null)parts.push(`팀 킬의 ${c.kp}%에 관여`);if(c.damageRank!==null)parts.push(`챔피언 피해 ${c.damageRank}위`);if(c.takenRank!==null&&c.takenRank<=2)parts.push(`받은 피해 ${c.takenRank}위`);if(parts.length)return`${parts.join(' · ')}한 경기입니다.`;const r=x.deaths===null?null:(x.kills+x.assists)/Math.max(1,x.deaths);if(x.result==='WIN'&&r!==null&&r>=3)return'교전 효율을 유지하며 승리에 기여한 경기입니다.';return'최근 경기 수치와 팀 내 상대 지표를 기준으로 다음 플레이를 복기하세요.';
}
function improvementV01595(x){
  const c=x.ctx||resultTeamContextV01598(x),cards=[],ratio=x.kills===null?null:(x.kills+x.assists)/Math.max(1,x.deaths);
  cards.push(['포지셔닝',x.deaths!==null&&x.deaths>=10&&ratio!==null&&ratio<3?'데스와 교전 효율을 함께 보면 손해 교전 가능성이 있습니다. 한타 직전 단독 사망과 첫 진입 타이밍을 우선 복기하세요.':'데스 횟수만으로 판단하지 않습니다. 현재 교전 효율을 유지하면서 한타 직전 단독 사망만 줄이는 쪽을 목표로 하세요.',x.deaths!==null&&x.deaths>=10&&ratio!==null&&ratio<3?'warn':'good']);
  cards.push(['교전 합류',c.kp!==null?(c.kp<60?`킬 관여 ${c.kp}%입니다. 다음 판은 아군 첫 CC나 이니시에 한 템포 빠르게 합류하는 것을 우선하세요.`:`킬 관여 ${c.kp}%로 충분히 높습니다. 다음에는 같은 참여율을 유지하면서 핵심 타겟 집중도를 높이세요.`):'팀 킬 데이터가 제공되면 실제 킬 관여율을 기준으로 합류 타이밍을 평가합니다.',c.kp!==null&&c.kp>=60?'good':'']);
  cards.push(['빌드 점검',x.items.length?`최종 ${x.items.length}슬롯을 확인했습니다. 다음 판에는 같은 챔피언이라도 상대 피해 유형과 최고 위협에 따라 방어/관통/유틸 전환 시점을 비교하세요.`:'최종 아이템 데이터가 동기화되면 실제 종료 빌드를 기준으로 전환 시점을 평가합니다.','']);return cards;
}

function renderResultV01595(){
  ensureResultStylesV01595();if(resultSyncV01596.blocking&&!resultSyncV01596.synced)return renderResultSyncV01596();const games=historyGamesV01595().map(normalizeResultGameV01595);if(!games.length)return`<div class="ri95Empty"><div><b>결과 동기화 대기</b><span>League Client의 일반 칼바람 전적을 불러오면 경기 요약과 최근 기록이 자동으로 표시됩니다.</span></div></div>`;
  for(const g of games)g.ctx=resultTeamContextV01598(g);const x=games[0],c=x.ctx,recent=games.slice(0,5),trend=games.slice(0,20),wins=trend.filter(g=>g.result==='WIN').length,known=trend.filter(g=>g.result!=='UNKNOWN').length,wr=known?Math.round(wins/known*100):0;
  const avg=(key)=>{const a=trend.map(g=>g[key]).filter(v=>Number.isFinite(Number(v)));return a.length?Math.round(a.reduce((s,v)=>s+Number(v),0)/a.length):null};
  const avgKda=trend.filter(g=>g.kills!==null&&g.deaths!==null&&g.assists!==null),ak=avgKda.length?(avgKda.reduce((s,g)=>s+(g.kills+g.assists)/Math.max(1,g.deaths),0)/avgKda.length).toFixed(1):'-',reasons=resultReasonsV01595(x),improve=improvementV01595(x),resultText=x.result==='WIN'?'승리':x.result==='LOSS'?'패배':'결과 확인 중',ccm=resultCcMetaV01598(x);
  const recentHtml=recent.map(g=>`<div class="ri95Match"><span class="ri95ResultBadge ${g.result==='WIN'?'win':g.result==='LOSS'?'loss':'unknown'}">${g.result==='WIN'?'승리':g.result==='LOSS'?'패배':'-'}</span><div class="ri95MatchChamp">${champIconV01595(g.champ,true)}<b>${esc(g.champ)}</b></div><div class="ri95Kda"><b>${esc(kdaV01595(g))}</b><small>${esc(ratioV01595(g))}</small></div><div class="ri95Damage"><b>${fmtV01595(g.damage)}</b><small>${g.ctx?.damageRank?`팀 ${g.ctx.damageRank}위`:'가한 피해'}</small></div><div class="ri95MiniItems">${g.items.slice(0,6).map(it=>itemHtmlV01595(it,true)).join('')||'<span class="ri95MiniItem">-</span>'}</div><div class="ri95Grade">${gradeV01595(g)}</div></div>`).join('');
  return`<div class="ri95Result"><section class="ri95Hero"><div class="ri95Trophy">${x.result==='LOSS'?'↘':'🏆'}</div><div class="ri95HeroCopy"><h2>게임 종료 · <b>${resultText}</b></h2><p>${esc(resultReviewV01595(x))}</p><small>ARAM · ${durationV01595(x.duration)} · ${dateV01595(x.time)}</small></div><span class="ri95HeroTag">MATCH RESULT · 최근 전적 자동 동기화</span></section>
  <div class="ri95GridTop"><section class="ri95Panel"><div class="ri95PanelHead"><b>▣ 내 경기 요약</b><small>실제 전적 + 팀 내 비교</small></div><div class="ri95Summary"><div class="ri95Champ">${champIconV01595(x.champ)}<b>${esc(x.champ)}</b><small>${esc(x.role||'ARAM')}</small><div class="ri95Quote">${esc(resultReviewV01595(x))}</div></div><div class="ri95Stats"><div class="ri95Stat"><span>KDA</span><b>${esc(kdaV01595(x))}</b><small>${esc(ratioV01595(x))}</small></div><div class="ri95Stat"><span>가한 피해</span><b>${fmtV01595(x.damage)}</b><small>${c.damageRank?`팀 내 ${c.damageRank}위`:'챔피언 대상'}</small></div><div class="ri95Stat"><span>받은 피해</span><b>${fmtV01595(x.taken)}</b><small>${c.takenRank?`팀 내 ${c.takenRank}위`:'전적 제공 값'}</small></div><div class="ri95Stat"><span>킬 관여</span><b>${c.kp!==null?c.kp+'%':'-'}</b><small>${c.teamKills!==null?`팀 ${fmtV01595(c.teamKills)}킬 기준`:'팀 킬 데이터 대기'}</small></div><div class="ri95Stat"><span>CC 기여</span><b>${fmtV01595(x.cc)}${x.cc!==null?ccm.suffix:''}</b><small>${ccm.sub}</small></div><div class="ri95Stat"><span>팀 딜 비중</span><b>${c.damageShare!==null?c.damageShare+'%':'-'}</b><small>${c.damageRank?`피해 ${c.damageRank}위`:'팀 피해 데이터 대기'}</small></div></div></div></section>
  <section class="ri95Panel"><div class="ri95PanelHead"><b>💡 핵심 결과 분석</b><small>팀 내 상대 수치 기반</small></div><div class="ri95Reasons">${reasons.map((r,i)=>`<div class="ri95Reason"><i>${i+1}</i><div><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div></div>`).join('')}</div></section>
  <section class="ri95Panel"><div class="ri95PanelHead"><b>🛒 최종 빌드</b><small>${x.items.length?'동기화 완료':'데이터 대기'}</small></div><div class="ri95Build"><div class="ri95Items">${x.items.map(it=>itemHtmlV01595(it,false)).join('')||'<span class="ri95Item">-</span>'}</div><div class="ri95BuildVerdict">${x.items.length?'실제 경기 종료 아이템을 아이콘 기준으로 확인합니다.':'최종 아이템 데이터 동기화를 기다리는 중입니다.'}</div><div class="ri95BuildText">숫자 itemId 대신 앱의 공용 아이템 카탈로그를 사용합니다. 상대 조합이 확보된 경기에서는 이후 빌드 적합도 분석으로 확장할 수 있습니다.</div></div></section></div>
  <div class="ri95GridBottom"><section class="ri95Panel"><div class="ri95PanelHead"><b>▰ 최근 몇 경기</b><small>최근 ${recent.length}경기</small></div><div class="ri95Recent"><div class="ri98RecentHeader"><span>결과</span><span>챔피언</span><span>KDA</span><span>가한 피해</span><span>아이템</span><span>평가</span></div>${recentHtml}</div></section><section class="ri95Panel"><div class="ri95PanelHead"><b>▥ 최근 경기 추이</b><small>최대 최근 20경기</small></div><div class="ri95Trend"><div class="ri95TrendTop"><div class="ri95Ring" style="--win:${wr}%"><b>${known?wr+'%':'-'}</b></div><div class="ri95TrendStat"><span>최근 전적</span><b>${known?wins+'승 '+(known-wins)+'패':'-'}</b><small>${known}경기 확인</small></div><div class="ri95TrendStat"><span>평균 KDA</span><b>${ak}</b><small>최근 경기 기준</small></div><div class="ri95TrendStat"><span>평균 가한 피해</span><b>${fmtV01595(avg('damage'))}</b><small>제공 경기 평균</small></div></div><div class="ri95Strip">${trend.slice().reverse().map(g=>`<span class="${g.result==='WIN'?'w':g.result==='LOSS'?'l':'u'}">${g.result==='WIN'?'승':g.result==='LOSS'?'패':'-'}</span>`).join('')}</div></div></section></div>
  <section class="ri95Panel"><div class="ri95PanelHead"><b>▥ 다음 개선점 및 추천</b><small>최근 경기 실데이터 코칭</small></div><div class="ri95Improve">${improve.map(q=>`<div class="ri95ImproveCard ${q[2]||''}"><b>${esc(q[0])}</b><span>${esc(q[1])}</span></div>`).join('')}</div></section></div>`;
}

function patchCoachV01598(src){
  if(src.includes('function resultTeamContextV01598('))return src;
  src=replaceSectionV01598(src,'  function ensureResultStylesV01595(){','  function historyStateV01595(){',injectFnV01598(ensureResultStylesV01595),'result-style');
  src=replaceSectionV01598(src,'  function champIconV01595(name,mini=false){','  function itemMetaV01595(x){',injectFnV01598(champIconV01595),'champion-art');
  src=replaceSectionV01598(src,'  function itemMetaV01595(x){','  function gradeV01595(x){',[injectFnV01598(itemMetaV01595),injectFnV01598(itemHtmlV01595)].join('\n\n'),'item-art');
  src=replaceSectionV01598(src,'  function gradeV01595(x){','  function historySignatureV01595(){',[resultRawParticipantsV01598,resultPNumV01598,resultTeamIdV01598,resultTeamContextV01598,resultCcMetaV01598,gradeV01595,resultReasonsV01595,resultReviewV01595,improvementV01595].map(injectFnV01598).join('\n\n'),'result-integrity');
  src=replaceSectionV01598(src,'  function renderResultV01595(){','  function renderDetail(m){',injectFnV01598(renderResultV01595),'result-render');
  src=src.replace(/INGAME COACH · v0\.15\.\d+/g,'INGAME COACH · v0.15.98');
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=patchCoachV01598(src);
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
  ingame_results_integrity_hotfix:true,
  ingame_results_team_kp:true,
  ingame_results_team_ranks:true,
  ingame_results_item_icons:true,
  ingame_results_champion_square_fit:true,
  ingame_results_reference_visual_refresh:true,
  ingame_results_version_label_sync:true,
  policy_version:'0.15.98'
};