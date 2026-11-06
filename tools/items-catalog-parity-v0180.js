'use strict';
const assert=require('assert');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const legacy=require(path.join(ROOT,'update/v0.15.64/item-catalog-v01527.js'));
const canonical=require(path.join(ROOT,'src/items/catalog-service.js'));
function stripTime(v){const x=JSON.parse(JSON.stringify(v));delete x.loadedAt;return x}
const data={data:{
  '1001':{name:'Boots',gold:{total:300,base:300,sell:210,purchasable:true},maps:{'12':true},tags:['Boots'],depth:1},
  '3001':{name:'Final Blade',gold:{total:3100,base:900,sell:2170,purchasable:true},maps:{'12':true},tags:['Damage'],depth:3,from:['1001']},
  '13001':{name:'Legacy Alternate',gold:{total:3200,base:3200,sell:2200,purchasable:true},maps:{'12':true},tags:['Damage'],depth:3},
  '2003':{name:'Health Potion',gold:{total:50,base:50,sell:20,purchasable:true},maps:{'12':true},tags:['Consumable'],depth:1}
}};
const community=[{id:3001,iconPath:'/game/assets/items/icons2d/3001_test.png'},{id:13001,iconPath:'/game/assets/items/icons2d/13001_test.png'}];
const legacyPrimary=legacy.communityIconMap(community),legacyFallback=legacy.communityFallbackMap(community);
const canonicalPrimary=canonical.communityIconMap(community),canonicalFallback=canonical.communityFallbackMap(community);
assert.deepStrictEqual(canonicalPrimary,legacyPrimary,'current-game icon mapping changed');
assert.deepStrictEqual(canonicalFallback,legacyFallback,'client-plugin fallback mapping changed');
const before=stripTime(legacy.compact('99.1.2',data,legacyPrimary,legacyFallback));
const after=stripTime(canonical.createCatalogService({now:()=>123}).compact('99.1.2',data,canonicalPrimary,canonicalFallback));
assert.deepStrictEqual(after,before,'canonical item catalog compact output changed');
for(const id of [1,9999,10000,13001,'3001','bad'])assert.strictEqual(canonical.isStandardLiveItemId(id),legacy.isStandardLiveItemId(id),`standard live item classification changed: ${id}`);
function fakeIpc(){const calls=[];return{calls,handle:(channel,fn)=>calls.push({channel,fn})}}
const ipcLegacy=fakeIpc(),ipcCanonical=fakeIpc();
legacy.register(ipcLegacy);
const service=canonical.createCatalogService(),canonicalReturn=service.register(ipcCanonical),canonicalSecond=service.register(ipcCanonical);
assert.strictEqual(canonicalReturn,true,'canonical first registration must explicitly claim ownership');
assert.strictEqual(canonicalSecond,false,'canonical repeated registration must explicitly report no-op');
assert.deepStrictEqual(ipcCanonical.calls.map(x=>x.channel),ipcLegacy.calls.map(x=>x.channel),'catalog IPC channel changed');
assert.strictEqual(ipcCanonical.calls.length,ipcLegacy.calls.length,'catalog IPC registration count changed');
assert.strictEqual(ipcCanonical.calls.length,1,'canonical catalog registered duplicate IPC handlers');
assert.strictEqual(typeof ipcCanonical.calls[0]?.fn,'function','canonical catalog IPC handler missing');
assert.strictEqual(canonical.production_capable,true,'canonical catalog must be production-capable after parity lock');
assert.strictEqual(canonical.production_active,false,'whole item owner must remain inactive until cutover');
console.log(JSON.stringify({status:'PASS',owner:canonical.OWNER,compactParity:true,iconParity:true,classificationParity:true,ipcRegistrationParity:true,explicitOwnerClaim:true,productionActive:false}));
