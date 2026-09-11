'use strict';
module.exports=`
  function routeOwnedCoresV01587(ctx){
    if(!buildCatalogV01581)return[];
    const owned=resolvedOwnedV01581(ctx),seen=new Set(),out=[];
    for(const id of owned.ids){
      const it=buildCatalogV01581.items?.[id];if(!it||!it.full||it.purchasable===false||it.map12!==true)continue;
      const tags=new Set(it.tags||[]);if(tags.has('Boots'))continue;
      const name=norm(it.name||'');const k=aliasKey(name);if(!name||seen.has(k))continue;seen.add(k);out.push(name);
    }
    return out.slice(0,6);
  }
  function routeProfileV01587(ctx,stat){
    const baseline=baselineCoresV01581(stat),baseSet=new Set(baseline.map(aliasKey)),cores=routeOwnedCoresV01587(ctx),off=cores.filter(n=>!baseSet.has(aliasKey(n))),tags=new Set(),classes=[];
    for(const n of cores){const it=catalogItemV01581(n);for(const t of it?.tags||[])tags.add(t);const c=itemClassV01581(n);if(c&&c!=='unknown'&&c!=='neutral')classes.push(c)}
    const counts=classes.reduce((a,c)=>(a[c]=(a[c]||0)+1,a),{}),cls=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||buildIdentityV01581(stat);
    let label='사용자 선택 루트';
    if(tags.has('AttackSpeed')&&(tags.has('OnHit')||tags.has('LifeSteal')))label='공속·온힛';
    else if(tags.has('SpellDamage')&&tags.has('Health'))label='AP 딜탱';
    else if(tags.has('CriticalStrike'))label='치명타 딜러';
    else if((tags.has('Armor')||tags.has('SpellBlock'))&&tags.has('Health')&&!tags.has('Damage')&&!tags.has('SpellDamage'))label='탱커·생존';
    else if(tags.has('Damage')&&tags.has('Health'))label='브루저';
    else if(tags.has('SpellDamage'))label='AP 화력';
    else if(tags.has('Damage'))label='AD 화력';
    return{adopted:off.length>0,baseline,cores,off,tags,cls,label};
  }
  function routeSimilarityV01587(itemName,profile){
    const it=catalogItemV01581(itemName);if(!it||!profile?.adopted)return 0;
    const tags=new Set(it.tags||[]),major=['Damage','SpellDamage','AttackSpeed','OnHit','Health','Armor','SpellBlock','LifeSteal','CriticalStrike','ArmorPenetration','SpellPenetration'];
    let score=0;for(const t of major)if(profile.tags.has(t)&&tags.has(t))score+=7;
    const cls=itemClassV01581(itemName);if(cls===profile.cls)score+=12;
    if(profile.tags.has('AttackSpeed')&&tags.has('AttackSpeed'))score+=8;
    if(profile.tags.has('OnHit')&&tags.has('OnHit'))score+=10;
    if(profile.tags.has('SpellDamage')&&tags.has('SpellDamage'))score+=8;
    if(profile.tags.has('Health')&&tags.has('Health'))score+=5;
    return Math.min(48,score);
  }
  function buildGateV01581(available,stat,ctx,threat){
    ensureBuildCatalogV01581();
    const src=(Array.isArray(available)?available:[]).filter(x=>x?.item).map((x,i)=>({...x,__v81Order:i}));
    const stage=coreStageV01581(ctx),baseline=baselineCoresV01581(stat),profile=routeProfileV01587(ctx,stat),identity=profile.adopted?profile.cls:buildIdentityV01581(stat),nextBase=profile.adopted?'':nextBaselineV01581(stat,ctx,stage),maxScore=Math.max(0,...src.map(x=>num(x.score))),urgent=num(threat?.score)>=95;
    const baseKey=aliasKey(nextBase),seen=new Set(src.map(x=>aliasKey(x.item))),owned=resolvedOwnedV01581(ctx);
    if(nextBase&&!seen.has(baseKey))src.push({item:nextBase,score:maxScore+(stage===0?20:stage===1?-30:stage===2?-25:-30),reason:stage===0?'첫 코어는 챔피언 기본 빌드 정체성을 우선':'기본 트리 진행을 유지하면서 상황 대응',__v81Order:-1,__v81Injected:true});
    const rows=src.map(x=>{
      const cls=itemClassV01581(x.item),k=aliasKey(x.item),baseIndex=baseline.findIndex(n=>aliasKey(n)===k),isNext=!!nextBase&&k===baseKey,isOwned=owned.names.has(k);
      let adj=0,blocked=isOwned,why=isOwned?'이미 보유 중':'';
      if(profile.adopted){
        const sim=routeSimilarityV01587(x.item,profile);adj+=sim;
        if(baseIndex>=0&&sim<14)adj-=10;
        why=[why,sim?`사용자 선택 ${profile.label} 시너지 +${sim}`:'현재 선택 루트와 직접 시너지 낮음'].filter(Boolean).join(' · ');
      }else{
        if(isNext)adj+=stage===0?70:stage===1?24:stage===2?8:2;else if(baseIndex>=0)adj+=stage===0?20:stage===1?10:4;
        if(identity==='damage'&&cls==='tank'){
          const p=stage===0?120:stage===1?(urgent?34:52):stage===2?(urgent?6:18):0;adj-=p;why=[why,p?('초반 순수 탱 전환 -'+p):''].filter(Boolean).join(' · ');if(stage===0&&nextBase)blocked=true;
        }else if(identity==='tank'&&cls==='damage'){
          const p=stage===0?90:stage===1?42:stage===2?14:0;adj-=p;why=[why,p?('초반 유리대포 전환 -'+p):''].filter(Boolean).join(' · ');if(stage===0&&nextBase)blocked=true;
        }else if(identity==='support'&&cls==='tank'&&!isNext&&stage===0){adj-=35;why=[why,'초반 서포트 코어 이탈 -35'].filter(Boolean).join(' · ')}
      }
      const score=num(x.score)+adj,reason=[norm(x.reason||''),why].filter(Boolean).join(' · ');
      return{...x,score,reason,__v81Score:score,__v81Class:cls,__v81Blocked:blocked,__v81Stage:stage,__v81Identity:identity,__v87RouteAdopted:profile.adopted,__v87RouteLabel:profile.label};
    });
    let pool=rows.filter(x=>!x.__v81Blocked);if(!pool.length)pool=rows;
    pool.sort((a,b)=>num(b.__v81Score)-num(a.__v81Score)||(a.__v81Order-b.__v81Order));
    return pool;
  }
`;
