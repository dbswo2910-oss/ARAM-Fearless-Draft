'use strict';
function mustReplace(code,oldText,newText,label){
  if(code.includes(newText))return code;
  if(!code.includes(oldText))throw new Error(`v0.15.77 source contract mismatch: ${label}`);
  return code.replace(oldText,newText);
}
function patchRuntimeSource(file,input){
  let code=String(input||'');
  if(file==='random-ingame-shop-v01553.js'){
    code=mustReplace(code,"if(!catalog?.ok){box.innerHTML='<div class=\"riShopWait\">아이템 조합표 확인 중…</div>';loadCatalog().then(()=>sync());return}","if(!catalog?.ok){box.innerHTML='<div class=\"riShopWait\">아이템 조합표 확인 중…</div>';if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(x=>{if(x?.ok)sync()});return}",'shop53 catalog retry');
    code=mustReplace(code,"ensureStyles();loadCatalog().then(()=>sync());sync();timer=setInterval(sync,360);","ensureStyles();loadCatalog().then(x=>{if(x?.ok)sync()});sync();timer=setInterval(sync,360);",'shop53 startup retry');
  }
  if(file==='item-icons-global-v01557.js'){
    code=mustReplace(code,"pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);return x||null})","pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);else catalog=x||null;return x||null})",'icons57 retain failure state');
    code=mustReplace(code,"ensureStyles();if(!catalog?.ok){loadCatalog().then(()=>{if(catalog?.ok)sync()});return}","ensureStyles();if(!catalog?.ok){if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(()=>{if(catalog?.ok)sync()});return}",'icons57 retry throttle');
    code=mustReplace(code,"loadCatalog().then(()=>sync());sync();timer=setInterval(sync,700);","loadCatalog().then(x=>{if(x?.ok)sync()});sync();timer=setInterval(sync,700);",'icons57 startup retry');
  }
  if(file==='item-art-runtime-v01566.js'){
    code=mustReplace(code,"pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);return x||null})","pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);else catalog=x||null;return x||null})",'art66 retain failure state');
    code=mustReplace(code,"if(!catalog?.ok){loadCatalog().then(x=>{if(x?.ok)scan(root)});return}","if(!catalog?.ok){if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(x=>{if(x?.ok)scan(root)});return}",'art66 scan retry throttle');
    code=mustReplace(code,"if(!catalog?.ok){loadCatalog().then(x=>{if(x?.ok)scan()});return}","if(!catalog?.ok){if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(x=>{if(x?.ok)scan()});return}",'art66 mutation retry throttle');
    code=mustReplace(code,"observer=new MutationObserver(onMutations);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-item-id','alt','title']});","observer=new MutationObserver(onMutations);for(const root of [document.getElementById('random'),document.getElementById('historyMatchDetail'),document.getElementById('data')].filter(Boolean))observer.observe(root,{childList:true,subtree:true});",'art66 broad observer scope');
  }
  const profileScopes={
    'role-mastery-drilldown-v01522.js':"mo.observe(document.documentElement,{subtree:true,childList:true});",
    'role-profile-specialized-v01530.js':"mo.observe(document.documentElement,{subtree:true,childList:true});",
    'profile-ux-v01537.js':"mo.observe(document.documentElement,{subtree:true,childList:true});",
    'riot-grade-calibration-history-v01532.js':"mo.observe(document.documentElement,{subtree:true,childList:true});"
  };
  if(profileScopes[file]){
    const oldText=profileScopes[file];
    const newText="{const __aramProfileRoot=document.getElementById('pp19ov');if(__aramProfileRoot)mo.observe(__aramProfileRoot,{subtree:true,childList:true});}";
    code=mustReplace(code,oldText,newText,`${file} observer scope`);
  }
  return code;
}
module.exports={patchRuntimeSource};
