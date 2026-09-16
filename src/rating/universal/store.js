'use strict';
const fs=require('fs');
const path=require('path');
const {SCHEMA_VERSION,ratingKey}=require('./contracts');
const empty=()=>({schemaVersion:SCHEMA_VERSION,players:{},matches:{},ratings:{},audits:[]});
function migrate(input){const s=input&&typeof input==='object'?input:empty();if(!s.schemaVersion)s.schemaVersion=1;if(s.schemaVersion!==SCHEMA_VERSION)throw new Error(`unsupported rating db schema ${s.schemaVersion}`);s.players=s.players||{};s.matches=s.matches||{};s.ratings=s.ratings||{};s.audits=Array.isArray(s.audits)?s.audits:[];return s}
class MemoryRatingStore{
  constructor(seed){this.state=migrate(seed?JSON.parse(JSON.stringify(seed)):empty())}
  flush(){}
  getPlayer(puuid){return this.state.players[String(puuid)]||null}
  putPlayer(player){if(!player?.puuid)throw new Error('player.puuid required');this.state.players[player.puuid]={...(this.state.players[player.puuid]||{}),...player,updatedAt:Date.now()};this.flush();return this.state.players[player.puuid]}
  getMatch(id){return this.state.matches[String(id)]||null}
  getAllMatches(){return Object.values(this.state.matches).sort((a,b)=>a.timestamp-b.timestamp||a.matchId.localeCompare(b.matchId))}
  putMatch(match){return this.putMatches([match])[0]}
  putMatches(matches){const out=[];for(const match of Array.isArray(matches)?matches:[]){if(!match?.matchId)throw new Error('match.matchId required');this.state.matches[match.matchId]=match;out.push(match)}if(out.length)this.flush();return out}
  getMatchesForPlayer(puuid){const id=String(puuid);return this.getAllMatches().filter(m=>m?.teamA?.includes(id)||m?.teamB?.includes(id))}
  getRating(modelVersion,puuid){return this.state.ratings[ratingKey(modelVersion,puuid)]||null}
  putRating(record){if(!record?.modelVersion||!record?.puuid)throw new Error('rating modelVersion and puuid required');const k=ratingKey(record.modelVersion,record.puuid);this.state.ratings[k]=record;this.flush();return record}
  appendAudit(row){this.state.audits.push({...row,at:row?.at||Date.now()});if(this.state.audits.length>2000)this.state.audits=this.state.audits.slice(-2000);this.flush();return row}
  snapshot(){return JSON.parse(JSON.stringify(this.state))}
}
class JsonRatingStore extends MemoryRatingStore{
  constructor(filePath){if(!filePath)throw new Error('filePath required');let seed=null;try{if(fs.existsSync(filePath))seed=JSON.parse(fs.readFileSync(filePath,'utf8'))}catch(e){throw new Error(`rating db read failed: ${e.message}`)}super(seed);this.filePath=path.resolve(filePath)}
  flush(){if(!this.filePath)return;fs.mkdirSync(path.dirname(this.filePath),{recursive:true});const tmp=`${this.filePath}.${process.pid}.tmp`;fs.writeFileSync(tmp,JSON.stringify(this.state,null,2),'utf8');fs.renameSync(tmp,this.filePath)}
}
module.exports={empty,migrate,MemoryRatingStore,JsonRatingStore,production_active:false};