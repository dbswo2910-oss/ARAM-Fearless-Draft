'use strict';
const identity=require('./identity');
const IMPLEMENTATION_VERSION='0.16-shadow';
const defaultNorm=s=>String(s??'').replace(/\s+/g,' ').trim();
const defaultKey=s=>defaultNorm(s).toLowerCase().replace(/[\s·.'’"`():\-_/]/g,'');
function assetKey(url){try{const u=new URL(String(url||''));return `${u.hostname}${decodeURIComponent(u.pathname).toLowerCase()}`}catch{return String(url||'').split(/[?#]/)[0].toLowerCase()}}
function sameAsset(a,b){return !!a&&!!b&&assetKey(a)===assetKey(b)}
function candidates(catalog,id){const it=catalog?.items?.[String(id)];if(!it)return[];const xs=[it.iconPrimaryUrl,it.iconUrl,...(Array.isArray(it.iconFallbackUrls)?it.iconFallbackUrls:[])].filter(Boolean);const out=[],seen=new Set();for(const x of xs){const v=String(x);if(!seen.has(v)){seen.add(v);out.push(v)}}return out}
function createArtResolver(initialCatalog=null,{norm=defaultNorm,key=defaultKey}={}){
  let catalog=null,nameToId=new Map();
  function setCatalog(next){catalog=next||null;nameToId=identity.buildCanonicalNameIndex(catalog,{norm,key}).nameToId;return catalog}
  function idFrom(img){
    const direct=String(img?.dataset?.itemId||'').match(/^\d+$/)?.[0];if(direct&&catalog?.items?.[direct])return direct;
    const holder=img?.closest?.('[data-item-id],[data-ri-icon-item-v01556],[data-aram-item-icon-v01557]');
    const byData=String(holder?.dataset?.itemId||holder?.dataset?.riIconItemV01556||holder?.dataset?.aramItemIconV01557||'').match(/\d+/)?.[0];if(byData&&catalog?.items?.[byData])return byData;
    const src=String(img?.getAttribute?.('src')||'');const bySrc=src.match(/(?:\/img\/item\/|\/item\/|\/icons2d\/)(\d+)(?:[_./?]|$)/i)?.[1]||'';if(bySrc&&catalog?.items?.[bySrc])return bySrc;
    for(const text of [img?.alt,img?.title]){const byName=nameToId.get(key(text));if(byName)return byName}
    return'';
  }
  function resolve(idOrName){const raw=String(idOrName??''),id=catalog?.items?.[raw]?raw:(nameToId.get(key(raw))||'');return id?{id,item:catalog.items[id],candidates:candidates(catalog,id)}:null}
  function getCatalog(){return catalog}
  if(initialCatalog)setCatalog(initialCatalog);
  return{setCatalog,idFrom,resolve,candidates:id=>candidates(catalog,id),assetKey,sameAsset,getCatalog};
}
module.exports={IMPLEMENTATION_VERSION,assetKey,sameAsset,candidates,createArtResolver,production_active:false,score_logic_changed:false,random_scoring_changed:false,item_recommendation_logic_changed:false};
