// Community Calibration v1 — Cloudflare Worker reference implementation.
// Binding required: env.CALIBRATION_DB (D1).
// This endpoint is intentionally write-only for the public desktop client.

const MAX_BATCH = 20;
const MAX_BODY_BYTES = 512 * 1024;
const MAX_EVENT_BYTES = 96 * 1024;
const QUEUES = new Set([450, 2400]);
const ROLES = new Set(['원딜','탱커','서포터','메이지','브루저','암살자','ADC','TANK','SUPPORT','MAGE','BRUISER','ASSASSIN']);
const GRADE_RE = /^(?:S\+?|S-|A[+-]?|B[+-]?|C[+-]?|D[+-]?)$/;
const HEX64 = /^[a-f0-9]{64}$/i;
const INSTALL_ID_RE = /^[a-zA-Z0-9._:-]{16,128}$/;
const encoder = new TextEncoder();

const BANNED_KEYS = new Set([
  'puuid','riotid','riot_id','summonername','summoner_name','gamename','game_name',
  'tagline','tag_line','accountid','account_id','summonerid','summoner_id',
  'displayname','display_name','email','phone','ip','ipaddress','ip_address',
  'gameid','game_id','rawgameid','raw_game_id','access_token','token','password'
]);

function cors(extra={}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Cache-Control': 'no-store',
    ...extra
  };
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:cors({'content-type':'application/json; charset=utf-8'})});}
function byteLength(s){return encoder.encode(String(s??'')).byteLength;}
function str(v,max=128){const s=v==null?'':String(v).trim();return s.length<=max?s:'';}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function int(v){const n=num(v);return n===null?null:Math.trunc(n);}
function grade(v){const s=str(v,4).toUpperCase();return GRADE_RE.test(s)?s:'';}
function containsBannedKey(root){
  const seen=new Set();
  function walk(x){
    if(x==null||typeof x!=='object'||seen.has(x))return false;
    seen.add(x);
    if(Array.isArray(x))return x.some(walk);
    for(const [k,v] of Object.entries(x)){
      const key=String(k).toLowerCase();
      if(BANNED_KEYS.has(key))return true;
      if(walk(v))return true;
    }
    return false;
  }
  return walk(root);
}
function validateEvent(raw,root){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return{ok:false,error:'invalid event'};
  if(containsBannedKey(raw))return{ok:false,error:'identity field rejected'};
  const schemaVersion=int(raw.schema_version??root.schema_version);
  const policyVersion=int(raw.policy_version??root.policy_version);
  const anonymousInstallId=str(raw.anonymous_install_id??root.anonymous_install_id,128);
  const gameHash=str(raw.game_hash,64);
  const queueId=int(raw.queue_id);
  const championId=int(raw.champion_id);
  const role=str(raw.role,32);
  const roleScore=num(raw.role_score);
  const roleGrade=grade(raw.role_grade);
  const riotGrade=grade(raw.riot_grade);
  const patchVersion=str(raw.patch_version,32);
  const appVersion=str(raw.app_version,32);
  const engineVersion=str(raw.engine_version,64);
  if(schemaVersion!==1)return{ok:false,error:'unsupported schema'};
  if(policyVersion!==1)return{ok:false,error:'unsupported policy'};
  if(!INSTALL_ID_RE.test(anonymousInstallId))return{ok:false,error:'invalid anonymous id'};
  if(!HEX64.test(gameHash))return{ok:false,error:'invalid game hash'};
  if(!QUEUES.has(queueId))return{ok:false,error:'invalid queue'};
  if(championId===null||championId<1||championId>10000)return{ok:false,error:'invalid champion'};
  if(role&&!ROLES.has(role))return{ok:false,error:'invalid role'};
  if(roleScore!==null&&(roleScore<0||roleScore>100))return{ok:false,error:'invalid role score'};
  const payload=JSON.stringify(raw);
  if(byteLength(payload)>MAX_EVENT_BYTES)return{ok:false,error:'event too large'};
  return{ok:true,row:{schemaVersion,policyVersion,anonymousInstallId,gameHash,queueId,championId,role,roleScore,roleGrade,riotGrade,patchVersion,appVersion,engineVersion,payload}};
}

export default {
  async fetch(request, env) {
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors()});
    const url=new URL(request.url);
    if(url.pathname==='/health'&&request.method==='GET')return json({ok:true,service:'community-calibration',schema:1});
    if(url.pathname!=='/v1/calibration'||request.method!=='POST')return json({ok:false,error:'not found'},404);
    if(!env.CALIBRATION_DB)return json({ok:false,error:'database unavailable'},503);
    const len=Number(request.headers.get('content-length')||0);
    if(len>MAX_BODY_BYTES)return json({ok:false,error:'body too large'},413);
    let text='';
    try{text=await request.text();}catch{return json({ok:false,error:'body read failed'},400);}
    if(byteLength(text)>MAX_BODY_BYTES)return json({ok:false,error:'body too large'},413);
    let body;
    try{body=JSON.parse(text);}catch{return json({ok:false,error:'invalid json'},400);}
    if(!body||typeof body!=='object')return json({ok:false,error:'invalid body'},400);
    if(containsBannedKey(body))return json({ok:false,error:'identity field rejected'},400);
    const events=Array.isArray(body.events)?body.events:[];
    if(!events.length||events.length>MAX_BATCH)return json({ok:false,error:'invalid batch size'},400);
    const valid=[];
    for(const raw of events){const v=validateEvent(raw,body);if(!v.ok)return json({ok:false,error:v.error},400);valid.push(v.row);}
    const now=new Date().toISOString();
    const stmts=[];
    const devices=new Set();
    for(const r of valid){
      if(!devices.has(r.anonymousInstallId)){
        devices.add(r.anonymousInstallId);
        stmts.push(env.CALIBRATION_DB.prepare(`
          INSERT INTO calibration_devices(anonymous_install_id,first_seen_at,last_seen_at,policy_version,app_version)
          VALUES(?,?,?,?,?)
          ON CONFLICT(anonymous_install_id) DO UPDATE SET
            last_seen_at=excluded.last_seen_at,
            policy_version=excluded.policy_version,
            app_version=excluded.app_version
        `).bind(r.anonymousInstallId,now,now,r.policyVersion,r.appVersion));
      }
      stmts.push(env.CALIBRATION_DB.prepare(`
        INSERT OR IGNORE INTO calibration_events(
          received_at,schema_version,policy_version,anonymous_install_id,game_hash,queue_id,
          patch_version,app_version,engine_version,champion_id,role,role_score,role_grade,riot_grade,payload_json
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(now,r.schemaVersion,r.policyVersion,r.anonymousInstallId,r.gameHash,r.queueId,
        r.patchVersion,r.appVersion,r.engineVersion,r.championId,r.role,r.roleScore,r.roleGrade,r.riotGrade,r.payload));
    }
    try{await env.CALIBRATION_DB.batch(stmts);}catch(e){return json({ok:false,error:'database write failed'},500);}
    return json({ok:true,accepted:valid.length,schema_version:1,server_time:now});
  }
};
