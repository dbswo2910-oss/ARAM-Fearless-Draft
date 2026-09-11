'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01579')}catch{prior=require('../v0.15.79/runtime-source-stability-v01579')}

function countOf(src,needle){return String(src).split(needle).length-1}
function replaceExact(src,oldText,newText,label){
  if(src.includes(newText))return src;
  const n=countOf(src,oldText);
  if(n!==1)throw new Error(`v0.15.80 source contract mismatch ${label} count=${n}`);
  return src.replace(oldText,newText);
}
function insertAfter(src,anchor,text,signature,label){
  if(src.includes(signature))return src;
  const n=countOf(src,anchor);
  if(n!==1)throw new Error(`v0.15.80 source contract mismatch ${label} count=${n}`);
  return src.replace(anchor,anchor+text);
}
function replaceBlock(src,startMarker,endMarker,newBlock,signature,label){
  if(src.includes(signature))return src;
  const a=src.indexOf(startMarker);
  if(a<0)throw new Error(`v0.15.80 source contract mismatch ${label} start`);
  const b=src.indexOf(endMarker,a+startMarker.length);
  if(b<0)throw new Error(`v0.15.80 source contract mismatch ${label} end`);
  return src.slice(0,a)+newBlock+src.slice(b);
}

const ITEM_RANK=`\n\n  // v0.15.80 canonical item identity: prefer the purchasable standard ARAM/live ID when localized names collide across modes.\n  function itemIdentityRank(id,it){const n=Number(id);let score=0;if(it?.map12===true)score+=100;if(it?.purchasable!==false)score+=40;if(it?.standardLiveId===true||(Number.isFinite(n)&&n>0&&n<10000))score+=30;if(it?.full===true)score+=8;if(Number.isFinite(n)&&n>0&&n<10000)score+=4;return score}`;

function patchRandomIcons(src){
  src=insertAfter(
    src,
    "  let catalog=null,pending=null,nameToId=new Map(),timer=0,retryTimer=0,lastFailureAt=0;",
    `${ITEM_RANK}\n  function rebuildNameIndex(){\n    nameToId=new Map();const best=new Map();\n    for(const [id,it] of Object.entries(catalog?.items||{})){\n      const name=norm(it?.name);if(!name)continue;const k=key(name),score=itemIdentityRank(id,it),prev=best.get(k);\n      if(!prev||score>prev.score||(score===prev.score&&Number(id)<Number(prev.id)))best.set(k,{id:String(id),score});\n    }\n    for(const [k,row] of best)nameToId.set(k,row.id);\n  }`,
    'function rebuildNameIndex()',
    'random icons canonical helper'
  );
  src=replaceExact(
    src,
    "      catalog=x||null;nameToId=new Map();\n      if(catalog?.items)for(const [id,it] of Object.entries(catalog.items)){if(it?.name)nameToId.set(key(it.name),String(id))}",
    "      catalog=x||null;rebuildNameIndex();",
    'random icons canonical index'
  );
  src=replaceExact(
    src,
    "    if(!id)return null;const img=document.createElement('img');img.className=`riItemIconV01556 ${kind}`.trim();img.src=iconUrl(id);img.alt=norm(name)||'아이템';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;",
    "    if(!id)return null;const img=document.createElement('img');img.className=`riItemIconV01556 ${kind}`.trim();img.dataset.itemId=String(id);img.src=iconUrl(id);img.alt=norm(name)||'아이템';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;",
    'random icons explicit item id'
  );
  const tree=`  function treeMatches(text){\n    if(!catalog?.items||!text)return[];const low=norm(text),best=new Map();\n    for(const [id,it] of Object.entries(catalog.items)){\n      const name=norm(it?.name);if(!name||name.length<2)continue;const at=low.indexOf(name);if(at<0)continue;\n      const k=key(name),score=itemIdentityRank(id,it),prev=best.get(k),row={id:String(id),name,at,score};\n      if(!prev||score>prev.score||(score===prev.score&&Number(id)<Number(prev.id)))best.set(k,row);\n    }\n    const rows=[...best.values()].sort((a,b)=>a.at-b.at||b.name.length-a.name.length||Number(a.id)-Number(b.id));\n    const out=[];for(const x of rows){if(out.some(y=>x.at<y.at+y.name.length&&x.at+x.name.length>y.at))continue;out.push(x);if(out.length>=4)break}return out;\n  }\n`;
  src=replaceBlock(src,'  function treeMatches(text){','  function decorateStatTree(shell){',tree,'const low=norm(text),best=new Map()','random icons dedupe tree');
  src=replaceExact(
    src,
    "const chip=document.createElement('span');chip.className='riTreeItemV01556';const img=makeImg(x.id,x.name,'small');",
    "const chip=document.createElement('span');chip.className='riTreeItemV01556';chip.dataset.itemId=String(x.id);const img=makeImg(x.id,x.name,'small');",
    'random icons tree item id'
  );
  return src;
}

function patchGlobalIcons(src){
  src=insertAfter(src,"  let catalog=null,pending=null,nameToId=new Map(),names=[],timer=0;",ITEM_RANK,'function itemIdentityRank(id,it)','global icons canonical helper');
  const setCatalog=`  function setCatalog(x){\n    catalog=x;nameToId=new Map();names=[];const best=new Map();\n    for(const [id,it] of Object.entries(catalog?.items||{})){\n      const name=norm(it?.name);if(!name)continue;const k=key(name),score=itemIdentityRank(id,it),prev=best.get(k),row={id:String(id),name,k,score};\n      if(!prev||score>prev.score||(score===prev.score&&Number(id)<Number(prev.id)))best.set(k,row);\n    }\n    for(const row of best.values()){nameToId.set(row.k,row.id);if(row.name.length>=2)names.push({id:row.id,name:row.name,k:row.k})}\n    names.sort((a,b)=>b.name.length-a.name.length||Number(a.id)-Number(b.id));\n  }\n`;
  src=replaceBlock(src,'  function setCatalog(x){','  function iconUrl(id){',setCatalog,'names=[];const best=new Map()','global icons canonical index');
  src=replaceExact(
    src,
    "    if(!id)return null;const img=document.createElement('img');img.className=`aramItemIconV01557 ${kind}`.trim();img.src=iconUrl(id);img.alt=norm(name)||'아이템';img.title=norm(name)||`Item ${id}`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;",
    "    if(!id)return null;const img=document.createElement('img');img.className=`aramItemIconV01557 ${kind}`.trim();img.dataset.itemId=String(id);img.src=iconUrl(id);img.alt=norm(name)||'아이템';img.title=norm(name)||`Item ${id}`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;",
    'global icons explicit item id'
  );
  return src;
}

function patchArtRuntime(src){
  src=insertAfter(src,"  const counters={scans:0,mutationBatches:0,imagesVisited:0,itemImagesResolved:0,primaryReady:0,fallbackReady:0,missing:0,sameAssetSkips:0};",ITEM_RANK,'function itemIdentityRank(id,it)','art runtime canonical helper');
  src=replaceExact(
    src,
    "  function setCatalog(x){catalog=x||null;nameToId=new Map();for(const [id,it] of Object.entries(catalog?.items||{})){const name=norm(it?.name);if(name)nameToId.set(key(name),String(id))}}",
    "  function setCatalog(x){catalog=x||null;nameToId=new Map();const best=new Map();for(const [id,it] of Object.entries(catalog?.items||{})){const name=norm(it?.name);if(!name)continue;const k=key(name),score=itemIdentityRank(id,it),prev=best.get(k);if(!prev||score>prev.score||(score===prev.score&&Number(id)<Number(prev.id)))best.set(k,{id:String(id),score})}for(const [k,row] of best)nameToId.set(k,row.id)}",
    'art runtime canonical index'
  );
  return src;
}

const COACH_HELPERS=`\n\n  // v0.15.80: keep build advice actionable. Do not recommend a core already visible in the local inventory,\n  // and never convert a missing gold field into a fake 0G value.\n  function ownedItemState(ctx){\n    const names=new Set(),ids=new Set(),local=ctx?.local||{},buckets=[local?.items,local?.itemIds,local?.inventory,local?.raw?.items,ctx?.localItems,ctx?.myItems];\n    const visit=v=>{if(v==null)return;if(Array.isArray(v)){v.forEach(visit);return}if(typeof v==='number'||typeof v==='string'){const m=String(v).match(/^\\d+$/);if(m)ids.add(m[0]);return}if(typeof v==='object'){const id=String(v.itemId||v.id||v.raw?.itemId||v.raw?.id||'').match(/^\\d+$/)?.[0];if(id)ids.add(id);const name=norm(v.displayName||v.name||v.itemName||v.raw?.displayName||v.raw?.name||'');if(name)names.add(aliasKey(name))}};\n    buckets.forEach(visit);return{names,ids};\n  }\n  function availableAdviceItems(advice,ctx){\n    const xs=(Array.isArray(advice?.items)?advice.items:[]).filter(x=>x?.item),owned=ownedItemState(ctx),resolver=window.aramItemArtResolverV01566||window.aramItemArtResolverV01565||window.aramItemArtResolverV01564;\n    if(!owned.names.size&&!owned.ids.size)return xs;\n    return xs.filter(x=>{if(owned.names.has(aliasKey(x.item)))return false;const direct=String(x.itemId||x.id||'').match(/^\\d+$/)?.[0];if(direct&&owned.ids.has(direct))return false;const resolved=resolver?.resolve?.(x.item)?.id;return !(resolved&&owned.ids.has(String(resolved)))})\n  }\n  function goldSnapshot(ctx){const raw=ctx?.currentGold,known=raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(Number(raw));return{known,value:known?Math.max(0,Number(raw)):0}}\n  function buildDecisionText(m){const reason=norm(m.item?.reason||m.advice?.direction||''),bits=[m.buildSame?'기본 트리 유지':'상황 대응으로 우선순위 변경'];if(reason)bits.push(reason);if(m.threat?.name&&m.threat.name!=='-'&&num(m.threat?.score)>=80)bits.push(\`최고위협 \${m.threat.name}\`);return bits.join(' · ')}`;

function patchCoach(src){
  src=insertAfter(src,"  function importantWarning(model){const a=model.alive,t=model.threat,s=model.advice?.summary||{};if(a&&a.our<a.enemy-1)return{tone:'bad',text:`수적 열세 ${a.our}:${a.enemy} · 정면 교전보다 부활 합류를 기다리기`};if(t&&!t.dead&&t.score>=88)return{tone:'bad',text:`${t.name} 최고위협 ${Math.round(t.score)} · ${t.damageType||'핵심 딜'} 대응을 최우선`};if(num(s.healPressure)>=3.4)return{tone:'warn',text:`상대 회복 위협 ${num(s.healPressure).toFixed(1)}/5 · 치감 가치 상승`};if(num(s.shieldPressure)>=3.4)return{tone:'warn',text:`상대 보호막 위협 ${num(s.shieldPressure).toFixed(1)}/5 · 보호막 대응 가치 상승`};return null}",COACH_HELPERS,'function availableAdviceItems(advice,ctx)','coach actionable helpers');
  src=replaceExact(
    src,
    "    const top=threats[0]||null,best=advice?.items?.[0]||null,stat=statBuildFor(local.name||advice?.localName||''),job=roleText(safe(typeof randomLiveLocalJob==='function'?randomLiveLocalJob:null,ctx,om),local.name||'');",
    "    const top=threats[0]||null,available=availableAdviceItems(advice,ctx),best=available[0]||null,stat=statBuildFor(local.name||advice?.localName||''),job=roleText(safe(typeof randomLiveLocalJob==='function'?randomLiveLocalJob:null,ctx,om),local.name||''),goldSnap=goldSnapshot(ctx);",
    'coach next unowned core'
  );
  src=replaceExact(
    src,
    "    const model={source:'live',life,ctx,ours,enemies,threats,advice,power,plan,local,respawn,gameTime:num(ctx.gameTime),gold:num(ctx.currentGold),alive:{our:num(aliveSnap.our?.alive),enemy:num(aliveSnap.enemy?.alive)},threat:top?{name:top.name,score:num(top.score),damageType:top.damageType||'',dead:!!top.isDead||num(top.respawnTimer)>0,respawn:Math.ceil(num(top.respawnTimer))}:{name:'-',score:0,damageType:'',dead:false,respawn:0},item:best?{name:best.item,score:num(best.score),reason:short(best.reason,100)}:{name:'-',score:0,reason:'내 보유 아이템 정보 대기'},alts:(advice?.items||[]).slice(1,3).map(x=>x.item),stat,buildSame:same,job,matchup:powerLabel(power.diff)};",
    "    const model={source:'live',life,ctx,ours,enemies,threats,advice,power,plan,local,respawn,gameTime:num(ctx.gameTime),gold:goldSnap.value,goldKnown:goldSnap.known,alive:{our:num(aliveSnap.our?.alive),enemy:num(aliveSnap.enemy?.alive)},threat:top?{name:top.name,score:num(top.score),damageType:top.damageType||'',dead:!!top.isDead||num(top.respawnTimer)>0,respawn:Math.ceil(num(top.respawnTimer))}:{name:'-',score:0,damageType:'',dead:false,respawn:0},item:best?{name:best.item,score:num(best.score),reason:short(best.reason,100)}:{name:'-',score:0,reason:'다음 미보유 코어 계산 대기'},alts:available.slice(1,3).map(x=>x.item),stat,buildSame:same,job,matchup:powerLabel(power.diff)};",
    'coach gold and unowned model'
  );
  src=replaceExact(src,"return{source:'preview',life,gameTime:742,gold:1480,respawn,alive,threat,item:","return{source:'preview',life,gameTime:742,gold:1480,goldKnown:true,respawn,alive,threat,item:",'coach preview gold known');
  const build=`  function renderBuild(m){\n    if(m.life==='waiting')return renderLive(m);\n    const source=m.stat?.source||'앱 기본 DB',basic=m.stat?.tree||'통계 기본트리 정보 없음',same=m.buildSame,alts=(m.alts||[]).filter(Boolean);\n    const goldLabel=m.goldKnown===false?'골드 데이터 확인 중':\`보유 골드 \${Math.round(num(m.gold)).toLocaleString('ko-KR')}\`;\n    const lifeLabel=m.life==='dead'?\`\${m.respawn||0}초\`:m.life==='respawn'?\`\${m.respawn||0}초\`:'LIVE';\n    const lifeGuide=m.life==='dead'?'부활까지 · 이번 상점 구매와 다음 한타 준비':m.life==='respawn'?'곧 부활 · 구매보다 다음 한타 준비':'현재 생존 · 다음 사망 구매 계획을 미리 확인';\n    const respawn=\`<div class="riRespawnStrip"><strong>\${esc(lifeLabel)}</strong><span>\${esc(lifeGuide)}</span><b>\${esc(goldLabel)}</b></div>\`;\n    const decision=buildDecisionText(m)||'현재 조합과 보유템 기준으로 다음 코어 계산 중';\n    return \`\${respawn}<div class="riBuildCompare"><div class="riBuildCard"><div class="riBuildCardHead"><span>통계 기본트리 · 참고</span><i>\${esc(m.stat?.verified?\`검증 \${m.stat.verified}\`:'BASE')}</i></div><div class="riBuildTree">\${esc(basic)}</div><div class="riBuildSub">\${esc(source)}</div></div><div class="riBuildCard opt"><div class="riBuildCardHead"><span>이번 판 최적화</span><i class="\${same?'same':''}">\${same?'기본과 일치':'상황 대응'}</i></div><div class="riBuildMain">\${esc(m.item?.name||'-')}</div><div class="riBuildSub">\${esc(short(m.item?.reason||m.advice?.direction||'',100))}</div>\${alts.length?\`<div class="riAltRow">\${alts.map(x=>\`<span class="riAltChip">대안 · \${esc(x)}</span>\`).join('')}</div>\`:''}</div></div><div class="riOneLine"><b>빌드 판단:</b> \${esc(short(decision,150))}</div><div class="riOneLine"><b>다음 한타:</b> \${esc(m.job||'-')}\${m.threat?.name&&m.threat.name!=='-'?\` · <b>\${esc(m.threat.name)}</b> 대응 우선\`:''}</div>\`;\n  }\n`;
  src=replaceBlock(src,'  function renderBuild(m){','  function detailThreats(m){',build,'통계 기본트리 · 참고','coach build decision UI');
  return src;
}

function patchShop(src){
  src=insertAfter(src,"  let catalog=null,catalogPending=null,nameToId=new Map(),timer=0;",`${ITEM_RANK}\n  function rebuildNameIndex(){nameToId=new Map();const best=new Map();for(const [id,it] of Object.entries(catalog?.items||{})){const name=norm(it?.name);if(!name)continue;const k=key(name),score=itemIdentityRank(id,it),prev=best.get(k);if(!prev||score>prev.score||(score===prev.score&&Number(id)<Number(prev.id)))best.set(k,{id:String(id),score})}for(const [k,row] of best)nameToId.set(k,row.id)}`,'function rebuildNameIndex()','shop canonical helper');
  src=replaceExact(
    src,
    "      catalog=x||null;nameToId=new Map();\n      if(catalog?.items)for(const [id,it] of Object.entries(catalog.items)){if(it?.name)nameToId.set(key(it.name),String(id))}",
    "      catalog=x||null;rebuildNameIndex();",
    'shop canonical index'
  );
  src=insertAfter(src,"    return ids.filter(id=>catalog?.items?.[id]);\n  }","\n  function inventoryKnown(ctx){const buckets=[ctx?.local?.items,ctx?.local?.itemIds,ctx?.local?.inventory,ctx?.local?.raw?.items,ctx?.localItems,ctx?.myItems];return buckets.some(v=>Array.isArray(v))}",'function inventoryKnown(ctx)','shop inventory known');
  const parse=`  function parseGold(shell){\n    const ctx=liveCtx(),raw=ctx?.currentGold,known=raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(Number(raw));\n    if(known)return{known:true,value:Math.max(0,Number(raw))};\n    const txt=$('.riRespawnStrip b',shell)?.textContent||'';const m=txt.replace(/,/g,'').match(/보유 골드\\s*(\\d+)\\s*$/);return m?{known:true,value:Number(m[1])}:{known:false,value:0};\n  }\n`;
  src=replaceBlock(src,'  function parseGold(shell){','  function targetName(shell){',parse,'return{known:true,value:Math.max(0,Number(raw))}','shop unknown gold guard');
  const should=`  function shouldShow(shell){\n    return !!$('[data-ri-tab="build"].active',shell);\n  }\n\n`;
  src=replaceBlock(src,'  function shouldShow(shell){','  function plannerHtml(',should,"return !!$('[data-ri-tab=\"build\"].active',shell)",'shop alive build visibility');
  const planner=`  function plannerHtml(target,gold,tree,basket,ownedKnown,isPreview,purchaseWindow){\n    const left=Math.max(0,Math.round(gold-basket.spent)),after=Math.max(0,Math.round(tree.remaining-basket.spent));\n    const complete=basket.items.length===1&&basket.items[0].id===tree.id&&basket.spent===tree.remaining;\n    const nextDeath=purchaseWindow==='next-death';\n    let buy='';\n    if(basket.items.length){buy=basket.items.map(x=>\`<span class="riShopItem"><b>\${esc(x.name)}</b><em>\${Math.round(x.remaining).toLocaleString('ko-KR')}G</em></span>\`).join('')}\n    else{\n      const missing=missingNodes(tree,[]).filter(x=>x.remaining>gold).sort((a,b)=>a.remaining-b.remaining)[0];\n      buy=missing?\`<span class="riShopNone">현재 골드로 구매 가능한 조합 부품 없음 · \${Math.max(0,Math.ceil(missing.remaining-gold)).toLocaleString('ko-KR')}G 더 필요</span>\`:\`<span class="riShopNone">추가 구매 없음</span>\`;\n    }\n    const badge=isPreview?'미리보기 · 보유 부품 없음 가정':ownedKnown?'보유 부품 반영':'';\n    const head=nextDeath?'💰 다음 사망 구매 계획':'💰 지금 구매';\n    const buyLabel=nextDeath?'현재 골드 기준 · 다음 사망 때 살 것':'이번 죽음에 바로 살 것';\n    return \`<div class="riShopHead"><span>\${head}\${badge?\` · \${esc(badge)}\`:''}</span><b>\${Math.round(gold).toLocaleString('ko-KR')}G 보유</b></div><div class="riShopMain"><div><div class="riShopBuyLabel">\${buyLabel}</div><div class="riShopItems">\${buy}</div></div><div class="riShopMoney"><span>\${nextDeath?'예상 구매 후 잔여':'구매 후 잔여'}</span><strong>\${left.toLocaleString('ko-KR')}G</strong></div></div><div class="riShopFoot"><span>최종 목표 · <b>\${esc(target)}</b></span><span class="\${complete?'riShopDone':''}">\${complete?(nextDeath?'다음 사망에 완성 가능':'이번 죽음에 완성 가능'):\`구매 후 코어까지 \${after.toLocaleString('ko-KR')}G\`}</span></div>\`;\n  }\n\n`;
  src=replaceBlock(src,'  function plannerHtml(','  function sync(){',planner,"const nextDeath=purchaseWindow==='next-death'",'shop alive planner');
  const sync=`  function sync(){\n    const root=$('#random'),shell=$('#riCoachShellV01550');if(!root||!shell)return;\n    ensureStyles();\n    const eyebrow=$('.riCoachTitle small',shell);if(eyebrow)eyebrow.setAttribute('aria-label',\`INGAME COACH · v\${V}\`);\n    const old=$('#riShopPlannerV01553',shell);\n    if(!shouldShow(shell)){old?.remove();return}\n    const compare=$('.riBuildCompare',shell),strip=$('.riRespawnStrip',shell);if(!compare||!strip)return;\n    let box=old;if(!box){box=document.createElement('div');box.id='riShopPlannerV01553';compare.parentElement.insertBefore(box,compare)}\n    if(!catalog?.ok){box.innerHTML='<div class="riShopWait">아이템 조합표 확인 중…</div>';if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(x=>{if(x?.ok)sync()});return}\n    const target=targetName(shell),id=findItemId(target),goldState=parseGold(shell),isPreview=shell.classList.contains('preview');\n    if(!target||target==='-'||!id){box.innerHTML='<div class="riShopWait">다음 미보유 코어가 확정되면 구매 부품을 계산합니다.</div>';return}\n    if(!isPreview&&!goldState.known){box.dataset.purchaseWindow='waiting';box.innerHTML='<div class="riShopWait">골드 데이터를 확인하는 중입니다. 데이터가 없을 때 0G로 가정하지 않습니다.</div>';return}\n    const gold=goldState.value,ctx=isPreview?null:liveCtx(),ownedIds=isPreview?[]:collectOwnedIds(ctx),ownedKnown=isPreview||inventoryKnown(ctx);\n    if(!isPreview&&!ownedKnown){box.dataset.purchaseWindow='waiting';box.innerHTML='<div class="riShopWait">현재 보유 부품을 확인하는 중입니다. 중복 구매 방지를 위해 확인 전에는 구매 지시를 숨깁니다.</div>';return}\n    const tree=buildTree(id,countOwned(ownedIds));if(!tree){box.innerHTML='<div class="riShopWait">아이템 조합표를 계산할 수 없습니다.</div>';return}\n    if(tree.owned||tree.remaining<=0){box.dataset.purchaseWindow='waiting';box.innerHTML='<div class="riShopWait">추천 코어가 이미 보유 중입니다. 다음 미보유 코어를 다시 계산합니다.</div>';return}\n    const title=norm($('#riCoachTitleV01550',shell)?.textContent||''),deadish=shell.classList.contains('ri52Dead')||title.includes('사망 분석')||title.includes('부활 준비');\n    const purchaseWindow=!isPreview&&!deadish?'next-death':'dead';box.dataset.purchaseWindow=purchaseWindow;\n    const candidates=frontier(tree,gold,[]),basket=bestBasket(candidates,gold);\n    box.innerHTML=plannerHtml(target,gold,tree,basket,ownedKnown,isPreview,purchaseWindow);\n  }\n\n`;
  src=replaceBlock(src,'  function sync(){','  function start(){',sync,"box.dataset.purchaseWindow=purchaseWindow",'shop live purchase sync');
  return src;
}

function patchShopPolish(src){
  return replaceExact(src,"    if(label&&label.textContent!=='지금 살 것')label.textContent='지금 살 것';","    if(label){const wanted=planner.dataset.purchaseWindow==='next-death'?'다음 사망 때 살 것':'지금 살 것';if(label.textContent!==wanted)label.textContent=wanted}",'shop polish dynamic label');
}

function patchRuntime70(src){
  return replaceExact(
    src,
    "    const gold=$('.riRespawnStrip b',shell),goldText=`보유 골드 ${Math.max(0,Math.floor(Number(s.currentGold)||0)).toLocaleString('ko-KR')}`;",
    "    const gold=$('.riRespawnStrip b',shell),rawGold=s.currentGold,goldKnown=rawGold!==null&&rawGold!==undefined&&rawGold!==''&&Number.isFinite(Number(rawGold)),goldText=goldKnown?`보유 골드 ${Math.max(0,Math.floor(Number(rawGold))).toLocaleString('ko-KR')}`:'골드 데이터 확인 중';",
    'runtime70 unknown gold guard'
  );
}

function patchRuntimeSource(file,code){
  let src=prior.patchRuntimeSource(file,code);
  if(file==='random-item-icons-v01556.js')src=patchRandomIcons(src);
  else if(file==='item-icons-global-v01557.js')src=patchGlobalIcons(src);
  else if(file==='item-art-runtime-v01566.js')src=patchArtRuntime(src);
  else if(file==='random-ingame-coach-v01550.js')src=patchCoach(src);
  else if(file==='random-ingame-shop-v01553.js')src=patchShop(src);
  else if(file==='random-ingame-shop-polish-v01554.js')src=patchShopPolish(src);
  else if(file==='runtime-random-ingame-v01570.js')src=patchRuntime70(src);
  return src;
}

module.exports={patchRuntimeSource,score_logic_changed:false};
