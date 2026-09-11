'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const patch=require(path.join(ROOT,'update/v0.15.81/runtime-source-stability-v01581.js')).patchRuntimeSource;
const raw=read('update/v0.15.50/random-ingame-coach-v01550.js');
let code='';
try{code=patch('random-ingame-coach-v01550.js',raw);new Function(code);ok('patched coach parses',true)}catch(e){ok('patched coach parses',false,e.stack||e.message)}
ok('global core-stage gate injected',code.includes('function buildGateV01581(available,stat,ctx,threat)'));
ok('recommendation uses gated ranking',code.includes('ranked=buildGateV01581(available,stat,ctx,top),best=ranked[0]||null'));
ok('alternatives use same gated ranking',code.includes('alts:ranked.slice(1,3).map(x=>x.item)'));
ok('pure tank early penalty exists',code.includes("identity==='damage'&&cls==='tank'")&&code.includes('stage===0?120'));
ok('tank early glass-cannon penalty exists',code.includes("identity==='tank'&&cls==='damage'")&&code.includes('stage===0?90'));
ok('hybrid items are not blanket-blocked',code.includes("return'hybrid'"));
ok('policy does not touch draft pick/ban scoring',!code.includes('candidateScore=function')&&!code.includes('threatScore=function'));

const catalog={ok:true,items:{
 '3153':{id:'3153',name:'몰락한 왕의 검',tags:['Damage','AttackSpeed','LifeSteal'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '3091':{id:'3091',name:'마법사의 최후',tags:['Damage','AttackSpeed','SpellBlock'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '6333':{id:'6333',name:'죽음의 무도',tags:['Damage','Armor'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '3071':{id:'3071',name:'칠흑의 양날 도끼',tags:['Damage','Health'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '3053':{id:'3053',name:'스테락의 도전',tags:['Damage','Health'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '6672':{id:'6672',name:'크라켄 학살자',tags:['Damage','AttackSpeed'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '3031':{id:'3031',name:'무한의 대검',tags:['Damage','CriticalStrike'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '6655':{id:'6655',name:'루덴의 동반자',tags:['SpellDamage','Mana'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '3089':{id:'3089',name:'라바돈의 죽음모자',tags:['SpellDamage'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '3143':{id:'3143',name:'란두인의 예언',tags:['Health','Armor'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '3065':{id:'3065',name:'정령의 형상',tags:['Health','SpellBlock'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '6665':{id:'6665',name:'해신 작쇼',tags:['Health','Armor','SpellBlock'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '3075':{id:'3075',name:'가시 갑옷',tags:['Health','Armor'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '6617':{id:'6617',name:'월석 재생기',tags:['Health','ManaRegen','HealAndShieldPower'],full:true,map12:true,purchasable:true,standardLiveId:true},
 '6620':{id:'6620',name:'헬리아의 메아리',tags:['SpellDamage','ManaRegen','HealAndShieldPower'],full:true,map12:true,purchasable:true,standardLiveId:true}
}};
function expose(src){
 const anchor='  ensureShell();document.addEventListener';
 const injected="  window.__V81_TEST__={rebuildBuildCatalogV01581,buildGateV01581,itemClassV01581,coreStageV01581,buildIdentityV01581};\n"+anchor;
 if(!src.includes(anchor))throw new Error('coach startup anchor missing');
 return src.replace(anchor,injected);
}
try{
 const testCode=expose(code),document={querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,addEventListener:()=>{},createElement:()=>({style:{},dataset:{},classList:{add(){},toggle(){}},appendChild(){},addEventListener(){}}),head:{appendChild(){}}};
 const ctx={console,document,localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},Promise,Date,Number,String,Object,Array,Map,Set,Math,JSON};ctx.window=ctx;ctx.aramDesktop={};vm.createContext(ctx);vm.runInContext(testCode,ctx);const api=ctx.__V81_TEST__;api.rebuildBuildCatalogV01581(catalog);
 const gate=(tree,items,itemIds=[],threat=90)=>api.buildGateV01581(items,{tree},{local:{itemIds}}, {score:threat});
 const damageCases=[
  ['skirmisher','몰락한 왕의 검 → 마법사의 최후 → 죽음의 무도'],
  ['juggernaut','칠흑의 양날 도끼 → 스테락의 도전 → 죽음의 무도'],
  ['marksman','크라켄 학살자 → 무한의 대검'],
  ['mage','루덴의 동반자 → 라바돈의 죽음모자']
 ];
 for(const [name,tree] of damageCases){const r=gate(tree,[{item:'란두인의 예언',score:99,reason:'물리 대응'},{item:'정령의 형상',score:94,reason:'마법 대응'}]);ok(`${name}: 0-core pure tank cannot be TOP1`,r[0]&&r[0].item!=='란두인의 예언'&&r[0].item!=='정령의 형상',r.map(x=>x.item).join(' > '))}
 const hybrid=gate('몰락한 왕의 검 → 마법사의 최후 → 죽음의 무도',[{item:'죽음의 무도',score:105,reason:'AD 대응'},{item:'란두인의 예언',score:99,reason:'치명타 대응'}]);ok('bruiser hybrid defense remains eligible',hybrid.some(x=>x.item==='죽음의 무도'&&!x.__v81Blocked),JSON.stringify(hybrid.map(x=>[x.item,x.__v81Class,x.__v81Blocked])));
 const tank=gate('해신 작쇼 → 가시 갑옷 → 정령의 형상',[{item:'라바돈의 죽음모자',score:120,reason:'딜'},{item:'란두인의 예언',score:98,reason:'치명타 대응'}]);ok('tank: 0-core glass cannon cannot be TOP1',tank[0]&&tank[0].item!=='라바돈의 죽음모자',tank.map(x=>x.item).join(' > '));
 const support=gate('월석 재생기 → 헬리아의 메아리',[{item:'란두인의 예언',score:110,reason:'AD 대응'}]);ok('support: baseline identity beats random pure tank first core',support[0]?.item==='월석 재생기',support.map(x=>x.item).join(' > '));
 const late=gate('몰락한 왕의 검 → 마법사의 최후 → 죽음의 무도',[{item:'란두인의 예언',score:110,reason:'치명타 대응'},{item:'라바돈의 죽음모자',score:30,reason:'비정상'}],['3153','3091','6333'],98);ok('3-core damage build can promote situational pure tank',late[0]?.item==='란두인의 예언',late.map(x=>`${x.item}:${x.score}`).join(' > '));
 ok('core stage counts completed non-boot items',api.coreStageV01581({local:{itemIds:['3153','3091','6333']}})===3,String(api.coreStageV01581({local:{itemIds:['3153','3091','6333']}})));
}catch(e){ok('VM policy matrix executes',false,e.stack||e.message)}

const report={version:'0.15.81',checks,pass:checks.every(x=>x.pass),draft_score_logic_changed:false,item_recommendation_logic_changed:true};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/item-recommendation-v01581-report.json'),JSON.stringify(report,null,2));
for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);
