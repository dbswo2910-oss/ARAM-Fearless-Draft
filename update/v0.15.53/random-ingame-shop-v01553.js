'use strict';
(()=>{
  const V='0.15.53';
  if(window.__ARAM_RANDOM_INGAME_SHOP_V01553__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
  const key=s=>norm(s).toLowerCase().replace(/[\s·.'’"`():\-_/]/g,'');
  let catalog=null,catalogPending=null,nameToId=new Map(),timer=0;

  function ensureStyles(){
    if($('#riShopStyleV01553'))return;
    const st=document.createElement('style');st.id='riShopStyleV01553';st.textContent=`
      /* v0.15.52 still owns the text node; visually expose only the current release label. */
      #riCoachShellV01550 .riCoachTitle small{font-size:0!important}
      #riCoachShellV01550 .riCoachTitle small::after{content:'INGAME COACH · v0.15.53';font-size:8px;letter-spacing:.06em}
      #riShopPlannerV01553{margin:0 0 10px;border:1px solid #3d6d58;border-radius:11px;background:linear-gradient(135deg,#0b211a,#0a1822);overflow:hidden}
      #riShopPlannerV01553 .riShopHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border-bottom:1px solid #244a3b}
      #riShopPlannerV01553 .riShopHead span{font-size:9px;font-weight:950;color:#80b99d;letter-spacing:.04em}
      #riShopPlannerV01553 .riShopHead b{font-size:12px;color:#f0fbf5;white-space:nowrap}
      #riShopPlannerV01553 .riShopMain{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px}
      #riShopPlannerV01553 .riShopBuyLabel{font-size:8px;font-weight:900;color:#6f94ac;margin-bottom:5px}
      #riShopPlannerV01553 .riShopItems{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
      #riShopPlannerV01553 .riShopItem{display:inline-flex;align-items:center;gap:6px;border:1px solid #356c56;border-radius:8px;background:#103225;padding:7px 9px;color:#e9fff4;font-size:11px;font-weight:950}
      #riShopPlannerV01553 .riShopItem em{font-style:normal;color:#8eddb5;font-size:9px;font-weight:850}
      #riShopPlannerV01553 .riShopNone{color:#b3c4d2;font-size:11px;font-weight:850}
      #riShopPlannerV01553 .riShopMoney{text-align:right;min-width:122px}
      #riShopPlannerV01553 .riShopMoney span{display:block;color:#7994aa;font-size:8px;margin-bottom:2px}
      #riShopPlannerV01553 .riShopMoney strong{display:block;color:#f3fbff;font-size:17px}
      #riShopPlannerV01553 .riShopFoot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 11px;background:#091722;border-top:1px solid #213d36;font-size:9px;color:#8ea6b8}
      #riShopPlannerV01553 .riShopFoot b{color:#cfe9dc}
      #riShopPlannerV01553 .riShopDone{color:#8fe6b6!important}
      #riShopPlannerV01553 .riShopWait{padding:10px 11px;color:#8fa6ba;font-size:10px}
      @media(max-width:760px){#riShopPlannerV01553 .riShopMain{grid-template-columns:1fr}#riShopPlannerV01553 .riShopMoney{text-align:left}}
    `;document.head.appendChild(st);
  }

  async function loadCatalog(){
    if(catalog?.ok)return catalog;if(catalogPending)return catalogPending;
    const api=window.aramDesktop?.getItemCatalog;
    if(typeof api!=='function')return null;
    catalogPending=Promise.resolve().then(()=>api()).then(x=>{
      catalog=x||null;nameToId=new Map();
      if(catalog?.items)for(const [id,it] of Object.entries(catalog.items)){if(it?.name)nameToId.set(key(it.name),String(id))}
      return catalog;
    }).catch(()=>null).finally(()=>{catalogPending=null});
    return catalogPending;
  }

  function liveCtx(){try{return typeof randomLiveContext==='function'?randomLiveContext():null}catch{return null}}
  function findItemId(name){return nameToId.get(key(name))||''}

  function collectOwnedIds(ctx){
    const ids=[];const names=[];
    const buckets=[ctx?.local?.items,ctx?.local?.itemIds,ctx?.local?.inventory,ctx?.local?.raw?.items,ctx?.localItems,ctx?.myItems];
    const visit=v=>{
      if(v==null)return;
      if(Array.isArray(v)){v.forEach(visit);return}
      if(typeof v==='number'||(/^\d+$/.test(String(v)))){ids.push(String(v));return}
      if(typeof v==='object'){
        const id=v.itemID??v.itemId??v.item_id??v.id??v.raw?.itemID??v.raw?.itemId;
        if(id!=null&&/^\d+$/.test(String(id)))ids.push(String(id));
        else if(v.displayName||v.name)names.push(String(v.displayName||v.name));
      }
    };
    buckets.forEach(visit);
    names.forEach(n=>{const id=findItemId(n);if(id)ids.push(id)});
    return ids.filter(id=>catalog?.items?.[id]);
  }

  function countOwned(ids){const m=new Map();ids.forEach(id=>m.set(id,(m.get(id)||0)+1));return m}
  function recipeBase(it){
    if(!it)return 0;if(!Array.isArray(it.from)||!it.from.length)return num(it.total);
    if(num(it.base)>0)return num(it.base);
    const direct=it.from.reduce((s,id)=>s+num(catalog?.items?.[id]?.total),0);
    return Math.max(0,num(it.total)-direct);
  }
  function buildTree(id,owned,stack=new Set()){
    const it=catalog?.items?.[id];if(!it||stack.has(id))return null;
    if((owned.get(id)||0)>0){owned.set(id,owned.get(id)-1);return{id,it,name:it.name,owned:true,remaining:0,children:[]}}
    const next=new Set(stack);next.add(id);
    const children=(it.from||[]).map(cid=>buildTree(String(cid),owned,next)).filter(Boolean);
    const remaining=Math.max(0,recipeBase(it)+children.reduce((s,c)=>s+c.remaining,0));
    return{id,it,name:it.name,owned:false,remaining,children};
  }

  function frontier(node,gold,out=[]){
    if(!node||node.owned||node.remaining<=0)return out;
    if(node.remaining<=gold){out.push(node);return out}
    if(!node.children.length)return out;
    node.children.forEach(c=>frontier(c,gold,out));return out;
  }
  function missingNodes(node,out=[]){if(!node||node.owned||node.remaining<=0)return out;out.push(node);node.children.forEach(c=>missingNodes(c,out));return out}
  function bestBasket(candidates,gold){
    const xs=candidates.filter(x=>x.remaining>0&&x.remaining<=gold).slice(0,14);let best=[],spent=0;
    const max=1<<xs.length;
    for(let mask=1;mask<max;mask++){
      let sum=0,row=[];
      for(let i=0;i<xs.length;i++)if(mask&(1<<i)){sum+=xs[i].remaining;if(sum>gold)break;row.push(xs[i])}
      if(sum<=gold&&(sum>spent||(sum===spent&&row.length<best.length))){spent=sum;best=row}
    }
    return{items:best,spent};
  }

  function parseGold(shell){
    const ctx=liveCtx();if(ctx&&Number.isFinite(Number(ctx.currentGold)))return Math.max(0,Number(ctx.currentGold));
    const txt=$('.riRespawnStrip b',shell)?.textContent||'';const m=txt.replace(/,/g,'').match(/(\d+)\s*$/);return m?Number(m[1]):0;
  }
  function targetName(shell){return norm($('.riBuildCard.opt .riBuildMain',shell)?.textContent||'')}
  function shouldShow(shell){
    const title=norm($('#riCoachTitleV01550',shell)?.textContent||'');
    const buildActive=$('[data-ri-tab="build"].active',shell);
    return !!buildActive&&(shell.classList.contains('ri52Dead')||title==='사망 분석');
  }

  function plannerHtml(target,gold,tree,basket,ownedKnown,isPreview){
    const left=Math.max(0,Math.round(gold-basket.spent)),after=Math.max(0,Math.round(tree.remaining-basket.spent));
    const complete=basket.items.length===1&&basket.items[0].id===tree.id&&basket.spent===tree.remaining;
    let buy='';
    if(basket.items.length){buy=basket.items.map(x=>`<span class="riShopItem"><b>${esc(x.name)}</b><em>${Math.round(x.remaining).toLocaleString('ko-KR')}G</em></span>`).join('')}
    else{
      const missing=missingNodes(tree,[]).filter(x=>x.remaining>gold).sort((a,b)=>a.remaining-b.remaining)[0];
      buy=missing?`<span class="riShopNone">지금 구매 가능한 조합 부품 없음 · ${Math.max(0,Math.ceil(missing.remaining-gold)).toLocaleString('ko-KR')}G 더 필요</span>`:`<span class="riShopNone">추가 구매 없음</span>`;
    }
    const badge=isPreview?'미리보기 · 보유 부품 없음 가정':ownedKnown?'보유 부품 반영':'';
    return `<div class="riShopHead"><span>💰 지금 구매${badge?` · ${esc(badge)}`:''}</span><b>${Math.round(gold).toLocaleString('ko-KR')}G 보유</b></div><div class="riShopMain"><div><div class="riShopBuyLabel">이번 죽음에 바로 살 것</div><div class="riShopItems">${buy}</div></div><div class="riShopMoney"><span>구매 후 잔여</span><strong>${left.toLocaleString('ko-KR')}G</strong></div></div><div class="riShopFoot"><span>최종 목표 · <b>${esc(target)}</b></span><span class="${complete?'riShopDone':''}">${complete?'이번 죽음에 완성 가능':`구매 후 코어까지 ${after.toLocaleString('ko-KR')}G`}</span></div>`;
  }

  function sync(){
    const root=$('#random'),shell=$('#riCoachShellV01550');if(!root||!shell)return;
    ensureStyles();
    const eyebrow=$('.riCoachTitle small',shell);if(eyebrow)eyebrow.setAttribute('aria-label',`INGAME COACH · v${V}`);
    const old=$('#riShopPlannerV01553',shell);
    if(!shouldShow(shell)){old?.remove();return}
    const compare=$('.riBuildCompare',shell),strip=$('.riRespawnStrip',shell);if(!compare||!strip)return;
    let box=old;if(!box){box=document.createElement('div');box.id='riShopPlannerV01553';compare.parentElement.insertBefore(box,compare)}
    if(!catalog?.ok){box.innerHTML='<div class="riShopWait">아이템 조합표 확인 중…</div>';loadCatalog().then(()=>sync());return}
    const target=targetName(shell),id=findItemId(target),gold=parseGold(shell),isPreview=shell.classList.contains('preview');
    if(!target||target==='-'||!id){box.innerHTML='<div class="riShopWait">다음 코어가 확정되면 즉시 구매 부품을 계산합니다.</div>';return}
    const ctx=isPreview?null:liveCtx(),ownedIds=isPreview?[]:collectOwnedIds(ctx),ownedKnown=isPreview||ownedIds.length>0;
    if(!isPreview&&!ownedKnown){box.innerHTML='<div class="riShopWait">현재 보유 부품을 확인하는 중입니다. 중복 구매 방지를 위해 확인 전에는 구매 지시를 숨깁니다.</div>';return}
    const tree=buildTree(id,countOwned(ownedIds));if(!tree){box.innerHTML='<div class="riShopWait">아이템 조합표를 계산할 수 없습니다.</div>';return}
    const candidates=frontier(tree,gold,[]),basket=bestBasket(candidates,gold);
    box.innerHTML=plannerHtml(target,gold,tree,basket,ownedKnown,isPreview);
  }

  function start(){
    const root=$('#random'),shell=$('#riCoachShellV01550');if(!root||!shell){setTimeout(start,160);return}
    ensureStyles();loadCatalog().then(()=>sync());sync();timer=setInterval(sync,360);
    window.__ARAM_RANDOM_INGAME_SHOP_V01553__=true;
    window.aramRandomIngameShopV01553={version:V,refresh:sync,getCatalog:()=>catalog,score_logic_changed:false,source:'Data Dragon recipe-aware death shop planner'};
  }
  start();
})();
