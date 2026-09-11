'use strict';
const TOUCHED="    const touched=[...new Set([...files.map(x=>x.target),...deletes])];";
const TOUCHED_NEW=TOUCHED+"\n    require('./update-safety-v01579').prepareUpdateTransaction({current:VERSION,latest,appDir:__dirname,touched});";
const INNER="      throw e;\n    }\n    setTimeout(()=>{try{app.relaunch()}catch{}quitting=true;app.exit(0)},700);";
const INNER_NEW="      try{require('./update-safety-v01579').abortUpdateTransaction({reason:'apply-write-failed'})}catch{}\n      throw e;\n    }\n    try{require('./update-safety-v01579').markUpdateApplied({from:VERSION,to:latest})}catch{}\n    setTimeout(()=>{try{app.relaunch()}catch{}quitting=true;app.exit(0)},700);";
const OUTER="  }catch(e){return{status:'error',current:VERSION,latest:VERSION,message:e?.message||String(e)}}finally{rmrf(stage);rmrf(backup);updateBusy=false}";
const OUTER_NEW="  }catch(e){try{require('./update-safety-v01579').abortUpdateTransaction({reason:'update-error'})}catch{};return{status:'error',current:VERSION,latest:VERSION,message:e?.message||String(e)}}finally{rmrf(stage);rmrf(backup);updateBusy=false}";
function exact(src,a,b,label){if(src.includes(b))return src;const n=src.split(a).length-1;if(n!==1)throw new Error('v0.15.79 updater contract mismatch '+label+' count='+n);return src.replace(a,b)}
function patchUpdaterSource(src){let s=String(src||'');s=exact(s,TOUCHED,TOUCHED_NEW,'prepare transaction');s=exact(s,INNER,INNER_NEW,'commit/abort transaction');s=exact(s,OUTER,OUTER_NEW,'outer abort');return s}
module.exports={patchUpdaterSource,score_logic_changed:false};
