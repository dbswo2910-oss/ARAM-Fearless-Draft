'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01580')}catch{prior=require('../v0.15.80/runtime-source-stability-v01580')}

function countOf(src,needle){return String(src).split(needle).length-1}
function replaceExact(src,oldText,newText,label){
  if(src.includes(newText))return src;
  const n=countOf(src,oldText);
  if(n!==1)throw new Error(`v0.15.81 source contract mismatch ${label} count=${n}`);
  return src.replace(oldText,newText);
}
function insertBefore(src,anchor,text,signature,label){
  if(src.includes(signature))return src;
  const n=countOf(src,anchor);
  if(n!==1)throw new Error(`v0.15.81 source contract mismatch ${label} count=${n}`);
  return src.replace(anchor,text+anchor);
}

const COACH_GATE = `

  // v0.15.81 Item Recommendation Engine v2.
  // Global policy: early cores preserve the champion's statistical build identity first,
  // while pure defensive/offensive role deviations become progressively available later.
  let buildCatalogV01581=null,buildCatalogPendingV01581=null,buildCatalogNameV01581=new Map();
  function rebuildBuildCatalogV01581(x){
    buildCatalogV01581=x?.ok?x:null;buildCatalogNameV01581=new Map();const best=new Map();
    for(const [id,it] of Object.entries(buildCatalogV01581?.items||{})){
      const name=norm(it?.name);if(!name)continue;const k=aliasKey(name),live=(it?.map12===true?100:0)+(it?.purchasable!==false?30:0)+(it?.standardLiveId===true?20:0)+(it?.full===true?5:0),p=best.get(k);
      if(!p||live>p.live||(live===p.live&&Number(id)<Number(p.id)))best.set(k,{id:String(id),it,live});
    }
    for(const [k,row] of best)buildCatalogNameV01581.set(k,row);
  }
  function ensureBuildCatalogV01581(){
    if(buildCatalogV01581||buildCatalogPendingV01581)return;
    const fn=window.aramDesktop?.getItemCatalog;if(typeof fn!=='function')return;
    buildCatalogPendingV01581=Promise.resolve(fn()).then(x=>{rebuildBuildCatalogV01581(x);buildCatalogPendingV01581=null;try{render(true)}catch{}}).catch(()=>{buildCatalogPendingV01581=null});
  }
  function baselineCoresV01581(stat){
    return norm(stat?.tree||'').split(/\\s*(?:→|>|›|»|,|\\/\\/|\\n)\\s*/).map(norm).filter(x=>x&&x.length>1).slice(0,6);
  }
  function catalogRowByNameV01581(name){return buildCatalogNameV01581.get(aliasKey(name))||null}
  function catalogItemV01581(idOrName){
    const id=String(idOrName??'').match(/^\\d+$/)?.[0];
    if(id&&buildCatalogV01581?.items?.[id])return buildCatalogV01581.items[id];
    return catalogRowByNameV01581(idOrName)?.it||null;
  }
  function itemClassV01581(idOrName){
    const it=catalogItemV01581(idOrName);if(!it)return'unknown';
    const tags=new Set(Array.isArray(it.tags)?it.tags:[]);
    const def=['Health','Armor','SpellBlock'].reduce((a,k)=>a+(tags.has(k)?1:0),0);
    const off=['Damage','SpellDamage','CriticalStrike','AttackSpeed','LifeSteal','ArmorPenetration','SpellPenetration','OnHit'].reduce((a,k)=>a+(tags.has(k)?1:0),0);
    const support=['ManaRegen','HealAndShieldPower'].reduce((a,k)=>a+(tags.has(k)?1:0),0);
    if(def>0&&off===0&&support===0)return'tank';
    if(def>0&&off>0)return'hybrid';
    if(off>0)return'damage';
    if(support>0)return'support';
    return'neutral';
  }
  function inventoryTokensV01581(ctx){
    const ids=new Set(),names=new Set(),local=ctx?.local||{},buckets=[local?.items,local?.itemIds,local?.inventory,local?.raw?.items,ctx?.localItems,ctx?.myItems];
    const visit=v=>{if(v==null)return;if(Array.isArray(v)){v.forEach(visit);return}if(typeof v==='number'||typeof v==='string'){const s=String(v),id=s.match(/^\\d+$/)?.[0];if(id)ids.add(id);else if(norm(s))names.add(aliasKey(s));return}if(typeof v==='object'){const id=String(v.itemId||v.id||v.raw?.itemId||v.raw?.id||'').match(/^\\d+$/)?.[0];if(id)ids.add(id);const name=norm(v.displayName||v.name||v.itemName||v.raw?.displayName||v.raw?.name||'');if(name)names.add(aliasKey(name))}};
    buckets.forEach(visit);return{ids,names};
  }
  function resolvedOwnedV01581(ctx){
    const raw=inventoryTokensV01581(ctx),ids=new Set(raw.ids),names=new Set(raw.names);
    if(buildCatalogV01581){
      for(const id of ids){const name=norm(buildCatalogV01581.items?.[id]?.name);if(name)names.add(aliasKey(name))}
      for(const name of [...names]){const row=buildCatalogNameV01581.get(name);if(row?.id)ids.add(row.id)}
    }
    return{ids,names};
  }
  function coreStageV01581(ctx){
    if(!buildCatalogV01581)return 0;
    const owned=resolvedOwnedV01581(ctx),seen=new Set();let count=0;
    for(const id of owned.ids){const it=buildCatalogV01581.items?.[id];if(!it||!it.full||it.purchasable===false||it.map12!==true)continue;const tags=new Set(it.tags||[]);if(tags.has('Boots'))continue;const k=aliasKey(it.name||id);if(seen.has(k))continue;seen.add(k);count++}
    return Math.min(6,count);
  }
  function buildIdentityV01581(stat){
    const base=baselineCoresV01581(stat),classes=base.slice(0,3).map(itemClassV01581).filter(x=>x!=='unknown'&&x!=='neutral');
    if(classes[0]==='tank'&&classes.filter(x=>x==='tank').length>=Math.min(2,classes.length||2))return'tank';
    if(classes[0]==='support'||classes.filter(x=>x==='support').length>=2)return'support';
    return'damage';
  }
  function nextBaselineV01581(stat,ctx,stage){
    const base=baselineCoresV01581(stat);if(!base.length)return'';
    const owned=resolvedOwnedV01581(ctx),isOwned=name=>owned.names.has(aliasKey(name));
    const start=Math.min(Math.max(0,stage),Math.max(0,base.length-1));
    return base.slice(start).find(x=>!isOwned(x))||base.find(x=>!isOwned(x))||'';
  }
  function buildGateV01581(available,stat,ctx,threat){
    ensureBuildCatalogV01581();
    const src=(Array.isArray(available)?available:[]).filter(x=>x?.item).map((x,i)=>({...x,__v81Order:i}));
    const stage=coreStageV01581(ctx),identity=buildIdentityV01581(stat),baseline=baselineCoresV01581(stat),nextBase=nextBaselineV01581(stat,ctx,stage),maxScore=Math.max(0,...src.map(x=>num(x.score)));
    const urgent=num(threat?.score)>=95;
    const baseKey=aliasKey(nextBase),seen=new Set(src.map(x=>aliasKey(x.item)));
    if(nextBase&&!seen.has(baseKey)){
      src.push({item:nextBase,score:maxScore+(stage===0?20:stage===1?-30:stage===2?-25:-30),reason:stage===0?'첫 코어는 챔피언 기본 빌드 정체성을 우선':'기본 트리 진행을 유지하면서 상황 대응',__v81Order:-1,__v81Injected:true});
    }
    const rows=src.map(x=>{
      const cls=itemClassV01581(x.item),k=aliasKey(x.item),baseIndex=baseline.findIndex(n=>aliasKey(n)===k),isNext=!!nextBase&&k===baseKey;
      let adj=0,blocked=false,why='';
      if(isNext)adj+=stage===0?70:stage===1?24:stage===2?8:2;
      else if(baseIndex>=0)adj+=stage===0?20:stage===1?10:4;
      if(identity==='damage'&&cls==='tank'){
        const p=stage===0?120:stage===1?(urgent?34:52):stage===2?(urgent?6:18):0;adj-=p;why=p?('초반 순수 탱 전환 -'+p):'';
        if(stage===0&&nextBase)blocked=true;
      }else if(identity==='tank'&&cls==='damage'){
        const p=stage===0?90:stage===1?42:stage===2?14:0;adj-=p;why=p?('초반 유리대포 전환 -'+p):'';
        if(stage===0&&nextBase)blocked=true;
      }else if(identity==='support'&&cls==='tank'&&!isNext&&stage===0){
        adj-=35;why='초반 서포트 코어 이탈 -35';
      }
      const score=num(x.score)+adj;
      const reason=[norm(x.reason||''),why].filter(Boolean).join(' · ');
      return{...x,score,reason,__v81Score:score,__v81Class:cls,__v81Blocked:blocked,__v81Stage:stage,__v81Identity:identity};
    });
    let pool=rows.filter(x=>!x.__v81Blocked);
    if(!pool.length)pool=rows;
    pool.sort((a,b)=>num(b.__v81Score)-num(a.__v81Score)||(a.__v81Order-b.__v81Order));
    return pool;
  }
`;

function patchCoach(src){
  src=insertBefore(src,'\n\n  function buildRealModel(){',COACH_GATE,'function buildGateV01581(available,stat,ctx,threat)','coach item recommendation gate');
  const oldLine="    const top=threats[0]||null,available=availableAdviceItems(advice,ctx),best=available[0]||null,stat=statBuildFor(local.name||advice?.localName||''),job=roleText(safe(typeof randomLiveLocalJob==='function'?randomLiveLocalJob:null,ctx,om),local.name||''),goldSnap=goldSnapshot(ctx);";
  const newLine="    const top=threats[0]||null,stat=statBuildFor(local.name||advice?.localName||''),job=roleText(safe(typeof randomLiveLocalJob==='function'?randomLiveLocalJob:null,ctx,om),local.name||''),goldSnap=goldSnapshot(ctx),available=availableAdviceItems(advice,ctx),ranked=buildGateV01581(available,stat,ctx,top),best=ranked[0]||null;";
  src=replaceExact(src,oldLine,newLine,'coach gated recommendation');
  src=replaceExact(src,"alts:available.slice(1,3).map(x=>x.item)","alts:ranked.slice(1,3).map(x=>x.item)",'coach gated alternatives');
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=patchCoach(src);
  return src;
}

module.exports={patchRuntimeSource,score_logic_changed:false,item_recommendation_logic_changed:true,policy_version:'0.15.81'};
