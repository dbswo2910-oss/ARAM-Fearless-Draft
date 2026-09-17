'use strict';
const bridgeMethods=Object.freeze(['isElectron','getAutoSyncState','getAramMatchHistory','getRiotGradeState','pollRiotGrade','annotateRiotGradeSnapshots','getDesktopInfo','checkAndApplyUpdate','getItemCatalog','setAlwaysOnTop','setLaunchAtStartup','showWindow','traceFreeze','traceDiagnostic','getLastDiagnostic','readStateMirror','writeStateMirror','traceStateIntegrity']);
const invokeChannels=Object.freeze(['autosync:get-state','match-history:load','riot-grade:get-state','riot-grade:poll','riot-grade:annotate-snapshots','desktop:get-info','desktop:update-now','desktop:get-item-catalog','desktop:set-always-on-top','desktop:set-launch-at-startup','desktop:show-window','diagnostics:get-last-v01577']);
const sendChannels=Object.freeze(['diagnostics:freeze-trace-v01575','diagnostics:blackbox-v01577']);
const optionalBridgeMethods=Object.freeze(['getUniversalRatingShadowDiagnostics','getUniversalRatingAutoSyncState','onUniversalRatingAutoSync','offUniversalRatingAutoSync']);
const shadowInvokeChannels=Object.freeze(['rating:universal-rate-resolved-history','rating:universal-shadow-diagnostics']);
module.exports={bridgeMethods,invokeChannels,sendChannels,optionalBridgeMethods,shadowInvokeChannels,production_active:false,mode:'shadow-contract'};
