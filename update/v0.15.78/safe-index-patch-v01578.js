'use strict';
const MARK='/*ARAM_RENDERALL_SAFE_V01578*/';
const OLD="function renderAll(){document.getElementById('queueSize').value=String(randomState.queue);renderBuilder();renderLive();renderSeries();renderRandomInputs();runRandomCombos();renderOnline();document.getElementById('champCount').textContent=champs.length;document.getElementById('aliasCount').textContent=Object.keys(aliases).length;document.getElementById('routeCount').textContent=routes.length;document.getElementById('sapaCount').textContent=sapa.length;renderDataExplorer();renderAramHistoryFeedback();persist()}";
const NEW=MARK+"\nfunction renderAll(){const q=document.getElementById('queueSize');if(q)q.value=String(randomState.queue);renderBuilder();renderLive();renderSeries();renderRandomInputs();runRandomCombos();renderOnline();const cc=document.getElementById('champCount');if(cc)cc.textContent=champs.length;const ac=document.getElementById('aliasCount');if(ac)ac.textContent=Object.keys(aliases).length;const rc=document.getElementById('routeCount');if(rc)rc.textContent=routes.length;const sc=document.getElementById('sapaCount');if(sc)sc.textContent=sapa.length;renderDataExplorer();renderAramHistoryFeedback();persist()}";
function patchIndexText(text){
  text=String(text||'');
  if(text.includes(MARK))return{ok:true,changed:false,status:'already-patched',text};
  const count=text.split(OLD).length-1;
  if(count!==1)return{ok:false,changed:false,status:'contract-mismatch',count,text};
  return{ok:true,changed:true,status:'patched',text:text.replace(OLD,NEW)};
}
module.exports={patchIndexText,MARK,OLD,NEW,score_logic_changed:false};
