'use strict';
const fs=require('fs');
const path=require('path');
const {app}=require('electron');
const basePath=path.join(__dirname,'main-v0161-shadow.js');
const diagnosticsPath=path.join(__dirname,'src','profile','shadow-rating-diagnostics-renderer.js');
if(!fs.existsSync(basePath))throw new Error('v0.16.2 successor base missing');
if(!fs.existsSync(diagnosticsPath))throw new Error('v0.16.2 shadow diagnostics renderer missing');
const diagnosticsSource=fs.readFileSync(diagnosticsPath,'utf8')+'\n//# sourceURL=shadow-rating-diagnostics-v0162.js';
app.on('browser-window-created',(_event,win)=>{
  const inject=()=>{
    try{
      if(!win||win.isDestroyed?.()||win.webContents?.isDestroyed?.())return;
      Promise.resolve(win.webContents.executeJavaScript(diagnosticsSource,false)).catch(e=>console.warn('[v0.16.2 shadow diagnostics] inject failed:',e?.message||String(e)));
    }catch(e){console.warn('[v0.16.2 shadow diagnostics] inject failed:',e?.message||String(e))}
  };
  try{win.webContents.on('did-finish-load',inject)}catch(e){console.warn('[v0.16.2 shadow diagnostics] hook failed:',e?.message||String(e))}
});
let src=fs.readFileSync(basePath,'utf8');
if(!src.includes('0.16.1'))throw new Error('v0.16.2 successor contract mismatch: v0.16.1 marker missing');
src=src.replaceAll('0.16.1','0.16.2');
module._compile(src,__filename);
