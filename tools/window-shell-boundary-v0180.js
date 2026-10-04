'use strict';
const assert=require('assert');
const path=require('path');
const {createWindowShell,OWNER}=require('../src/main/window-shell');

class FakeWindow{
  constructor(options){this.options=options;this.events={};this.onceEvents={};this.destroyed=false;this.shown=0;this.restored=0;this.focused=0;this.always=[];this.loaded=null;this.menuBar=null;this.webContents={events:{},executed:[],on:(n,fn)=>{this.webContents.events[n]=fn},setWindowOpenHandler:fn=>{this.webContents.openHandler=fn}};FakeWindow.instances.push(this)}
  setMenuBarVisibility(v){this.menuBar=v}
  loadFile(file,opts){this.loaded={file,opts}}
  on(n,fn){this.events[n]=fn}
  once(n,fn){this.onceEvents[n]=fn}
  show(){this.shown++}
  restore(){this.restored++}
  focus(){this.focused++}
  setAlwaysOnTop(v,level){this.always.push({v,level})}
  isDestroyed(){return this.destroyed}
}
FakeWindow.instances=[];
class FakeTray{
  constructor(image){this.image=image;this.events={};this.menu=null;this.tip='';this.destroyed=false;FakeTray.instances.push(this)}
  setContextMenu(menu){this.menu=menu}
  setToolTip(v){this.tip=v}
  on(n,fn){this.events[n]=fn}
  destroy(){this.destroyed=true}
}
FakeTray.instances=[];
let login=false,loginArgs=null,quitCalls=0,external='';
const app={getLoginItemSettings:()=>({openAtLogin:login}),setLoginItemSettings:v=>{login=!!v.openAtLogin;loginArgs=v},quit:()=>{quitCalls++}};
const Menu={buildFromTemplate:t=>t};
const nativeImage={createFromPath:p=>({path:p,isEmpty:()=>false,resize:opts=>({path:p,opts})}),createEmpty:()=>({empty:true})};
const shell={openExternal:url=>{external=url}};
let prepared=0,domReady=0;const native=[];
const appDir=path.join('C:','aram-test');
const manager=createWindowShell({app,BrowserWindow:FakeWindow,Tray:FakeTray,Menu,nativeImage,shell,appDir,version:'0.18.0',prepareUi:()=>{prepared++},onDomReady:()=>{domReady++},onNativeInteraction:(_win,busy)=>{native.push(busy)}});
assert.strictEqual(OWNER,'main.window-shell');
const win=manager.createWindow();
assert.strictEqual(prepared,1);assert.strictEqual(FakeWindow.instances.length,1);
assert.strictEqual(win.options.width,1480);assert.strictEqual(win.options.height,940);assert.strictEqual(win.options.webPreferences.contextIsolation,true);assert.strictEqual(win.options.webPreferences.nodeIntegration,false);assert.strictEqual(win.options.webPreferences.webSecurity,true);
assert.strictEqual(win.loaded.file,path.join(appDir,'index.html'));assert.deepStrictEqual(win.loaded.opts.query,{autosync:'1',desktop:'1',electron:'1'});
win.webContents.events['dom-ready']();assert.strictEqual(domReady,1);
win.events['will-move']();win.events['will-move']();win.events.moved();win.events['will-resize']();win.events.resized();assert.deepStrictEqual(native,[true,false,true,false]);
assert.strictEqual(manager.setAlwaysOnTop(true),true);assert.deepStrictEqual(win.always.pop(),{v:true,level:'floating'});
assert.strictEqual(manager.setLaunchAtStartup(true),true);assert.strictEqual(loginArgs.openAtLogin,true);
const tray=manager.createTray();assert.strictEqual(FakeTray.instances.length,1);assert.strictEqual(tray.tip,'ARAM Fearless Draft');assert.strictEqual(manager.createTray(),tray);
const openResult=win.webContents.openHandler({url:'https://example.com'});assert.deepStrictEqual(openResult,{action:'deny'});assert.strictEqual(external,'https://example.com');
let prevented=false;win.webContents.events['will-navigate']({preventDefault:()=>{prevented=true}},'https://example.com/x');assert.strictEqual(prevented,true);
prevented=false;win.webContents.events['will-navigate']({preventDefault:()=>{prevented=true}},'file:///index.html');assert.strictEqual(prevented,false);
win.onceEvents['ready-to-show']();assert.strictEqual(win.shown,1);
manager.showWindow();assert.strictEqual(win.shown,2);assert.strictEqual(win.restored,1);assert.strictEqual(win.focused,1);
const quitItem=tray.menu.find(x=>x.label==='종료');quitItem.click();assert.strictEqual(quitCalls,1);
manager.destroyTray();assert.strictEqual(tray.destroyed,true);assert.strictEqual(manager.getTray(),null);
win.events.closed();assert.strictEqual(manager.getMainWindow(),null);
console.log(JSON.stringify({status:'PASS',owner:OWNER,windowOptions:true,navigationPolicy:true,nativeInteractionEdge:true,trayLifecycle:true,startupToggle:true}));
