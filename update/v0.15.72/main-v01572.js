'use strict';
const fs=require('fs');
const path=require('path');
const autosyncCore=require('./autosync-core');
require('./autosync-live-runtime-v01571').patch(autosyncCore);
const basePath=path.join(__dirname,'main.js');
let src=fs.readFileSync(basePath,'utf8');
const scriptsOld="'runtime-performance-v01568.js','live-strength-v01513.js'";
const scriptsNew="'runtime-global-performance-v01572.js','runtime-performance-v01568.js','runtime-live-autosync-v01571.js','live-strength-v01513.js'";
const readyOld='Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__) && Boolean(window.__ARAM_LIVE_STRENGTH_V01513__)';
const readyNew='Boolean(window.__ARAM_GLOBAL_PERFORMANCE_V01572__) && Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__) && Boolean(window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__) && Boolean(window.__ARAM_LIVE_STRENGTH_V01513__)';
const executeOld="chain=chain.then(()=>mainWindow.webContents.executeJavaScript(code,false));";
const executeNew="chain=chain.then(()=>mainWindow.webContents.executeJavaScript(`window.__ARAM_LOADING_RUNTIME_V01572__=${JSON.stringify(file)}; true`,false)).then(()=>mainWindow.webContents.executeJavaScript(code,false)).then(()=>mainWindow.webContents.executeJavaScript('window.__ARAM_LOADING_RUNTIME_V01572__=\\\"\\\"; true',false));";
const restoreOld="chain.then(()=>mainWindow.webContents.executeJavaScript('window.aramRuntimePerformanceV01568?.restoreTimerHook?.(); true',false))";
const restoreNew="chain.then(()=>mainWindow.webContents.executeJavaScript('window.aramGlobalPerformanceV01572?.finishBootstrap?.(); true',false)).then(()=>mainWindow.webContents.executeJavaScript('window.aramRuntimePerformanceV01568?.restoreTimerHook?.(); true',false))";
for(const needle of [scriptsOld,readyOld,executeOld,restoreOld,"const VERSION='0.15.70'"]){if(!src.includes(needle))throw new Error('v0.15.72 base main contract mismatch: '+needle.slice(0,70))}
src=src.replace(scriptsOld,scriptsNew).replace(readyOld,readyNew).replace(executeOld,executeNew).replace(restoreOld,restoreNew).replaceAll('0.15.70','0.15.72');
module._compile(src,__filename);
