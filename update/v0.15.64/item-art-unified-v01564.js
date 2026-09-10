'use strict';
(()=>{
  const V='0.15.64';
  if(window.__ARAM_ITEM_ART_UNIFIED_V01564__)return;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
  const key=s=>norm(s).toLowerCase().replace(/[\s·.'’"`():\-_/]/g,'');
  let catalog=null,pending=null,nameToId=new Map(),timer=0,sessionNonce=Date.now().toString(36);
  const runtime=new Map();

  function setCatalog(x){
    catalog=x||null;nameToId=new Map();
    for(const [id,it] of Object.entries(catalog?.items||{})){
      const name=norm(it?.name);if(name)nameToId.set(key(name),String(id));
    }
  }
  async function loadCatalog(){
    if(catalog?.ok)return catalog;if(pending)return pending;
    const api=window.aramDesktop?.getItemCatalog;if(typeof api!=='function')return null;
    pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);return x||null}).catch(()=>null).finally(()=>{pending=null});
    return pending;
  }
  function addBust(url,id,index){
    const src=String(url||'');if(!src)return'';
    try{const u=new URL(src);u.searchParams.set('aramItemArt',V);u.searchParams.set('item',String(id));u.searchParams.set('candidate',String(index));u.searchParams.set('session',sessionNonce);return u.toString()}catch{return src}
  }
  function candidates(id){
    const it=catalog?.items?.[String(id)];if(!it)return[];
    const xs=[it.iconPrimaryUrl,it.iconUrl,...(Array.isArray(it.iconFallbackUrls)?it.iconFallbackUrls:[])].filter(Boolean);
    const out=[];const seen=new Set();
    xs.forEach(x=>{const clean=String(x);if(!seen.has(clean)){seen.add(clean);out.push(clean)}});
    return out;
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
  function clearLegacyFlags(img){
    const attrs=['aramArtFailedV01560','aramArtFallbackV01560','aramCurrentArtFallbackV01563'];
    for(const a of attrs)delete img.dataset[a];
    img.removeAttribute('data-aram-current-art-v01563');
  }
  function mark(id,state,index,url){
    const it=catalog?.items?.[String(id)];runtime.set(String(id),{id:String(id),name:it?.name||'',state,index,url:String(url||''),at:Date.now()});
  }
  function applyCandidate(img,id,index){
    const xs=candidates(id);if(!xs.length){mark(id,'missing',-1,'');img.style.display='none';return}
    if(index>=xs.length){mark(id,'missing',index,'');img.style.display='none';return}
    const base=xs[index],wanted=addBust(base,id,index);
    img.dataset.itemId=String(id);
    img.dataset.aramUnifiedItemArtV01564=String(id);
    img.dataset.aramUnifiedCandidateV01564=String(index);
    /* v0.15.60 refresh treats raw.communitydragon latest + this marker as already refreshed. */
    img.dataset.aramArtV01560=String(id);
    img.referrerPolicy='no-referrer';
    img.onerror=()=>{
      if(img.dataset.aramUnifiedItemArtV01564!==String(id))return;
      applyCandidate(img,id,index+1);
    };
    img.onload=()=>{
      if(img.dataset.aramUnifiedItemArtV01564!==String(id))return;
      mark(id,index===0?'primary':'fallback',index,base);
      img.style.display='';
    };
    mark(id,'pending',index,base);
    img.style.display='';
    img.src=wanted;
  }
  function refreshImg(img){
    const id=idFrom(img);if(!id)return;
    const xs=candidates(id);if(!xs.length)return;
    const currentIndex=Number(img.dataset.aramUnifiedCandidateV01564||0);
    const expected=xs[Math.max(0,currentIndex)]||xs[0];
    const current=String(img.getAttribute('src')||'');
    if(img.dataset.aramUnifiedItemArtV01564===id&&expected&&current.includes(expected))return;
    clearLegacyFlags(img);applyCandidate(img,id,0);
  }
  function sync(){
    if(!catalog?.ok){loadCatalog().then(()=>{if(catalog?.ok)sync()});return}
    $$('img').forEach(refreshImg);
  }
  function catalogList(kind){
    const rows=Object.values(catalog?.items||{}).filter(x=>x.map12&&x.purchasable);
    if(kind==='fallback')return rows.filter(x=>!x.iconPrimaryUrl&&x.iconUrl).map(x=>({id:x.id,name:x.name,source:x.iconSource}));
    if(kind==='missing')return rows.filter(x=>!x.iconUrl).map(x=>({id:x.id,name:x.name}));
    return rows.map(x=>({id:x.id,name:x.name,primary:!!x.iconPrimaryUrl,source:x.iconSource}));
  }
  function getAuditReport(){
    const audit=catalog?.iconAudit||{};
    const states=[...runtime.values()];
    return{
      version:V,
      catalogVersion:catalog?.version||'',
      managedAramItems:Number(audit.aramPurchasable||0),
      latestPathMapped:Number(audit.primaryMapped||0),
      resolverFallbackOnly:Number(audit.fallbackOnly||0),
      resolverMissing:Number(audit.missing||0),
      runtimeSeen:states.length,
      runtimePrimarySuccess:states.filter(x=>x.state==='primary').length,
      runtimeFallbackSuccess:states.filter(x=>x.state==='fallback').length,
      runtimePending:states.filter(x=>x.state==='pending').length,
      runtimeMissing:states.filter(x=>x.state==='missing').length,
      fallbackItems:catalogList('fallback'),
      missingItems:catalogList('missing'),
      runtimeItems:states.sort((a,b)=>Number(a.id)-Number(b.id)),
      primarySource:'CommunityDragon latest /game/assets/items/icons2d',
      fallbackChain:['CommunityDragon latest client plugin asset','Data Dragon current item version'],
      cachePolicy:`cache-bust ${V} + per-session nonce + legacy item-art flags invalidated`,
      score_logic_changed:false
    };
  }
  function printAudit(){const r=getAuditReport();console.info('[ARAM item art audit]',r);return r}
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,45)}
  function start(){
    loadCatalog().then(()=>{sync();printAudit()});sync();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-item-id','alt','title']});
    document.addEventListener('click',schedule,true);
    setInterval(schedule,650);
    window.__ARAM_ITEM_ART_UNIFIED_V01564__=true;
    /* Keep the historical marker true because current main still validates all installed layers. */
    window.__ARAM_ITEM_ART_HOTFIX_V01563__=true;
    window.aramItemArtResolverV01564={version:V,refresh:sync,resolve:(idOrName)=>{
      const raw=String(idOrName??''),id=catalog?.items?.[raw]?raw:(nameToId.get(key(raw))||'');
      return id?{id,item:catalog.items[id],candidates:candidates(id)}:null;
    },getAuditReport,printAudit,getCatalog:()=>catalog,score_logic_changed:false};
  }
  start();
})();
