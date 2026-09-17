'use strict';

const dataset = require('./dataset');
const model = require('./model');
const metrics = require('./metrics');
const evaluator = require('./evaluator');

module.exports = Object.freeze({
  ...dataset,
  ...model,
  ...metrics,
  ...evaluator,
  subsystem: 'aram-mmr-v2-global-latent-shadow',
  queueId: 450,
  researchOnly: true,
  production_active: false,
  automatic_promotion: false
});
