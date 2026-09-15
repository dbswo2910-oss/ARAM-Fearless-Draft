(function(){
  'use strict';
  const KEY='__ARAM_CANONICAL_V0160__';
  const existing=window[KEY];
  if(existing&&existing.version==='0.16.0')return;
  const bridge=Object.freeze({
    version:'0.16.0',
    stage:'package-scaffold',
    production_active:false,
    owners_active:0,
    owner_target:15,
    node_integration_required:false,
    context_isolation_compatible:true
  });
  try{Object.defineProperty(window,KEY,{value:bridge,configurable:true})}catch{window[KEY]=bridge}
  try{window.dispatchEvent(new CustomEvent('aram:canonical-v0160-bridge-ready',{detail:{version:bridge.version,stage:bridge.stage}}))}catch{}
})();
