'use strict';
const { contextBridge, ipcRenderer } = require('electron');
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
  traceFreeze: payload => ipcRenderer.send('diagnostics:freeze-trace-v01575', payload && typeof payload==='object' ? payload : {stage:String(payload||'')})
});
