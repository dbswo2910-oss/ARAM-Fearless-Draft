'use strict';
const autosync=require('../autosync');
const items=require('../items');
const updater=require('../updater');

const OWNER='app.canonical-runtime-owners';
let coreInstalled=false;
let ipcInstalled=false;

function installCore({autosyncCore}={}){
  if(coreInstalled)return{installed:false,alreadyInstalled:true,owner:OWNER};
  if(!autosyncCore)throw new Error('canonical runtime owners require autosyncCore');
  autosync.installHistoryOwners(autosyncCore);
  coreInstalled=true;
  return{installed:true,alreadyInstalled:false,owner:OWNER};
}

function installIpc({ipcMain,prefetchItems=true}={}){
  if(ipcInstalled)return{installed:false,alreadyInstalled:true,owner:OWNER,itemCatalog:items.catalogService};
  if(!ipcMain||typeof ipcMain.handle!=='function')throw new Error('canonical runtime owners require ipcMain');
  items.catalogService.register(ipcMain);
  if(prefetchItems)Promise.resolve(items.catalogService.fetchCatalog()).catch(()=>{});
  ipcInstalled=true;
  return{installed:true,alreadyInstalled:false,owner:OWNER,itemCatalog:items.catalogService};
}

function install({autosyncCore,ipcMain,prefetchItems=true}={}){
  const core=installCore({autosyncCore});
  const ipc=installIpc({ipcMain,prefetchItems});
  return{owner:OWNER,core,ipc,itemCatalog:items.catalogService,updater};
}

function getState(){return{owner:OWNER,coreInstalled,ipcInstalled,autosyncOwners:['queue','cc-impact','mission-timeline','telemetry'],itemsOwner:'catalog-service',updaterOwner:'transaction'};}
function _resetForTests(){coreInstalled=false;ipcInstalled=false;items.catalogService._resetForTests?.();}

module.exports={OWNER,installCore,installIpc,install,getState,_resetForTests,itemCatalog:items.catalogService,updater,production_capable:true,production_active:false,legacy_removal_complete:false};
