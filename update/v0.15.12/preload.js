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
