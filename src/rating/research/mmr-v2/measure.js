'use strict';

const { normalizeResearchDataset } = require('./dataset');
const { fitGlobalLatent } = require('./model');
const { evaluateMmrV2 } = require('./evaluator');

function measureMmrV2(rawMatches, targetPuuid, options = {}) {
  const puuid = String(targetPuuid || '').trim();
  if (!puuid) throw new Error('targetPuuid required');

  const dataset = normalizeResearchDataset(rawMatches, { queueId: 450 });
  const targetStats = dataset.graph.players[puuid] || null;
  if (!targetStats) {
    return Object.freeze({
      status: 'UNMEASURED',
      researchOnly: true,
      productionRatingActive: false,
      automaticPromotion: false,
      rating: null,
      uncertainty: null,
      uncertainty95: null,
      games: 0,
      connectivity: 'NONE',
      componentId: null,
      componentSize: 0,
      comparableAcrossComponents: false,
      validationDecision: 'insufficient_real_data',
      modelId: null,
      modelOptions: null,
      evidenceMatches: dataset.acceptedCount
    });
  }

  const evaluation = options.evaluation || evaluateMmrV2(dataset.matches, options.evaluator || options);
  const selectedOptions = evaluation?.selection?.selectedV2Options;
  const selectedId = evaluation?.selection?.selectedV2 || null;
  if (!selectedOptions || !selectedId) {
    return Object.freeze({
      status: 'INSUFFICIENT_MODEL_SELECTION_DATA',
      researchOnly: true,
      productionRatingActive: false,
      automaticPromotion: false,
      rating: null,
      uncertainty: null,
      uncertainty95: null,
      games: targetStats.games || 0,
      connectivity: 'LOW',
      componentId: targetStats.componentId || null,
      componentSize: targetStats.componentSize || 0,
      comparableAcrossComponents: false,
      validationDecision: evaluation?.promotionGate?.decision || 'insufficient_real_data',
      modelId: null,
      modelOptions: null,
      evidenceMatches: dataset.acceptedCount
    });
  }

  // Evaluation remains leakage-safe because selection and promotion evidence were
  // computed before this final fit. This all-evidence fit is only the current
  // research measurement after the validation report has been frozen.
  const model = fitGlobalLatent(dataset.matches, selectedOptions);
  const view = model.viewPlayer(puuid);
  const onlyComponent = model.componentCount === 1;
  const decision = evaluation.promotionGate?.decision || 'no_clear_winner';
  const status = decision === 'candidate_model' ? 'VALIDATED_CANDIDATE_SHADOW' : 'RESEARCH_PROVISIONAL';

  return Object.freeze({
    status,
    researchOnly: true,
    productionRatingActive: false,
    automaticPromotion: false,
    rating: view.rating,
    uncertainty: view.uncertainty,
    uncertainty95: view.uncertainty95,
    uncertaintyKind: view.uncertaintyKind,
    games: view.games,
    wins: view.wins,
    uniqueTeammates: view.uniqueTeammates,
    uniqueOpponents: view.uniqueOpponents,
    connectivity: view.connectivity,
    componentId: view.componentId,
    componentSize: view.componentSize,
    componentMatches: view.componentMatches,
    comparableAcrossComponents: onlyComponent,
    provisional: view.provisional || decision !== 'candidate_model',
    validationDecision: decision,
    validationReason: evaluation.promotionGate?.reason || null,
    modelId: selectedId,
    modelOptions: Object.freeze({ ...selectedOptions }),
    evidenceMatches: dataset.acceptedCount,
    evidencePlayers: Object.keys(dataset.graph.players).length,
    evidenceComponents: dataset.graph.components.length,
    finalTestMatches: evaluation.temporal?.finalTestMatches || 0
  });
}

module.exports = {
  measureMmrV2,
  production_active: false,
  automatic_promotion: false
};
