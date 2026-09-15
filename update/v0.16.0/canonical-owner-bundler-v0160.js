'use strict';
const fs=require('fs');
const path=require('path');
const MODULE_IDS=Object.freeze([
  'core/owner-registry.js',
  'draft/production-adapter.js',
  'random/pick/production-adapter.js',
  'data/production-adapter.js'
]);
function modulePath(appDir,id){return path.join(appDir,'canonical','src',...String(id).split('/'))}
function buildRendererSource({appDir}={}){
  appDir=path.resolve(appDir||__dirname);
  const missing=[];
  const entries=[];
  for(const id of MODULE_IDS){
    const file=modulePath(appDir,id);
    if(!fs.existsSync(file)){missing.push(id);continue}
    const src=fs.readFileSync(file,'utf8');
    entries.push(`${JSON.stringify(id)}:function(module,exports,require){\n${src}\n}`);
  }
  const bootstrapPath=path.join(appDir,'canonical-renderer-bundle.js');
  if(!fs.existsSync(bootstrapPath))missing.push('canonical-renderer-bundle.js');
  if(missing.length)throw new Error(`v0.16 canonical owner bundle missing sources: ${missing.join(', ')}`);
  const loader=`(function(){\n'use strict';\nconst __mods={${entries.join(',\n')}};\nconst __cache={};\nfunction __req(id){if(__cache[id])return __cache[id].exports;const fn=__mods[id];if(!fn)throw new Error('canonical module not bundled: '+id);const module={exports:{}};__cache[id]=module;fn(module,module.exports,__req);return module.exports;}\ntry{Object.defineProperty(window,'__ARAM_CANONICAL_REQUIRE_V0160__',{value:__req,configurable:true})}catch{window.__ARAM_CANONICAL_REQUIRE_V0160__=__req}\n})();`;
  const bootstrap=fs.readFileSync(bootstrapPath,'utf8');
  return{source:`${loader}\n${bootstrap}\n//# sourceURL=canonical-production-owner-v0160.js`,modules:[...MODULE_IDS],ownerTarget:15,production_active:true};
}
module.exports={MODULE_IDS,modulePath,buildRendererSource,production_active:true,policy_version:'0.16.0'};
