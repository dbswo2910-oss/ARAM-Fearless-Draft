'use strict';
const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const OPGG='https://lol-api-champion.op.gg';
const DD='https://ddragon.leagueoflegends.com';
const REQUESTED_PATCH=process.env.ARAM_CANONICAL_PATCH||'';
const OUT=path.join(ROOT,'data','aram-builds','current.json');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function fetchJson(url,attempts=4){
  let last;
  for(let i=0;i<attempts;i++){
    try{
      const res=await fetch(url,{headers:{'user-agent':'ARAM-Fearless-Draft build-stat-cache/0.15.125 (+github-actions)','accept':'application/json,text/plain,*/*','accept-language':'ko-KR,ko;q=0.9,en;q=0.7'}});
      if(!res.ok)throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    }catch(err){last=err;if(i+1<attempts)await sleep(500*(2**i));}
  }
  throw new Error(`fetch failed ${url}: ${last?.message||last}`);
}
function patchParts(v){return String(v||'').match(/^(\d+)\.(\d+)/)?.slice(1).map(Number)||[]}
function compatiblePatch(provider,target){
  const [pm,pn]=patchParts(provider),[tm,tn]=patchParts(target);
  if(!Number.isFinite(pm)||!Number.isFinite(tm)||pn!==tn)return false;
  return pm===tm || pm+10===tm;
}
function canonicalFromProvider(provider){
  const [major,minor]=patchParts(provider),year2=new Date().getUTCFullYear()%100;
  if(Number.isFinite(major)&&Number.isFinite(minor)&&major+10===year2)return `${year2}.${minor}`;
  return String(provider||'');
}
function flattenIds(row){return Array.isArray(row?.ids)?row.ids.map(Number).filter(Number.isFinite):[]}
function sortRows(rows){return [...(Array.isArray(rows)?rows:[])].sort((a,b)=>(Number(b.play)||0)-(Number(a.play)||0)||(Number(b.pick_rate)||0)-(Number(a.pick_rate)||0))}
function unique(xs){const s=new Set();return xs.filter(x=>x&&!s.has(x)&&(s.add(x),true))}
function validCompleted(id,itemMap){const it=itemMap[String(id)];return !!it&&it.gold?.purchasable!==false&&Number(it.gold?.total||0)>=1600}
function chooseBaseline(info,itemMap){
  const starterRow=sortRows(info.starter_items)[0]||{};
  const bootRow=sortRows(info.boots)[0]||{};
  const coreRows=sortRows(info.core_items);
  const topCoreRow=coreRows[0]||{};
  const starters=unique(flattenIds(starterRow));
  const boots=unique(flattenIds(bootRow));
  const topCore=unique(flattenIds(topCoreRow)).filter(id=>validCompleted(id,itemMap));
  const popular=unique(sortRows(info.last_items).flatMap(flattenIds)).filter(id=>validCompleted(id,itemMap)&&!boots.includes(id));
  const alternatives=coreRows.slice(0,5).map(row=>({ids:unique(flattenIds(row)).filter(id=>validCompleted(id,itemMap)),play:Number(row.play)||0,win:Number(row.win)||0,pickRate:Number(row.pick_rate)||0})).filter(x=>x.ids.length>=2);
  return {starterItemIds:starters.slice(0,4),bootsId:boots[0]||null,coreItemIds:topCore.slice(0,4),popularItemIds:popular.slice(0,6),coreAlternatives:alternatives};
}
async function loadIndex(){
  const [metaKo,metaEn,list]=await Promise.all([
    fetchJson(`${OPGG}/api/meta/champions?hl=ko_KR`),
    fetchJson(`${OPGG}/api/meta/champions?hl=en_US`),
    fetchJson(`${OPGG}/api/global/champions/aram?hl=ko_KR`)
  ]);
  const providerPatch=String(list?.meta?.version||metaKo?.meta?.version||'');
  const canonicalPatch=REQUESTED_PATCH||canonicalFromProvider(providerPatch);
  if(!compatiblePatch(providerPatch,canonicalPatch))throw new Error(`OP.GG patch mismatch: provider=${providerPatch}, canonical=${canonicalPatch}`);
  const namesKo=new Map((metaKo?.data||[]).map(x=>[Number(x.id),String(x.name||'')]));
  const namesEn=new Map((metaEn?.data||[]).map(x=>[Number(x.id),String(x.name||'')]));
  const ids=(list?.data||[]).map(x=>Number(x.id)).filter(Number.isFinite);
  if(ids.length<170)throw new Error(`OP.GG ARAM roster unexpectedly small: ${ids.length}`);
  return {providerPatch,canonicalPatch,namesKo,namesEn,ids,listMeta:list?.meta||{}};
}
async function loadItemMap(providerPatch,canonicalPatch){
  const versions=await fetchJson(`${DD}/api/versions.json`);
  const candidates=unique([providerPatch,canonicalPatch,(()=>{const [m,n]=patchParts(canonicalPatch);return Number.isFinite(m)&&m>=20?`${m-10}.${n}`:''})()]);
  const ddVersion=versions.find(v=>candidates.some(p=>p&&String(v).startsWith(`${p}.`)));
  if(!ddVersion)throw new Error(`Data Dragon version aliases=${candidates.join(',')} not found; latest=${versions[0]}`);
  const payload=await fetchJson(`${DD}/cdn/${ddVersion}/data/ko_KR/item.json`);
  return {ddVersion,itemMap:payload.data||{}};
}
function itemNames(ids,itemMap){return (ids||[]).map(id=>itemMap[String(id)]?.name||'').filter(Boolean)}
async function fetchChampion(id){return fetchJson(`${OPGG}/api/global/champions/aram/${id}/none?hl=ko_KR`)}
function slugName(s){return String(s||'').toLowerCase().replace(/&/g,'and').replace(/[.'’\s-]/g,'').replace(/[^a-z0-9]/g,'')}
function winRate(row){const p=Number(row?.play)||0,w=Number(row?.win)||0;return p?Number((w/p*100).toFixed(2)):0}
function materialSnapshot(doc){
  return {
    schemaVersion:doc?.schemaVersion,mode:doc?.mode,excludes:doc?.excludes,canonicalPatch:doc?.canonicalPatch,provider:doc?.provider,providerPatch:doc?.providerPatch,ddragonVersion:doc?.ddragonVersion,rosterCount:doc?.rosterCount,
    champions:Object.fromEntries(Object.entries(doc?.champions||{}).map(([id,r])=>[id,{championId:r?.championId,name:r?.name,nameEn:r?.nameEn,starterItemIds:r?.starterItemIds,bootsId:r?.bootsId,coreItemIds:r?.coreItemIds,popularItemIds:r?.popularItemIds,coreAlternatives:(r?.coreAlternatives||[]).map(x=>x?.ids)}]))
  };
}
async function probe(){
  const index=await loadIndex(),{ddVersion,itemMap}=await loadItemMap(index.providerPatch,index.canonicalPatch);
  const id=103,payload=await fetchChampion(id),info=payload?.data||{},picked=chooseBaseline(info,itemMap),top=picked.coreAlternatives[0]||{};
  console.log(JSON.stringify({canonicalPatch:index.canonicalPatch,providerPatch:index.providerPatch,ddVersion,rosterCount:index.ids.length,providerMeta:index.listMeta,champion:{id,name:index.namesKo.get(id),nameEn:index.namesEn.get(id),responseMeta:payload?.meta,starter_items:(info.starter_items||[]).slice(0,3),boots:(info.boots||[]).slice(0,3),core_items:(info.core_items||[]).slice(0,5),last_items:(info.last_items||[]).slice(0,5),selected:{starterNames:itemNames(picked.starterItemIds,itemMap),bootsName:itemMap[String(picked.bootsId)]?.name||'',coreNames:itemNames(picked.coreItemIds,itemMap),popularNames:itemNames(picked.popularItemIds,itemMap),topCorePickRate:top.pickRate||0,topCoreWinRate:winRate(top)}}},null,2));
}
async function mapLimit(xs,limit,fn){let at=0;const out=new Array(xs.length);const workers=Array.from({length:Math.min(limit,xs.length)},async()=>{while(true){const i=at++;if(i>=xs.length)return;out[i]=await fn(xs[i],i)}});await Promise.all(workers);return out}
async function generate(){
  const index=await loadIndex(),{ddVersion,itemMap}=await loadItemMap(index.providerPatch,index.canonicalPatch),failures=[];
  const rows=await mapLimit(index.ids,6,async(id,i)=>{
    try{
      const payload=await fetchChampion(id),info=payload?.data||{},picked=chooseBaseline(info,itemMap),coreNames=itemNames(picked.coreItemIds,itemMap),popularNames=itemNames(picked.popularItemIds,itemMap),top=picked.coreAlternatives[0]||{};
      if(coreNames.length<2||coreNames.length!==picked.coreItemIds.length)throw new Error(`invalid core resolution ids=${picked.coreItemIds.length} names=${coreNames.length}`);
      if((i+1)%20===0)console.log(`fetched ${i+1}/${index.ids.length}`);
      const name=index.namesKo.get(id)||String(id),nameEn=index.namesEn.get(id)||name;
      return {championId:id,name,nameEn,slug:slugName(nameEn),starterItemIds:picked.starterItemIds,starterNames:itemNames(picked.starterItemIds,itemMap),bootsId:picked.bootsId,bootsName:itemMap[String(picked.bootsId)]?.name||'',coreItemIds:picked.coreItemIds,coreNames,tree:coreNames.join(' → '),popularItemIds:picked.popularItemIds,popularNames,coreAlternatives:picked.coreAlternatives.map(x=>({...x,names:itemNames(x.ids,itemMap),winRate:winRate(x)})),topCorePickRate:Number(top.pickRate||0),topCoreWinRate:winRate(top),source:'OP.GG ARAM',sourceUrl:`https://op.gg/ko/lol/modes/aram/${slugName(nameEn)}/build`,providerPatch:index.providerPatch,canonicalPatch:index.canonicalPatch,providerAnalyzedAt:index.listMeta?.analyzed_at||null};
    }catch(err){failures.push({championId:id,name:index.namesKo.get(id)||String(id),error:String(err?.message||err)});return null;}
  });
  const champions=Object.fromEntries(rows.filter(Boolean).sort((a,b)=>a.championId-b.championId).map(r=>[String(r.championId),r])),count=Object.keys(champions).length;
  if(failures.length||count!==index.ids.length)throw new Error(`incomplete ARAM cache: ${count}/${index.ids.length}; failures=${JSON.stringify(failures.slice(0,10))}`);
  const doc={schemaVersion:2,mode:'ARAM',excludes:['ARAM_MAYHEM'],canonicalPatch:index.canonicalPatch,provider:'OP.GG',providerPatch:index.providerPatch,ddragonVersion:ddVersion,generatedAt:new Date().toISOString(),providerAnalyzedAt:index.listMeta?.analyzed_at||null,providerMatchCount:Number(index.listMeta?.match_count)||null,rosterCount:index.ids.length,champions};
  if(fs.existsSync(OUT)){
    try{const old=JSON.parse(fs.readFileSync(OUT,'utf8'));if(JSON.stringify(materialSnapshot(old))===JSON.stringify(materialSnapshot(doc))){console.log(`ARAM build cache material paths unchanged: retaining existing ${old.canonicalPatch} cache`);return}}catch{}
  }
  fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(doc,null,2)+'\n','utf8');
  console.log(`ARAM build cache written: ${count} champions patch=${index.canonicalPatch} provider=${index.providerPatch} matches=${doc.providerMatchCount} -> ${path.relative(ROOT,OUT)}`);
}
(async()=>{if(process.argv.includes('--probe'))await probe();else await generate()})().catch(err=>{console.error(err.stack||err);process.exit(1)});
