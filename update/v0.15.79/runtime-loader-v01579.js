'use strict';
const prior=require('./runtime-loader-v01577');
async function injectRuntimeStack(opts={}){
  const result=await prior.injectRuntimeStack(opts);const wc=opts.mainWindow?.webContents;
  if(wc)try{await wc.executeJavaScript('window.aramSafetyNetV01579?.finalize?.(); true',false);opts.blackbox?.record?.('SAFE-FIN','safety-finalize-end',{wrapped:true})}catch(e){opts.blackbox?.record?.('SAFE-FIN','safety-finalize-error',{message:e?.message||String(e)})}
  return result;
}
module.exports={injectRuntimeStack};
