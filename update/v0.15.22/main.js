'use strict';
const path=require('path');
const fs=require('fs');
const {app,BrowserWindow,Tray,Menu,ipcMain,nativeImage,shell}=require('electron');
const autosyncCore=require('./autosync-core');
require('./autosync-queue-v01517').patch(autosyncCore);
const {LeagueAutoSyncCore}=autosyncCore;

const VERSION='0.15.22';
let mainWindow=null,tray=null,quitting=false,alwaysOnTop=false;
const core=new LeagueAutoSyncCore({version:VERSION});
const isUpdateHandoff=process.argv.includes('--aram-update-handoff');

function iconPath(){return path.join(__dirname,'app_icon.ico')}
function trayImage(){const ico=iconPath();const img=nativeImage.createFromPath(ico);return img.isEmpty()?nativeImage.createEmpty():img.resize({width:16,height:16})}
function rebuildTrayMenu(){
  if(!tray)return;
  tray.setContextMenu(Menu.buildFromTemplate([
    {label:'ARAM Fearless Draft 열기',click:()=>showWindow()},
    {type:'separator'},
    {label:'항상 위',type:'checkbox',checked:alwaysOnTop,click:i=>setAlwaysOnTop(i.checked)},
    {label:'Windows 시작 시 실행',type:'checkbox',checked:app.getLoginItemSettings().openAtLogin,click:i=>setLaunchAtStartup(i.checked)},
    {type:'separator'},
    {label:'종료',click:()=>{quitting=true;app.quit()}}
  ]));
}
function setAlwaysOnTop(v){alwaysOnTop=!!v;if(mainWindow&&!mainWindow.isDestroyed())mainWindow.setAlwaysOnTop(alwaysOnTop,'floating');rebuildTrayMenu();return alwaysOnTop}
function setLaunchAtStartup(v){try{app.setLoginItemSettings({openAtLogin:!!v,path:process.execPath,args:process.defaultApp?[path.resolve(__dirname)]:[]});}catch{}rebuildTrayMenu();return app.getLoginItemSettings().openAtLogin}
function showWindow(){if(!mainWindow||mainWindow.isDestroyed())createWindow();mainWindow.show();mainWindow.restore();mainWindow.focus()}
function createWindow(){
  mainWindow=new BrowserWindow({
    width:1480,height:940,minWidth:1060,minHeight:700,show:false,backgroundColor:'#08111f',
    title:`ARAM Fearless Draft v${VERSION}`,icon:iconPath(),autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false,webSecurity:true}
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname,'index.html'),{query:{autosync:'1',desktop:'1',electron:'1'}});
  mainWindow.webContents.on('dom-ready',()=>{
    try{
      const liveCode=fs.readFileSync(path.join(__dirname,'live-strength-v01513.js'),'utf8')+'\n//# sourceURL=live-strength-v01513.js';
      const favoriteCode=fs.readFileSync(path.join(__dirname,'match-lab-favorites-v01514.js'),'utf8')+'\n//# sourceURL=match-lab-favorites-v01514.js';
      const roleBaseCode=fs.readFileSync(path.join(__dirname,'role-grade-v01513.js'),'utf8')+'\n//# sourceURL=role-grade-v01513.js';
      const roleCode=fs.readFileSync(path.join(__dirname,'role-grade-fairs-v01515.js'),'utf8')+'\n//# sourceURL=role-grade-fairs-v01515.js';
      const replayCode=fs.readFileSync(path.join(__dirname,'match-lab-replay-v01515.js'),'utf8')+'\n//# sourceURL=match-lab-replay-v01515.js';
      const isolationCode=fs.readFileSync(path.join(__dirname,'multi-user-isolation-v01516.js'),'utf8')+'\n//# sourceURL=multi-user-isolation-v01516.js';
      const queueCode=fs.readFileSync(path.join(__dirname,'match-lab-queue-v01517.js'),'utf8')+'\n//# sourceURL=match-lab-queue-v01517.js';
      const draftBalanceCode=fs.readFileSync(path.join(__dirname,'draft-pick-balance-v01517.js'),'utf8')+'\n//# sourceURL=draft-pick-balance-v01517.js';
      const roleMetricDetailCode=fs.readFileSync(path.join(__dirname,'role-metric-detail-v01518.js'),'utf8')+'\n//# sourceURL=role-metric-detail-v01518.js';
      const playerProfileCode=fs.readFileSync(path.join(__dirname,'player-profile-v01519.js'),'utf8')+'\n//# sourceURL=player-profile-v01519.js';
      const liveItemMemoryCode=fs.readFileSync(path.join(__dirname,'live-item-memory-v01520.js'),'utf8')+'\n//# sourceURL=live-item-memory-v01520.js';
      const profileDiversityCode=fs.readFileSync(path.join(__dirname,'player-profile-data-sticky-v01521.js'),'utf8')+'\n//# sourceURL=player-profile-data-sticky-v01521.js';
      const roleMasteryDrilldownCode=fs.readFileSync(path.join(__dirname,'role-mastery-drilldown-v01522.js'),'utf8')+'\n//# sourceURL=role-mastery-drilldown-v01522.js';
      mainWindow.webContents.executeJavaScript(liveCode,false)
        .then(()=>mainWindow.webContents.executeJavaScript(favoriteCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(roleBaseCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(roleCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(replayCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(isolationCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(queueCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(draftBalanceCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(roleMetricDetailCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(playerProfileCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(liveItemMemoryCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(profileDiversityCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript(roleMasteryDrilldownCode,false))
        .then(()=>mainWindow.webContents.executeJavaScript('Boolean(window.__ARAM_LIVE_STRENGTH_V01513__) && Boolean(window.__ARAM_MATCH_LAB_FAVORITES_V01514__) && Boolean(window.__ARAM_ROLE_GRADE_V01513__) && Boolean(window.__ARAM_ROLE_GRADE_V01515__) && Boolean(window.__ARAM_MATCH_LAB_REPLAY_V01515__) && Boolean(window.__ARAM_MULTI_USER_ISOLATION_V01516__) && Boolean(window.__ARAM_MATCH_LAB_QUEUE_V01517__) && Boolean(window.__ARAM_DRAFT_BALANCE_V01517__) && Boolean(window.__ARAM_ROLE_METRIC_DETAIL_V01518__) && Boolean(window.__ARAM_PLAYER_PROFILE_V01519__) && Boolean(window.__ARAM_LIVE_ITEM_MEMORY_V01520__) && Boolean(window.__ARAM_PLAYER_PROFILE_DIVERSITY_V01521__) && Boolean(window.__ARAM_ROLE_MASTERY_DRILLDOWN_V01522__)',false))
        .then(ok=>{if(!ok)console.error('[v0.15.22] runtime patch marker missing')})
        .catch(e=>console.error('[v0.15.22] runtime patch inject failed',e));
    }catch(e){console.error('[v0.15.22] runtime patch read failed',e)}
  });
  mainWindow.once('ready-to-show',()=>mainWindow.show());
  mainWindow.on('closed',()=>{mainWindow=null});
  mainWindow.webContents.setWindowOpenHandler(({url})=>{if(/^https?:\/\//i.test(url))shell.openExternal(url);return{action:'deny'}});
  mainWindow.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('file:'))e.preventDefault()});
  return mainWindow;
}
function createTray(){tray=new Tray(trayImage());tray.setToolTip('ARAM Fearless Draft');tray.on('double-click',showWindow);rebuildTrayMenu()}

if(!app.requestSingleInstanceLock()){app.quit()}else if(isUpdateHandoff){
  app.whenReady().then(()=>{quitting=true;app.quit()});
}else{
  app.on('second-instance',(_event,argv)=>{
    if(Array.isArray(argv)&&argv.includes('--aram-update-handoff')){quitting=true;try{core.stop()}catch{};app.quit();return}
    showWindow();
  });
  app.whenReady().then(()=>{
    app.setAppUserModelId('ingdidi.aram-fearless-draft');
    core.start();createWindow();createTray();
    ipcMain.handle('autosync:get-state',()=>core.getState());
    ipcMain.handle('match-history:load',(_event,opts)=>core.getAramMatchHistory(opts||{}));
    ipcMain.handle('desktop:get-info',()=>({electron:true,version:VERSION,electronVersion:process.versions.electron,platform:process.platform,arch:process.arch,alwaysOnTop,launchAtStartup:app.getLoginItemSettings().openAtLogin,update:{status:process.env.ARAM_UPDATE_STATUS||'unknown',repo:process.env.ARAM_UPDATE_REPO||'',current:process.env.ARAM_UPDATE_CURRENT||VERSION,latest:process.env.ARAM_UPDATE_LATEST||VERSION,checkedAt:Number(process.env.ARAM_UPDATE_CHECKED_AT||0),message:process.env.ARAM_UPDATE_MESSAGE||''}}));
    ipcMain.handle('desktop:set-always-on-top',(_,v)=>setAlwaysOnTop(v));
    ipcMain.handle('desktop:set-launch-at-startup',(_,v)=>setLaunchAtStartup(v));
    ipcMain.handle('desktop:show-window',()=>{showWindow();return true});
  });
  app.on('before-quit',()=>{quitting=true;try{core.stop()}catch{};try{tray?.destroy()}catch{};tray=null});
  app.on('window-all-closed',()=>{quitting=true;app.quit()});
}
