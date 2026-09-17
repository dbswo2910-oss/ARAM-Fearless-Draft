'use strict';
const path=require('path');

const OWNER='main.window-shell';

function createWindowShell({
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  shell,
  appDir,
  version,
  prepareUi=()=>{},
  onDomReady=()=>{},
  onNativeInteraction=()=>{}
}={}){
  if(!app||!BrowserWindow||!Tray||!Menu||!nativeImage||!shell)throw new Error('window shell requires Electron dependencies');
  if(!appDir)throw new Error('window shell requires appDir');
  if(!version)throw new Error('window shell requires version');
  let mainWindow=null,tray=null,alwaysOnTop=false;

  function iconPath(){return path.join(appDir,'app_icon.ico')}
  function trayImage(){const img=nativeImage.createFromPath(iconPath());return img.isEmpty()?nativeImage.createEmpty():img.resize({width:16,height:16})}
  function rebuildTrayMenu(){
    if(!tray)return;
    tray.setContextMenu(Menu.buildFromTemplate([
      {label:'ARAM Fearless Draft 열기',click:()=>showWindow()},
      {type:'separator'},
      {label:'항상 위',type:'checkbox',checked:alwaysOnTop,click:i=>setAlwaysOnTop(i.checked)},
      {label:'Windows 시작 시 실행',type:'checkbox',checked:app.getLoginItemSettings().openAtLogin,click:i=>setLaunchAtStartup(i.checked)},
      {type:'separator'},
      {label:'종료',click:()=>app.quit()}
    ]));
  }
  function setAlwaysOnTop(v){alwaysOnTop=!!v;if(mainWindow&&!mainWindow.isDestroyed())mainWindow.setAlwaysOnTop(alwaysOnTop,'floating');rebuildTrayMenu();return alwaysOnTop}
  function setLaunchAtStartup(v){try{app.setLoginItemSettings({openAtLogin:!!v,path:process.execPath,args:process.defaultApp?[path.resolve(appDir)]:[]})}catch{}rebuildTrayMenu();return app.getLoginItemSettings().openAtLogin}
  function createWindow(){
    prepareUi();
    mainWindow=new BrowserWindow({
      width:1480,height:940,minWidth:1060,minHeight:700,show:false,backgroundColor:'#08111f',
      title:`ARAM Fearless Draft v${version}`,icon:iconPath(),autoHideMenuBar:true,
      webPreferences:{preload:path.join(appDir,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false,webSecurity:true}
    });
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile(path.join(appDir,'index.html'),{query:{autosync:'1',desktop:'1',electron:'1'}});
    mainWindow.webContents.on('dom-ready',()=>{try{const p=onDomReady(mainWindow);if(p&&typeof p.catch==='function')p.catch(()=>{})}catch{}});
    let nativeInteraction=false;
    const setNativeInteraction=busy=>{busy=!!busy;if(nativeInteraction===busy||!mainWindow||mainWindow.isDestroyed())return;nativeInteraction=busy;try{const p=onNativeInteraction(mainWindow,busy);if(p&&typeof p.catch==='function')p.catch(()=>{})}catch{}};
    mainWindow.on('will-move',()=>setNativeInteraction(true));
    mainWindow.on('moved',()=>setNativeInteraction(false));
    mainWindow.on('will-resize',()=>setNativeInteraction(true));
    mainWindow.on('resized',()=>setNativeInteraction(false));
    if(process.platform==='win32'&&typeof mainWindow.setBackgroundMaterial==='function'){try{mainWindow.setBackgroundMaterial('none')}catch{}}
    mainWindow.once('ready-to-show',()=>mainWindow.show());
    mainWindow.on('closed',()=>{mainWindow=null});
    mainWindow.webContents.setWindowOpenHandler(({url})=>{if(/^https?:\/\//i.test(url))shell.openExternal(url);return{action:'deny'}});
    mainWindow.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('file:'))e.preventDefault()});
    return mainWindow;
  }
  function showWindow(){if(!mainWindow||mainWindow.isDestroyed())createWindow();mainWindow.show();mainWindow.restore();mainWindow.focus();return mainWindow}
  function createTray(){if(tray)return tray;tray=new Tray(trayImage());tray.setToolTip('ARAM Fearless Draft');tray.on('double-click',showWindow);rebuildTrayMenu();return tray}
  function destroyTray(){try{tray?.destroy?.()}catch{}tray=null}
  return{OWNER,createWindow,showWindow,createTray,destroyTray,setAlwaysOnTop,setLaunchAtStartup,rebuildTrayMenu,getMainWindow:()=>mainWindow,getTray:()=>tray,getAlwaysOnTop:()=>alwaysOnTop};
}

module.exports={OWNER,createWindowShell,production_capable:true,production_active:false,legacy_removal_complete:false};
