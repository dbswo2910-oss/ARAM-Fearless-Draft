'use strict';
const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const OPGG='https://lol-api-champion.op.gg';
const DD='https://ddragon.leagueoflegends.com';
const TARGET_PATCH=process.env.ARAM_CANONICAL_PATCH||'26.18';
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
function flattenIds(row){return Array.isArray(row?.ids)?row.ids.map(Number).filter(Number.isFinite):[]}
function sortRows(rows){return [...(Array.isArray(rows)?rows:[])].sort((a,b)=>(Number(b.play)||0)-(Number(a.play)||0)||(Number(b.pick_rate)||0)-(Number(a.pick_rate)||0))}
function unique(xs){const s=new Set();return xs.filter(x=>x&&!s.has(x)&&(s.add(x),true))}
function chooseBaseline(info,itemMap){
  const starters=unique(flattenIds(sortRows(info.starter_items)[0]));
  const boots=unique(flattenIds(sortRows(info.boots)[0]));
  const topCore=unique(flattenIds(sortRows(info.core_items)[0]));
  const completion=[];
  const add=id=>{
    id=Number(id);if(!Number.isFinite(id)||topCore.includes(id)||boots.includes(id)||starters.includes(id)||completion.includes(id))return;
    const it=itemMap[String(id)];
    if(!it||it.gold?.purchasable===false||Number(it.gold?.total||0)<1600)return;
    completion.push(id);
  };
  for(const row of sortRows(info.last_items))for(const id of flattenIds(row))add(id);
  for(const row of sortRows(info.core_items).slice(1))for(const id of flattenIds(row))add(id);
  return {starterItemIds:starters.slice(0,4),bootsId:boots[0]||null,coreItemIds:unique([...topCore,...completion]).slice(0,5)};
}
function ddragonPatchCandidates(target){
  const [major,minor]=patchParts(target);const out=[target];
  if(Number.isFinite(major)&&major>=20)out.push(`${major-10}.${minor}`);
  return out;
}
async function loadItemMap(){
  const versions=await fetchJson(`${DD}/api/versions.json`);
  const candidates=ddragonPatchCandidates(TARGET_PATCH);
  const ddVersion=versions.find(v=>candidates.some(p=>String(v).startsWith(`${p}.`)));
  if(!ddVersion)throw new Error(`Data Dragon version for ${TARGET_PATCH} aliases=${candidates.join(',')} not found; latest=${versions[0]}`);
  const payload=await fetchJson(`${DD}/cdn/${ddVersion}/data/ko_KR/item.json`);
  return {ddVersion,itemMap:payload.data||{}};
}
function itemNames(ids,itemMap){return (ids||[]).map(id=>itemMap[String(id)]?.name||'').filter(Boolean)}
async function loadIndex(){
  const [meta,list]=await Promise.all([
    fetchJson(`${OPGG}/api/meta/champions?hl=ko_KR`),
    fetchJson(`${OPGG}/api/global/champions/aram?hl=ko_KR`)
  ]);
  const providerPatch=String(list?.meta?.version||meta?.meta?.version||'');
  if(!compatiblePatch(providerPatch,TARGET_PATCH))throw new Error(`OP.GG patch mismatch: provider=${providerPatch}, canonical=${TARGET_PATCH}`);
  const names=new Map((meta?.data||[]).map(x=>[Number(x.id),String(x.name||'')]));
  const ids=(list?.data||[]).map(x=>Number(x.id)).filter(Number.isFinite);
  if(ids.length<170)throw new Error(`OP.GG ARAM roster unexpectedly small: ${ids.length}`);
  return {providerPatch,names,ids,listMeta:list?.meta||{}};
}
async function fetchChampion(id){
  return fetchJson(`${OPGG}/api/global/champions/aram/${id}/none?hl=ko_KR`);
}
async function probe(){
  const [{providerPatch,names,ids,listMeta},{ddVersion,itemMap}]=await Promise.all([loadIndex(),loadItemMap()]);
  const id=103;
  const payload=await fetchChampion(id);
  const info=payload?.data||{};
  const picked=chooseBaseline(info,itemMap);
  console.log(JSON.stringify({canonicalPatch:TARGET_PATCH,providerPatch,ddVersion,rosterCount:ids.length,providerMeta:listMeta,champion:{id,name:names.get(id),responseMeta:payload?.meta,keys:Object.keys(info),starter_items:(info.starter_items||[]).slice(0,3),boots:(info.boots||[]).slice(0,3),core_items:(info.core_items||[]).slice(0,5),last_items:(info.last_items||[]).slice(0,5),selected:{...picked,starterNames:itemNames(picked.starterItemIds,itemMap),bootsName:itemMap[String(picked.bootsId)]?.name||'',coreNames:itemNames(picked.coreItemIds,itemMap)}}},null,2));
}
async function mapLimit(xs,limit,fn){
  let at=0;const out=new Array(xs.length);const workers=Array.from({length:Math.min(limit,xs.length)},async()=>{while(true){const i=at++;if(i>=xs.length)return;out[i]=await fn(xs[i],i)}});await Promise.all(workers);return out;
}
async function generate(){
  const [{providerPatch,names,ids,listMeta},{ddVersion,itemMap}]=await Promise.all([loadIndex(),loadItemMap()]);
  const failures=[];
  const rows=await mapLimit(ids,6,async(id,i)=>{
    try{
      const payload=await fetchChampion(id);const info=payload?.data||{};const picked=chooseBaseline(info,itemMap);const coreNames=itemNames(picked.coreItemIds,itemMap);
      if(coreNames.length<2)throw new Error(`too few resolved cores (${coreNames.length})`);
      if((i+1)%20===0)console.log(`fetched ${i+1}/${ids.length}`);
      return {championId:id,name:names.get(id)||String(id),starterItemIds:picked.starterItemIds,starterNames:itemNames(picked.starterItemIds,itemMap),bootsId:picked.bootsId,bootsName:itemMap[String(picked.bootsId)]?.name||'',coreItemIds:picked.coreItemIds,coreNames,tree:coreNames.join(' → '),source:'OP.GG ARAM',sourceUrl:`https://op.gg/ko/lol/modes/aram/${String(names.get(id)||id).toLowerCase().replace(/[^a-z0-9]/g,'')}/build`,providerPatch,canonicalPatch:TARGET_PATCH,providerAnalyzedAt:payload?.meta?.analyzed_at||listMeta?.analyzed_at||null};
    }catch(err){failures.push({championId:id,name:names.get(id)||String(id),error:String(err?.message||err)});return null;}
  });
  const champions=Object.fromEntries(rows.filter(Boolean).sort((a,b)=>a.championId-b.championId).map(r=>[String(r.championId),r]));
  const count=Object.keys(champions).length;
  if(failures.length||count!==ids.length)throw new Error(`incomplete ARAM cache: ${count}/${ids.length}; failures=${JSON.stringify(failures.slice(0,10))}`);
  const doc={schemaVersion:1,mode:'ARAM',excludes:['ARAM_MAYHEM'],canonicalPatch:TARGET_PATCH,provider:'OP.GG',providerPatch,ddragonVersion:ddVersion,generatedAt:new Date().toISOString(),rosterCount:ids.length,champions};
  fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(doc,null,2)+'\n','utf8');
  console.log(`ARAM build cache written: ${count} champions -> ${path.relative(ROOT,OUT)}`);
}
(async()=>{if(process.argv.includes('--probe'))await probe();else await generate()})().catch(err=>{console.error(err.stack||err);process.exit(1)});
