'use strict';
const vm=require('vm');const L=require('./lib');const identity=require('../../src/items/identity');const recommendation=require('../../src/items/recommendation');
const norm=s=>String(s??'').replace(/\s+/g,' ').trim(),num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d,aliasKey=s=>norm(s).toLowerCase();
function json(v){return JSON.stringify(v,(k,x)=>x instanceof Set?[...x].sort():x instanceof Map?[...x.entries()].sort():x)}
function legacyIdentity(){
  const v80=require('../../update/v0.15.80/runtime-source-stability-v01580'),base=L.read('update/v0.15.73/random-item-icons-v01556.js'),src=v80.patchRuntimeSource('random-item-icons-v01556.js',base),start=src.indexOf('function itemIdentityRank(id,it)'),end=src.indexOf('function rebuildNameIndex()',start);L.must(start>=0&&end>start,'could not isolate legacy itemIdentityRank');const window={},context={window,Number,Math,Object,Array,Set,Map};vm.runInNewContext(src.slice(start,end)+'\nwindow.rank=itemIdentityRank;',context);return window.rank;
}
function legacyRecommendation(){
  const v81=require('../../update/v0.15.81/runtime-source-stability-v01581'),base=L.read('update/v0.15.50/random-ingame-coach-v01550.js'),src=v81.patchRuntimeSource('random-ingame-coach-v01550.js',base),start=src.indexOf('function ownedItemState(ctx)'),end=src.indexOf('function buildRealModel(){',start);L.must(start>=0&&end>start,'could not isolate legacy item recommendation helpers');const window={aramDesktop:null},context={window,norm,num,aliasKey,render:()=>{},console,Promise,Map,Set,Object,Array,Math,Number,String};const expose='\nwindow.api={ownedItemState,availableAdviceItems,goldSnapshot,rebuildBuildCatalogV01581,baselineCoresV01581,catalogItemV01581,itemClassV01581,inventoryTokensV01581,resolvedOwnedV01581,coreStageV01581,buildIdentityV01581,nextBaselineV01581,buildGateV01581};';vm.runInNewContext(src.slice(start,end)+expose,context);return window.api;
}
const rank=legacyIdentity();
const rankFixtures=[['3001',{map12:true,purchasable:true,standardLiveId:true,full:true}],['13001',{map12:true,purchasable:true,standardLiveId:false,full:true}],['99999',{map12:false,purchasable:false,standardLiveId:false,full:false}],['6655',{map12:true,purchasable:true,full:true}]];
for(const [id,it] of rankFixtures)L.must(rank(id,it)===identity.itemIdentityRank(id,it),`item identity rank drift ${id}`);
const catalog={ok:true,items:{
  '3001':{name:'태양불꽃 방패',map12:true,purchasable:true,standardLiveId:true,full:true,tags:['Health','Armor']},
  '13001':{name:'태양불꽃 방패',map12:true,purchasable:true,standardLiveId:false,full:true,tags:['Health','Armor']},
  '6655':{name:'루덴의 동반자',map12:true,purchasable:true,standardLiveId:true,full:true,tags:['SpellDamage','SpellPenetration']},
  '3075':{name:'가시 갑옷',map12:true,purchasable:true,standardLiveId:true,full:true,tags:['Health','Armor']},
  '3089':{name:'라바돈의 죽음모자',map12:true,purchasable:true,standardLiveId:true,full:true,tags:['SpellDamage']},
  '6617':{name:'흐르는 물의 지팡이',map12:true,purchasable:true,standardLiveId:true,full:true,tags:['ManaRegen','HealAndShieldPower']},
  '3020':{name:'마법사의 신발',map12:true,purchasable:true,standardLiveId:true,full:true,tags:['Boots','SpellPenetration']}
}};
const idx=identity.buildCanonicalNameIndex(catalog,{norm,key:aliasKey});L.must(idx.nameToId.get(aliasKey('태양불꽃 방패'))==='3001','canonical item name collision did not prefer live standard ID');
const old=legacyRecommendation(),next=recommendation.createRecommendationEngine({norm,num,aliasKey});old.rebuildBuildCatalogV01581(catalog);next.rebuildCatalog(catalog);
for(const tree of ['루덴의 동반자 → 라바돈의 죽음모자 → 가시 갑옷','가시 갑옷 > 태양불꽃 방패 > 흐르는 물의 지팡이','흐르는 물의 지팡이, 가시 갑옷'])L.must(json(old.baselineCoresV01581({tree}))===json(next.baselineCores({tree})),`baseline cores drift ${tree}`);
for(const item of ['루덴의 동반자','가시 갑옷','태양불꽃 방패','흐르는 물의 지팡이','6655','unknown'])L.must(old.itemClassV01581(item)===next.itemClass(item),`item class drift ${item}`);
const ctxs=[
  {local:{items:[{itemID:6655,name:'루덴의 동반자'}]},currentGold:1430},
  {local:{itemIds:[3075,3020]},myItems:[{id:3001,name:'태양불꽃 방패'}]},currentGold:null},
  {local:{inventory:['루덴의 동반자',{itemId:'3089',displayName:'라바돈의 죽음모자'}]},currentGold:'975'}
];
for(const [i,ctx] of ctxs.entries()){
  L.must(json(old.inventoryTokensV01581(ctx))===json(next.inventoryTokens(ctx)),`inventory token drift ${i}`);
  L.must(json(old.resolvedOwnedV01581(ctx))===json(next.resolvedOwned(ctx)),`resolved owned drift ${i}`);
  L.must(old.coreStageV01581(ctx)===next.coreStage(ctx),`core stage drift ${i}`);
  L.must(json(old.goldSnapshot(ctx))===json(next.goldSnapshot(ctx)),`gold snapshot drift ${i}`);
}
const stats=[{tree:'루덴의 동반자 → 라바돈의 죽음모자 → 가시 갑옷'},{tree:'가시 갑옷 → 태양불꽃 방패 → 라바돈의 죽음모자'},{tree:'흐르는 물의 지팡이 → 흐르는 물의 지팡이 → 가시 갑옷'}];
for(const stat of stats){L.must(old.buildIdentityV01581(stat)===next.buildIdentity(stat),`build identity drift ${stat.tree}`);for(const ctx of ctxs)L.must(old.nextBaselineV01581(stat,ctx,old.coreStageV01581(ctx))===next.nextBaseline(stat,ctx,next.coreStage(ctx)),`next baseline drift ${stat.tree}`)}
const available=[{item:'가시 갑옷',score:92,reason:'물리 대응'},{item:'루덴의 동반자',score:88,reason:'딜 코어'},{item:'라바돈의 죽음모자',score:80,reason:'AP 증폭'},{item:'태양불꽃 방패',score:76,reason:'앞라인'}];
const gateCases=[{stat:stats[0],ctx:{local:{items:[]}},threat:{score:80}},{stat:stats[0],ctx:ctxs[0],threat:{score:98}},{stat:stats[1],ctx:ctxs[1],threat:{score:60}}];
for(const [i,c] of gateCases.entries())L.must(json(old.buildGateV01581(available,c.stat,c.ctx,c.threat))===json(next.buildGate(available,c.stat,c.ctx,c.threat)),`recommendation gate drift ${i}`);
const advice={items:[{item:'루덴의 동반자',itemId:6655},{item:'가시 갑옷',itemId:3075},{item:'라바돈의 죽음모자',itemId:3089}]},resolver={resolve:n=>({id:catalog.items['6655'].name===n?'6655':catalog.items['3075'].name===n?'3075':catalog.items['3089'].name===n?'3089':null})};
for(const [i,ctx] of ctxs.entries())L.must(json(old.availableAdviceItems(advice,ctx,resolver))===json(next.availableAdviceItems(advice,ctx,resolver)),`available advice drift ${i}`);
L.must(identity.production_active===false&&recommendation.production_active===false&&identity.score_logic_changed===false&&recommendation.score_logic_changed===false,'item canonical shadows must remain inactive/scoring-neutral');
const report={status:'SUCCESS',production_active:false,identity_fixtures:rankFixtures.length,recommendation_gate_fixtures:gateCases.length,inventory_fixtures:ctxs.length,semantic_contract:['v0.15.80 live item identity rank','name collision prefers canonical live ID','v0.15.80 owned-item filtering and gold-known semantics','v0.15.81 baseline build identity','v0.15.81 core-stage gating','v0.15.81 recommendation ordering/reasons'],scoring_changed:false,item_recommendation_logic_changed:false,cutover_allowed:false};L.write('audit-output/stability/item-canonical-differential.json',report);console.log('ITEM CANONICAL DIFFERENTIAL: SUCCESS · identity/owned-item/recommendation semantics preserved');
