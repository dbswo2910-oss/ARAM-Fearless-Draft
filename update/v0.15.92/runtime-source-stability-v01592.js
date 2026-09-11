'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01591')}catch{prior=require('../v0.15.91/runtime-source-stability-v01591')}

function countOf(src,needle){return String(src).split(needle).length-1}
function replaceExact(src,from,to,label){if(src.includes(to))return src;const n=countOf(src,from);if(n!==1)throw new Error(`v0.15.92 source contract mismatch ${label} count=${n}`);return src.replace(from,to)}
function replaceRange(src,start,end,replacement,signature,label){if(src.includes(signature))return src;const a=src.indexOf(start),b=a>=0?src.indexOf(end,a+start.length):-1;if(a<0||b<0||src.indexOf(start,a+1)>=0)throw new Error(`v0.15.92 source contract mismatch ${label}`);return src.slice(0,a)+replacement+src.slice(b)}

function patchCoach(src){
  if(src.includes('function ri92BuildItemAllowed(name,id)'))return src;

  src=replaceExact(
    src,
    "  function ri86Base(m){return baselineCoresV01581(m?.stat||{}).filter(Boolean).slice(0,6)}",
    "  function ri92BuildItemAllowed(name,id){const n=norm(name||'');const row=n?catalogRowByNameV01581(n):null;const rid=String(id||row?.id||row?.it?.id||'');if(rid==='2052')return false;if(/포로\\s*간식|poro[\\s-]*snax/i.test(n))return false;return true}\n  function ri86Base(m){return baselineCoresV01581(m?.stat||{}).filter(n=>n&&ri92BuildItemAllowed(n)).slice(0,6)}",
    'build-item eligibility helper'
  );

  const invReplacement=`  function ri86Inventory(m){
    const out=[],seen=new Set(),b=[m?.ctx?.local?.items,m?.ctx?.local?.inventory,m?.ctx?.local?.raw?.items];
    const add=v=>{if(!v)return;if(Array.isArray(v)){v.forEach(add);return}let n='',rid='';if(typeof v==='string'){if(/^\\d+$/.test(v)){rid=v;n=buildCatalogV01581?.items?.[String(v)]?.name||''}else n=v}else if(typeof v==='object'){rid=String(v.itemId||v.id||'');n=v.displayName||v.name||v.itemName||'';if(!n&&rid)n=buildCatalogV01581?.items?.[rid]?.name||''}else if(typeof v==='number'){rid=String(v);n=buildCatalogV01581?.items?.[rid]?.name||''}n=norm(n);const k=aliasKey(n);if(n&&ri92BuildItemAllowed(n,rid)&&!seen.has(k)){seen.add(k);out.push(n)}};b.forEach(add);
    return out.slice(0,6);
  }
`;
  src=replaceRange(src,'  function ri86Inventory(m){','  function ri86Optimized(m){',invReplacement,'ri92BuildItemAllowed(n,rid)','inventory Poro-Snax filter');

  src=replaceExact(
    src,
    "  function ri86Optimized(m){const inv=ri86Inventory(m),xs=[...inv,m?.item?.name,...(m?.alts||[]),...ri86Base(m)],seen=new Set(),out=[];for(const x0 of xs){const x=norm(x0),k=aliasKey(x);if(x&&x!=='-'&&!seen.has(k)){seen.add(k);out.push(x)}}return out.slice(0,6)}",
    "  function ri86Optimized(m){const inv=ri86Inventory(m),xs=[...inv,m?.item?.name,...(m?.alts||[]),...ri86Base(m)],seen=new Set(),out=[];for(const x0 of xs){const x=norm(x0),k=aliasKey(x);if(x&&x!=='-'&&ri92BuildItemAllowed(x)&&!seen.has(k)){seen.add(k);out.push(x)}}return out.slice(0,6)}",
    'optimized route filter'
  );

  src=replaceExact(
    src,
    "const rows=[m?.item?.name,...(m?.alts||[])].filter(Boolean).slice(0,3);",
    "const rows=[m?.item?.name,...(m?.alts||[])].filter(n=>n&&ri92BuildItemAllowed(n)).slice(0,3);",
    'priority filter'
  );

  src=replaceExact(
    src,
    "for(const n of [m?.item?.name,...(m?.alts||[]),...ri86Base(m)]){const it=catalogItemV01581(n);if(it&&test(it,n))return n}",
    "for(const n of [m?.item?.name,...(m?.alts||[]),...ri86Base(m)]){if(!ri92BuildItemAllowed(n))continue;const it=catalogItemV01581(n);if(it&&test(it,n))return n}",
    'situational candidate filter'
  );

  src=replaceExact(
    src,
    "const me=localChampionV01583(m),base=ri86Base(m),optimized=ri86Optimized(m),inventory=ri86Inventory(m),target=m.item?.name||m.alts?.[0]||base[0]||'-',source=m.stat?.source||'앱 기본 DB';",
    "const me=localChampionV01583(m),base=ri86Base(m),optimized=ri86Optimized(m),inventory=ri86Inventory(m),target=[m.item?.name,...(m.alts||[]),...base].find(n=>n&&ri92BuildItemAllowed(n))||'-',source=m.stat?.source||'앱 기본 DB';",
    'build target filter'
  );

  src=replaceExact(
    src,
    "  function ri87Unique(xs){const seen=new Set(),out=[];for(const x0 of xs||[]){const x=norm(x0),k=aliasKey(x);if(x&&x!=='-'&&!seen.has(k)){seen.add(k);out.push(x)}}return out}",
    "  function ri87Unique(xs){const seen=new Set(),out=[];for(const x0 of xs||[]){const x=norm(x0),k=aliasKey(x);if(x&&x!=='-'&&ri92BuildItemAllowed(x)&&!seen.has(k)){seen.add(k);out.push(x)}}return out}",
    'live route filter'
  );

  return src;
}

function patchRuntimeSource(file,input){let src=prior.patchRuntimeSource(file,input);if(file==='random-ingame-coach-v01550.js')src=patchCoach(src);return src}

module.exports={patchRuntimeSource,score_logic_changed:false,item_recommendation_logic_changed:false,ingame_hud_changed:true,poro_snax_filtered:true,policy_version:'0.15.92'};
