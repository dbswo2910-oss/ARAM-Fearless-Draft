'use strict';
const path=require('path');
const APP_ID='aram-fearless-draft';
function deriveUserDataPath(appData){if(typeof appData!=='string'||!appData.trim())throw new Error('appData path required');return path.join(appData,APP_ID)}
function contract(){return{app_id:APP_ID,user_data_suffix:APP_ID,production_active:false,mode:'shadow'}}
module.exports={APP_ID,deriveUserDataPath,contract,production_active:false};
