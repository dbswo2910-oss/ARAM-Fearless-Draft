'use strict';
const riot=require('../riot/grade');
const IMPLEMENTATION_VERSION='0.16-shadow';
const rank=g=>({'D-':0,'D':1,'D+':2,'C-':3,'C':4,'C+':5,'B-':6,'B':7,'B+':8,'A-':9,'A':10,'A+':11,'S-':12,'S':13,'S+':14}[String(g||'').toUpperCase()]??null);
function ownGrade(score){score=Number(score)||0;if(score>=96)return'S+';if(score>=91)return'S';if(score>=84)return'A+';if(score>=76)return'A';if(score>=64)return'B';if(score>=52)return'C';return'D'}
function verdict(roleGrade,riotGrade){const a=rank(roleGrade),b=rank(riotGrade);if(a==null||b==null)return'외부 검증값 수집 완료';const d=b-a;if(d>=3)return`Riot 등급이 우리보다 ${d}단계 높음 · 저평가 검토`;if(d<=-3)return`우리 등급이 Riot보다 ${-d}단계 높음 · 고평가 검토`;if(Math.abs(d)<=1)return'두 평가가 비슷한 구간';return d>0?'Riot 평가가 다소 높음':'우리 평가가 다소 높음'}
function matchChampionId(match){for(const root of [match,match?.me,match?.participant,match?.localParticipant,match?.data,match?.info]){const raw=root?.championId??root?.championID;if(raw===null||raw===undefined||raw==='')continue;const n=Number(raw);if(Number.isFinite(n))return n}return null}
function matchPuuid(match,fallback=''){for(const root of [match?.me,match?.participant,match?.localParticipant,match]){const v=String(root?.puuid||'').trim();if(v)return v}return String(fallback||'').trim()}
function findAuthoritativeRecord(state,match,{puuid='',championId=null}={}){
  const gid=riot.canonGameId(match?.gameId??match?.id??match?.matchId??match?.metadata?.matchId),targetPuuid=String(puuid||matchPuuid(match)).trim(),hasExplicitChampion=championId!==null&&championId!==undefined&&championId!==''&&Number.isFinite(Number(championId)),cid=hasExplicitChampion?Number(championId):matchChampionId(match);
  if(!gid||cid===null)return null;
  return (Array.isArray(state?.records)?state.records:[]).find(r=>riot.trustedRecord(r)&&riot.canonGameId(r.gameId)===gid&&Number(r.championId)===cid&&(!targetPuuid||!r.puuid||String(r.puuid)===targetPuuid))||null;
}
function buildLinkView({state,match,roleScore=0,roleGrade='',puuid='',championId=null,localPuuid=''}={}){
  const grade=String(roleGrade||ownGrade(roleScore));
  const rec=findAuthoritativeRecord(state,match,{puuid,championId});
  if(rec)return{status:'linked',role_grade:grade,role_score:Number(roleScore)||0,riot_grade:rec.grade,game_id:riot.canonGameId(rec.gameId),champion_id:Number(rec.championId),verdict:verdict(grade,rec.grade),scoring_use:false,authoritative_only:true,provenance:rec.gradeProvenance};
  const target=String(puuid||matchPuuid(match)).trim(),local=String(localPuuid||'').trim(),other=!!(target&&local&&target!==local);
  return{status:'unlinked',role_grade:grade,role_score:Number(roleScore)||0,riot_grade:null,reason:other?'searched-player-grade-not-collected':'no-authoritative-grade-for-exact-game-and-champion',scoring_use:false,authoritative_only:true};
}
module.exports={IMPLEMENTATION_VERSION,rank,ownGrade,verdict,matchChampionId,matchPuuid,findAuthoritativeRecord,buildLinkView,production_active:false,score_logic_changed:false,profile_scoring_changed:false,riot_grade_scoring_use:false};
