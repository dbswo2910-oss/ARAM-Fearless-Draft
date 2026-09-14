'use strict';
const legacy=require('../../update/v0.15.117/state-integrity-v015117.js');
const api={readNamespace:legacy.readNamespace,writeNamespace:legacy.writeNamespace,guardExternalJson:legacy.guardExternalJson,writeTextAtomic:legacy.writeTextAtomic,appendDiagnostic:legacy.appendDiagnostic};
module.exports={...api,policy_version:'0.16-shadow-state-bridge',legacy_policy_version:legacy.policy_version||legacy.VERSION||null,production_active:false,mode:'shadow-legacy-delegate',score_logic_changed:false,random_scoring_changed:false};
