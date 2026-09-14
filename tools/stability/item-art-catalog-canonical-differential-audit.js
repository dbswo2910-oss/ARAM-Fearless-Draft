'use strict';
const vm=require('vm');
const L=require('./lib');
const art=require('../../src/items/art-resolver');
const catalogContract=require('../../src/items/catalog-contract');
const preloadContract=require('../../src/preload/ipc-contract');
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
const key=s=>norm(s).toLowerCase().replace(/[\s·.'’"`():\-_/]/g,'');
function legacyArt(){
  const v80=require('../../update/v0.15.80/runtime-source-stability-v01580');
  const base=L.read('update/v0.15.66/item-art-runtime-v01566.js');
  const src=v80.patchRuntimeSource('item-art-runtime-v01566.js',base);
  const start=src.indexOf('function itemIdentityRank(id,it)');
  const end=src.indexOf('function legacyCompat(img,id,index)',start);
  L.must(start>=0&&end>start,'could not isolate active legacy item-art helpers');
  const window={},context={window,norm,key,URL,decodeURIComponent,Map,Set,Object,Array,String,Number,Math,Promise,console,document:{getElementById:()=>null,createElement:()=>({}),head:{appendChild(){}}}};
  const pre='let catalog=null,nameToId=new Map(),pending=null;\n';
  const expose='\nwindow.api={setCatalog,idFrom,candidates,assetKey,sameAsset};';
  vm.runInNewContext(pre+src.slice(start,end)+expose,context);
  return window.api;
}
function fakeImg({direct='',holder='',src='',alt='',title=''}){
  return{dataset:direct?{itemId:String(direct)}:{},alt,title,closest:()=>holder?{dataset:{itemId:String(holder)}}:null,getAttribute:name=>name==='src'?src:''};
}
const catalog={ok:true,version:'fixture-26.18',items:{
  '3001':{name:'태양불꽃 방패',map12:true,purchasable:true,standardLiveId:true,full:true,iconPrimaryUrl:'https://cdn.example/item/3001.png',iconUrl:'https://cdn.example/item/3001.png',iconFallbackUrls:['https://fallback.example/item/3001.png']},
  '13001':{name:'태양불꽃 방패',map12:true,purchasable:true,standardLiveId:false,full:true,iconPrimaryUrl:'https://cdn.example/item/13001.png'},
  '6655':{name:'루덴의 동반자',map12:true,purchasable:true,standardLiveId:true,full:true,iconPrimaryUrl:'https://cdn.example/item/6655.png',iconFallbackUrls:['https://cdn.example/item/6655.png','https://fallback.example/item/6655.png']},
  '3075':{name:'가시 갑옷',map12:true,purchasable:true,standardLiveId:true,full:true,iconUrl:'https://cdn.example/item/3075.png'},
  '3089':{name:'라바돈의 죽음모자',map12:true,purchasable:true,standardLiveId:true,full:true,iconPrimaryUrl:'https://cdn.example/item/3089.png'}
}};
const old=legacyArt();old.setCatalog(catalog);
const next=art.createArtResolver(catalog,{norm,key});
const imgs=[
  fakeImg({direct:6655}),
  fakeImg({holder:3075}),
  fakeImg({src:'https://ddragon.leagueoflegends.com/cdn/26.18.1/img/item/3089.png'}),
  fakeImg({alt:'태양불꽃 방패'}),
  fakeImg({title:'루덴의 동반자'})
];
for(const [i,img] of imgs.entries())L.must(old.idFrom(img)===next.idFrom(img),`item art id resolution drift ${i}: ${old.idFrom(img)} != ${next.idFrom(img)}`);
for(const id of ['3001','6655','3075','3089'])L.must(JSON.stringify(old.candidates(id))===JSON.stringify(next.candidates(id)),`item art candidate drift ${id}`);
const urls=[
  ['https://cdn.example/ITEM/6655.png?x=1','https://cdn.example/item/6655.png?y=2'],
  ['https://cdn.example/item/3075.png','https://other.example/item/3075.png'],
  ['not-a-url.png?x=1','not-a-url.png?x=2']
];
for(const [i,[a,b]] of urls.entries()){
  L.must(old.assetKey(a)===art.assetKey(a),`assetKey drift ${i}`);
  L.must(old.sameAsset(a,b)===art.sameAsset(a,b),`sameAsset drift ${i}`);
}
L.must(next.resolve('태양불꽃 방패')?.id==='3001','canonical duplicate-name resolver must prefer standard live item id');
L.must(next.resolve('6655')?.id==='6655','numeric item resolver drift');
const valid=catalogContract.validateCatalog(catalog);L.must(valid.ok&&valid.count===5,'catalog contract rejected valid fixture');
for(const bad of [null,{ok:false,items:{}},{ok:true,items:{}},{ok:true,items:[]},{ok:true,items:{'1':null}}])L.must(catalogContract.validateCatalog(bad).ok===false,'catalog contract accepted malformed fixture');
L.must(catalogContract.BRIDGE_METHOD==='getItemCatalog'&&catalogContract.IPC_CHANNEL==='desktop:get-item-catalog','catalog IPC canonical constants drift');
L.must(preloadContract.bridgeMethods.includes(catalogContract.BRIDGE_METHOD),'canonical preload bridge missing item catalog method');
L.must(preloadContract.invokeChannels.includes(catalogContract.IPC_CHANNEL),'canonical preload invoke contract missing item catalog channel');
const legacyPreload=L.read('update/v0.15.117/preload.js');L.must(legacyPreload.includes('getItemCatalog: () => ipcRenderer.invoke(\'desktop:get-item-catalog\')'),'Golden preload item catalog bridge contract missing');
L.must(art.production_active===false&&catalogContract.production_active===false&&art.score_logic_changed===false&&catalogContract.score_logic_changed===false,'item art/catalog shadows must remain inactive and scoring-neutral');
const report={status:'SUCCESS',production_active:false,image_id_fixtures:imgs.length,candidate_fixtures:4,asset_fixtures:urls.length,catalog_validation_fixtures:6,semantic_contract:['v0.15.80 canonical duplicate-name preference','v0.15.66 item art id resolution order','v0.15.66 primary/fallback candidate dedupe','v0.15.66 URL asset equivalence','v0.15.117 getItemCatalog preload bridge/channel'],dom_mutation_owner_migrated:false,main_catalog_handler_migrated:false,scoring_changed:false,cutover_allowed:false};
L.write('audit-output/stability/item-art-catalog-canonical-differential.json',report);
console.log('ITEM ART/CATALOG CANONICAL DIFFERENTIAL: SUCCESS · resolver and bridge semantics preserved');
