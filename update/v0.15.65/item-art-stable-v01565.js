'use strict';
(()=>{
  const V='0.15.65';
  if(window.__ARAM_ITEM_ART_STABLE_V01565__)return;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
  const key=s=>norm(s).toLowerCase().replace(/[\s·.'’"`():\-_/]/g,'');
  const sessionNonce=Date.now().toString(36);
  let catalog=null,pending=null,nameToId=new Map(),observer=null,scanTimer=0;
  const runtime=new Map();
  const counters={correctedFromLegacy:0,primaryReady:0,fallbackReady:0,missing:0,immediateMutationPasses:0,sameAssetSkips:0};

  function ensureStyle(){
    if(document.getElementById('aramItemArtStableStyleV01565'))return;
    const st=document.createElement('style');
    st.id='aramItemArtStableStyleV01565';
    st.textContent=`
      /* Never paint a legacy Data Dragon item frame before the current-art resolver replaces it. */
      img[src*="ddragon.leagueoflegends.com"][src*="/img/item/"]:not([data-aram-item-art-fallback-v01565="1"]){visibility:hidden!important}
      img[data-aram-item-art-switching-v01565="1"]{visibility:hidden!important;transition:none!important}
      img[data-aram-item-art-ready-v01565="1"]{visibility:visible!important}
    `;
    document.head.appendChild(st);
  }

  function setCatalog(x){
    catalog=x||null;nameToId=new Map();
    for(const [id,it] of Object.entries(catalog?.items||{})){
      const name=norm(it?.name);if(name)nameToId.set(key(name),String(id));
    }
  }
  async function loadCatalog(){
    if(catalog?.ok)return catalog;if(pending)return pending;
    const reused=window.aramItemArtResolverV01564?.getCatalog?.();
    if(reused?.ok){setCatalog(reused);return reused}
    const api=window.aramDesktop?.getItemCatalog;if(typeof api!=='function')return null;
    pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);return x||null}).catch(()=>null).finally(()=>{pending=null});
    return pending;
  }

  function idFrom(img){
    const direct=String(img?.dataset?.itemId||'').match(/^\d+$/)?.[0];if(direct&&catalog?.items?.[direct])return direct;
    const holder=img?.closest?.('[data-item-id],[data-ri-icon-item-v01556],[data-aram-item-icon-v01557]');
    const byData=String(holder?.dataset?.itemId||holder?.dataset?.riIconItemV01556||holder?.dataset?.aramItemIconV01557||'').match(/\d+/)?.[0];
    if(byData&&catalog?.items?.[byData])return byData;
    const src=String(img?.getAttribute?.('src')||'');
    const bySrc=src.match(/(?:\/img\/item\/|\/item\/|\/icons2d\/)(\d+)(?:[_./?]|$)/i)?.[1]||'';
    if(bySrc&&catalog?.items?.[bySrc])return bySrc;
    for(const text of [img?.alt,img?.title]){const byName=nameToId.get(key(text));if(byName)return byName}
    return'';
  }
  function candidates(id){
    const it=catalog?.items?.[String(id)];if(!it)return[];
    const xs=[it.iconPrimaryUrl,it.iconUrl,...(Array.isArray(it.iconFallbackUrls)?it.iconFallbackUrls:[])].filter(Boolean);
    const out=[],seen=new Set();
    for(const x of xs){const v=String(x);if(!seen.has(v)){seen.add(v);out.push(v)}}
    return out;
  }
  function assetKey(url){
    try{const u=new URL(String(url||''));return `${u.hostname}${decodeURIComponent(u.pathname).toLowerCase()}`}catch{return String(url||'').split(/[?#]/)[0].toLowerCase()}
  }
  function sameAsset(a,b){return !!a&&!!b&&assetKey(a)===assetKey(b)}
  function busted(url,id,index){
    try{const u=new URL(String(url));u.searchParams.set('aramItemArt',V);u.searchParams.set('item',String(id));u.searchParams.set('candidate',String(index));u.searchParams.set('session',sessionNonce);return u.toString()}catch{return String(url||'')}
  }
  function legacyCompat(img,id,index){
    img.dataset.itemId=String(id);
    img.dataset.aramArtV01560=String(id);
    img.dataset.aramCurrentArtV01563=String(id);
    img.dataset.aramUnifiedItemArtV01564=String(id);
    img.dataset.aramUnifiedCandidateV01564=String(index);
  }
  function record(id,state,index,url){
    const it=catalog?.items?.[String(id)];runtime.set(String(id),{id:String(id),name:it?.name||'',state,index,url:String(url||''),at:Date.now()});
  }
  function markReady(img,id,index,base){
    legacyCompat(img,id,index);
    img.dataset.aramItemArtReadyV01565='1';
    img.dataset.aramItemArtCandidateV01565=String(index);
    delete img.dataset.aramItemArtSwitchingV01565;
    if(String(base).includes('ddragon.leagueoflegends.com'))img.dataset.aramItemArtFallbackV01565='1';else delete img.dataset.aramItemArtFallbackV01565;
    img.style.visibility='';img.style.display='';
    if(index===0)counters.primaryReady++;else counters.fallbackReady++;
    record(id,index===0?'primary':'fallback',index,base);
  }
  function applyCandidate(img,id,index){
    const xs=candidates(id);
    if(!xs.length||index>=xs.length){
      delete img.dataset.aramItemArtSwitchingV01565;
      img.dataset.aramItemArtFallbackV01565='1';
      img.style.visibility='';
      counters.missing++;record(id,'missing',index,'');return;
    }
    const base=xs[index];
    img.dataset.aramItemArtSwitchingV01565='1';
    delete img.dataset.aramItemArtReadyV01565;
    if(String(base).includes('ddragon.leagueoflegends.com'))img.dataset.aramItemArtFallbackV01565='1';else delete img.dataset.aramItemArtFallbackV01565;
    legacyCompat(img,id,index);
    const token=`${id}:${index}:${Date.now()}:${Math.random()}`;img.dataset.aramItemArtTokenV01565=token;
    img.onerror=()=>{
      if(img.dataset.aramItemArtTokenV01565!==token)return;
      applyCandidate(img,id,index+1);
    };
    img.onload=()=>{
      if(img.dataset.aramItemArtTokenV01565!==token)return;
      if(!sameAsset(img.currentSrc||img.src,base)){
        delete img.dataset.aramItemArtSwitchingV01565;refreshImg(img);return;
      }
      markReady(img,id,index,base);
    };
    record(id,'pending',index,base);
    img.src=busted(base,id,index);
  }
  function refreshImg(img){
    if(!img||img.tagName!=='IMG'||!catalog?.ok)return;
    if(img.dataset.aramItemArtSwitchingV01565==='1')return;
    const id=idFrom(img);if(!id)return;
    const xs=candidates(id);if(!xs.length)return;
    const current=String(img.currentSrc||img.getAttribute('src')||'');
    const own=Number(img.dataset.aramItemArtCandidateV01565||-1);
    if(img.dataset.aramItemArtReadyV01565==='1'&&own>=0&&xs[own]&&sameAsset(current,xs[own])){
      legacyCompat(img,id,own);counters.sameAssetSkips++;return;
    }
    if(sameAsset(current,xs[0])){
      markReady(img,id,0,xs[0]);counters.sameAssetSkips++;return;
    }
    if(/ddragon\.leagueoflegends\.com/i.test(current))counters.correctedFromLegacy++;
    applyCandidate(img,id,0);
  }
  function touch(node){
    if(!node)return;
    if(node.nodeType===1&&node.tagName==='IMG')refreshImg(node);
    if(node.nodeType===1)$$('img',node).forEach(refreshImg);
  }
  function scan(){
    if(!catalog?.ok){loadCatalog().then(x=>{if(x?.ok)scan()});return}
    $$('img').forEach(refreshImg);
  }
  function onMutations(records){
    counters.immediateMutationPasses++;
    if(!catalog?.ok){loadCatalog().then(x=>{if(x?.ok)scan()});return}
    for(const rec of records){
      if(rec.type==='attributes'){refreshImg(rec.target);continue}
      for(const node of rec.addedNodes||[])touch(node);
    }
  }
  function getAuditReport(){
    const states=[...runtime.values()];
    return{
      version:V,catalogVersion:catalog?.version||'',singleOwner:true,
      correctedFromLegacy:counters.correctedFromLegacy,
      runtimeItems:states.length,
      primaryReady:states.filter(x=>x.state==='primary').length,
      fallbackReady:states.filter(x=>x.state==='fallback').length,
      pending:states.filter(x=>x.state==='pending').length,
      missing:states.filter(x=>x.state==='missing').length,
      immediateMutationPasses:counters.immediateMutationPasses,
      sameAssetSkips:counters.sameAssetSkips,
      primarySource:'CommunityDragon latest /game/assets/items/icons2d',
      fallbackChain:['CommunityDragon latest client plugin asset','Data Dragon current item version'],
      antiFlicker:'immediate MutationObserver + stale Data Dragon paint suppression + legacy resolver compatibility markers',
      score_logic_changed:false
    };
  }
  function start(){
    ensureStyle();
    observer=new MutationObserver(onMutations);
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-item-id','alt','title']});
    loadCatalog().then(()=>scan());scanTimer=setInterval(scan,1800);
    window.__ARAM_ITEM_ART_STABLE_V01565__=true;
    window.__ARAM_ITEM_ART_SINGLE_OWNER_V01565__=true;
    window.aramItemArtResolverV01565={version:V,refresh:scan,resolve:(idOrName)=>{
      const raw=String(idOrName??''),id=catalog?.items?.[raw]?raw:(nameToId.get(key(raw))||'');
      return id?{id,item:catalog.items[id],candidates:candidates(id)}:null;
    },getAuditReport,getCatalog:()=>catalog,observer,scanTimer,score_logic_changed:false};
  }
  start();
})();
