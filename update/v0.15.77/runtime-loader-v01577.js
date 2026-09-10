'use strict';
const fs=require('fs');
const path=require('path');
async function injectRuntimeStack(opts={}){
  const mainWindow=opts.mainWindow, scripts=Array.isArray(opts.scripts)?opts.scripts:[];
  const blackbox=opts.blackbox||{record:()=>{},captureNow:()=>Promise.resolve(false)};
  const patchRuntimeSource=typeof opts.patchRuntimeSource==='function'?opts.patchRuntimeSource:((_f,c)=>c);
  const wc=mainWindow?.webContents;if(!wc)throw new Error('v0.15.77 runtime loader missing webContents');
  const results=[];
  for(let i=0;i<scripts.length;i++){
    const file=scripts[i],injCode='RTI-'+String(i+1).padStart(3,'0');
    blackbox.record(injCode,'runtime-inject-start',{file});
    let slowTimer=0,ok=false;
    try{
      let code=fs.readFileSync(path.join(__dirname,file),'utf8');
      code=patchRuntimeSource(file,code);
      code+=`\n//# sourceURL=${file}`;
      const exec=wc.executeJavaScript(code,false);
      slowTimer=setTimeout(()=>{blackbox.record(injCode,'runtime-inject-slow',{file,thresholdMs:1200});Promise.resolve(blackbox.captureNow(wc,'runtime-inject:'+file)).catch(()=>{})},1200);
      await exec;ok=true;blackbox.record(injCode,'runtime-inject-end',{file});
    }catch(e){
      blackbox.record(injCode,'runtime-inject-error',{file,message:e?.message||String(e),stack:String(e?.stack||'').slice(0,2600)});
      console.error('[v0.15.77] runtime inject failed',file,e);
    }finally{clearTimeout(slowTimer);results.push({file,code:injCode,ok})}
    if(file==='item-icons-global-v01557.js'){
      try{await wc.executeJavaScript('window.aramRandomIngameRuntimeV01570?.finishBootstrap?.(); true',false)}
      catch(e){blackbox.record('RTI-BS1','bootstrap-finish-error',{message:e?.message||String(e)})}
    }
  }
  try{
    await wc.executeJavaScript('window.aramRandomIngameRuntimeV01570?.finishBootstrap?.(); window.aramRuntimePerformanceV01568?.restoreTimerHook?.(); window.aramBlackboxV01577?.rescan?.(); true',false);
    blackbox.record('RTI-FIN','runtime-finalize-end',{ok:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).map(x=>x.file)});
  }catch(e){blackbox.record('RTI-FIN','runtime-finalize-error',{message:e?.message||String(e)})}
  return results;
}
module.exports={injectRuntimeStack};
