'use strict';
(()=>{
  const V='0.15.126';
  const TARGET='전적검색';
  if(window.__ARAM_MATCH_SEARCH_LABELS_V015126__)return;
  window.__ARAM_MATCH_SEARCH_LABELS_V015126__=true;

  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  const oldExact=v=>['매치 랩','매치랩','Match Lab','MATCH LAB'].includes(norm(v));
  const oldPrefix=v=>/^(?:매치\s*랩|Match Lab|MATCH LAB)(?=\s*[·:|\-/]|\s*$)/.test(norm(v));
  const replaceBrand=v=>{
    const raw=String(v||'');
    const trimmed=norm(raw);
    if(oldExact(trimmed))return raw.replace(/매치\s*랩|Match Lab|MATCH LAB/,TARGET);
    if(oldPrefix(trimmed))return raw.replace(/매치\s*랩|Match Lab|MATCH LAB/,TARGET);
    return raw;
  };

  function renameElement(el){
    if(!el)return 0;
    let changed=0;
    for(const node of [...(el.childNodes||[])]){
      if(node.nodeType!==3)continue;
      const before=String(node.nodeValue||'');
      const after=replaceBrand(before);
      if(after!==before){node.nodeValue=after;changed++}
    }
    for(const child of [...(el.children||[])]){
      if(child.classList?.contains('badge'))continue;
      if(oldExact(child.textContent)){
        child.textContent=TARGET;
        changed++;
        break;
      }
    }
    if(!changed&&oldExact(el.textContent)&&!(el.children||[]).length){el.textContent=TARGET;changed++}
    for(const attr of ['aria-label','title']){
      const before=el.getAttribute?.(attr);
      if(!before)continue;
      const after=replaceBrand(before);
      if(after!==before){el.setAttribute(attr,after);changed++}
    }
    return changed;
  }

  function navLabelWithoutBadges(el){
    if(!el)return'';
    let s='';
    for(const node of [...(el.childNodes||[])]){
      if(node.nodeType===3)s+=node.nodeValue||'';
      else if(node.nodeType===1&&!node.classList?.contains('badge'))s+=' '+(node.textContent||'');
    }
    return norm(s);
  }

  function navCandidates(){
    const selectors=[
      'header [data-view="history"]',
      'header [data-tab="history"]',
      'header [data-page="history"]',
      'header [data-section="history"]',
      'header [aria-controls="history"]',
      'header #nav-history',
      'header #tab-history',
      'header #historyTab'
    ];
    const out=[];
    for(const selector of selectors){
      for(const el of document.querySelectorAll(selector))if(!out.includes(el))out.push(el);
    }
    if(out.length)return out;
    const header=document.querySelector('header');
    if(!header)return out;
    for(const el of header.querySelectorAll('button,a,[role="tab"],[role="button"]')){
      const label=navLabelWithoutBadges(el);
      if(oldExact(label)&&!out.includes(el))out.push(el);
    }
    return out;
  }

  function renameHistoryTitles(){
    const root=document.getElementById('history');
    if(!root)return 0;
    let changed=0;
    const selectors='h1,h2,h3,.heroTitle,.sectionTitle,.panelTitle,.pageTitle,.title';
    for(const el of root.querySelectorAll(selectors)){
      if(oldExact(el.textContent)||oldPrefix(el.textContent))changed+=renameElement(el);
    }
    for(const el of root.querySelectorAll('[aria-label],[title]')){
      const a=el.getAttribute('aria-label'),t=el.getAttribute('title');
      if(oldExact(a)||oldPrefix(a)||oldExact(t)||oldPrefix(t))changed+=renameElement(el);
    }
    return changed;
  }

  function apply(){
    let nav=0;
    for(const el of navCandidates())nav+=renameElement(el);
    const page=renameHistoryTitles();
    document.documentElement?.setAttribute('data-aram-match-search-label',nav>0?'applied':'pending');
    return {nav,page};
  }

  function boot(){
    let frames=0;
    const settle=()=>{
      frames++;
      const r=apply();
      if(r.nav>0||frames>=12)return;
      requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
  }

  window.aramMatchSearchLabelsV015126={version:V,apply,target:TARGET,score_logic_changed:false,random_scoring_changed:false};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
