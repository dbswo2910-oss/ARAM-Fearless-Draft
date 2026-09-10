'use strict';
(()=>{
  const V='0.15.57';
  if(window.__ARAM_ITEM_ICONS_GLOBAL_V01557__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
  const key=s=>norm(s).toLowerCase().replace(/[\s·.'’"`():\-_/]/g,'');
  let catalog=null,pending=null,nameToId=new Map(),names=[],timer=0;

  function ensureStyles(){
    if($('#aramItemGlobalStyleV01557'))return;
    const st=document.createElement('style');st.id='aramItemGlobalStyleV01557';st.textContent=`
      #riCoachShellV01550 .riCoachTitle small::after{content:'INGAME COACH · v0.15.57'!important}
      .aramItemIconV01557{width:25px;height:25px;object-fit:cover;border-radius:6px;border:1px solid #3b5871;background:#07111d;box-shadow:0 1px 4px rgba(0,0,0,.25);vertical-align:middle;flex:0 0 auto}
      .aramItemIconV01557.xs{width:20px;height:20px;border-radius:5px;margin-right:6px}
      .aramItemIconV01557.tree{width:24px;height:24px}
      .aramItemIconV01557.inv{width:22px;height:22px}
      .aramItemStripV01557{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:0 0 6px;min-height:0}
      .aramItemStripV01557.compact{gap:4px;margin-bottom:5px}
      .aramItemStripV01557.inventory{gap:4px;margin:2px 0 5px}
      .aramItemInlineV01557{margin-right:7px}
      #liveBuilds .buildGrid>div .aramItemStripV01557,#randomBuilds .buildGrid>div .aramItemStripV01557{margin-top:1px}
      #liveUtils td:nth-child(6),#randomUtils td:nth-child(6){white-space:nowrap}
      #dataCard .dataInfoBlock.good .aramItemStripV01557,#dataCard .altProfileCard .aramItemStripV01557{margin-top:6px}
      #historyMatchDetail .matchBuildAdvice .aramItemStripV01557{margin:5px 0 6px}
      #randomThreatList .randomThreatCardMeta .aramItemStripV01557{margin:3px 0 5px}
      @media(max-width:760px){.aramItemIconV01557{width:23px;height:23px}.aramItemIconV01557.tree{width:22px;height:22px}}
    `;document.head.appendChild(st);
  }

  async function loadCatalog(){
    if(catalog?.ok)return catalog;if(pending)return pending;
    const reused=window.aramRandomItemIconsV01556?.getCatalog?.();
    if(reused?.ok){setCatalog(reused);return reused}
    const api=window.aramDesktop?.getItemCatalog;if(typeof api!=='function')return null;
    pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);return x||null}).catch(()=>null).finally(()=>{pending=null});
    return pending;
  }
  function setCatalog(x){
    catalog=x;nameToId=new Map();names=[];
    for(const [id,it] of Object.entries(catalog?.items||{})){
      const name=norm(it?.name);if(!name)continue;
      nameToId.set(key(name),String(id));
      if(name.length>=2)names.push({id:String(id),name,k:key(name)});
    }
    names.sort((a,b)=>b.name.length-a.name.length);
  }
  function iconUrl(id){const ver=encodeURIComponent(String(catalog?.version||'16.17.1'));return `https://ddragon.leagueoflegends.com/cdn/${ver}/img/item/${encodeURIComponent(String(id))}.png`}
  function imgFor(id,name,kind='tree'){
    if(!id)return null;const img=document.createElement('img');img.className=`aramItemIconV01557 ${kind}`.trim();img.src=iconUrl(id);img.alt=norm(name)||'아이템';img.title=norm(name)||`Item ${id}`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.display='none'};return img;
  }
  function exactId(text){return nameToId.get(key(text))||''}
  function matches(text,limit=6){
    const src=norm(text);if(!src||!catalog?.ok)return[];const found=[];
    for(const x of names){const at=src.indexOf(x.name);if(at<0)continue;found.push({...x,at,end:at+x.name.length})}
    found.sort((a,b)=>a.at-b.at||b.name.length-a.name.length);
    const out=[],ids=new Set();
    for(const x of found){if(ids.has(x.id)||out.some(y=>x.at<y.end&&x.end>y.at))continue;ids.add(x.id);out.push(x);if(out.length>=limit)break}
    return out.sort((a,b)=>a.at-b.at);
  }
  function ensureStrip(host,text,slot='tree',limit=6,kind='tree'){
    if(!host)return;const source=norm(text),sig=key(source),selector=`:scope > .aramItemStripV01557[data-slot="${slot}"]`;let strip=$(selector,host);
    if(host.dataset[`itemSig${slot.replace(/[^a-z0-9]/gi,'')}`]===sig&&strip)return;
    host.dataset[`itemSig${slot.replace(/[^a-z0-9]/gi,'')}`]=sig;
    if(strip)strip.remove();const xs=matches(source,limit);if(!xs.length)return;
    strip=document.createElement('div');strip.className=`aramItemStripV01557 ${slot==='inventory'?'inventory':'compact'}`;strip.dataset.slot=slot;
    for(const x of xs){const img=imgFor(x.id,x.name,kind);if(img)strip.appendChild(img)}
    if(strip.childElementCount)host.prepend(strip);
  }
  function ensureInline(el,text,slot='inline'){
    if(!el)return;const source=norm(text),id=exactId(source),old=$(`.aramItemIconV01557[data-slot="${slot}"]`,el);
    if(!id){old?.remove();return}if(old?.dataset.itemId===id)return;old?.remove();const img=imgFor(id,source,'xs aramItemInlineV01557');if(!img)return;img.dataset.slot=slot;img.dataset.itemId=id;el.prepend(img);
  }

  function decorateBuildGrid(rootId){
    const root=$(rootId),grid=$('.buildGrid',root);if(!grid)return;const cells=[...grid.children];
    for(let i=5;i+4<cells.length;i+=5){ensureStrip(cells[i+2],cells[i+2].textContent,'buildTree',5,'tree');ensureStrip(cells[i+4],cells[i+4].textContent,'assignedUtil',3,'xs')}
  }
  function decorateUtilityTable(rootId){
    const root=$(rootId);if(!root)return;$$('table.utilityTable tbody tr',root).forEach((tr,i)=>{const td=tr.children?.[5];if(td)ensureInline(td,td.textContent,`util${i}`)})
  }
  function decorateRandomUtilityCards(){
    const root=$('#randomUtils');if(!root)return;$$('.randomUtilityCard',root).forEach((card,i)=>{const line=$(':scope > span',card);if(!line)return;const xs=matches(line.textContent,1);if(!xs.length)return;let old=$(`.aramItemIconV01557[data-slot="ru${i}"]`,line);if(old?.dataset.itemId===xs[0].id)return;old?.remove();const img=imgFor(xs[0].id,xs[0].name,'xs aramItemInlineV01557');if(img){img.dataset.slot=`ru${i}`;img.dataset.itemId=xs[0].id;line.prepend(img)}})
  }
  function decorateLegacyRandomItems(){
    const top=$('#randomLiveTopbar .randomLiveTopCell.item b');ensureInline(top,top?.textContent,'randomTopNext');
    const summary=$('#randomLiveSummary');$$('.randomLiveQuickCard',summary).forEach((card,i)=>{if(norm($('span',card)?.textContent)==='다음 구매'){const b=$('b',card);ensureInline(b,b?.textContent,`randomQuick${i}`)}});
    const advice=$('#randomLiveBuildAdvice');$$('.liveNextItem > b',advice).forEach((b,i)=>ensureInline(b,b.textContent,`randomAdvice${i}`));
    const owned=$('.liveOwnedLine',advice);if(owned)ensureStrip(owned,owned.textContent,'inventory',6,'inv');
    const threats=$('#randomThreatList');$$('.randomThreatCardMeta',threats).forEach((meta,i)=>ensureStrip(meta,meta.textContent,`threatInv${i}`,6,'inv'));
  }
  function decorateData(){
    const card=$('#dataCard');if(!card)return;const primary=$('.dataInfoGrid .dataInfoBlock.good',card);if(primary){const b=$(':scope > b',primary);ensureStrip(primary,b?.textContent,'dataPrimary',5,'tree')}
    $$('.altProfileGrid .altProfileCard',card).forEach((row,i)=>{const text=$(':scope > small',row);if(text)ensureStrip(row,text.textContent,`dataAlt${i}`,5,'xs')});
  }
  function decorateMatchLab(){
    const root=$('#historyMatchDetail'),advice=$('.matchBuildAdvice',root);if(advice){const b=$(':scope > b',advice);ensureStrip(advice,b?.textContent,'matchAdvice',5,'tree')}
    /* .matchItems already uses Riot item artwork in the base Match Lab renderer; never duplicate it. */
  }
  function sync(){
    ensureStyles();if(!catalog?.ok){loadCatalog().then(()=>{if(catalog?.ok)sync()});return}
    window.aramRandomItemIconsV01556?.refresh?.();
    decorateBuildGrid('#liveBuilds');decorateUtilityTable('#liveUtils');
    decorateBuildGrid('#randomBuilds');decorateUtilityTable('#randomUtils');decorateRandomUtilityCards();decorateLegacyRandomItems();
    decorateData();decorateMatchLab();
  }
  function start(){ensureStyles();loadCatalog().then(()=>sync());sync();timer=setInterval(sync,700);window.__ARAM_ITEM_ICONS_GLOBAL_V01557__=true;window.aramItemIconsGlobalV01557={version:V,refresh:sync,getCatalog:()=>catalog,timer,targets:['#liveBuilds','#liveUtils','#randomLiveTopbar','#randomLiveSummary','#randomLiveBuildAdvice','#randomBuilds','#randomUtils','#randomThreatList','#dataCard','#historyMatchDetail'],score_logic_changed:false,source:'Official Data Dragon item icons · exact known item surfaces'};}
  start();
})();
