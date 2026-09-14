'use strict';
const contract=require('./contract');
const patchModeShell=require('./patch-mode-shell');
const workspace=require('./workspace');
const modeController=require('./mode-controller');
const navigation=require('./navigation');
const patchNotesRender=require('./patch-notes-render');
const owner=require('./owner');
module.exports={contract,patchModeShell,workspace,modeController,navigation,patchNotesRender,owner,production_active:false,score_logic_changed:false,random_scoring_changed:false};
