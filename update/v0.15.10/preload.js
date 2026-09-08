'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('aramDesktop', {
  isElectron: true,
  getAutoSyncState: () => ipcRenderer.invoke('autosync:get-state'),
  getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {}),
  getDesktopInfo: () => ipcRenderer.invoke('desktop:get-info'),
  setAlwaysOnTop: value => ipcRenderer.invoke('desktop:set-always-on-top', !!value),
  setLaunchAtStartup: value => ipcRenderer.invoke('desktop:set-launch-at-startup', !!value),
  showWindow: () => ipcRenderer.invoke('desktop:show-window')
});
window.addEventListener('DOMContentLoaded', () => {
  const s=document.createElement('script');
  s.src='./live-strength-v01510.js';
  s.defer=true;
  s.onerror=()=>console.error('[v0.15.10] live strength overlay load failed');
  document.head.appendChild(s);
});
