'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'audit-output','r17-installed-shadow-rc-kit');
const MODULES=Object.freeze([
  ['storage','src/research/storage.js'],
  ['rating-engine','src/research/rating-engine.js'],
  ['dual-shadow','src/research/dual-shadow.js'],
  ['shadow-promotion-gate','src/research/shadow-promotion-gate.js'],
  ['shadow-evidence-store','src/research/shadow-evidence-store.js'],
  ['installed-shadow-rc','src/research/installed-shadow-rc.js']
]);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8')}
function ensure(d){fs.mkdirSync(d,{recursive:true})}
function write(name,body){const p=path.join(OUT,name);ensure(path.dirname(p));fs.writeFileSync(p,body,'utf8');return{file:name,sha256:sha(Buffer.from(body,'utf8')),bytes:Buffer.byteLength(body)}}
function buildRenderer(){
  const entries=MODULES.map(([id,rel])=>`${JSON.stringify(id)}:function(module,exports,require){\n${read(rel)}\n}`).join(',\n');
  return `(function(){\n'use strict';\nconst __mods={${entries}};\nconst __cache={};\nfunction __norm(id){return String(id||'').replace(/^\\.\\//,'').replace(/\\.js$/,'')}\nfunction __req(id){id=__norm(id);if(__cache[id])return __cache[id].exports;const fn=__mods[id];if(!fn)throw new Error('R17 shadow module unavailable: '+id);const module={exports:{}};__cache[id]=module;fn(module,module.exports,__req);return module.exports}\nconst MARKER='[ARAM_R17_SHADOW_RC_RESULT]';\nfunction publish(result){try{Object.defineProperty(window,'__ARAM_R17_SHADOW_RC__',{value:Object.freeze(result),configurable:true})}catch{window.__ARAM_R17_SHADOW_RC__=result}try{console.log(MARKER+JSON.stringify(result))}catch{}return result}\nfunction run(){const rc=__req('installed-shadow-rc');return Promise.resolve(rc.runOnce({windowRef:window})).then(publish).catch(e=>publish({schema:'aram-rating-installed-shadow-rc-v1',state:'error',error_name:e&&e.name||'Error',production_active:false,production_score_changed:false,ui_changed:false,canonical_checkpoint_written:false,automatic_promotion:false,production_activation_authorized:false,privacy:{raw_puuid_returned:false,raw_match_id_returned:false,identity_mapping_returned:false}}))}\nif(typeof window.requestIdleCallback==='function')window.requestIdleCallback(()=>{void run()},{timeout:3000});else Promise.resolve().then(()=>run());\nreturn{installed:true,mode:'r17-shadow-rc',production_active:false};\n})()\n//# sourceURL=aram-rating-r17-shadow-rc.js\n`;
}
function buildMain(){return `'use strict';\nconst fs=require('fs'),path=require('path');\nconst {app}=require('electron');\nconst MARKER='[ARAM_R17_SHADOW_RC_RESULT]';\nconst renderer=fs.readFileSync(path.join(__dirname,'r17-shadow-renderer.js'),'utf8');\nconst reportPath=String(process.env.ARAM_R17_SHADOW_RC_REPORT||'').trim();\nfunction writeReport(result){if(!reportPath)return;try{fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify({status:result&&result.state==='available'?'SUCCESS':'FAILURE',stage:'R17_PHYSICAL_INSTALLED_SHADOW_RC',captured_at:new Date().toISOString(),result},null,2)+'\\n','utf8')}catch(e){try{console.warn('[R17 shadow RC] report write failed:',e&&e.message||String(e))}catch{}}}\napp.on('browser-window-created',(_event,win)=>{\n  try{win.webContents.on('console-message',(_e,...args)=>{const msg=args.find(x=>typeof x==='string'&&x.startsWith(MARKER));if(!msg)return;try{const result=JSON.parse(msg.slice(MARKER.length));writeReport(result);console.log('[R17 shadow RC] result captured',{state:result.state,history_requests:result.history_requests,augmented_matches:result.augmented_matches,promotion_status:result.promotion_status})}catch(e){console.warn('[R17 shadow RC] result parse failed:',e&&e.message||String(e))}})}catch{}\n  const inject=()=>{try{if(!win||win.isDestroyed?.()||win.webContents?.isDestroyed?.())return;Promise.resolve(win.webContents.executeJavaScript(renderer,false)).catch(e=>console.warn('[R17 shadow RC] renderer inject failed:',e&&e.message||String(e)))}catch(e){console.warn('[R17 shadow RC] renderer inject failed:',e&&e.message||String(e))}};\n  try{win.webContents.on('did-finish-load',inject)}catch(e){console.warn('[R17 shadow RC] hook failed:',e&&e.message||String(e))}\n});\nrequire('./main-v0160.js');\n`}
function build(){
  fs.rmSync(OUT,{recursive:true,force:true});ensure(OUT);
  const files=[];files.push(write('r17-shadow-renderer.js',buildRenderer()));files.push(write('main-r17-shadow-rc.js',buildMain()));
  const manifest={schema:'aram-rating-r17-installed-shadow-rc-kit-v1',production_version:'0.16.0',mode:'temporary_copy_overlay_only',production_install_mutated:false,production_manifest_mutated:false,package_main_override_for_temp_copy:'main-r17-shadow-rc.js',user_data_identity:'aram-fearless-draft',canonical_research_db:'aram-rating-research-v03',shadow_evidence_db:'aram-rating-shadow-evidence-v1',files:[...files],source_modules:MODULES.map(([id,rel])=>({id,rel,sha256:sha(Buffer.from(read(rel),'utf8'))}))};
  files.push(write('rc-kit.json',JSON.stringify(manifest,null,2)+'\n'));return{...manifest,files};
}
if(require.main===module){const report=build();console.log('R18 INSTALLED SHADOW RC KIT: BUILT',JSON.stringify({files:report.files.length,mode:report.mode,production_manifest_mutated:false}))}
module.exports={ROOT,OUT,MODULES,buildRenderer,buildMain,build};
