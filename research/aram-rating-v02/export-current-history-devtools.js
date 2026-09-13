'use strict';
/*
Developer-only export helper for ARAM Rating v0.2.
Run manually in the Electron DevTools console. It does not install a runtime
owner, add IPC, write files, upload data, or modify application state.
*/
(async()=>{
  if(!window.aramDesktop?.getAramMatchHistory)throw new Error('desktop match-history bridge unavailable');
  let s=null;
  try{s=typeof aramHistoryState!=='undefined'?aramHistoryState:null}catch{}
  const searched=s?.targetMode==='searched'&&s?.target;
  const target=searched?{...s.target}:{current:true};
  const response=await window.aramDesktop.getAramMatchHistory({
    limit:30,
    scan:100,
    target,
    queueMode:'standard',
    priority:'interactive'
  });
  const envelope={
    schema:'aram-rating-v02-current-program-export',
    exported_at:new Date().toISOString(),
    queue_mode:'standard',
    source:'existing-program-match-history',
    target_mode:searched?'searched':'current',
    matches:Array.isArray(response?.matches)?response.matches:[],
    metadata:{
      connected:response?.connected!==false,
      scanned:Number(response?.scanned)||0,
      fullTeamCount:Number(response?.fullTeamCount)||0,
      sourceEndpoint:String(response?.sourceEndpoint||response?.source||'')
    }
  };
  const text=JSON.stringify(envelope,null,2);
  let copied=false;
  try{if(typeof copy==='function'){copy(text);copied=true}}catch{}
  if(!copied){try{await navigator.clipboard.writeText(text);copied=true}catch{}}
  console.log('[ARAM Rating v0.2] current-program export ready',{
    matches:envelope.matches.length,scanned:envelope.metadata.scanned,copied,
    note:'Save this JSON locally. Do not commit PUUID-bearing exports to the public repository.'
  });
  return envelope;
})();
