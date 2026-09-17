'use strict';
const concurrency=require('./concurrency');
const telemetry=require('./telemetry');
module.exports={...concurrency,telemetry,installTelemetry:telemetry.install};
