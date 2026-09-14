(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const views=['random','data','profile','results'];
  const state={view:'random',randomMode:'pick',dataMode:'tier',transitions:0};
  function showView(name){state.view=name;for(const v of views){const el=$('#'+v);if(el)el.classList.toggle('hidden',v!==name)}state.transitions++;}
  function setRandomMode(mode){state.randomMode=mode;$('#randomPickShell')?.classList.toggle('hidden',mode!=='pick');$('#randomIngameShell')?.classList.toggle('hidden',mode!=='ingame');state.transitions++;}
  function setDataMode(mode){state.dataMode=mode;$('#dataTierPanel')?.classList.toggle('hidden',mode!=='tier');$('#dataPatchNotesV01599')?.classList.toggle('hidden',mode!=='patch');$('#genericDataHeader')?.classList.toggle('hidden',mode==='patch');$('#data')?.setAttribute('data-mode',mode);state.transitions++;}
  function setScenario(name){
    if(name==='random.pick'){showView('random');setRandomMode('pick')}
    else if(name==='random.ingame'){showView('random');setRandomMode('ingame')}
    else if(name==='data.tier'){showView('data');setDataMode('tier')}
    else if(name==='data.patch'){showView('data');setDataMode('patch')}
    else if(name==='profile'){showView('profile')}
    else if(name==='results'){showView('results')}
    else throw new Error('unknown synthetic scenario '+name);
  }
  function count(sel){return $$(sel).length}
  function duplicateIds(){const seen=new Set(),dupes=[];for(const el of $$('[id]')){if(seen.has(el.id))dupes.push(el.id);else seen.add(el.id)}return[...new Set(dupes)].sort()}
  function assert(cond,msg){if(!cond)throw new Error(msg)}
  async function seedResearchFixture(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open('aram-rating-research-v03',1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('checkpoint'))db.createObjectStore('checkpoint',{keyPath:'key'})};
      req.onerror=()=>reject(req.error||new Error('indexedDB open failed'));
      req.onsuccess=()=>{const db=req.result;const tx=db.transaction('checkpoint','readwrite');tx.objectStore('checkpoint').put({key:'checkpoint-v03',accepted_matches:159,synthetic:true});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error||new Error('checkpoint write failed'))};
    });
  }
  async function readResearchFixture(){
    return new Promise((resolve,reject)=>{const req=indexedDB.open('aram-rating-research-v03');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result;const tx=db.transaction('checkpoint','readonly');const g=tx.objectStore('checkpoint').get('checkpoint-v03');g.onsuccess=()=>{const v=g.result;db.close();resolve(v)};g.onerror=()=>reject(g.error)}});
  }
  async function rerenderSoak(iterations=30){
    const baselineRoles=count('[data-ui-role]');
    for(let i=0;i<iterations;i++){
      setScenario(i%2?'data.patch':'data.tier');
      const card=$('#dataCard');const marker=document.createElement('span');marker.className='ephemeral';marker.textContent='x';card.appendChild(marker);marker.remove();
      setScenario(i%2?'random.ingame':'random.pick');
      await sleep(0);
    }
    setScenario('data.patch');
    return{iterations,baseline_role_nodes:baselineRoles,final_role_nodes:count('[data-ui-role]'),duplicate_ids:duplicateIds(),generic_header_hidden:$('#genericDataHeader')?.classList.contains('hidden')===true,patch_visible:!$('#dataPatchNotesV01599')?.classList.contains('hidden'),transition_count:state.transitions};
  }
  async function runSyntheticE2E(){
    await seedResearchFixture();
    const research=await readResearchFixture();
    assert(Number(research?.accepted_matches)===159,'synthetic Research checkpoint did not preserve 159 accepted matches');
    setScenario('data.patch');
    assert($('#genericDataHeader')?.classList.contains('hidden'),'Patch Notes generic header must be hidden');
    assert(!$('#dataPatchNotesV01599')?.classList.contains('hidden'),'Patch Notes body must be visible');
    setScenario('data.tier');
    assert(!$('#genericDataHeader')?.classList.contains('hidden'),'Tier mode generic header must return');
    setScenario('random.pick');
    assert(!$('#randomPickShell')?.classList.contains('hidden'),'Random PICK must be visible');
    assert($('#randomIngameShell')?.classList.contains('hidden'),'Random IN GAME must be hidden in PICK mode');
    setScenario('random.ingame');
    assert(!$('#randomIngameShell')?.classList.contains('hidden'),'Random IN GAME must be visible');
    const soak=await rerenderSoak(30);
    assert(soak.final_role_nodes===soak.baseline_role_nodes,'semantic role node count drift after rerender soak');
    assert(soak.duplicate_ids.length===0,'duplicate ids after rerender soak: '+soak.duplicate_ids.join(','));
    assert(soak.generic_header_hidden&&soak.patch_visible,'DATA Patch Notes state regressed after soak');
    const diag=await window.aramDiagnosticsV1.collect({version:'0.15.135-golden',autosyncStatus:'synthetic-idle',autosyncQueueDepth:0});
    assert(diag.app.app_identity==='aram-fearless-draft','diagnostics app identity drift');
    assert(diag.research.checkpoint_readable===true,'diagnostics could not read synthetic Research checkpoint');
    assert(diag.research.accepted_matches===159,'diagnostics checkpoint count mismatch');
    assert(diag.ui.duplicate_ids.length===0,'diagnostics found duplicate IDs');
    return{status:'SUCCESS',synthetic:true,platform:navigator.platform,research_checkpoint:research.accepted_matches,soak,diagnostics:diag};
  }
  $('#navRandom').onclick=()=>showView('random');$('#navData').onclick=()=>showView('data');$('#navProfile').onclick=()=>showView('profile');$('#navResults').onclick=()=>showView('results');
  $('#randomPickMode').onclick=()=>setRandomMode('pick');$('#randomIngameMode').onclick=()=>setRandomMode('ingame');$('#dataTier').onclick=()=>setDataMode('tier');$('#dataPatch').onclick=()=>setDataMode('patch');
  window.aramSyntheticE2E={setScenario,runSyntheticE2E,rerenderSoak,state};
  window.__syntheticReady=true;
})();
