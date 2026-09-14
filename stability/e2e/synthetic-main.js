'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('fs');
const os=require('os');
const path=require('path');
const crypto=require('crypto');
const OUT=path.resolve(__dirname,'../../audit-output/stability/windows-e2e');
const USER_DATA=path.join(os.tmpdir(),'aram-fearless-draft-v0160-synthetic-userdata');
const VISUAL_CONTRACT=path.resolve(__dirname,'../contracts/visual-baseline.synthetic.v1.json');
const GEOMETRY_CONTRACT=path.resolve(__dirname,'../contracts/visual-geometry-baseline.synthetic.v1.json');
fs.rmSync(USER_DATA,{recursive:true,force:true});
app.setPath('userData',USER_DATA);
app.on('window-all-closed',()=>{});
function writeJson(name,obj){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(obj,null,2)+'\n','utf8')}
function writeFailure(error,stage='unknown'){
  try{writeJson('synthetic-e2e-report.json',{status:'FAILURE',synthetic:true,stage,error:error?.stack||String(error),acceptance_scope:'synthetic Electron/Chromium fixture on Windows; NOT production-installed-app acceptance'})}catch{}
}
process.on('unhandledRejection',e=>writeFailure(e,'unhandledRejection'));
process.on('uncaughtException',e=>{writeFailure(e,'uncaughtException');console.error(e);app.exit(1)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForReady(win){for(let i=0;i<120;i++){const ok=await win.webContents.executeJavaScript('Boolean(window.__syntheticReady)').catch(()=>false);if(ok)return;await sleep(50)}throw new Error('synthetic renderer did not become ready')}
async function openWindow(){const win=new BrowserWindow({width:1440,height:960,show:false,backgroundColor:'#07141f',webPreferences:{contextIsolation:false,nodeIntegration:false,sandbox:false}});await win.loadFile(path.join(__dirname,'synthetic-ui.html'));await waitForReady(win);return win}
function sha(buf){return crypto.createHash('sha256').update(buf).digest('hex')}
function totalWorkingSetKb(){return app.getAppMetrics().reduce((n,m)=>n+Number(m.memory?.workingSetSize||0),0)}
function validateGeometry(layout){
  const contract=JSON.parse(fs.readFileSync(GEOMETRY_CONTRACT,'utf8')),tol=Number(contract.tolerance_px)||0,violations=[];
  const near=(a,b)=>Math.abs(Number(a)-Number(b))<=tol;
  for(const [scenario,expected] of Object.entries(contract.scenarios||{})){
    const actual=layout[scenario];if(!actual){violations.push(`${scenario}: missing scenario`);continue}
    if(actual.visible_view!==expected.visible_view)violations.push(`${scenario}: visible view ${actual.visible_view} != ${expected.visible_view}`);
    if(actual.viewport?.width!==contract.viewport?.width||actual.viewport?.height!==contract.viewport?.height)violations.push(`${scenario}: viewport drift ${actual.viewport?.width}x${actual.viewport?.height}`);
    if((actual.duplicate_ids||[]).length)violations.push(`${scenario}: duplicate ids ${(actual.duplicate_ids||[]).join(',')}`);
    for(const role of expected.required_visible||[])if(actual.roles?.[role]?.visible!==true)violations.push(`${scenario}: expected visible role ${role}`);
    for(const role of expected.required_hidden||[])if(actual.roles?.[role]?.visible===true)violations.push(`${scenario}: expected hidden role ${role}`);
    for(const [role,rect] of Object.entries(expected.anchors||{})){
      const g=actual.roles?.[role];if(!g||!g.visible){violations.push(`${scenario}: missing anchor ${role}`);continue}
      const vals=[g.x,g.y,g.width,g.height];for(let i=0;i<4;i++)if(!near(vals[i],rect[i]))violations.push(`${scenario}: ${role} geometry[${i}] ${vals[i]} != ${rect[i]} ±${tol}`);
    }
  }
  return{status:violations.length?'FAILURE':'SUCCESS',hard_gate:true,tolerance_px:tol,scenario_count:Object.keys(contract.scenarios||{}).length,violations};
}
async function capture(win,scenario,file,layout){await win.webContents.executeJavaScript(`window.aramSyntheticE2E.setScenario(${JSON.stringify(scenario)});true`);await sleep(120);layout[scenario]=await win.webContents.executeJavaScript(`window.aramSyntheticE2E.collectVisualGeometry(${JSON.stringify(scenario)})`);const img=await win.webContents.capturePage();const buf=img.toPNG();fs.writeFileSync(path.join(OUT,file),buf);return{sha256:sha(buf),bytes:buf.length}}
async function main(){
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
  writeJson('runner-bootstrap.json',{status:'STARTED',pid:process.pid,platform:process.platform,electron:process.versions.electron,userData:USER_DATA});
  const first=await openWindow();
  const seeded=await first.webContents.executeJavaScript('window.aramSyntheticE2E.seedPersistenceFixture()');
  if(Number(seeded?.research_checkpoint)!==159||seeded?.local_storage!=='persist-v1')throw new Error('first-window persistence seed failed');
  first.destroy();await sleep(150);
  const memoryBefore=totalWorkingSetKb();
  const win=await openWindow();
  const persisted=await win.webContents.executeJavaScript('window.aramSyntheticE2E.verifyPersistenceFixture()');
  if(Number(persisted?.research_checkpoint)!==159||persisted?.local_storage!=='persist-v1')throw new Error('restart-like persistence verification failed');
  const report=await win.webContents.executeJavaScript('window.aramSyntheticE2E.runSyntheticE2E()');
  const layout={},screens={};
  const scenarios=[['random.pick','random-pick.png'],['random.ingame','random-ingame.png'],['data.tier','data-tier.png'],['data.patch','data-patch-notes.png'],['profile','player-profile.png'],['results','results.png']];
  for(const [scenario,file] of scenarios)screens[file]=await capture(win,scenario,file,layout);
  const geometryGate=validateGeometry(layout);writeJson('visual-geometry-gate.json',geometryGate);if(geometryGate.status!=='SUCCESS')throw new Error('semantic visual geometry gate failed: '+geometryGate.violations.join(' | '));
  const post=await win.webContents.executeJavaScript('window.aramDiagnosticsV1.collect({version:"0.15.135-golden",autosyncStatus:"synthetic-idle",autosyncQueueDepth:0})');
  const reference=JSON.parse(fs.readFileSync(VISUAL_CONTRACT,'utf8'));
  const visualReference={exact_hash_matches:0,hash_drifts:[],screens:{}};
  for(const [file,actual] of Object.entries(screens)){const expected=reference.screens?.[file]||null;const exact=!!expected&&expected.sha256===actual.sha256;visualReference.screens[file]={expected:expected?.sha256||null,actual:actual.sha256,bytes:actual.bytes,exact};if(exact)visualReference.exact_hash_matches++;else visualReference.hash_drifts.push(file)}
  const memoryAfter=totalWorkingSetKb();
  report.restart_persistence=persisted;report.post_capture_diagnostics=post;report.screens=screens;report.visual_geometry=layout;report.visual_geometry_gate=geometryGate;report.visual_reference=visualReference;report.memory={working_set_kb_before:memoryBefore,working_set_kb_after:memoryAfter,delta_kb:memoryAfter-memoryBefore,hard_gate:false};report.user_data_fixture='temporary isolated userData';report.acceptance_scope='synthetic Electron/Chromium fixture on Windows with restart-like persistence; NOT production-installed-app acceptance';
  writeJson('synthetic-e2e-report.json',report);writeJson('visual-geometry-report.json',layout);writeJson('visual-reference-report.json',visualReference);writeJson('runner-bootstrap.json',{status:'SUCCESS',pid:process.pid,platform:process.platform,electron:process.versions.electron,userData:USER_DATA});
  console.log('SYNTHETIC WINDOWS ELECTRON E2E: SUCCESS',JSON.stringify({soak:report.soak,restart:persisted,geometry_gate:geometryGate.status,visual_hash_drifts:visualReference.hash_drifts.length,memory_delta_kb:memoryAfter-memoryBefore}));
  win.destroy();app.quit();
}
app.whenReady().then(()=>main().catch(e=>{writeFailure(e,'main');console.error(e);app.exit(1)}));
