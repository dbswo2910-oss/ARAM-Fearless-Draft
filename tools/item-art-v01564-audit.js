'use strict';
const fs=require('fs'),path=require('path'),https=require('https');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const report={generatedAt:new Date().toISOString(),pass:[],fail:[],warn:[],coverage:null,info:{}};
const ok=(cond,name,detail='')=>(cond?report.pass:report.fail).push({name,detail});
const warn=(name,detail='')=>report.warn.push({name,detail});
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};

const m=JSON.parse(read('update/manifest.json'));
const byPath=new Map((m.files||[]).map(x=>[x.path,x.source]));
const resolverPath=byPath.get('item-art-unified-v01564.js');
const catalogPath=byPath.get('item-catalog-v01527.js');
const mainPath=byPath.get('main.js'),pkgPath=byPath.get('package.json');
ok(ge(m.version,'0.15.64'),'Manifest is v0.15.64 or newer',m.version);
ok(!!resolverPath&&/v0\.15\.64\/item-art-unified-v01564\.js$/.test(resolverPath)&&exists(resolverPath),'Unified item-art resolver is delivered',resolverPath||'missing');
ok(!!catalogPath&&/v0\.15\.64\/item-catalog-v01527\.js$/.test(catalogPath)&&exists(catalogPath),'Current item catalog is delivered from v0.15.64',catalogPath||'missing');
ok(!!mainPath&&/v0\.15\.64\/main\.js$/.test(mainPath)&&exists(mainPath),'v0.15.64 main is delivered',mainPath||'missing');
ok(!!pkgPath&&/v0\.15\.64\/package\.json$/.test(pkgPath)&&exists(pkgPath),'v0.15.64 package is delivered',pkgPath||'missing');

const resolver=resolverPath&&exists(resolverPath)?read(resolverPath):'';
const catalog=catalogPath&&exists(catalogPath)?read(catalogPath):'';
const main=mainPath&&exists(mainPath)?read(mainPath):'';
const pkg=pkgPath&&exists(pkgPath)?JSON.parse(read(pkgPath)):{};
for(const [code,name] of [[resolver,'v0.15.64 unified resolver'],[catalog,'v0.15.64 item catalog'],[main,'v0.15.64 main']]){try{new Function(code);ok(true,`${name} parses as JavaScript`)}catch(e){ok(false,`${name} parses as JavaScript`,e.message)}}
ok(/__ARAM_ITEM_ART_UNIFIED_V01564__\s*=\s*true/.test(resolver),'Unified resolver readiness marker exists');
ok(/aramItemArtResolverV01564/.test(resolver)&&/resolve:\(idOrName\)/.test(resolver),'One public resolver handles item ID or item name');
ok(/\$\$\('img'\)\.forEach\(refreshImg\)/.test(resolver),'Resolver audits every image element instead of a menu allow-list');
ok(/MutationObserver/.test(resolver)&&/attributeFilter:\['src','data-item-id','alt','title'\]/.test(resolver),'Future/re-rendered item images are re-resolved automatically');
ok(/aramItemArt/.test(resolver)&&/sessionNonce/.test(resolver)&&/clearLegacyFlags/.test(resolver),'Old item-art cache/legacy state is invalidated with versioned per-session URLs');
ok(/iconPrimaryUrl/.test(resolver)&&/iconFallbackUrls/.test(resolver),'Resolver consumes an ordered primary/fallback chain');
ok(/runtimePrimarySuccess/.test(resolver)&&/runtimeFallbackSuccess/.test(resolver)&&/runtimeMissing/.test(resolver),'Runtime coverage report exposes latest/fallback/missing counts');
ok(/score_logic_changed:false/.test(resolver),'Unified resolver is score-neutral');
ok(/latest\/game\/assets\/items\/icons2d/.test(catalog),'Catalog primary is CommunityDragon latest current-game item art');
ok(/plugins\/rcp-be-lol-game-data\/global\/default\/assets\/items\/icons2d/.test(catalog),'Client-plugin latest art remains only as first fallback');
ok(/ddragon\.leagueoflegends\.com/.test(catalog)&&/iconFallbackUrls/.test(catalog),'Current-version Data Dragon is final image fallback');
ok(/iconAudit:\{aramPurchasable/.test(catalog),'Catalog publishes full ARAM item-art coverage metadata');
const hotfixAt=main.indexOf("'item-art-hotfix-v01563.js'"),unifiedAt=main.indexOf("'item-art-unified-v01564.js'"),roleAt=main.indexOf("'role-metric-detail-v01518.js'");
ok(hotfixAt>=0&&unifiedAt>hotfixAt&&roleAt>unifiedAt,'Unified resolver runs after legacy item layers and before unrelated role UI');
ok(main.includes('__ARAM_ITEM_ART_UNIFIED_V01564__'),'Main readiness guard covers v0.15.64 resolver');
const vm=(main.match(/const VERSION='([^']+)'/)||[])[1]||'';
ok(ge(vm,'0.15.64'),'Current main VERSION is v0.15.64 or newer',vm);
ok(ge(pkg.version,'0.15.64'),'Current package VERSION is v0.15.64 or newer',pkg.version);

function getJson(url,timeout=10000){return new Promise((resolve,reject)=>{const req=https.get(url,{headers:{'User-Agent':'ARAM-Fearless-Draft-v01564-audit','Cache-Control':'no-cache'}},res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();getJson(new URL(res.headers.location,url).toString(),timeout).then(resolve,reject);return}if(res.statusCode!==200){res.resume();reject(new Error(`HTTP ${res.statusCode} ${url}`));return}const cs=[];res.on('data',c=>cs.push(c));res.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(cs).toString('utf8')))}catch(e){reject(e)}})});req.setTimeout(timeout,()=>req.destroy(new Error(`timeout ${url}`)));req.on('error',reject)})}
function probe(url,timeout=5000){return new Promise(resolve=>{let settled=false;const done=(ok,status)=>{if(settled)return;settled=true;resolve({ok,status})};const req=https.request(url,{method:'HEAD',headers:{'User-Agent':'ARAM-Fearless-Draft-v01564-audit','Cache-Control':'no-cache'}},res=>{res.resume();done(res.statusCode>=200&&res.statusCode<400,res.statusCode)});req.setTimeout(timeout,()=>{req.destroy();done(false,'timeout')});req.on('error',()=>done(false,'error'));req.end()})}
async function mapLimit(xs,limit,fn){const out=new Array(xs.length);let next=0;async function worker(){while(true){const i=next++;if(i>=xs.length)return;out[i]=await fn(xs[i],i)}}await Promise.all(Array.from({length:Math.min(limit,xs.length)},worker));return out}
async function remoteCoverage(){
  const realm=await getJson('https://ddragon.leagueoflegends.com/realms/kr.json');
  const version=String(realm?.n?.item||realm?.v||'16.18.1');
  let dd;try{dd=await getJson(`https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(version)}/data/ko_KR/item.json`)}catch{dd=await getJson(`https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(version)}/data/en_US/item.json`)}
  const cj=await getJson('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json');
  const cMap=new Map();for(const row of Array.isArray(cj)?cj:[]){const id=String(Number(row?.id)||'');const file=String(row?.iconPath||'').split('/').pop().toLowerCase();if(id&&file)cMap.set(id,file)}
  const rows=[];for(const [id,it] of Object.entries(dd?.data||{})){if(it?.maps?.['12']!==true||it?.gold?.purchasable===false)continue;const file=cMap.get(String(id))||'';rows.push({id:String(id),name:String(it?.name||''),file,primary:file?`https://raw.communitydragon.org/latest/game/assets/items/icons2d/${encodeURIComponent(file)}`:'',plugin:file?`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/${encodeURIComponent(file)}`:'',dd:`https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(version)}/img/item/${encodeURIComponent(id)}.png`})}
  const checked=await mapLimit(rows,14,async row=>{
    if(row.primary){const p=await probe(row.primary);if(p.ok)return{...row,state:'latest',status:p.status}}
    if(row.plugin){const q=await probe(row.plugin);if(q.ok)return{...row,state:'fallback-plugin',status:q.status}}
    const d=await probe(row.dd);if(d.ok)return{...row,state:'fallback-ddragon',status:d.status};
    return{...row,state:'missing',status:d.status};
  });
  return{version,total:checked.length,latest:checked.filter(x=>x.state==='latest').length,fallback:checked.filter(x=>x.state.startsWith('fallback')).length,missing:checked.filter(x=>x.state==='missing').length,fallbackItems:checked.filter(x=>x.state.startsWith('fallback')).map(x=>({id:x.id,name:x.name,state:x.state})),missingItems:checked.filter(x=>x.state==='missing').map(x=>({id:x.id,name:x.name}))};
}

(async()=>{
  try{report.coverage=await remoteCoverage();console.log(`[item-art-v0.15.64] 총 관리 ARAM 아이템 ${report.coverage.total}개 · 최신 아이콘 성공 ${report.coverage.latest}개 · fallback ${report.coverage.fallback}개 · 누락 ${report.coverage.missing}개`)}catch(e){warn('Remote current-art coverage probe unavailable',e?.message||String(e));console.warn('[item-art-v0.15.64] remote coverage probe skipped:',e?.message||String(e))}
  report.info={scope:'All item-bearing menus are normalized by one global resolver. Current-game CommunityDragon art is primary, client-plugin latest then current Data Dragon are fallbacks. Legacy image cache is bypassed by v0.15.64 + per-session query keys.',scoreLogicChanged:false,coverageMeaning:'ARAM map-12 purchasable item IDs from current Data Dragon are probed against latest current-game art, then fallbacks.'};
  report.summary={pass:report.pass.length,warn:report.warn.length,fail:report.fail.length,status:report.fail.length?'FAIL':'PASS'};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output','item-art-v01564-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.summary));for(const x of report.fail)console.error('FAIL',x.name,x.detail||'');process.exitCode=report.fail.length?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});
