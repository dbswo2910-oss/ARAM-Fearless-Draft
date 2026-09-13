'use strict';
const TOUCHED="    const touched=[...new Set([...files.map(x=>x.target),...deletes])];";
const TOUCHED_NEW=TOUCHED+"\n    require('./update-safety-v01579').prepareUpdateTransaction({current:VERSION,latest,appDir:__dirname,touched});";
const INNER="      throw e;\n    }\n    setTimeout(()=>{try{app.relaunch()}catch{}quitting=true;app.exit(0)},700);";
const INNER_NEW="      try{require('./update-safety-v01579').abortUpdateTransaction({reason:'apply-write-failed'})}catch{}\n      throw e;\n    }\n    try{require('./update-safety-v01579').markUpdateApplied({from:VERSION,to:latest})}catch{}\n    setTimeout(()=>{try{app.relaunch()}catch{}quitting=true;app.exit(0)},700);";
const OUTER="  }catch(e){return{status:'error',current:VERSION,latest:VERSION,message:e?.message||String(e)}}finally{rmrf(stage);rmrf(backup);updateBusy=false}";
const OUTER_NEW="  }catch(e){try{require('./update-safety-v01579').abortUpdateTransaction({reason:'update-error'})}catch{};return{status:'error',current:VERSION,latest:VERSION,message:e?.message||String(e)}}finally{rmrf(stage);rmrf(backup);updateBusy=false}";
const FETCH_OLD="async function fetchManifest(){const b=await getBuffer(`${rawUrl('update/manifest.json')}?t=${Date.now()}`);const m=JSON.parse(b.toString('utf8'));if(!m||!m.version||!Array.isArray(m.files))throw new Error('업데이트 manifest 형식이 올바르지 않습니다.');return m}";
const VALIDATOR=`function validateManifestV015116(m){
  if(!m||typeof m!=='object'||!/^\\d+\\.\\d+\\.\\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(String(m.version||'')))throw new Error('업데이트 manifest 버전 형식이 올바르지 않습니다.');
  if(!Array.isArray(m.files)||m.files.length<1||m.files.length>512)throw new Error('업데이트 manifest 파일 목록이 올바르지 않습니다.');
  const install=new Set();
  for(const f of m.files){
    if(!f||typeof f!=='object')throw new Error('업데이트 manifest 파일 항목이 올바르지 않습니다.');
    const p=safeRel(f.path),s=safeRel(f.source);
    if(!s.startsWith('update/'))throw new Error('허용되지 않은 update source: '+s);
    if(install.has(p))throw new Error('중복 업데이트 대상: '+p);install.add(p);
    if(f.sha256!=null&&!/^[0-9a-f]{64}$/i.test(String(f.sha256)))throw new Error('잘못된 SHA-256: '+p);
  }
  const del=new Set(),critical=new Set(['index.html','autosync-core.js','main.js','preload.js','package.json']);
  for(const raw of Array.isArray(m.delete)?m.delete:[]){const p=safeRel(raw);if(del.has(p))throw new Error('중복 삭제 대상: '+p);if(install.has(p))throw new Error('설치/삭제 대상 충돌: '+p);if(critical.has(p))throw new Error('핵심 런타임 삭제 금지: '+p);del.add(p)}
  return m;
}`;
const FETCH_NEW=VALIDATOR+"\nasync function fetchManifest(){const b=await getBuffer(`${rawUrl('update/manifest.json')}?t=${Date.now()}`);const m=JSON.parse(b.toString('utf8'));if(!m||!m.version||!Array.isArray(m.files))throw new Error('업데이트 manifest 형식이 올바르지 않습니다.');validateManifestV015116(m);return m}";
function exact(src,a,b,label){if(src.includes(b))return src;const n=src.split(a).length-1;if(n!==1)throw new Error('v0.15.116 updater contract mismatch '+label+' count='+n);return src.replace(a,b)}
function patchUpdaterSource(src){let s=String(src||'');s=exact(s,TOUCHED,TOUCHED_NEW,'prepare transaction');s=exact(s,INNER,INNER_NEW,'commit/abort transaction');s=exact(s,OUTER,OUTER_NEW,'outer abort');if(!s.includes('function validateManifestV015116(m){'))s=exact(s,FETCH_OLD,FETCH_NEW,'manifest validation');return s}
module.exports={patchUpdaterSource,score_logic_changed:false,manifest_integrity_gate:true,policy_version:'0.15.116'};
