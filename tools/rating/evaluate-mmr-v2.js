#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { evaluateMmrV2, measureMmrV2 } = require('../../src/rating/research/mmr-v2');

function usage() {
  return [
    'Usage:',
    '  node tools/rating/evaluate-mmr-v2.js <input.json> [--target <PUUID>] [--out <report.json>] [--skip-walk-forward]',
    '',
    'Accepted input shapes:',
    '  - an array of normalized/raw matches',
    '  - { matches: [...] }',
    '  - Universal Rating DB: { matches: { matchId: match, ... } }',
    '',
    'This tool is read-only. It never mutates the Rating DB or production model.'
  ].join('\n');
}

function parseArgs(argv) {
  const args = [...argv];
  if (args.includes('--help') || args.includes('-h')) return { help: true, input: null, target: null, out: null, skipWalkForward: false };
  let input = null, target = null, out = null, skipWalkForward = false;
  while (args.length) {
    const arg = args.shift();
    if (arg === '--target') {
      if (!args.length) throw new Error('--target requires a PUUID');
      target = String(args.shift() || '').trim() || null;
    } else if (arg === '--out') {
      if (!args.length) throw new Error('--out requires a path');
      out = String(args.shift() || '').trim() || null;
    } else if (arg === '--skip-walk-forward') {
      skipWalkForward = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown argument: ${arg}`);
    } else if (!input) {
      input = arg;
    } else {
      throw new Error(`unexpected positional argument: ${arg}`);
    }
  }
  return { input, target, out, skipWalkForward };
}

function extractMatches(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.matches)) return payload.matches;
  if (payload?.matches && typeof payload.matches === 'object') return Object.values(payload.matches);
  if (Array.isArray(payload?.data?.matches)) return payload.data.matches;
  throw new Error('input JSON does not contain a supported matches collection');
}

function main(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  if (parsed.help || !parsed.input) {
    process.stdout.write(`${usage()}\n`);
    if (!parsed.help) process.exitCode = 2;
    return null;
  }
  const inputPath = path.resolve(parsed.input);
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const matches = extractMatches(payload);
  const evaluation = evaluateMmrV2(matches, { skipWalkForward: parsed.skipWalkForward });
  const measurement = parsed.target ? measureMmrV2(matches, parsed.target, { evaluation }) : null;
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: path.basename(inputPath),
    researchOnly: true,
    productionRatingActive: false,
    automaticPromotion: false,
    evaluation,
    measurement
  };
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (parsed.out) {
    const outputPath = path.resolve(parsed.out);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, text, 'utf8');
    process.stdout.write(`MMR v2 research report written: ${outputPath}\n`);
  } else {
    process.stdout.write(text);
  }
  return report;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`MMR v2 evaluation failed: ${error?.message || String(error)}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main, parseArgs, extractMatches, usage };
