'use strict';
(()=>{
  const V='0.15.114';
  if(window.__ARAM_RANDOM_PICK_INTEGRITY_V015114__===true)return;
  window.__ARAM_RANDOM_PICK_INTEGRITY_V015114__=true;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number(n)||0));
  const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let selectedIndex=null,refreshWrapped=false,repairTimer=0;

  function mode(root){return String(root?.dataset?.randomMode||'pick')==='ingame'?'ingame':'pick'}

  function ensureStyle(){
    if($('#randomPickIntegrityStyleV015114'))return;
    const st=document.createElement('style');
    st.id='randomPickIntegrityStyleV015114';
    st.textContent=`
      /* v0.15.114 — RANDOM PICK integrity layer.
         Stronger than historical v90/v107/v111/v112 rules and scoped to PICK only. */
      #random.rp114PickIntegrity[data-random-mode="pick"]{
        width:min(1720px,calc(100vw - 28px))!important;
        max-width:none!important;
      }
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor.rp107RandomGrid,
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor.rp112WorkspaceGrid,
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor{
        display:grid!important;
        grid-template-columns:minmax(300px,360px) minmax(0,1fr)!important;
        gap:12px!important;
        align-items:start!important;
        min-width:0!important;
      }
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp107Left,
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp112Left{
        grid-column:1!important;
        grid-row:1 / span 2!important;
        min-width:0!important;
        width:100%!important;
      }
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp107Center,
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp112Center{
        grid-column:2!important;
        grid-row:1!important;
        min-width:0!important;
        width:100%!important;
      }
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp107Right,
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp112Right{
        grid-column:2!important;
        grid-row:2!important;
        display:grid!important;
        grid-template-columns:repeat(auto-fit,minmax(360px,1fr))!important;
        gap:10px!important;
        align-items:start!important;
        align-content:start!important;
        min-width:0!important;
        width:100%!important;
        max-width:none!important;
        margin:0!important;
      }
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp107Right>*,
      #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp112Right>*{
        min-width:0!important;
        width:100%!important;
        max-width:100%!important;
        box-sizing:border-box!important;
      }
      #random.rp114PickIntegrity[data-random-mode="pick"] #rpPickIntelV01589,
      #random.rp114PickIntegrity[data-random-mode="pick"] #comboDetail,
      #random.rp114PickIntegrity[data-random-mode="pick"] #comboDetail *{
        word-break:keep-all!important;
        overflow-wrap:break-word!important;
      }

      /* Pool grade badges were historically positioned outside the first column.
         Keep them inside each pool item and reserve real horizontal space. */
      #random.rp114PickIntegrity[data-random-mode="pick"] #poolInputs .randomPoolItem.rp114GradeOwner{
        position:relative!important;
        padding-left:30px!important;
        box-sizing:border-box!important;
        overflow:visible!important;
      }
      #random.rp114PickIntegrity[data-random-mode="pick"] #poolInputs .rp114GradeToken{
        position:absolute!important;
        left:6px!important;
        top:50%!important;
        transform:translateY(-50%)!important;
        margin:0!important;
        width:20px!important;
        min-width:20px!important;
        text-align:center!important;
        white-space:nowrap!important;
        overflow:visible!important;
        z-index:2!important;
      }
      #random.rp114PickIntegrity[data-random-mode="pick"] #poolInputs{min-width:0!important}

      /* Candidate names are single-source labels; never let legacy duplicated text spill. */
      #random.rp114PickIntegrity[data-random-mode="pick"] #comboResults .rp90Name b,
      #random.rp114PickIntegrity[data-random-mode="pick"] #comboResults .rp93CandidateName,
      #random.rp114PickIntegrity[data-random-mode="pick"] #comboResults .rp93HeroName{
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }

      @media(max-width:1080px){
        #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor.rp107RandomGrid,
        #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor.rp112WorkspaceGrid,
        #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor{grid-template-columns:minmax(0,1fr)!important}
        #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp107Left,
        #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp112Left,
        #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp107Center,
        #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp112Center,
        #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp107Right,
        #random.rp114PickIntegrity[data-random-mode="pick"] #randomInputAnchor>.rp112Right{
          grid-column:1!important;
          grid-row:auto!important;
        }
      }
      #random.rp114PickIntegrity[data-random-mode="ingame"] #randomInputAnchor,
      #random.rp114PickIntegrity[data-random-mode="ingame"] .randomPickOnly{display:none!important}
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function engineCombos(){
    try{if(typeof randomState!=='undefined'&&Array.isArray(randomState?.combos))return randomState.combos}catch{}
    try{if(Array.isArray(window.randomState?.combos))return window.randomState.combos}catch{}
    return [];
  }
  function nameOf(v){
    if(typeof v==='string')return clean(v);
    if(v&&typeof v==='object')return clean(v.name||v.championName||v.ko||v.krName||v.kr||v.label||'');
    return clean(v);
  }
  function knownNames(){
    const out=[];const add=v=>{const n=nameOf(v);if(n&&!out.includes(n))out.push(n)};
    try{if(typeof getChampionNames==='function')getChampionNames().forEach(add)}catch{}
    try{if(Array.isArray(window.poolNames))window.poolNames.forEach(add)}catch{}
    ['CHAMPIONS','champions','championData','championDB','ARAM_CHAMPIONS','CHAMPION_DATA'].forEach(k=>{
      try{const s=window[k];if(Array.isArray(s))s.forEach(add);else if(s&&typeof s==='object')Object.values(s).forEach(add)}catch{}
    });
    return out.sort((a,b)=>b.length-a.length);
  }
  function collapsePollutedName(raw){
    const s=clean(raw).replace(/^[1-5]\s+/,'');if(!s)return'';
    const known=knownNames();
    if(known.includes(s))return s;
    for(const n of known){
      const compact=s.replace(/\s+/g,''),cn=n.replace(/\s+/g,'');
      if(!cn||!compact.includes(cn))continue;
      if(compact===cn+cn||compact===cn+cn+cn)return n;
      if(compact.length<=cn.length*3+2&&compact.startsWith(cn)&&compact.endsWith(cn))return n;
    }
    for(let len=1;len<=Math.floor(s.length/2);len++){
      const u=s.slice(0,len);if(u.repeat(Math.floor(s.length/len))===s)return u;
    }
    return s;
  }
  function rowIndex(row){const rows=$$('#comboResults .combo');return Math.max(0,rows.indexOf(row))}
  function comboForRow(row){const i=rowIndex(row);return{index:i,combo:engineCombos()[i]||null}}
  function comboCandidateName(row){
    const {combo}=comboForRow(row);
    const sel=Array.isArray(combo?.sel)?combo.sel.map(nameOf).filter(Boolean):[];
    if(sel.length)return sel.join(' · ');
    const ds=clean(row?.dataset?.rp114Candidate||row?.dataset?.rp93Candidate||row?.dataset?.rp90Champion||'');
    if(ds)return collapsePollutedName(ds);
    return collapsePollutedName(clean(row?.querySelector?.('.names')?.textContent||row?.querySelector?.('.rp90Name b')?.textContent||''));
  }

  function flattenNumbers(obj,prefix='',out=[],depth=0){
    if(depth>5||obj==null)return out;
    if(typeof obj==='number'&&Number.isFinite(obj)){out.push([prefix,obj]);return out}
    if(typeof obj!=='object')return out;
    for(const [k,v] of Object.entries(obj)){
      const key=(prefix?prefix+'.':'')+String(k);
      if(typeof v==='number'&&Number.isFinite(v))out.push([key,v]);
      else if(v&&typeof v==='object')flattenNumbers(v,key,out,depth+1);
    }
    return out;
  }
  const normKey=k=>String(k||'').toLowerCase().replace(/[\s_.\-·/()[\]{}:]+/g,'');
  function metricFromEntries(entries,aliases){
    const aa=aliases.map(normKey);
    for(const [k,v] of entries){const nk=normKey(k);if(aa.includes(nk))return Number(v)}
    for(const [k,v] of entries){const nk=normKey(k);if(aa.some(a=>a.length>=3&&nk.endsWith(a)))return Number(v)}
    for(const [k,v] of entries){const nk=normKey(k);if(aa.some(a=>a.length>=3&&nk.includes(a)))return Number(v)}
    return null;
  }
  function metricFromText(text,aliases){
    const t=String(text||'').replace(/["']/g,' ');
    for(const a of aliases){
      const latin=/^[a-z]/i.test(a);const src=String(a).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const re=new RegExp((latin?'(?:^|[^a-z])':'')+src+'\\s*[:=]?\\s*(-?\\d+(?:\\.\\d+)?)','i');
      const m=t.match(re);if(m)return Number(m[1]);
    }
    return null;
  }
  function rawMetric(combo,row,aliases){
    const entries=[...flattenNumbers(combo?.structure),...flattenNumbers(combo?.parts)];
    const n=metricFromEntries(entries,aliases);if(Number.isFinite(n))return n;
    const text=[JSON.stringify(combo?.structure||{}),JSON.stringify(combo?.parts||{}),combo?.reason,combo?.warning,row?.querySelector?.('.desc')?.textContent].filter(Boolean).join(' / ');
    const m=metricFromText(text,aliases);return Number.isFinite(m)?m:null;
  }
  function pctMetric(v){
    const n=Number(v);if(!Number.isFinite(n))return null;
    if(n>=0&&n<=1)return clamp(Math.round(n*100));
    if(n>=0&&n<=20)return clamp(Math.round(n/20*100));
    return clamp(Math.round(n));
  }
  function average(vals){const xs=vals.filter(Number.isFinite);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null}
  function fallbackDna(row,name){
    try{
      if(typeof candidateDnaPreviewV01594==='function'&&typeof candidateDamageProfileV01593==='function'&&typeof pickReferenceModelV01590==='function'){
        const m=pickReferenceModelV01590();
        const profile=candidateDamageProfileV01593(row,name,m);
        const desc=clean(row?.querySelector?.('.desc')?.textContent||row?.querySelector?.('.rp90Desc')?.textContent||'');
        const p=candidateDnaPreviewV01594(row,name,desc,profile);
        return{engage:clamp(p?.dna?.engage?.pct||0),poke:clamp(p?.dna?.poke?.pct||0),front:clamp(p?.dna?.front?.pct||0),sustain:clamp(p?.dna?.sustain?.pct||0),cc:clamp(p?.dna?.cc?.pct||0),ad:clamp(profile?.adPct??50),ap:clamp(profile?.apPct??50),source:'candidate-fallback'};
      }
    }catch{}
    return{engage:50,poke:50,front:50,sustain:50,cc:50,ad:50,ap:50,source:'neutral-fallback'};
  }
  function dnaForRow(row){
    const {combo}=comboForRow(row);const name=comboCandidateName(row);const fb=fallbackDna(row,name);
    if(!combo)return{...fb,name,combo:null};
    const engage=pctMetric(rawMetric(combo,row,['engage','initiation','initiate','이니시','진입','시동']));
    const poke=pctMetric(rawMetric(combo,row,['poke','poking','포킹']));
    const front=pctMetric(rawMetric(combo,row,['frontline','front','tankline','프론트','앞라인']));
    const sustainRaw=average([rawMetric(combo,row,['sustain','지속전투','유지력']),rawMetric(combo,row,['protect','protection','peel','보호역이니시','보호','역이니시']),rawMetric(combo,row,['sustaineddamage','dps','지속딜'])]);
    const ccDirect=rawMetric(combo,row,['crowdcontrol','control','cc','군중제어']);
    const ccRaw=Number.isFinite(ccDirect)?ccDirect:average([rawMetric(combo,row,['aoe','area','광역']),rawMetric(combo,row,['zone','space','공간'])]);
    const sustain=pctMetric(sustainRaw),cc=pctMetric(ccRaw);
    let adRaw=rawMetric(combo,row,['effectivead','realad','실질ad','ad']);
    let apRaw=rawMetric(combo,row,['effectiveap','realap','실질ap','ap']);
    let ad=fb.ad,ap=fb.ap;
    if(Number.isFinite(adRaw)||Number.isFinite(apRaw)){
      adRaw=Number.isFinite(adRaw)?Math.max(0,adRaw):0;apRaw=Number.isFinite(apRaw)?Math.max(0,apRaw):0;
      const sum=adRaw+apRaw;if(sum>0){ad=clamp(Math.round(adRaw/sum*100));ap=100-ad}
    }
    const values={engage,poke,front,sustain,cc};
    const found=Object.values(values).filter(Number.isFinite).length;
    return{name,combo,source:found?'engine-combo-structure':fb.source,engage:Number.isFinite(engage)?engage:fb.engage,poke:Number.isFinite(poke)?poke:fb.poke,front:Number.isFinite(front)?front:fb.front,sustain:Number.isFinite(sustain)?sustain:fb.sustain,cc:Number.isFinite(cc)?cc:fb.cc,ad,ap};
  }
  function stateFor(p){return p>=78?'매우 강함':p>=62?'강함':p>=46?'확보':p>=30?'보통':'부족'}
  function metricHtml(label,p){return `<div class="rp90DnaMetric"><div class="rp90DnaTop"><span>${esc(label)}</span><b>${esc(stateFor(p))}</b></div><div class="rp90DnaBar" style="--v:${p}%"><i></i></div></div>`}
  function renderDna(row){
    const panel=$('#rpPickIntelV01589');if(!panel||!row)return;
    const d=dnaForRow(row);const idx=rowIndex(row);selectedIndex=idx;
    const score=clean(row.querySelector('.comboScore')?.textContent||row.querySelector('.rp90Score')?.textContent||'-');
    const desc=clean(row.querySelector('.desc')?.textContent||row.querySelector('.rp90Desc')?.textContent||'선택한 후보를 포함한 조합 미리보기입니다.');
    const shortages=[['한타 개시',d.engage],['포킹',d.poke],['프론트라인',d.front],['지속 전투',d.sustain],['군중 제어',d.cc]].filter(([,p])=>p<40).map(([n])=>n);
    const chips=(shortages.length?shortages:['현재 큰 결손 없음']).map(x=>`<span class="rp89Chip${shortages.length?'':' good'}">${esc(x)}</span>`).join('');
    panel.dataset.rp114Selected=String(idx);panel.dataset.rp114Candidate=d.name;panel.dataset.rp114DnaSig=[d.engage,d.poke,d.front,d.sustain,d.cc,d.ad,d.ap].join('|');panel.dataset.rp114DnaSource=d.source;
    panel.innerHTML=`<div class="rp89IntelHead"><b>◆ 조합 DNA</b><span>${esc(d.name)} 반영 · LIVE PREVIEW</span></div>
      ${metricHtml('한타 개시(Engage)',d.engage)}${metricHtml('포킹(Poke)',d.poke)}${metricHtml('프론트라인(Frontline)',d.front)}${metricHtml('지속 전투(Sustain)',d.sustain)}${metricHtml('군중 제어(CC)',d.cc)}
      <div class="rp90DnaDamage"><div class="rp90DnaTop"><span>실전 AD / AP</span><b>AD ${d.ad}% / AP ${d.ap}%</b></div><div class="rp90DnaSplit" style="--ad:${d.ad}%;--ap:${d.ap}%"><i class="ad"></i><i class="ap"></i></div><div class="rp90DnaLegend"><span>AD ${d.ad}%</span><span>AP ${d.ap}%</span></div></div>
      <div class="rp89IntelSection"><strong>⚠ 부족한 역할 · ${esc(d.name)} 반영</strong><div class="rp89Chips">${chips}</div></div>
      <div class="rp89IntelSection"><strong>✦ 선택 후보</strong><div class="rp89Top1"><span>${esc(score)}</span><b>${esc(d.name)}</b><small>${esc(desc)}</small></div></div>`;
    const results=$('#comboResults');if(results){results.dataset.selectedCandidate=d.name;results.dataset.rp114Selected=String(idx);$$('.combo',results).forEach((x,i)=>x.classList.toggle('isSelectedV01593',i===idx))}
  }

  function canonicalizeRows(){
    $$('#comboResults .combo').slice(0,5).forEach((row,i)=>{
      const name=comboCandidateName(row)||`추천 ${i+1}`;
      row.dataset.rp114Candidate=name;row.dataset.rp93Candidate=name;row.dataset.rp90Champion=name;
      const b=row.querySelector('.rp90Name b');if(b)b.textContent=name;
      const c=row.querySelector('.rp93CandidateName');if(c)c.textContent=name;
      const h=row.querySelector('.rp93HeroName');if(h)h.textContent=name;
    });
  }
  function repairGradeLabels(){
    const pool=$('#poolInputs');if(!pool)return;
    const grades=/^(?:S\+|S|A\+|A|B\+|B|C\+|C|D\+|D)$/;
    $$('*',pool).forEach(el=>{
      if(el.children.length||!grades.test(clean(el.textContent)))return;
      const owner=el.closest('.randomPoolItem');if(!owner)return;
      owner.classList.add('rp114GradeOwner');el.classList.add('rp114GradeToken');
    });
  }
  function repairLayout(){
    const root=$('#random');if(!root||mode(root)!=='pick')return false;
    try{window.aramRandomWorkspaceStabilityV015112?.stabilizePick?.()}catch{}
    root.classList.add('rp114PickIntegrity');
    const input=$('#randomInputAnchor',root);if(!input)return false;
    input.classList.add('rp107RandomGrid');
    const external=$('#externalInputs',root)?.closest('.panel');
    const pool=$('#poolInputs',root)?.closest('.panel');
    const results=$('#comboResults',root)?.closest('.panel');
    const detail=$('#comboDetail',root)?.closest('.panel');
    if(external)external.classList.add('rp107Left');
    let center=input.querySelector(':scope>.rp107Center,:scope>.rp112Center');
    if(!center){center=document.createElement('div');center.className='rp107Center rp112Center';input.appendChild(center)}
    if(pool&&pool.parentElement!==center)center.appendChild(pool);
    if(results&&results.parentElement!==center)center.appendChild(results);
    let right=input.querySelector(':scope>.rp107Right,:scope>.rp112Right');
    if(!right){right=document.createElement('div');right.className='rp107Right rp112Right';input.appendChild(right)}
    right.classList.add('rp107Right','rp112Right','rp114DecisionArea');
    const intel=$('#rpPickIntelV01589',root);if(intel&&intel.parentElement!==right)right.appendChild(intel);
    if(detail&&detail!==results&&detail.parentElement!==right)right.appendChild(detail);
    root.setAttribute('data-aram-random-pick-integrity',V);
    return true;
  }
  function selectedRow(){
    const rows=$$('#comboResults .combo').slice(0,5);if(!rows.length)return null;
    let idx=selectedIndex;
    if(!Number.isInteger(idx))idx=Number($('#comboResults')?.dataset?.rp114Selected);
    if(!Number.isInteger(idx)||idx<0||idx>=rows.length){idx=rows.findIndex(x=>x.classList.contains('isSelectedV01593'));if(idx<0)idx=0}
    return rows[idx]||rows[0];
  }
  function repair(){
    clearTimeout(repairTimer);ensureStyle();
    const root=$('#random');if(!root||mode(root)!=='pick')return false;
    repairLayout();repairGradeLabels();canonicalizeRows();
    const row=selectedRow();if(row)renderDna(row);
    return true;
  }
  function schedule(delay=0){clearTimeout(repairTimer);repairTimer=setTimeout(()=>requestAnimationFrame(repair),Math.max(0,delay))}
  function wrapRefresh(){
    if(refreshWrapped)return;
    const api=window.aramRandomPracticeFocusV01549,fn=api?.refresh;if(typeof fn!=='function')return;
    const wrapped=function(...a){const out=fn.apply(this,a);repair();return out};
    wrapped.__aramV015114Wrapped=true;api.refresh=wrapped;refreshWrapped=true;
  }
  function boot(){ensureStyle();wrapRefresh();repair();queueMicrotask(repair);setTimeout(repair,140)}

  document.addEventListener('click',e=>{
    const row=e.target?.closest?.('#random[data-random-mode="pick"] #comboResults .combo');if(!row)return;
    selectedIndex=rowIndex(row);queueMicrotask(()=>{canonicalizeRows();renderDna(row)});schedule(135);
  },false);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;const row=e.target?.closest?.('#random[data-random-mode="pick"] #comboResults .combo');if(!row)return;
    selectedIndex=rowIndex(row);queueMicrotask(()=>{canonicalizeRows();renderDna(row)});schedule(135);
  },false);
  window.addEventListener('resize',()=>schedule(40),{passive:true});
  window.addEventListener('aram:random-dna-rail-repaired',()=>schedule(135));

  window.aramRandomPickIntegrityV015114={version:V,repair,dnaForRow,comboCandidateName,score_logic_changed:false,random_scoring_changed:false,data_views_changed:false};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
