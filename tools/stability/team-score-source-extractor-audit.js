'use strict';
const L=require('./lib');const x=require('./team-score-source-extractor');
const fixtures=[
  ['declaration','<script>function teamScore(names,modes){const x={a:"}"};if(names.length){return {s:names.length,parts:{x:1}}}return {s:0}}</script>','function-declaration'],
  ['expression','const teamScore = function(names,modes){/* } */ return {s:(names||[]).length};};','function-expression'],
  ['arrow','let teamScore=(names,modes)=>{const t=`${names.length}}`;return {s:names.length};};','arrow']
];
for(const [id,src,kind] of fixtures){const r=x.extractTeamScoreSource(src);L.must(r.found&&r.kind===kind,`${id} extractor failed`);L.must(r.source.includes('teamScore')&&r.source.trim().endsWith('}'),`${id} source boundary failed`)}
const missing=x.extractTeamScoreSource('function other(){return 1}');L.must(!missing.found&&missing.start===-1,'missing scorer should not false-positive');
const ref=L.read('reference/installed-v0.15.49/random-practice-pick-fragment.html');L.must(ref.includes('Source index.html SHA-256:\n8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906'),'real installed reference hash marker missing');L.must(x.KNOWN_INSTALLED_V01549_INDEX_SHA256==='8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906','extractor known baseline hash drift');
L.write('audit-output/stability/team-score-source-extractor.json',{status:'SUCCESS',fixture_count:fixtures.length,known_installed_index_sha256:x.KNOWN_INSTALLED_V01549_INDEX_SHA256,privacy:'source-only local app code; no Riot account/session data',next_use:'run against exact installed v0.15.49 index backup (prefer index.pre-v01569-auto-regression.bak.html if present) before canonicalizing teamScore math'});console.log('TEAM SCORE SOURCE EXTRACTOR AUDIT: SUCCESS');
