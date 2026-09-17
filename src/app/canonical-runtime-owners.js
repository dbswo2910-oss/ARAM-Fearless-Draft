'use strict';
const autosync=require('../autosync');
const items=require('../items');
const updater=require('../updater');

const OWNER='app.canonical-runtime-owners';
let installed=false;

function install({autosyncCore,ipcMain,prefetchItems=true}={}){
  if(installed)return{installed:false,alreadyInstalled:true,owner:OWNER,itemCatalog:items.catalogService,updater};
  if(!autosyncCore)throw new Error('canonical runtime owners require autosyncCore');
  if(!ipcMain||typeof ipcMain.handle!=='function')throw new Error('canonical runtime owners require ipcMain');
  autosync.installHistoryOwners(autosyncCore);
  items.catalogService.register(ipcMain);
  if(prefetchItems)Promise.resolve(items.catalogService.fetchCatalog()).catch(()=>{});
  installed=true;
  return{installed:true,alreadyInstalled:false,owner:OWNER,itemCatalog:items.catalogService,updater};
}

function getState(){return{owner:OWNER,installed,autosyncOwners:['queue','cc-impact','mission-timeline','telemetry'],itemsOwner:'catalog-service',updaterOwner:'transaction'};}
function _resetForTests(){installed=false;}

module.exports={OWNER,install,getState,_resetForTests,itemCatalog:items.catalogService,updater,production_capable:true,production_active:false,legacy_removal_complete:false};
