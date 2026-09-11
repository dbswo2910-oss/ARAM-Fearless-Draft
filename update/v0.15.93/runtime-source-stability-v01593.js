'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01592')}catch{prior=require('../v0.15.92/runtime-source-stability-v01592')}

function countOf(src,needle){return String(src).split(needle).length-1}
function replaceRange(src,start,end,replacement,signature,label){
  if(src.includes(signature))return src;
  const a=src.indexOf(start),b=a>=0?src.indexOf(end,a+start.length):-1;
  if(a<0||b<0||src.indexOf(start,a+1)>=0)throw new Error(`v0.15.93 source contract mismatch ${label}`);
  return src.slice(0,a)+replacement+src.slice(b);
}

function ensurePickInteractionStylesV01593(){
  if(document.querySelector('#rpPickInteractionStyleV01593'))return;
  const st=document.createElement('style');st.id='rpPickInteractionStyleV01593';st.textContent=`
    /* v0.15.93 · fullscreen density + queue visibility + interactive candidate preview */
    #random.rpPickReferenceV01590.view{width:calc(100% - 12px)!important;max-width:none!important;margin-left:6px!important;margin-right:6px!important;min-width:0!important}
    #random.rpPickReferenceV01590>.randomHero{overflow:visible!important}
    #random.rpPickReferenceV01590>.randomHero>.toolbar{grid-template-columns:max-content minmax(150px,1fr)!important;min-width:260px!important;overflow:visible!important}
    #random.rpPickReferenceV01590>.randomHero>.toolbar>span:first-child{min-width:42px!important;overflow:visible!important;text-overflow:clip!important}
    #random.rpPickReferenceV01590>.randomHero #queueSize{display:block!important;visibility:visible!important;opacity:1!important;min-width:150px!important;width:100%!important;height:38px!important;line-height:38px!important;padding:0 44px 0 15px!important;text-indent:0!important;font-size:15px!important;font-weight:900!important;color:#f4f9ff!important;background-color:#071a2b!important;border:1px solid #315b79!important;appearance:auto!important;-webkit-appearance:menulist!important}
    #random.rpPickReferenceV01590>.randomHero #queueSize option{color:#f4f9ff!important;background:#071a2b!important}
    #random.rpPickReferenceV01590 .rp90ComboView{cursor:pointer!important;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease,transform .15s ease}
    #random.rpPickReferenceV01590 .rp90ComboView:hover{background:linear-gradient(90deg,rgba(24,73,105,.38),rgba(7,20,31,.15))!important}
    #random.rpPickReferenceV01590 #comboResults .combo.isSelectedV01593{border-color:#39c4ff!important;box-shadow:inset 3px 0 0 #39c4ff,0 0 0 1px rgba(57,196,255,.16),0 0 22px rgba(57,196,255,.10)!important}
    #random.rpPickReferenceV01590 #comboResults .combo.isSelectedV01593 .rp90ComboView{background:linear-gradient(90deg,rgba(17,67,98,.72),rgba(7,20,31,.20))!important}
    #random.rpPickReferenceV01590 .rp93SelectedBadge{display:inline-flex;align-items:center;margin-left:5px;border:1px solid #3a95be;background:#0a3349;color:#8ce6ff;border-radius:999px;padding:1px 5px;font-size:6px;font-weight:950}
    #random.rpPickReferenceV01590 .rp90Damage.isEstimated>span:after{content:' · 후보 반영';color:#55c8ea;margin-left:3px}

    @media(min-width:1500px){
      #random.rpPickReferenceV01590 #randomInputAnchor{grid-template-columns:minmax(390px,.88fr) minmax(760px,1.82fr) minmax(235px,.52fr)!important;gap:12px!important}
      #random.rpPickReferenceV01590 .rp90CenterStack{gap:10px!important}
      #random.rpPickReferenceV01590 .rp90Top5Panel{padding:9px!important}
      #random.rpPickReferenceV01590 #comboResults{gap:5px!important}
      #random.rpPickReferenceV01590 #comboResults .combo{min-height:58px!important}
      #random.rpPickReferenceV01590 .rp90ComboView{grid-template-columns:28px minmax(220px,1.1fr) 70px minmax(145px,.72fr) minmax(235px,1.35fr) 62px!important;gap:9px!important;min-height:58px!important;padding:7px 9px!important}
      #random.rpPickReferenceV01590 .rp90MiniIcons img{width:24px!important;height:24px!important}
      #random.rpPickReferenceV01590 .rp90Name{font-size:11px!important}
      #random.rpPickReferenceV01590 .rp90Score{font-size:12px!important}
      #random.rpPickReferenceV01590 .rp90Desc{font-size:7.5px!important}
      #random.rpPickReferenceV01590 .rp90Damage{font-size:7px!important}
      #random.rpPickReferenceV01590 .rp90DamageBar{height:5px!important}
      #random.rpPickReferenceV01590 .rp90Detail{font-size:7.5px!important;padding:5px 7px!important}
    }
    @media(min-width:1780px){
      #random.rpPickReferenceV01590 #randomInputAnchor{grid-template-columns:minmax(430px,.9fr) minmax(900px,1.95fr) minmax(255px,.54fr)!important;gap:14px!important}
      #random.rpPickReferenceV01590 .rp90ComboView{grid-template-columns:30px minmax(260px,1.18fr) 78px minmax(170px,.78fr) minmax(300px,1.5fr) 68px!important;min-height:62px!important;padding:8px 10px!important}
    }
    @media(max-width:1180px){
      #random.rpPickReferenceV01590.view{width:100%!important;margin-left:0!important;margin-right:0!important}
      #random.rpPickReferenceV01590>.randomHero>.toolbar{min-width:0!important}
      #random.rpPickReferenceV01590>.randomHero #queueSize{min-width:110px!important}
    }
  `;document.head.appendChild(st);
}

function numV01593(v){const n=Number(v);return Number.isFinite(n)?n:null}
function normalizeNameV01593(v){return String(v||'').replace(/\s+/g,' ').trim()}
function rowDataNumberV01593(el,names){for(const n of names){const v=el?.dataset?.[n];const x=numV01593(v);if(x!==null)return x}return null}
function candidateMetaFromGlobalsV01593(name){
  const n=normalizeNameV01593(name);if(!n)return null;
  const fns=['getChampionByName','championByName','champByName','findChampionByName','getChampion'];
  for(const k of fns){try{const fn=window[k];if(typeof fn==='function'){const v=fn(n);if(v&&typeof v==='object')return v}}catch{}}
  const stores=['CHAMPIONS','champions','championData','championDB','ARAM_CHAMPIONS','CHAMPION_DATA'];
  for(const k of stores){try{const s=window[k];if(!s)continue;if(Array.isArray(s)){const v=s.find(x=>normalizeNameV01593(x?.name||x?.ko||x?.krName)===n);if(v)return v}else if(typeof s==='object'){if(s[n])return s[n];const v=Object.values(s).find(x=>normalizeNameV01593(x?.name||x?.ko||x?.krName)===n);if(v)return v}}catch{}}
  return null;
}
function damageShareFromMetaV01593(meta,text){
  const t=(String(text||'')+' '+String(meta?.damageType||meta?.damage_type||meta?.damage||meta?.role||meta?.class||meta?.position||'')+' '+String(Array.isArray(meta?.roles)?meta.roles.join(' '):'')+' '+String(Array.isArray(meta?.tags)?meta.tags.join(' '):'')).toLowerCase();
  const adRaw=numV01593(meta?.adPct??meta?.ad_pct??meta?.physicalPct??meta?.physical_pct??meta?.adWeight??meta?.ad_weight);
  const apRaw=numV01593(meta?.apPct??meta?.ap_pct??meta?.magicPct??meta?.magic_pct??meta?.apWeight??meta?.ap_weight);
  if(adRaw!==null||apRaw!==null){let a=adRaw??0,p=apRaw??0;if(a>1||p>1){const s=a+p;if(s>0)return{ad:a/s,ap:p/s,source:'meta'}}else{const s=a+p;if(s>0)return{ad:a/s,ap:p/s,source:'meta'}}}
  if(/mixed|hybrid|혼합|하이브리드|균형/.test(t))return{ad:.5,ap:.5,source:'type'};
  if(/ap브루저|ap\b|메이지|마법|magic/.test(t)&&!/ad브루저/.test(t))return{ad:.15,ap:.85,source:'type'};
  if(/ad브루저|원딜|marksman|물리|physical|\bad\b/.test(t))return{ad:.85,ap:.15,source:'type'};
  return null;
}
function candidateDamageProfileV01593(row,name,m){
  const pool=[...document.querySelectorAll('#poolInputs .randomPoolItem')].find(it=>{const inp=it.querySelector('.searchInput');return normalizeNameV01593(inp?.dataset?.committed||inp?.value)===normalizeNameV01593(name)});
  const dataEls=[row,pool,pool?.querySelector('.searchInput')].filter(Boolean);
  for(const el of dataEls){let ad=rowDataNumberV01593(el,['adPct','adpct','physicalPct','physicalpct']),ap=rowDataNumberV01593(el,['apPct','appct','magicPct','magicpct']);if(ad!==null||ap!==null){ad=ad??Math.max(0,100-(ap??0));ap=ap??Math.max(0,100-ad);const s=ad+ap||100;return{adPct:Math.round(ad/s*100),apPct:Math.round(ap/s*100),source:'dataset'}}}
  const raw=String(row?.textContent||'')+' '+String(pool?.textContent||'');
  let mt=raw.match(/AD\s*(\d+(?:\.\d+)?)\s*(?:%|\/|:)\s*AP\s*(\d+(?:\.\d+)?)/i);if(!mt)mt=raw.match(/AD\s*\/\s*AP\s*[:：]?\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/i);
  if(mt){const a=Number(mt[1]),p=Number(mt[2]),s=a+p;if(s>0)return{adPct:Math.round(a/s*100),apPct:Math.round(p/s*100),source:'row'}}
  const meta=candidateMetaFromGlobalsV01593(name);const share=damageShareFromMetaV01593(meta,raw);if(!share)return{adPct:m.adPct,apPct:m.apPct,source:'base'};
  const dm=String(m.damage||'').match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);let a=dm?Number(dm[1]):m.adPct,p=dm?Number(dm[2]):m.apPct;const fixed=Math.max(1,(Number(m.ext)||0)+(Number(m.locked)||0));const unit=(a+p)>0?(a+p)/fixed:1;a+=unit*share.ad;p+=unit*share.ap;const total=a+p||1;return{adPct:Math.round(a/total*100),apPct:Math.round(p/total*100),source:share.source};
}
function applyCandidatePreviewV01593(row,name,profile,score,desc){
  const results=document.querySelector('#comboResults');if(!results)return;results.dataset.selectedCandidate=normalizeNameV01593(name);results.querySelectorAll('.combo').forEach(x=>x.classList.toggle('isSelectedV01593',x===row));results.querySelectorAll('.rp93SelectedBadge').forEach(x=>x.remove());
  const box=row?.querySelector('.rp90NameBox');if(box){const b=document.createElement('span');b.className='rp93SelectedBadge';b.textContent='선택 미리보기';box.querySelector('.rp90Name')?.appendChild(b)}
  const dmg=document.querySelector('#rpPickIntelV01589 .rp90DnaDamage');if(dmg){const split=dmg.querySelector('.rp90DnaSplit');if(split)split.setAttribute('style',`--ad:${profile.adPct}%;--ap:${profile.apPct}%`);const strong=dmg.querySelector('.rp90DnaTop b');if(strong)strong.textContent=`AD ${profile.adPct}% / AP ${profile.apPct}%`;const legend=dmg.querySelectorAll('.rp90DnaLegend span');if(legend[0])legend[0].textContent=`AD ${profile.adPct}%`;if(legend[1])legend[1].textContent=`AP ${profile.apPct}%`}
  const top=document.querySelector('#rpPickIntelV01589 .rp89Top1');if(top){const s=top.querySelector('span'),b=top.querySelector('b'),sm=top.querySelector('small');if(s)s.textContent=score||'-';if(b)b.textContent=name||'선택 후보';if(sm)sm.textContent=desc||'선택한 후보를 포함한 조합 미리보기입니다.'}
  document.querySelectorAll('.rpQuickCardV01549').forEach(card=>{const label=String(card.querySelector('span')?.textContent||'').trim(),b=card.querySelector('b');if(!b)return;if(label==='현재 결론')b.textContent=name||'선택 후보';if(label==='실전 AD / AP'){b.textContent=`${profile.adPct} / ${profile.apPct}`;const split=card.querySelector('.rp90QuickSplit');if(split)split.setAttribute('style',`--ad:${profile.adPct}%;--ap:${profile.apPct}%`)}if(label==='TOP1 점수')b.textContent=score||'-';if(label==='추천 방향')b.textContent=desc||'선택 후보 기준으로 조합을 확인합니다.'});
}

function enhanceTop5V01590(r){
  const panel=r?.resultPanel,results=r?.results;if(!panel||!results)return;ensurePickInteractionStylesV01593();panel.classList.add('rp90Top5Panel');let head=panel.querySelector(':scope>.rp90Top5Head');if(!head){head=document.createElement('div');head.className='rp90Top5Head';results.parentElement?.insertBefore(head,results)}const rows=[...results.querySelectorAll('.combo')].slice(0,5);head.innerHTML=`<div class="left"><b>현재 큐 인원 기준 완성 조합 TOP5</b><small>엔진 점수 순 · 후보 클릭 시 조합 미리보기</small></div><span class="count">${rows.length}개 계산됨</span>`;const m=pickReferenceModelV01590();const selected=normalizeNameV01593(results.dataset.selectedCandidate||'');
  rows.forEach((row,idx)=>{const rawName=txt(row.querySelector('.names'));const name=canonicalChampionNameV01590(rawName,row)||`추천 ${idx+1}`;const score=txt(row.querySelector('.comboScore'))||'-';let desc=txt(row.querySelector('.desc'))||'현재 입력 기준 완성 조합 추천입니다.';const cn=String(name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');desc=desc.replace(new RegExp('^'+cn+'\\s*[·:|-]?\\s*','i'),'').trim()||'현재 입력 기준 완성 조합 추천입니다.';const tags=roleTagsFromTextV01590(desc);const iconLine=row.querySelector('.comboIconLine');const iconHtml=iconLine?iconLine.innerHTML:'';const oldBtn=[...row.querySelectorAll('button')].find(x=>!x.classList.contains('rp90Detail'));const profile=candidateDamageProfileV01593(row,name,m);let view=row.querySelector(':scope>.rp90ComboView');if(!view){view=document.createElement('div');view.className='rp90ComboView';row.appendChild(view)}const tagHtml=(idx===0?['강력 추천',...tags]:tags).slice(0,4).map((x,j)=>`<span class="rp90Badge${idx===0&&j===0?' strong':(x==='균형'?' good':'')}">${esc(x)}</span>`).join('');view.innerHTML=`<div class="rp90Rank">${idx+1}</div><div class="rp90PickIdentity"><div class="rp90MiniIcons">${iconHtml}</div><div class="rp90NameBox"><div class="rp90Name">${esc(name)}</div><div class="rp90Badges">${tagHtml||'<span class="rp90Badge">대안 추천</span>'}</div></div></div><div class="rp90Score">${esc(score)}</div><div class="rp90Damage${profile.source==='base'?'':' isEstimated'}"><span>실전 AD/AP</span><div class="rp90DamageBar" style="--ad:${profile.adPct}%;--ap:${profile.apPct}%"><i class="ad"></i><i class="ap"></i></div></div><div class="rp90Desc">${esc(desc)}</div><button type="button" class="rp90Detail">상세보기</button>`;row.dataset.rp93Candidate=name;row.dataset.rp93Ad=String(profile.adPct);row.dataset.rp93Ap=String(profile.apPct);row.classList.toggle('isSelectedV01593',selected===normalizeNameV01593(name));const detail=view.querySelector('.rp90Detail');if(detail&&!detail.dataset.rp93Bound){detail.dataset.rp93Bound='1';detail.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();try{oldBtn?.click()}catch{}})}if(!view.dataset.rp93Bound){view.dataset.rp93Bound='1';view.addEventListener('click',e=>{if(e.target?.closest?.('.rp90Detail'))return;const currentProfile={adPct:Number(row.dataset.rp93Ad)||50,apPct:Number(row.dataset.rp93Ap)||50};setTimeout(()=>applyCandidatePreviewV01593(row,row.dataset.rp93Candidate,currentProfile,score,desc),0)},false)}});
  if(selected){const row=rows.find(x=>normalizeNameV01593(x.dataset.rp93Candidate)===selected);if(row)applyCandidatePreviewV01593(row,row.dataset.rp93Candidate,{adPct:Number(row.dataset.rp93Ad)||50,apPct:Number(row.dataset.rp93Ap)||50},txt(row.querySelector('.comboScore'))||'-',txt(row.querySelector('.desc')))}
}

function patchRandomPracticeV01593(src){
  if(src.includes('function ensurePickInteractionStylesV01593()'))return src;
  const helpers=[ensurePickInteractionStylesV01593,numV01593,normalizeNameV01593,rowDataNumberV01593,candidateMetaFromGlobalsV01593,damageShareFromMetaV01593,candidateDamageProfileV01593,applyCandidatePreviewV01593,enhanceTop5V01590].map(fn=>'  '+fn.toString().replace(/\n/g,'\n  ')).join('\n\n')+'\n\n';
  src=replaceRange(src,'  function enhanceTop5V01590(r){','  function arrangeReferenceLayoutV01590(r){',helpers,'function ensurePickInteractionStylesV01593()','TOP5 candidate interaction');
  const openGuard=`  function guardTop5InteractionV01591(r){\n    // v0.15.93: allow native TOP5 row/champion click to bubble again. Detail remains isolated by its own handler.\n    const results=r?.results||document.querySelector('#comboResults');if(!results)return;\n    results.dataset.rp93Interaction='open';\n  }\n\n`;
  src=replaceRange(src,'  function guardTop5InteractionV01591(r){','  function refreshPickWindowV01591(r){',openGuard,"rp93Interaction='open'",'release v0.15.91 click blocker');
  return src;
}

function patchRuntimeSource(file,input){let src=prior.patchRuntimeSource(file,input);if(file==='random-practice-focus-v01549.js')src=patchRandomPracticeV01593(src);return src}

module.exports={patchRuntimeSource,score_logic_changed:false,item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,route_adoption_changed:prior.route_adoption_changed===true,ingame_hud_changed:prior.ingame_hud_changed===true,poro_snax_filtered:prior.poro_snax_filtered===true,random_pick_window_hotfix_changed:true,random_pick_candidate_preview_changed:true,random_pick_candidate_balance_changed:true,policy_version:'0.15.93'};
