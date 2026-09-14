'use strict';
const L=require('./lib');
const legacy=require('../../update/v0.15.122/riot-grade-collector-v01532');
const next=require('../../src/riot/grade');
function stable(v){return JSON.stringify(v)}
const grades=['s','S+','s minus','a_plus','B-','C','D+','x','',null];
for(const g of grades)L.must(legacy.normGrade(g)===next.normGrade(g),`grade normalization drift for ${g}`);
const gameIds=['KR_123456789','123456789','EUW1_99887766','abc','',null];
for(const id of gameIds)L.must(legacy.canonGameId(id)===next.canonGameId(id),`game id canonicalization drift for ${id}`);
const payload={
  updates:[
    {grade:'S+',gameId:'KR_123456789',championId:103,playerId:77,queueId:450,gameMode:'ARAM',memberGrades:[{grade:'D',gameId:'KR_123456789',championId:22,playerId:88}]},
    {championGrade:'A-',gameID:'KR_123456790',championID:99,summonerId:77,queueID:450},
    {grade:'BAD',gameId:'KR_123456791',championId:1},
    {data:{grade:'B+',gameId:'KR_123456792',championId:64,playerId:77}}
  ],
  memberGrades:[{grade:'C',gameId:'KR_123456799',championId:51,playerId:999}]
};
const a=legacy.extractPrimaryRows(payload),b=next.extractPrimaryRows(payload);
L.must(stable(a)===stable(b),'primary Riot grade extraction drift');
L.must(b.length===3,'unexpected primary row count');
L.must(!b.some(r=>r.championId===22||r.championId===51),'nested teammate memberGrades leaked into canonical parser');
const records=[
 {gameId:'KR_123456789',puuid:'p1',championId:103,grade:'S+',roleSnapshot:{schema:1}},
 {gameId:'KR_123456789',puuid:'p1',championId:22,grade:'A'},
 {gameId:'KR_123456790',puuid:'p1',championId:99,grade:'B',gradeProvenance:next.PRIMARY_PROVENANCE}
];
const ma=legacy.migrateLegacyRecords(records),mb=next.migrateLegacyRecords(records);
L.must(stable(ma)===stable(mb),'legacy grade migration drift');
L.must(mb.changed===2&&mb.ambiguous===2,'legacy ambiguity migration contract drift');
const trustedFixtures=[
 {grade:'S+',gameId:'123456789',championId:103,gradeProvenance:next.PRIMARY_PROVENANCE},
 {grade:'S+',gameId:'123456789',championId:103,gradeProvenance:next.LEGACY_PROVENANCE},
 {grade:'X',gameId:'123456789',championId:103,gradeProvenance:next.PRIMARY_PROVENANCE}
];
for(const r of trustedFixtures)L.must(legacy.trustedRecord(r)===next.trustedRecord(r),'trusted grade predicate drift');
const stores=[{schema:3,records:[]},{schema:3,records:[{grade:'S+',roleSnapshot:{schema:1}}]},{schema:3,records:'bad'},{schema:3,records:[{grade:'THIS_IS_TOO_LONG'}]}];
for(const s of stores)L.must(legacy.validStore(s)===next.validStore(s),'Riot grade store validation drift');
L.must(next.PRIMARY_PROVENANCE==='riot-primary-update'&&next.LEGACY_PROVENANCE==='legacy-unverified-v015121','grade provenance identity drift');
L.must(next.production_active===false&&next.score_logic_changed===false&&next.random_scoring_changed===false,'canonical Riot parser must remain inactive and scoring neutral');
const report={status:'SUCCESS',production_active:false,implementation:next.IMPLEMENTATION_VERSION,primary_provenance:next.PRIMARY_PROVENANCE,legacy_provenance:next.LEGACY_PROVENANCE,primary_rows:b.length,member_grades_excluded:true,migration:{changed:mb.changed,ambiguous:mb.ambiguous},semantic_helpers:['normGrade','canonGameId','extractPrimaryRows','trustedRecord','migrateLegacyRecords','validStore'],cutover_allowed:false};
L.write('audit-output/stability/riot-canonical-differential.json',report);console.log('RIOT CANONICAL DIFFERENTIAL: SUCCESS · trusted primary-grade parsing and teammate exclusion preserved');
