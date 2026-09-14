'use strict';
(function(){
  if(globalThis.__ARAM_V0160_RC1_ACTIVE__)return;
  const api=globalThis.__ARAM_V0160_CANONICAL__;
  if(!api)throw new Error('v0.16 RC1 canonical bundle missing');
  globalThis.__ARAM_V0160_RC1_ACTIVE__=true;
  const state={version:'0.16.0-rc.1',startedAt:Date.now(),data:false,diagnostics:false,research:false,randomRoles:false,puuidReady:false,errors:[]};
  globalThis.__ARAM_V0160_RC1_STATE__=state;
  document.documentElement?.setAttribute?.('data-v0160-rc','rc1');

  const style=document.createElement('style');
  style.id='v0160Rc1Style';
  style.textContent=`
    #v0160Rc1Badge{position:fixed;z-index:650;right:12px;top:10px;border:1px solid #4fa7c9;background:#071827e8;color:#bceaff;border-radius:10px;padding:7px 10px;font:800 9px/1.2 system-ui;box-shadow:0 8px 28px #0007;cursor:pointer}
    #v0160Rc1Badge b{color:#77e0bb}#v0160Rc1Badge.rc-warn b{color:#f1bd75}
    #dataHubTopNavV015115[data-v0160-rc-legacy-disabled="1"]{display:none!important}
    #dataCanonicalNavV016{display:flex;gap:6px;margin:0 0 10px;padding:7px;border:1px solid #284962;border-radius:10px;background:#081a29}
    #dataCanonicalNavV016 button{border:1px solid #315974;background:#10273a;color:#b9daee;border-radius:8px;padding:7px 10px;font-size:9px;font-weight:800;cursor:pointer}
    #dataCanonicalNavV016 .badge{opacity:.7;margin-left:4px}
    [data-v0160-rc-hidden-legacy-research="1"]{display:none!important}
  `;
  (document.head||document.documentElement).appendChild(style);

  const badge=document.createElement('button');
  badge.id='v0160Rc1Badge';badge.type='button';badge.setAttribute('data-ui-role','v0160-rc-status');
  document.body?.appendChild(badge);
  function statusText(){const n=['DATA','DIAG','RESEARCH'].filter((_,i)=>[state.data,state.diagnostics,state.research][i]).length;return `v0.16 RC1 · <b>${n}/3 canonical active</b>`}
  function paint(){badge.innerHTML=statusText();badge.classList.toggle('rc-warn',state.errors.length>0);badge.title=state.errors.length?state.errors.join('\n'):'Golden shell + canonical owner activation canary';}
  badge.addEventListener('click',()=>{const s={version:state.version,data:state.data,diagnostics:state.diagnostics,research:state.research,randomRoles:state.randomRoles,puuidReady:state.puuidReady,errorCount:state.errors.length};alert(`v0.16 RC1 CANARY\n${JSON.stringify(s,null,2)}\n\n이 빌드는 production이 아니며 자동 업데이트 배포 대상이 아닙니다.`)});
  function safe(label,fn){try{return fn()}catch(e){state.errors.push(`${label}: ${e?.message||String(e)}`);console.error('[v0.16 RC1]',label,e);paint();return null}}

  let diagnosticsOwner=null;
  safe('diagnostics',()=>{
    diagnosticsOwner=api.diagnostics.createDiagnosticsOwner({documentRef:document,collector:globalThis.aramDiagnosticsV1,getExtra:()=>({rc:{version:state.version,data:state.data,research:state.research,randomRoles:state.randomRoles,errorCount:state.errors.length}})});
    diagnosticsOwner.render();state.diagnostics=true;paint();
  });

  let dataOwner=null;
  function activateData(){
    if(state.data)return true;
    return safe('data',()=>{
      const root=document.getElementById('data'),card=document.getElementById('dataCard');if(!root||!card)return false;
      const legacy=document.getElementById('dataHubTopNavV015115');if(legacy)legacy.setAttribute('data-v0160-rc-legacy-disabled','1');
      const patchBody=document.getElementById('dataPatchNotesV01599');const initial=patchBody&&!patchBody.hidden?'patch':'tier';
      dataOwner=api.data.createDataOwner({document,patchLabel:'RC1',onMode:m=>{document.documentElement?.setAttribute?.('data-v0160-rc-data-mode',m)}});
      if(!dataOwner.render({mode:initial}))return false;
      state.data=true;paint();return true;
    })||false;
  }

  function findPuuid(value,depth=0,seen=new Set()){
    if(depth>5||value==null)return'';if(typeof value!=='object')return'';if(seen.has(value))return'';seen.add(value);
    for(const [k,v] of Object.entries(value)){if(/puuid/i.test(k)&&typeof v==='string'&&v.length>20)return v}
    for(const v of Object.values(value)){const x=findPuuid(v,depth+1,seen);if(x)return x}return'';
  }
  let localPuuid='';
  async function refreshPuuid(){
    try{const bridge=globalThis.aramDesktop;if(!bridge?.getAutoSyncState)return;const x=await bridge.getAutoSyncState();const p=findPuuid(x);if(p){localPuuid=p;state.puuidReady=true;paint()}}catch(e){console.warn('[v0.16 RC1] puuid lookup unavailable:',e?.message||String(e))}
  }

  let researchOwner=null,researchLoading=false;
  async function activateResearch(){
    if(researchLoading)return false;
    const body=document.querySelector('#profileCanonicalContentV016 .ppbody')||document.querySelector('#pp19c .ppbody');if(!body)return false;
    researchLoading=true;
    try{
      document.querySelectorAll('#aramRatingResearchCardV01').forEach(el=>{if(!el.closest('#researchCanonicalHostV016'))el.setAttribute('data-v0160-rc-hidden-legacy-research','1')});
      if(!researchOwner)researchOwner=api.research.createResearchOwner({document,getPuuid:()=>localPuuid,resolveProfileBody:()=>body,onState:s=>document.documentElement?.setAttribute?.('data-v0160-rc-research-state',String(s?.state||'unknown'))});
      await researchOwner.load({forceBuild:false});state.research=true;paint();return true;
    }catch(e){state.errors.push(`research: ${e?.message||String(e)}`);console.error('[v0.16 RC1] research',e);paint();return false}
    finally{researchLoading=false}
  }

  function bindRandomRoles(){
    const root=document.getElementById('random');if(!root)return false;
    return !!safe('random-roles',()=>{const rows=api.randomPickRender.bindStableRoles(document);state.randomRoles=rows.length>0;paint();return state.randomRoles});
  }

  const observer=new MutationObserver(()=>{activateData();bindRandomRoles();void activateResearch()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  globalThis.__ARAM_V0160_RC1_DISPOSE__=()=>{observer.disconnect();try{dataOwner?.dispose?.()}catch{}try{diagnosticsOwner?.dispose?.()}catch{}try{researchOwner?.dispose?.()}catch{}badge.remove();style.remove();delete globalThis.__ARAM_V0160_RC1_ACTIVE__};
  activateData();bindRandomRoles();void refreshPuuid().then(()=>activateResearch());void activateResearch();paint();
  console.log('[v0.16 RC1] canonical activation canary mounted',{version:state.version,canonicalModules:api.__rc?.moduleCount||0});
})();
