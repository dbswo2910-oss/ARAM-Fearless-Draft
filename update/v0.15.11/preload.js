'use strict';
const { contextBridge, ipcRenderer, webFrame } = require('electron');
const fs = require('fs');
const path = require('path');
const APP_VERSION='0.15.11';
contextBridge.exposeInMainWorld('aramDesktop', {
  isElectron: true,
  getAutoSyncState: () => ipcRenderer.invoke('autosync:get-state'),
  getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {}),
  getDesktopInfo: () => ipcRenderer.invoke('desktop:get-info'),
  setAlwaysOnTop: value => ipcRenderer.invoke('desktop:set-always-on-top', !!value),
  setLaunchAtStartup: value => ipcRenderer.invoke('desktop:set-launch-at-startup', !!value),
  showWindow: () => ipcRenderer.invoke('desktop:show-window')
});
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const code=fs.readFileSync(path.join(__dirname,'live-strength-v01511.js'),'utf8') + '\n//# sourceURL=live-strength-v01511.js';
    await webFrame.executeJavaScript(code, false);
    const installed=await webFrame.executeJavaScript('Boolean(window.__ARAM_LIVE_STRENGTH_V01511__)', false);
    if(!installed) throw new Error('overlay install marker missing');
    console.info('[v0.15.11] live strength overlay main-world install OK');
  } catch (e) {
    console.error('[v0.15.11] live strength overlay install failed', e);
  }
});
