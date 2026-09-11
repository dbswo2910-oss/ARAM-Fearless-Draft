'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const raw=name=>by.get(name)?read(by.get(name)):'';
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});

const entry=raw('main-v01580.js');
const stabilityPath=by.get('runtime-source-stability-v01580.js');
let effectivePatch=null;
try{
  const cut=entry.indexOf("const basePath=path.join(__dirname,'main-v01579.js');");
  if(cut<0)throw new Error('v0.15.80 entry prefix boundary not found');
  const prefix=entry.slice(0,cut)+"\nmodule.exports=stability.patchRuntimeSource;\n";
  const mod={exports:{}};
  const localRequire=id=>{
    if(id==='fs')return fs;
    if(id==='path')return path;
    if(id==='./runtime-source-stability-v01580')return require(path.join(ROOT,stabilityPath));
    throw new Error('unexpected require '+id);
  };
  vm.runInNewContext(prefix,{require:localRequire,module:mod,exports:mod.exports,console});
  effectivePatch=mod.exports;
  ok('latest-only runtime wrapper loads',typeof effectivePatch==='function');
}catch(e){ok('latest-only runtime wrapper loads',false,e.stack||e.message)}

const targets=['random-item-icons-v01556.js','item-icons-global-v01557.js','item-art-runtime-v01566.js'];
const patched={};
if(effectivePatch){
  for(const file of targets){
    try{patched[file]=effectivePatch(file,raw(file));new Function(patched[file]);ok(file+' latest-only transform parses',true)}
    catch(e){ok(file+' latest-only transform parses',false,e.stack||e.message)}
  }
}
const random=patched['random-item-icons-v01556.js']||'';
const globalIcons=patched['item-icons-global-v01557.js']||'';
const art=patched['item-art-runtime-v01566.js']||'';

ok('Random icons use latest current-game primary URL only',random.includes("function iconUrl(id){return String(catalog?.items?.[String(id)]?.iconPrimaryUrl||'')}"));
ok('Global icons use latest current-game primary URL only',globalIcons.includes("function iconUrl(id){return String(catalog?.items?.[String(id)]?.iconPrimaryUrl||'')}"));
ok('Random icons do not construct Data Dragon item URLs',!/return `https:\/\/ddragon\.leagueoflegends\.com\/cdn\/\$\{ver\}\/img\/item/.test(random));
ok('Global icons do not construct Data Dragon item URLs',!/return `https:\/\/ddragon\.leagueoflegends\.com\/cdn\/\$\{ver\}\/img\/item/.test(globalIcons));
ok('Missing latest art yields text-only Random UI',random.includes("const url=iconUrl(id);if(!url)return null"));
ok('Missing latest art yields text-only Global UI',globalIcons.includes("const url=iconUrl(id);if(!url)return null"));
ok('Runtime resolver candidate chain is latest primary only',art.includes("function candidates(id){const it=catalog?.items?.[String(id)];const url=String(it?.iconPrimaryUrl||'');return url?[url]:[]}"));
ok('Runtime resolver removed legacy fallback chain',!art.includes('iconFallbackUrls'));
ok('Old Data Dragon art is hidden before replacement',art.includes('ddragon.leagueoflegends.com')&&art.includes('/img/item/'));
ok('Old client-plugin art is hidden before replacement',art.includes('/plugins/rcp-be-lol-game-data/')&&art.includes('/assets/items/icons2d/'));
ok('Missing latest primary art hides the old icon',art.includes("if(!xs.length){img.style.display='none';return}"));
ok('Failed latest primary art never reveals legacy fallback',art.includes("if(!xs.length||index>=xs.length){delete img.dataset.aramItemArtSwitchingV01566;img.style.display='none'"));
ok('Policy remains scoring neutral',entry.includes('stability.score_logic_changed=false')&&!entry.includes('teamScore(')&&!entry.includes('recommendPicks(')&&!entry.includes('recommendBans('));

const report={version:'0.15.80',checks,pass:checks.every(x=>x.pass),score_logic_changed:false,info:{policy:'CommunityDragon latest /game/assets/items/icons2d only. No Data Dragon or client-plugin visual fallback; missing latest art renders text-only.'}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/item-art-latest-v01580-report.json'),JSON.stringify(report,null,2));
for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);
if(!report.pass)process.exit(1);
