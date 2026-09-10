'use strict';
(()=>{
  const V='0.15.56';
  if(window.__ARAM_RANDOM_ITEM_ICONS_V01556__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
  const key=s=>norm(s).toLowerCase().replace(/[\s·.'’"`():\-_/]/g,'');
  let catalog=null,pending=null,nameToId=new Map(),timer=0,retryTimer=0,lastFailureAt=0;

  function ensureStyles(){
    if($('#riItemIconStyleV01556'))return;
    const st=document.createElement('style');st.id='riItemIconStyleV01556';st.textContent=`
      #riCoachShellV01550 .riCoachTitle small::after{content:'INGAME COACH · v0.15.56'!important}
      #riCoachShellV01550 .riItemIconV01556{width:26px;height:26px;border-radius:6px;object-fit:cover;flex:0 0 auto;border:1px solid #42566c;background:#07111d;box-shadow:0 1px 4px rgba(0,0,0,.28)}
      #riCoachShellV01550 .riItemIconV01556.small{width:22px;height:22px;border-radius:5px}
      #riCoachShellV01550 .riItemIconV01556.shop{width:30px;height:30px;border-radius:7px;border-color:#4c836b}
      #riCoachShellV01550 .riItemWithIconV01556{display:flex!important;align-items:center;gap:7px;min-width:0}
      #riCoachShellV01550 .riItemWithIconV01556>b,#riCoachShellV01550 .riItemWithIconV01556>.riItemTextV01556{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #riCoachShellV01550 .riMetric.riNextBuyV01556>b{display:flex;align-items:center;gap:7px}
      #riCoachShellV01550 .riBuildMain.riItemWithIconV01556{font-size:15px}
      #riCoachShellV01550 .riTreeIconsV01556{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0 0 7px}
      #riCoachShellV01550 .riTreeItemV01556{display:inline-flex;align-items:center;gap:5px;min-width:0;border:1px solid #29475f;background:#0b1a29;border-radius:7px;padding:4px 6px;color:#c5d6e5;font-size:8px;font-weight:850}
      #riCoachShellV01550 .riTreeItemV01556 span{max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #riCoachShellV01550 .riTreeArrowV01556{color:#58738b;font-size:10px;font-weight:950}
      #riShopPlannerV01553 .riShopItem{padding:6px 8px}
      #riShopPlannerV01553 .riShopItem.riItemWithIconV01556{gap:7px}
      #riShopPlannerV01553 .riShopFoot b.riItemWithIconV01556{display:inline-flex!important;vertical-align:middle;margin-left:3px}
      @media(max-width:680px){#riCoachShellV01550 .riItemIconV01556{width:24px;height:24px}#riCoachShellV01550 .riItemIconV01556.shop{width:28px;height:28px}}
    `;document.head.appendChild(st);
  }

  async function loadCatalog(){
    if(catalog?.ok)return catalog;if(pending)return pending;
    const api=window.aramDesktop?.getItemCatalog;
    if(typeof api!=='function')return null;
    pending=Promise.resolve().then(()=>api()).then(x=>{
      catalog=x||null;nameToId=new Map();
      if(catalog?.items)for(const [id,it] of Object.entries(catalog.items)){if(it?.name)nameToId.set(key(it.name),String(id))}
      return catalog;
    }).catch(()=>null).finally(()=>{pending=null});
    return pending;
  }
  function findId(name){return nameToId.get(key(name))||''}
  function iconUrl(id){const ver=encodeURIComponent(String(catalog?.version||'16.17.1'));return `https://ddragon.leagueoflegends.com/cdn/${ver}/img/item/${encodeURIComponent(String(id))}.png`}
  function makeImg(id,name,kind=''){
    if(!id)return null;const img=document.createElement('img');img.className=`riItemIconV01556 ${kind}`.trim();img.src=iconUrl(id);img.alt=norm(name)||'아이템';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;
  }
  function decorateExact(el,name,kind=''){
    if(!el||!name||name==='-')return;
    const id=findId(name);if(!id)return;
    if(el.dataset.riIconItemV01556===id&&$('.riItemIconV01556',el))return;
    $$('.riItemIconV01556',el).forEach(x=>x.remove());
    const img=makeImg(id,name,kind);if(!img)return;
    el.prepend(img);el.classList.add('riItemWithIconV01556');el.dataset.riIconItemV01556=id;
  }
  function decorateShop(shell){
    $$('#riShopPlannerV01553 .riShopItem',shell).forEach(el=>{const b=$('b',el),name=norm(b?.textContent);decorateExact(el,name,'shop')});
    const target=$('#riShopPlannerV01553 .riShopFoot b',shell);if(target){const name=norm([...target.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(''))||norm(target.textContent);decorateExact(target,name,'small')}
  }
  function decorateLiveNext(shell){
    $$('.riMetric',shell).forEach(card=>{
      if(norm($('span',card)?.textContent)!=='다음 구매')return;
      card.classList.add('riNextBuyV01556');const b=$('b',card);decorateExact(b,norm(b?.textContent),'small');
    });
  }
  function decorateOptimized(shell){const el=$('.riBuildCard.opt .riBuildMain',shell);decorateExact(el,norm(el?.textContent),'')}
  function treeMatches(text){
    if(!catalog?.items||!text)return[];const low=norm(text);const rows=[];
    for(const [id,it] of Object.entries(catalog.items)){
      const name=norm(it?.name);if(!name||name.length<2)continue;const at=low.indexOf(name);if(at>=0)rows.push({id,name,at});
    }
    rows.sort((a,b)=>a.at-b.at||b.name.length-a.name.length);
    const out=[];const seen=new Set();for(const x of rows){if(seen.has(x.id))continue;seen.add(x.id);out.push(x);if(out.length>=4)break}return out;
  }
  function decorateStatTree(shell){
    const tree=$('.riBuildCard:not(.opt) .riBuildTree',shell);if(!tree)return;
    const text=norm(tree.textContent),sig=key(text);let strip=tree.previousElementSibling;
    if(!strip?.classList?.contains('riTreeIconsV01556')){strip=document.createElement('div');strip.className='riTreeIconsV01556';tree.parentElement.insertBefore(strip,tree)}
    if(strip.dataset.sig===sig)return;strip.dataset.sig=sig;strip.innerHTML='';
    const xs=treeMatches(text);xs.forEach((x,i)=>{if(i){const ar=document.createElement('span');ar.className='riTreeArrowV01556';ar.textContent='→';strip.appendChild(ar)}const chip=document.createElement('span');chip.className='riTreeItemV01556';const img=makeImg(x.id,x.name,'small');if(img)chip.appendChild(img);const t=document.createElement('span');t.textContent=x.name;chip.appendChild(t);strip.appendChild(chip)});
    strip.hidden=!xs.length;
  }

  // v0.15.73 stability fix: a failed catalog response used to recurse forever through
  // loadCatalog().then(sync) because {ok:false} never satisfied the catalog?.ok guard.
  // Keep text UI usable and retry slowly instead of creating an unbounded Promise loop.
  function scheduleCatalogRetry(){
    if(retryTimer)return;
    const wait=Math.max(15000,30000-(Date.now()-lastFailureAt));
    retryTimer=setTimeout(()=>{
      retryTimer=0;
      loadCatalog().then(x=>{if(x?.ok)sync();else lastFailureAt=Date.now()}).catch(()=>{lastFailureAt=Date.now()});
    },wait);
  }
  function sync(){
    const shell=$('#riCoachShellV01550');if(!shell)return;ensureStyles();
    if(!catalog?.ok){
      if(!pending&&(!lastFailureAt||Date.now()-lastFailureAt>=30000)){
        loadCatalog().then(x=>{if(x?.ok)sync();else{lastFailureAt=Date.now();scheduleCatalogRetry()}}).catch(()=>{lastFailureAt=Date.now();scheduleCatalogRetry()});
      }else scheduleCatalogRetry();
      return;
    }
    decorateLiveNext(shell);decorateShop(shell);decorateOptimized(shell);decorateStatTree(shell);
  }
  function start(){
    const shell=$('#riCoachShellV01550');if(!shell){setTimeout(start,160);return}
    ensureStyles();sync();timer=setInterval(sync,320);
    window.__ARAM_RANDOM_ITEM_ICONS_V01556__=true;
    window.aramRandomItemIconsV01556={version:V,refresh:sync,getCatalog:()=>catalog,timer,getStatus:()=>({catalogOk:!!catalog?.ok,pending:!!pending,retryScheduled:!!retryTimer,lastFailureAt}),score_logic_changed:false,source:'Official Data Dragon item icons'};
  }
  start();
})();
