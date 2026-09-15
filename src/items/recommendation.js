'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const defaultNorm=s=>String(s??'').replace(/\s+/g,' ').trim();
const defaultNum=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const defaultAliasKey=s=>defaultNorm(s).toLowerCase();
function createRecommendationEngine({norm=defaultNorm,num=defaultNum,aliasKey=defaultAliasKey}={}){
  let catalog=null,catalogName=new Map();
  function rebuildCatalog(x){
    catalog=x?.ok?x:null;catalogName=new Map();const best=new Map();
    for(const [id,it] of Object.entries(catalog?.items||{})){
      const name=norm(it?.name);if(!name)continue;const k=aliasKey(name),live=(it?.map12===true?100:0)+(it?.purchasable!==false?30:0)+(it?.standardLiveId===true?20:0)+(it?.full===true?5:0),p=best.get(k);
      if(!p||live>p.live||(live===p.live&&Number(id)<Number(p.id)))best.set(k,{id:String(id),it,live});
    }
    for(const [k,row] of best)catalogName.set(k,row);return catalog;
  }
  function baselineCores(stat){return norm(stat?.tree||'').split(/\s*(?:→|>|›|»|,|\/\/|\n)\s*/).map(norm).filter(x=>x&&x.length>1).slice(0,6)}
  function catalogRowByName(name){return catalogName.get(aliasKey(name))||null}
  function catalogItem(idOrName){const id=String(idOrName??'').match(/^\d+$/)?.[0];if(id&&catalog?.items?.[id])return catalog.items[id];return catalogRowByName(idOrName)?.it||null}
  function itemClass(idOrName){
    const it=catalogItem(idOrName);if(!it)return'unknown';const tags=new Set(Array.isArray(it.tags)?it.tags:[]);
    const def=['Health','Armor','SpellBlock'].reduce((a,k)=>a+(tags.has(k)?1:0),0),off=['Damage','SpellDamage','CriticalStrike','AttackSpeed','LifeSteal','ArmorPenetration','SpellPenetration','OnHit'].reduce((a,k)=>a+(tags.has(k)?1:0),0),support=['ManaRegen','HealAndShieldPower'].reduce((a,k)=>a+(tags.has(k)?1:0),0);
    if(def>0&&off===0&&support===0)return'tank';if(def>0&&off>0)return'hybrid';if(off>0)return'damage';if(support>0)return'support';return'neutral';
  }
  function inventoryTokens(ctx){
    const ids=new Set(),names=new Set(),local=ctx?.local||{},buckets=[local?.items,local?.itemIds,local?.inventory,local?.raw?.items,ctx?.localItems,ctx?.myItems];
    const visit=v=>{if(v==null)return;if(Array.isArray(v)){v.forEach(visit);return}if(typeof v==='number'||typeof v==='string'){const s=String(v),id=s.match(/^\d+$/)?.[0];if(id)ids.add(id);else if(norm(s))names.add(aliasKey(s));return}if(typeof v==='object'){const id=String(v.itemId||v.id||v.raw?.itemId||v.raw?.id||'').match(/^\d+$/)?.[0];if(id)ids.add(id);const name=norm(v.displayName||v.name||v.itemName||v.raw?.displayName||v.raw?.name||'');if(name)names.add(aliasKey(name))}};
    buckets.forEach(visit);return{ids,names};
  }
  function resolvedOwned(ctx){
    const raw=inventoryTokens(ctx),ids=new Set(raw.ids),names=new Set(raw.names);if(catalog){for(const id of ids){const name=norm(catalog.items?.[id]?.name);if(name)names.add(aliasKey(name))}for(const name of [...names]){const row=catalogName.get(name);if(row?.id)ids.add(row.id)}}return{ids,names};
  }
  function coreStage(ctx){if(!catalog)return 0;const owned=resolvedOwned(ctx),seen=new Set();let count=0;for(const id of owned.ids){const it=catalog.items?.[id];if(!it||!it.full||it.purchasable===false||it.map12!==true)continue;const tags=new Set(it.tags||[]);if(tags.has('Boots'))continue;const k=aliasKey(it.name||id);if(seen.has(k))continue;seen.add(k);count++}return Math.min(6,count)}
  function buildIdentity(stat){const base=baselineCores(stat),classes=base.slice(0,3).map(itemClass).filter(x=>x!=='unknown'&&x!=='neutral');if(classes[0]==='tank'&&classes.filter(x=>x==='tank').length>=Math.min(2,classes.length||2))return'tank';if(classes[0]==='support'||classes.filter(x=>x==='support').length>=2)return'support';return'damage'}
  function nextBaseline(stat,ctx,stage){const base=baselineCores(stat);if(!base.length)return'';const owned=resolvedOwned(ctx),isOwned=name=>owned.names.has(aliasKey(name)),start=Math.min(Math.max(0,stage),Math.max(0,base.length-1));return base.slice(start).find(x=>!isOwned(x))||base.find(x=>!isOwned(x))||''}
  function buildGate(available,stat,ctx,threat){
    const src=(Array.isArray(available)?available:[]).filter(x=>x?.item).map((x,i)=>({...x,__v81Order:i})),stage=coreStage(ctx),identity=buildIdentity(stat),baseline=baselineCores(stat),nextBase=nextBaseline(stat,ctx,stage),maxScore=Math.max(0,...src.map(x=>num(x.score))),urgent=num(threat?.score)>=95,baseKey=aliasKey(nextBase),seen=new Set(src.map(x=>aliasKey(x.item)));
    if(nextBase&&!seen.has(baseKey))src.push({item:nextBase,score:maxScore+(stage===0?20:stage===1?-30:stage===2?-25:-30),reason:stage===0?'첫 코어는 챔피언 기본 빌드 정체성을 우선':'기본 트리 진행을 유지하면서 상황 대응',__v81Order:-1,__v81Injected:true});
    const rows=src.map(x=>{const cls=itemClass(x.item),k=aliasKey(x.item),baseIndex=baseline.findIndex(n=>aliasKey(n)===k),isNext=!!nextBase&&k===baseKey;let adj=0,blocked=false,why='';if(isNext)adj+=stage===0?70:stage===1?24:stage===2?8:2;else if(baseIndex>=0)adj+=stage===0?20:stage===1?10:4;if(identity==='damage'&&cls==='tank'){const p=stage===0?120:stage===1?(urgent?34:52):stage===2?(urgent?6:18):0;adj-=p;why=p?('초반 순수 탱 전환 -'+p):'';if(stage===0&&nextBase)blocked=true}else if(identity==='tank'&&cls==='damage'){const p=stage===0?90:stage===1?42:stage===2?14:0;adj-=p;why=p?('초반 유리대포 전환 -'+p):'';if(stage===0&&nextBase)blocked=true}else if(identity==='support'&&cls==='tank'&&!isNext&&stage===0){adj-=35;why='초반 서포트 코어 이탈 -35'}const score=num(x.score)+adj,reason=[norm(x.reason||''),why].filter(Boolean).join(' · ');return{...x,score,reason,__v81Score:score,__v81Class:cls,__v81Blocked:blocked,__v81Stage:stage,__v81Identity:identity}});let pool=rows.filter(x=>!x.__v81Blocked);if(!pool.length)pool=rows;pool.sort((a,b)=>num(b.__v81Score)-num(a.__v81Score)||(a.__v81Order-b.__v81Order));return pool;
  }
  function ownedItemState(ctx){const names=new Set(),ids=new Set(),local=ctx?.local||{},buckets=[local?.items,local?.itemIds,local?.inventory,local?.raw?.items,ctx?.localItems,ctx?.myItems];const visit=v=>{if(v==null)return;if(Array.isArray(v)){v.forEach(visit);return}if(typeof v==='number'||typeof v==='string'){const m=String(v).match(/^\d+$/);if(m)ids.add(m[0]);return}if(typeof v==='object'){const id=String(v.itemId||v.id||v.raw?.itemId||v.raw?.id||'').match(/^\d+$/)?.[0];if(id)ids.add(id);const name=norm(v.displayName||v.name||v.itemName||v.raw?.displayName||v.raw?.name||'');if(name)names.add(aliasKey(name))}};buckets.forEach(visit);return{names,ids}}
  function availableAdviceItems(advice,ctx,resolver){const xs=(Array.isArray(advice?.items)?advice.items:[]).filter(x=>x?.item),owned=ownedItemState(ctx);if(!owned.names.size&&!owned.ids.size)return xs;return xs.filter(x=>{if(owned.names.has(aliasKey(x.item)))return false;const direct=String(x.itemId||x.id||'').match(/^\d+$/)?.[0];if(direct&&owned.ids.has(direct))return false;const resolved=resolver?.resolve?.(x.item)?.id;return !(resolved&&owned.ids.has(String(resolved)))})}
  function goldSnapshot(ctx){const raw=ctx?.currentGold,known=raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(Number(raw));return{known,value:known?Math.max(0,Number(raw)):0}}
  return{rebuildCatalog,getCatalog:()=>catalog,baselineCores,catalogRowByName,catalogItem,itemClass,inventoryTokens,resolvedOwned,coreStage,buildIdentity,nextBaseline,buildGate,ownedItemState,availableAdviceItems,goldSnapshot};
}
module.exports={IMPLEMENTATION_VERSION,createRecommendationEngine,production_active:false,score_logic_changed:false,random_scoring_changed:false,item_recommendation_logic_changed:false};
