'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const fs=require('fs'),path=require('path');
try{
  const root=process.env.APPDATA||path.join(process.env.USERPROFILE||'', 'AppData','Roaming');
  const dir=path.join(root,'ARAM Fearless Draft','diagnostics');fs.mkdirSync(dir,{recursive:true});
  const stable=path.join(dir,'heartbeat-renderer.json'),legacy=path.join(dir,'heartbeat-renderer-v01578.json');
  const write=()=>{const body=JSON.stringify({at:Date.now(),pid:process.pid,version:'0.15.79'});fs.writeFile(stable,body,()=>{});fs.writeFile(legacy,body,()=>{})};
  write();setInterval(write,500);
}catch{}
contextBridge.exposeInMainWorld('aramDesktop', {
  isElectron: true,
  getAutoSyncState: () => ipcRenderer.invoke('autosync:get-state'),
  getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {}),
  getRiotGradeState: () => ipcRenderer.invoke('riot-grade:get-state'),
  pollRiotGrade: () => ipcRenderer.invoke('riot-grade:poll'),
  annotateRiotGradeSnapshots: rows => ipcRenderer.invoke('riot-grade:annotate-snapshots', Array.isArray(rows)?rows:[]),
  getDesktopInfo: () => ipcRenderer.invoke('desktop:get-info'),
  checkAndApplyUpdate: () => ipcRenderer.invoke('desktop:update-now'),
  getItemCatalog: () => ipcRenderer.invoke('desktop:get-item-catalog'),
  setAlwaysOnTop: value => ipcRenderer.invoke('desktop:set-always-on-top', !!value),
  setLaunchAtStartup: value => ipcRenderer.invoke('desktop:set-launch-at-startup', !!value),
  showWindow: () => ipcRenderer.invoke('desktop:show-window'),
  traceFreeze: payload => ipcRenderer.send('diagnostics:freeze-trace-v01575', payload && typeof payload==='object' ? payload : {stage:String(payload||'')}),
  traceDiagnostic: payload => ipcRenderer.send('diagnostics:blackbox-v01577', payload && typeof payload==='object' ? payload : {message:String(payload||'')}),
  getLastDiagnostic: () => ipcRenderer.invoke('diagnostics:get-last-v01577')
});
