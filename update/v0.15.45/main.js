'use strict';
const path=require('path');
const fs=require('fs');
const os=require('os');
const https=require('https');
const crypto=require('crypto');
const {app,BrowserWindow,Tray,Menu,ipcMain,nativeImage,shell}=require('electron');
const autosyncCore=require('./autosync-core');
require('./autosync-queue-v01517').patch(autosyncCore);
require('./autosync-cc-impact-v01525').patch(autosyncCore);
require('./autosync-mission-timeline-v01529').patch(autosyncCore);
require('./autosync-telemetry-v01534').patch(autosyncCore);
const itemCatalog=require('./item-catalog-v01527');
const riotGrade=require('./riot-grade-collector-v01532');
const {LeagueAutoSyncCore}=autosyncCore;

const VERSION='0.15.45';
const UPDATE_REPO=process.env.ARAM_UPDATE_REPO||'dbswo2910-oss/ARAM-Fearless-Draft';
const UPDATE_BRANCH='main';
const LAUNCHER_VERSION=process.env.ARAM_LAUNCHER_VERSION||'2.0.2';
let mainWindow=null,tray=null,quitting=false,alwaysOnTop=false,updateBusy=false,gradeCollector=null;
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

function verParts(v){return String(v||'0').split('.').map(x=>Number.parseInt(x,10)||0)}
function compareVersion(a,b){const A=verParts(a),B=verParts(b),L=Math.max(A.length,B.length);for(let i=0;i<L;i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function safeRel(p){p=String(p||'').replace(/\\/g,'/').replace(/^\.\//,'');if(!p||p.startsWith('/')||p.includes('\0')||p.split('/').some(x=>x==='..')||/^[a-zA-Z]:/.test(p))throw new Error(`Unsafe update path: ${p}`);return p}
function rawUrl(source){source=safeRel(source);return `https://raw.githubusercontent.com/${UPDATE_REPO}/${UPDATE_BRANCH}/${source.split('/').map(encodeURIComponent).join('/')}`}
function allowedHost(h){return h==='raw.githubusercontent.com'||h==='github.com'||h.endsWith('.githubusercontent.com')}
function getBuffer(url,redirects=0){return new Promise((resolve,reject)=>{let u;try{u=new URL(url)}catch(e){reject(e);return}if(u.protocol!=='https:'||!allowedHost(u.hostname)){reject(new Error('허용되지 않은 업데이트 호스트입니다.'));return}const req=https.get(u,{headers:{'User-Agent':'ARAM-Fearless-Draft-InApp-Updater/0.15.45','Cache-Control':'no-cache'}},res=>{const code=Number(res.statusCode)||0;if(code>=300&&code<400&&res.headers.location){res.resume();if(redirects>=4){reject(new Error('업데이트 리다이렉트가 너무 많습니다.'));return}let next;try{next=new URL(res.headers.location,u).toString()}catch(e){reject(e);return}getBuffer(next,redirects+1).then(resolve,reject);return}if(code!==200){const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>reject(new Error(`업데이트 서버 응답 ${code}`)));return}const chunks=[];let size=0;res.on('data',c=>{size+=c.length;if(size>25*1024*1024){req.destroy(new Error('업데이트 파일이 허용 크기를 초과했습니다.'));return}chunks.push(c)});res.on('end',()=>resolve(Buffer.concat(chunks))) });req.setTimeout(12000,()=>req.destroy(new Error('업데이트 서버 응답 시간이 초과되었습니다.')));req.on('error',reject)})}
function hash(buf){return crypto.createHash('sha256').update(buf).digest('hex')}
function rmrf(p){try{fs.rmSync(p,{recursive:true,force:true})}catch{}}
function ensureParent(p){fs.mkdirSync(path.dirname(p),{recursive:true})}
async function fetchManifest(){const b=await getBuffer(`${rawUrl('update/manifest.json')}?t=${Date.now()}`);const m=JSON.parse(b.toString('utf8'));if(!m||!m.version||!Array.isArray(m.files))throw new Error('업데이트 manifest 형식이 올바르지 않습니다.');return m}
async function checkAndApplyUpdate(){
  if(updateBusy)return{status:'busy',current:VERSION,latest:VERSION,message:'이미 업데이트를 확인 중입니다.'};
  updateBusy=true;let stage='',backup='',written=[],deleted=[];
  try{
    const manifest=await fetchManifest(),latest=String(manifest.version||'');
    if(compareVersion(latest,VERSION)<=0)return{status:'current',current:VERSION,latest,message:`최신 버전입니다 · v${VERSION}`};
    if(manifest.min_launcher&&compareVersion(LAUNCHER_VERSION,manifest.min_launcher)<0)return{status:'launcher-required',current:VERSION,latest,minLauncher:String(manifest.min_launcher),launcher:LAUNCHER_VERSION,message:`Launcher v${manifest.min_launcher} 이상이 필요합니다.`};
    stage=fs.mkdtempSync(path.join(os.tmpdir(),'aramfd-stage-'));backup=fs.mkdtempSync(path.join(os.tmpdir(),'aramfd-backup-'));
    const files=[];
    for(const f of manifest.files){const target=safeRel(f.path),source=safeRel(f.source);if(!source.startsWith('update/'))throw new Error(`허용되지 않은 update source: ${source}`);const buf=await getBuffer(`${rawUrl(source)}?t=${Date.now()}`);if(f.sha256&&String(f.sha256).toLowerCase()!==hash(buf))throw new Error(`${target} SHA-256 검증 실패`);const staged=path.join(stage,...target.split('/'));ensureParent(staged);fs.writeFileSync(staged,buf);files.push({target,staged})}
    const deletes=(Array.isArray(manifest.delete)?manifest.delete:[]).map(safeRel);
    const touched=[...new Set([...files.map(x=>x.target),...deletes])];
    for(const rel of touched){const dst=path.join(__dirname,...rel.split('/'));if(fs.existsSync(dst)){const bk=path.join(backup,...rel.split('/'));ensureParent(bk);fs.copyFileSync(dst,bk)}}
    try{
      for(const f of files){const dst=path.join(__dirname,...f.target.split('/'));ensureParent(dst);const tmp=`${dst}.aram-new-${process.pid}`;fs.copyFileSync(f.staged,tmp);try{fs.renameSync(tmp,dst)}catch{try{fs.unlinkSync(dst)}catch{}fs.renameSync(tmp,dst)}written.push(f.target)}
      for(const rel of deletes){const dst=path.join(__dirname,...rel.split('/'));if(fs.existsSync(dst)){fs.rmSync(dst,{recursive:true,force:true});deleted.push(rel)}}
    }catch(e){
      for(const rel of [...written,...deleted]){const dst=path.join(__dirname,...rel.split('/')),bk=path.join(backup,...rel.split('/'));try{if(fs.existsSync(bk)){ensureParent(dst);fs.copyFileSync(bk,dst)}else fs.rmSync(dst,{recursive:true,force:true})}catch{}}
      throw e;
    }
    setTimeout(()=>{try{app.relaunch()}catch{}quitting=true;app.exit(0)},700);
    return{status:'applied',current:VERSION,latest,message:`v${latest} 적용 완료 · 자동 재시작합니다.`};
  }catch(e){return{status:'error',current:VERSION,latest:VERSION,message:e?.message||String(e)}}finally{rmrf(stage);rmrf(backup);updateBusy=false}
}

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
      const scripts=[
        'live-strength-v01513.js','match-lab-favorites-v01514.js','role-grade-v01513.js','role-grade-fairs-v01515.js','match-lab-replay-v01515.js','multi-user-isolation-v01516.js','match-lab-queue-v01517.js','draft-pick-balance-v01517.js','catch-resilience-v01540.js','draft-side-order-v01540.js','builder-champion-pool-v01541.js','draft-live-context-v01542.js','draft-balance-alerts-v01543.js','draft-layout-v01545.js','role-metric-detail-v01518.js','cc-impact-v01525.js','mission-death-fairness-v01529.js','player-profile-v01519.js','live-item-memory-v01520.js','player-profile-data-sticky-v01521.js','role-mastery-drilldown-v01522.js','role-profile-context-v01523.js','role-profile-specialized-v01530.js','profile-ux-v01537.js','in-app-updater-ui-v01523.js','time-power-v01527.js','riot-grade-ui-v01528.js','riot-grade-calibration-history-v01532.js','riot-grade-autosnapshot-v01533.js','community-calibration-v01534.js','brand-header-v01538.js','input-interaction-stability-v01539.js'
      ];
      let chain=Promise.resolve();
      for(const file of scripts){const code=fs.readFileSync(path.join(__dirname,file),'utf8')+`\n//# sourceURL=${file}`;chain=chain.then(()=>mainWindow.webContents.executeJavaScript(code,false))}
      chain.then(()=>mainWindow.webContents.executeJavaScript('Boolean(window.__ARAM_LIVE_STRENGTH_V01513__) && Boolean(window.__ARAM_MATCH_LAB_FAVORITES_V01514__) && Boolean(window.__ARAM_ROLE_GRADE_V01513__) && Boolean(window.__ARAM_ROLE_GRADE_V01515__) && Boolean(window.__ARAM_MATCH_LAB_REPLAY_V01515__) && Boolean(window.__ARAM_MULTI_USER_ISOLATION_V01516__) && Boolean(window.__ARAM_MATCH_LAB_QUEUE_V01517__) && Boolean(window.__ARAM_DRAFT_BALANCE_V01517__) && Boolean(window.__ARAM_CATCH_RESILIENCE_V01540__) && Boolean(window.__ARAM_DRAFT_SIDE_ORDER_V01540__) && Boolean(window.__ARAM_BUILDER_CHAMPION_POOL_V01541__) && Boolean(window.__ARAM_DRAFT_LIVE_CONTEXT_V01542__) && Boolean(window.__ARAM_DRAFT_BALANCE_ALERTS_V01543__) && Boolean(window.__ARAM_DRAFT_LAYOUT_V01545__) && Boolean(window.__ARAM_ROLE_METRIC_DETAIL_V01518__) && Boolean(window.__ARAM_CC_IMPACT_V01525__) && Boolean(window.__ARAM_MISSION_DEATH_FAIRNESS_V01529__) && Boolean(window.__ARAM_PLAYER_PROFILE_V01519__) && Boolean(window.__ARAM_LIVE_ITEM_MEMORY_V01520__) && Boolean(window.__ARAM_PLAYER_PROFILE_DIVERSITY_V01521__) && Boolean(window.__ARAM_ROLE_MASTERY_DRILLDOWN_V01522__) && Boolean(window.__ARAM_ROLE_PROFILE_CONTEXT_V01523__) && Boolean(window.__ARAM_ROLE_PROFILE_SPECIALIZED_V01530__) && Boolean(window.__ARAM_PROFILE_UX_V01537__) && Boolean(window.__ARAM_IN_APP_UPDATER_UI_V01523__) && Boolean(window.__ARAM_TIME_POWER_V01527__) && Boolean(window.__ARAM_RIOT_GRADE_V01528__) && Boolean(window.__ARAM_RIOT_GRADE_CALIBRATION_HISTORY_V01532__) && Boolean(window.__ARAM_RIOT_GRADE_AUTOSNAPSHOT_V01533__) && Boolean(window.__ARAM_COMMUNITY_CALIBRATION_V01534__) && Boolean(window.__ARAM_BRAND_HEADER_V01538__) && Boolean(window.__ARAM_INPUT_INTERACTION_STABILITY_V01539__)',false))
        .then(ok=>{if(!ok)console.error('[v0.15.45] runtime patch marker missing')})
        .catch(e=>console.error('[v0.15.45] runtime patch inject failed',e));
    }catch(e){console.error('[v0.15.45] runtime patch read failed',e)}
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
    core.start();
    try{gradeCollector=riotGrade.createCollector(core,{app,intervalMs:5000});gradeCollector.start()}catch(e){console.error('[v0.15.45] Riot Grade collector init failed',e)}
    createWindow();createTray();
    ipcMain.handle('autosync:get-state',()=>core.getState());
    ipcMain.handle('match-history:load',(_event,opts)=>core.getAramMatchHistory(opts||{}));
    ipcMain.handle('riot-grade:get-state',()=>gradeCollector?.getState?.()||{running:false,records:[],lastResult:'collector unavailable',scoringUse:false});
    ipcMain.handle('riot-grade:poll',()=>gradeCollector?.poll?.()||{running:false,records:[],lastResult:'collector unavailable',scoringUse:false});
    ipcMain.handle('riot-grade:annotate-snapshots',(_event,rows)=>gradeCollector?.annotateSnapshots?.(Array.isArray(rows)?rows:[])||{updated:0,rejected:0,unmatched:0,scoringUse:false});
    ipcMain.handle('desktop:get-info',()=>({electron:true,version:VERSION,electronVersion:process.versions.electron,platform:process.platform,arch:process.arch,alwaysOnTop,launchAtStartup:app.getLoginItemSettings().openAtLogin,launcherVersion:LAUNCHER_VERSION,update:{status:process.env.ARAM_UPDATE_STATUS||'unknown',repo:UPDATE_REPO,current:VERSION,latest:process.env.ARAM_UPDATE_LATEST||VERSION,checkedAt:Number(process.env.ARAM_UPDATE_CHECKED_AT||0),message:process.env.ARAM_UPDATE_MESSAGE||''}}));
    ipcMain.handle('desktop:update-now',()=>checkAndApplyUpdate());
    itemCatalog.register(ipcMain);itemCatalog.fetchCatalog().catch(()=>{});
    ipcMain.handle('desktop:set-always-on-top',(_,v)=>setAlwaysOnTop(v));
    ipcMain.handle('desktop:set-launch-at-startup',(_,v)=>setLaunchAtStartup(v));
    ipcMain.handle('desktop:show-window',()=>{showWindow();return true});
  });
  app.on('before-quit',()=>{quitting=true;try{gradeCollector?.stop?.()}catch{};try{core.stop()}catch{};try{tray?.destroy()}catch{};tray=null});
  app.on('window-all-closed',()=>{quitting=true;app.quit()});
}
