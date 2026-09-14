'use strict';
const L=require('./lib');
const legacy=require('../../update/v0.15.64/item-catalog-v01527');
const canonical=require('../../src/items/catalog-service');
const FIXED_NOW=1778888888888;
const community=[
  {id:6655,iconPath:'/lol-game-data/assets/ASSETS/Items/Icons2D/6655_Ludens_Companion.png'},
  {id:13001,iconPath:'/lol-game-data/assets/ASSETS/Items/Icons2D/3001_SunfireCape.png'},
  {id:'bad',iconPath:'/ignore.png'}
];
const ddragon={data:{
  '6655':{name:'루덴의 동반자',gold:{total:2850,base:850,sell:1995,purchasable:true},maps:{'12':true},tags:['SpellDamage'],depth:3,from:['1026'],into:[]},
  '3001':{name:'태양불꽃 방패',gold:{total:2700,base:700,sell:1890,purchasable:true},maps:{'12':true},tags:['Health','Armor'],depth:3,from:['1028'],into:[]},
  '13001':{name:'태양불꽃 방패',gold:{total:2700,base:700,sell:1890,purchasable:true},maps:{'12':true},tags:['Health','Armor'],depth:3,from:['1028'],into:[]},
  '2003':{name:'체력 물약',gold:{total:50,base:50,sell:20,purchasable:true},maps:{'12':true},tags:['Consumable'],depth:1,into:[]},
  '3075':{name:'가시 갑옷',gold:{total:2450,base:650,sell:1715,purchasable:true},maps:{'12':true},tags:['Health','Armor'],depth:3,from:['1031'],into:[]},
  '99999':{name:'실험 아이템',gold:{total:2500,base:2500,sell:0,purchasable:true},maps:{'12':false},tags:[],depth:3,into:[]}
}};
function clean(x){return JSON.parse(JSON.stringify(x))}
const service=canonical.createCatalogService({now:()=>FIXED_NOW});
for(const row of community){if(!Number(row.id))continue;L.must(legacy.currentGameIconUrl(row.iconPath)===service.currentGameIconUrl(row.iconPath),`current icon URL drift ${row.id}`);L.must(legacy.clientPluginIconUrl(row.iconPath)===service.clientPluginIconUrl(row.iconPath),`plugin icon URL drift ${row.id}`)}
L.must(JSON.stringify(legacy.communityIconMap(community))===JSON.stringify(service.communityIconMap(community)),'community icon map drift');
L.must(JSON.stringify(legacy.communityFallbackMap(community))===JSON.stringify(service.communityFallbackMap(community)),'community fallback map drift');
for(const id of ['1','6655','9999','10000','13001','99999','x'])L.must(legacy.isStandardLiveItemId(id)===service.isStandardLiveItemId(id),`standard-live-id drift ${id}`);
const current=service.communityIconMap(community),plugin=service.communityFallbackMap(community);
const originalNow=Date.now;let oldCompact;try{Date.now=()=>FIXED_NOW;oldCompact=legacy.compact('16.18.1',ddragon,current,plugin)}finally{Date.now=originalNow}
const nextCompact=service.compact('16.18.1',ddragon,current,plugin);L.must(JSON.stringify(clean(oldCompact))===JSON.stringify(clean(nextCompact)),'active v0.15.64 compact catalog semantics drift');
L.must(nextCompact.items['6655'].iconPrimaryUrl.includes('raw.communitydragon.org/latest/game/assets/items/icons2d/'),'current-game primary icon semantics drift');L.must(nextCompact.items['3001'].iconFallbackUrls.some(x=>x.includes('ddragon.leagueoflegends.com')),'Data Dragon fallback semantics drift');L.must(nextCompact.items['13001'].standardLiveId===false,'legacy alternate id classification drift');L.must(nextCompact.items['2003'].full===false,'consumable full-item filter drift');
for(const host of ['ddragon.leagueoflegends.com','raw.communitydragon.org','evil.example.com']){const expected=host!=='evil.example.com';L.must(service.allowedHost(host)===expected,`catalog host policy drift ${host}`)}
let handled=0,channel='',handler=null;const ipc={handle:(ch,fn)=>{handled++;channel=ch;handler=fn}};L.must(service.register(ipc)===true,'first canonical catalog registration should claim owner');L.must(service.register(ipc)===false,'second canonical catalog registration should be idempotent');L.must(handled===1&&channel==='desktop:get-item-catalog'&&typeof handler==='function','catalog IPC registration drift');
const activeManifest=L.json('update/manifest.json'),activeCatalog=activeManifest.files.find(x=>x.path==='item-catalog-v01527.js');L.must(activeCatalog?.source==='update/v0.15.64/item-catalog-v01527.js','active manifest item catalog source drift');
const activeMain=L.read('update/v0.15.70/main.js');L.must(activeMain.includes("itemCatalog.register(ipcMain);itemCatalog.fetchCatalog().catch(()=>{})"),'Golden main item catalog registration/prefetch contract missing');
L.must(canonical.production_active===false&&canonical.score_logic_changed===false&&canonical.item_recommendation_logic_changed===false,'catalog service shadow must remain inactive/scoring-neutral');
const report={status:'SUCCESS',production_active:false,active_legacy_source:activeCatalog.source,fixture_items:Object.keys(ddragon.data).length,community_rows:community.length,ipc_registration_calls:handled,semantic_contract:['v0.15.64 Data Dragon/CommunityDragon host policy','ko_KR-era compact recipe/art fields','standard live item id split','current-game primary icon with plugin/Data Dragon fallback','single desktop:get-item-catalog IPC registration','main-process eager prefetch intent'],network_called:false,scoring_changed:false,cutover_allowed:false};L.write('audit-output/stability/item-catalog-service-canonical-differential.json',report);console.log('ITEM CATALOG SERVICE CANONICAL DIFFERENTIAL: SUCCESS · active v0.15.64 service semantics preserved');
