'use strict';
const fs=require('fs');
const path=require('path');

// v0.15.80 latest-only item art policy.
// Keep the v0.15.79 safety baseline and the v0.15.80 source-stability patch,
// but never render legacy Data Dragon / client-plugin fallback item artwork.
const stability=require('./runtime-source-stability-v01580');
const basePatch=stability.patchRuntimeSource;

function replaceOne(src,oldText,newText,label){
  if(src.includes(newText))return src;
  const n=src.split(oldText).length-1;
  if(n!==1)throw new Error(`v0.15.80 latest-art contract mismatch ${label} count=${n}`);
  return src.replace(oldText,newText);
}

function latestOnlyItemArt(file,input){
  let src=basePatch(file,input);

  if(file==='random-item-icons-v01556.js'){
    src=replaceOne(
      src,
      "  function iconUrl(id){const ver=encodeURIComponent(String(catalog?.version||'16.17.1'));return `https://ddragon.leagueoflegends.com/cdn/${ver}/img/item/${encodeURIComponent(String(id))}.png`}",
      "  function iconUrl(id){return String(catalog?.items?.[String(id)]?.iconPrimaryUrl||'')}",
      'random icon latest source'
    );
    src=replaceOne(
      src,
      "    if(!id)return null;const img=document.createElement('img');img.className=`riItemIconV01556 ${kind}`.trim();img.dataset.itemId=String(id);img.src=iconUrl(id);img.alt=norm(name)||'아이템';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;",
      "    if(!id)return null;const url=iconUrl(id);if(!url)return null;const img=document.createElement('img');img.className=`riItemIconV01556 ${kind}`.trim();img.dataset.itemId=String(id);img.src=url;img.alt=norm(name)||'아이템';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;",
      'random icon no legacy fallback'
    );
  }

  if(file==='item-icons-global-v01557.js'){
    src=replaceOne(
      src,
      "  function iconUrl(id){const ver=encodeURIComponent(String(catalog?.version||'16.17.1'));return `https://ddragon.leagueoflegends.com/cdn/${ver}/img/item/${encodeURIComponent(String(id))}.png`}",
      "  function iconUrl(id){return String(catalog?.items?.[String(id)]?.iconPrimaryUrl||'')}",
      'global icon latest source'
    );
    src=replaceOne(
      src,
      "    if(!id)return null;const img=document.createElement('img');img.className=`aramItemIconV01557 ${kind}`.trim();img.dataset.itemId=String(id);img.src=iconUrl(id);img.alt=norm(name)||'아이템';img.title=norm(name)||`Item ${id}`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;",
      "    if(!id)return null;const url=iconUrl(id);if(!url)return null;const img=document.createElement('img');img.className=`aramItemIconV01557 ${kind}`.trim();img.dataset.itemId=String(id);img.src=url;img.alt=norm(name)||'아이템';img.title=norm(name)||`Item ${id}`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;",
      'global icon no legacy fallback'
    );
  }

  if(file==='item-art-runtime-v01566.js'){
    src=replaceOne(
      src,
      "function ensureStyle(){if(document.getElementById('aramItemArtRuntimeStyleV01566'))return;const st=document.createElement('style');st.id='aramItemArtRuntimeStyleV01566';st.textContent=`img[data-aram-item-art-switching-v01566=\"1\"]{visibility:hidden!important;transition:none!important} img[data-aram-item-art-ready-v01566=\"1\"]{visibility:visible!important}`;document.head.appendChild(st)}",
      "function ensureStyle(){if(document.getElementById('aramItemArtRuntimeStyleV01566'))return;const st=document.createElement('style');st.id='aramItemArtRuntimeStyleV01566';st.textContent=`img[src*=\"ddragon.leagueoflegends.com\"][src*=\"/img/item/\"]{visibility:hidden!important} img[src*=\"raw.communitydragon.org\"][src*=\"/plugins/rcp-be-lol-game-data/\"][src*=\"/assets/items/icons2d/\"]{visibility:hidden!important} img[data-aram-item-art-switching-v01566=\"1\"]{visibility:hidden!important;transition:none!important} img[data-aram-item-art-ready-v01566=\"1\"]{visibility:visible!important}`;document.head.appendChild(st)}",
      'art runtime suppress legacy paint'
    );
    src=replaceOne(
      src,
      "function candidates(id){const it=catalog?.items?.[String(id)];if(!it)return[];const xs=[it.iconPrimaryUrl,it.iconUrl,...(Array.isArray(it.iconFallbackUrls)?it.iconFallbackUrls:[])].filter(Boolean);const out=[],seen=new Set();for(const x of xs){const v=String(x);if(!seen.has(v)){seen.add(v);out.push(v)}}return out}",
      "function candidates(id){const it=catalog?.items?.[String(id)];const url=String(it?.iconPrimaryUrl||'');return url?[url]:[]}",
      'art runtime latest-only candidates'
    );
    src=replaceOne(
      src,
      "if(!xs.length||index>=xs.length){delete img.dataset.aramItemArtSwitchingV01566;img.style.visibility='';counters.missing++;record(id,'missing',index,'');return}",
      "if(!xs.length||index>=xs.length){delete img.dataset.aramItemArtSwitchingV01566;img.style.display='none';counters.missing++;record(id,'missing',index,'');return}",
      'art runtime missing hides icon'
    );
    src=replaceOne(
      src,
      "const xs=candidates(id);if(!xs.length)return;const current=String(img.currentSrc||img.getAttribute('src')||'');",
      "const xs=candidates(id);if(!xs.length){img.style.display='none';return}const current=String(img.currentSrc||img.getAttribute('src')||'');",
      'art runtime no primary hides old art'
    );
  }

  return src;
}

// The runtime loader requires this module later from the compiled v0.15.79 baseline.
// Replace its cached export before compiling so all injected item layers use the strict policy.
stability.patchRuntimeSource=latestOnlyItemArt;
stability.score_logic_changed=false;

const basePath=path.join(__dirname,'main-v01579.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.79';
const hits=src.split(marker).length-1;
if(hits<6)throw new Error('v0.15.80 safety-baseline successor contract mismatch: v0.15.79 markers='+hits);
const sourceStabilityOld="runtime-source-stability-v01579";
if(src.split(sourceStabilityOld).length-1!==1)throw new Error('v0.15.80 runtime source-stability contract mismatch');
src=src.replaceAll('0.15.79','0.15.80').replace(sourceStabilityOld,'runtime-source-stability-v01580');
module._compile(src,__filename);
