'use strict';
const concurrency=require('./concurrency');
const queue=require('./queue');
const ccImpact=require('./cc-impact');
const missionTimeline=require('./mission-timeline');
const telemetry=require('./telemetry');
function installHistoryOwners(coreMod){queue.install(coreMod);ccImpact.install(coreMod);missionTimeline.install(coreMod);telemetry.install(coreMod);return coreMod}
module.exports={...concurrency,queue,ccImpact,missionTimeline,telemetry,installHistoryOwners,installQueue:queue.install,installCcImpact:ccImpact.install,installMissionTimeline:missionTimeline.install,installTelemetry:telemetry.install};
