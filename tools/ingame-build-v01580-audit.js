'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const raw=name=>by.get(name)&&exists(by.get(name))?read(by.get(name)):'';
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const pkg=JSON.parse(raw('package.json')||'{}'),entry=raw(pkg.main||''),stability=raw('runtime-source-stability-v01580.js');

ok('manifest version is v0.15.80',manifest.version==='0.15.80',manifest.version);
ok('package version is v0.15.80',pkg.version==='0.15.80',pkg.version||'');
ok('package entry is main-v01580.js',pkg.main==='main-v01580.js',pkg.main||'');
ok('v0.15.80 entry delivered',by.get('main-v01580.js')==='update/v0.15.80/main-v01580.js',by.get('main-v01580.js')||'');
ok('v0.15.80 source stability delivered',by.get('runtime-source-stability-v01580.js')==='update/v0.15.80/runtime-source-stability-v01580.js',by.get('runtime-source-stability-v01580.js')||'');
ok('historical icon source path stays stable',/update\/v0\.15\.73\/random-item-icons-v01556\.js$/.test(by.get('random-item-icons-v01556.js')||''),by.get('random-item-icons-v01556.js')||'');
ok('historical global icon source path stays stable',/update\/v0\.15\.57\/item-icons-global-v01557\.js$/.test(by.get('item-icons-global-v01557.js')||''),by.get('item-icons-global-v01557.js')||'');
ok('historical shop source path stays stable',/update\/v0\.15\.53\/random-ingame-shop-v01553\.js$/.test(by.get('random-ingame-shop-v01553.js')||''),by.get('random-ingame-shop-v01553.js')||'');
for(const [name,code] of [['entry',entry],['source stability',stability]]){try{new Function(code);ok(name+' parses',!!code)}catch(e){ok(name+' parses',false,e.message)}}
ok('successor entry inherits v0.15.79 safety baseline',entry.includes('main-v01579.js')&&entry.includes("replaceAll('0.15.79','0.15.80')"));
ok('successor entry switches only runtime source stability owner',entry.includes("replace(sourceStabilityOld,'runtime-source-stability-v01580')"));

let patch=null;
try{patch=require(path.join(ROOT,by.get('runtime-source-stability-v01580.js'))).patchRuntimeSource;ok('v0.15.80 source stability module loads',typeof patch==='function')}catch(e){ok('v0.15.80 source stability module loads',false,e.stack||e.message)}
const targets=['random-item-icons-v01556.js','item-icons-global-v01557.js','item-art-runtime-v01566.js','random-ingame-coach-v01550.js','random-ingame-shop-v01553.js','random-ingame-shop-polish-v01554.js','runtime-random-ingame-v01570.js'];
const patched={};
if(patch){
  for(const file of targets){
    try{
      const first=patch(file,raw(file)),second=patch(file,first);patched[file]=first;new Function(first);
      ok(file+' transforms and parses',true);ok(file+' transform is idempotent',first===second);
    }catch(e){ok(file+' transforms and parses',false,e.stack||e.message)}
  }
}
const random=patched['random-item-icons-v01556.js']||'',globalIcons=patched['item-icons-global-v01557.js']||'',art=patched['item-art-runtime-v01566.js']||'',coach=patched['random-ingame-coach-v01550.js']||'',shop=patched['random-ingame-shop-v01553.js']||'',polish=patched['random-ingame-shop-polish-v01554.js']||'',runtime70=patched['runtime-random-ingame-v01570.js']||'';
ok('item layers use canonical ARAM/live identity ranking',random.includes('itemIdentityRank')&&globalIcons.includes('itemIdentityRank')&&art.includes('itemIdentityRank')&&shop.includes('itemIdentityRank'));
ok('item images carry explicit canonical item IDs',random.includes('img.dataset.itemId=String(id)')&&globalIcons.includes('img.dataset.itemId=String(id)'));
ok('stat tree deduplicates localized item names',random.includes('const low=norm(text),best=new Map()')&&random.includes('best.set(k,row)'));
ok('coach distinguishes unknown gold from real 0G',coach.includes('goldKnown:goldSnap.known')&&coach.includes('골드 데이터 확인 중'));
ok('coach excludes visible owned cores before recommendation',coach.includes('ownedItemState(ctx)')&&coach.includes('availableAdviceItems(advice,ctx)'));
ok('coach separates baseline from current-match decision',coach.includes('통계 기본트리 · 참고')&&coach.includes('빌드 판단:')&&coach.includes('상황 대응으로 우선순위 변경'));
ok('shop planner is available in alive Build view',shop.includes("return !!$('[data-ri-tab=\"build\"].active',shell)")&&shop.includes("purchaseWindow=!isPreview&&!deadish?'next-death':'dead'"));
ok('shop planner refuses fake 0G when gold is absent',shop.includes('데이터가 없을 때 0G로 가정하지 않습니다')&&shop.includes('goldState.known'));
ok('shop planner accounts for known empty inventory',shop.includes('function inventoryKnown(ctx)')&&shop.includes('ownedKnown=isPreview||inventoryKnown(ctx)'));
ok('shop planner blocks already-owned target core',shop.includes('tree.owned||tree.remaining<=0')&&shop.includes('다음 미보유 코어를 다시 계산합니다'));
ok('shop polish preserves next-death label',polish.includes("purchaseWindow==='next-death'?'다음 사망 때 살 것':'지금 살 것'"));
ok('volatile runtime does not overwrite missing gold as 0G',runtime70.includes("goldText=goldKnown?")&&runtime70.includes("'골드 데이터 확인 중'"));
ok('v0.15.80 recommendation patch remains score-neutral',stability.includes('score_logic_changed:false')&&!stability.includes('teamScore(')&&!stability.includes('recommendPicks(')&&!stability.includes('recommendBans('));
ok('v0.15.80 adds no document-wide MutationObserver',!/\.observe\(document\.(?:documentElement|body)/.test(stability));

const catalog={ok:true,version:'test',items:{
  '3118':{name:'어둠불꽃 횃불',map12:true,purchasable:true,standardLiveId:true,full:true},
  '223118':{name:'어둠불꽃 횃불',map12:false,purchasable:true,standardLiveId:false,full:true},
  '6653':{name:'리안드리의 고통',map12:true,purchasable:true,standardLiveId:true,full:true},
  '226653':{name:'리안드리의 고통',map12:false,purchasable:true,standardLiveId:false,full:true},
  '4645':{name:'그림자불꽃',map12:true,purchasable:true,standardLiveId:true,full:true},
  '224645':{name:'그림자불꽃',map12:false,purchasable:true,standardLiveId:false,full:true}
}};
function makeContext(){
  const document={querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({dataset:{},style:{},classList:{add(){}},prepend(){},appendChild(){},remove(){}}),head:{appendChild(){}}};
  const ctx={console,document,Node:{TEXT_NODE:3},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},Promise,Date,Number,String,Object,Array,Map,Set,URL,encodeURIComponent};ctx.window=ctx;return ctx;
}
try{
  const code=random.replace(/\n\s*start\(\);\s*\n\}\)\(\);\s*$/,"\n  window.__V80_TEST__={setCatalog:x=>{catalog=x;rebuildNameIndex()},findId,treeMatches,makeImg};\n})();\n");
  const ctx=makeContext();vm.createContext(ctx);vm.runInContext(code,ctx);const api=ctx.__V80_TEST__;api.setCatalog(catalog);
  const rows=api.treeMatches('어둠불꽃 횃불 → 리안드리의 고통 → 그림자불꽃');
  ok('tree renders exactly three unique requested cores',rows.length===3,JSON.stringify(rows));
  ok('tree chooses standard ARAM/live IDs',rows.map(x=>x.id).join(',')==='3118,6653,4645',rows.map(x=>x.id).join(','));
  ok('exact Liandry lookup uses canonical ID',api.findId('리안드리의 고통')==='6653',api.findId('리안드리의 고통'));
  ok('Liandry image is bound to canonical ID',api.makeImg('6653','리안드리의 고통').dataset.itemId==='6653');
}catch(e){ok('random icon identity VM regression',false,e.stack||e.message)}
try{
  const code=globalIcons.replace(/\n\s*start\(\);\s*\n\}\)\(\);\s*$/,"\n  window.__V80_TEST__={setCatalog,exactId,matches,imgFor};\n})();\n");
  const ctx=makeContext();vm.createContext(ctx);vm.runInContext(code,ctx);const api=ctx.__V80_TEST__;api.setCatalog(catalog);
  const xs=api.matches('어둠불꽃 횃불 → 리안드리의 고통 → 그림자불꽃',6);
  ok('global icon matcher collapses mode-duplicate names',xs.length===3,JSON.stringify(xs));
  ok('global Shadowflame lookup uses canonical ID',api.exactId('그림자불꽃')==='4645',api.exactId('그림자불꽃'));
}catch(e){ok('global icon identity VM regression',false,e.stack||e.message)}
try{
  const code=art.replace(/\n\s*start\(\);\s*\n\}\)\(\);\s*$/,"\n  window.__V80_TEST__={setCatalog,resolveName:n=>nameToId.get(key(n))||''};\n})();\n");
  const ctx=makeContext();ctx.MutationObserver=function(){};vm.createContext(ctx);vm.runInContext(code,ctx);const api=ctx.__V80_TEST__;api.setCatalog(catalog);
  ok('item-art fallback resolves canonical Blackfire ID',api.resolveName('어둠불꽃 횃불')==='3118',api.resolveName('어둠불꽃 횃불'));
  ok('item-art fallback resolves canonical Liandry ID',api.resolveName('리안드리의 고통')==='6653',api.resolveName('리안드리의 고통'));
}catch(e){ok('item-art identity VM regression',false,e.stack||e.message)}

const report={version:'0.15.80',checks,pass:checks.every(x=>x.pass),score_logic_changed:false,info:{purpose:'Fix duplicate/wrong item artwork and make the in-game Build tab actionable without treating missing live gold as 0G; v0.15.79 safety baseline remains inherited.'}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/ingame-build-v01580-report.json'),JSON.stringify(report,null,2));
for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);
