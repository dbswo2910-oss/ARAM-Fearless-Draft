'use strict';
(()=>{
  const V='0.15.34',CONFIG_URL='https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/main/update/community-calibration-config.json';
  const K_CONSENT='aram_cc_consent_v1',K_INSTALL='aram_cc_install_v1',K_QUEUE='aram_cc_queue_v1',K_SENT='aram_cc_sent_v1';
  let cfg=null,timer=null,busy=false,lastResult={status:'staged'},promptOpen=false;
  const num=(v,d=null)=>{const n=Number(v);return Number.isFinite(n)?n:d};
  const str=v=>v==null?'':String(v).trim();
  const canon=v=>{const s=str(v),m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s};
  const safeParse=(s,d)=>{try{return JSON.parse(s)}catch{return d}};
  const lsGet=(k,d)=>safeParse(localStorage.getItem(k),d),lsSet=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  function installId(){
    let id=str(localStorage.getItem(K_INSTALL));if(id)return id;
    id=(crypto.randomUUID?.()||`cc-${Date.now().toString(36)}-${Array.from(crypto.getRandomValues(new Uint32Array(4))).map(x=>x.toString(36)).join('')}`);
    localStorage.setItem(K_INSTALL,id);return id;
  }
  async function sha256(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s)));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  function cleanNumbers(root,depth=0,budget={n:0,max:900}){
    if(root==null)return null;const t=typeof root;if(t==='number')return Number.isFinite(root)?root:null;if(t==='boolean')return root;if(t!=='object'||depth>5)return null;
    if(Array.isArray(root)){const a=[];for(const v of root.slice(0,128)){const x=cleanNumbers(v,depth+1,budget);if(x!=null)a.push(x);if(budget.n>=budget.max)break}return a.length?a:null}
    const o={};for(const [k,v] of Object.entries(root)){if(budget.n>=budget.max)break;const x=cleanNumbers(v,depth+1,budget);if(x==null)continue;o[k]=x;budget.n++}return Object.keys(o).length?o:null
  }
  function qid(){return aramHistoryState?.queueMode==='mayhem'?2400:450}
  function patchVersion(m){const v=str(m?.gameVersion);return v.split('.').slice(0,2).join('.')||str(DATA?.patch||DATA?.version)||''}
  function currentOnly(){return aramHistoryState?.targetMode!=='searched'}
  function roleData(m){try{return typeof aramHistoryRoleBreakdown==='function'?aramHistoryRoleBreakdown(m):null}catch{return null}}
  function signals(m){try{return typeof aramHistoryBaseSignals==='function'?cleanNumbers(aramHistoryBaseSignals(m)):null}catch{return null}}
  function championId(m){return num(m?.me?.championId??m?.me?.champion?.id)}
  function gradeMap(state){
    const mp=new Map();for(const r of Array.isArray(state?.records)?state.records:[]){const gid=canon(r?.gameId);if(gid&&!mp.has(gid))mp.set(gid,str(r?.grade).toUpperCase())}return mp
  }
  async function makeEvent(m,grades){
    const gid=canon(m?.gameId),cid=championId(m);if(!gid||cid==null)return null;
    const rd=roleData(m),install=installId(),gameHash=await sha256(`${install}|${gid}`),raw=cleanNumbers(m?.me?.rawGameplay||{});
    return{
      schema_version:Number(cfg?.schema_version)||1,policy_version:Number(cfg?.policy_version)||1,anonymous_install_id:install,game_hash:gameHash,
      queue_id:qid(),patch_version:patchVersion(m),app_version:V,engine_version:str(rd?.gradeModel||rd?.engineKey||'ROLE_FAIRS_MISSION_V01529'),
      champion_id:cid,role:str(rd?.role),role_score:num(rd?.score),role_grade:str(rd?.grade).toUpperCase(),riot_grade:grades.get(gid)||'',
      win:!!m?.win,game_duration:num(m?.gameDuration),data_quality:str(m?.dataQuality),raw_gameplay_schema:num(m?.me?.rawGameplaySchema,0),
      raw_gameplay:raw||{},derived_signals:signals(m)||{},telemetry_field_count:num(m?.rawGameplayFieldCount,0),captured_at:Date.now()
    };
  }
  function sent(){const a=lsGet(K_SENT,[]);return Array.isArray(a)?a:[]}
  function queue(){const a=lsGet(K_QUEUE,[]);return Array.isArray(a)?a:[]}
  function saveQueue(a){lsSet(K_QUEUE,a.slice(-120))}
  function saveSent(a){lsSet(K_SENT,a.slice(-1500))}
  async function enqueueLoaded(){
    if(!cfg?.enabled||!accepted()||!currentOnly())return{added:0};
    const ms=Array.isArray(aramHistoryState?.matches)?aramHistoryState.matches:[];if(!ms.length)return{added:0};
    let state={records:[]};try{state=await window.aramDesktop?.getRiotGradeState?.()||state}catch{}
    const grades=gradeMap(state),q=queue(),known=new Set([...sent(),...q.map(x=>x.game_hash)]);let added=0;
    for(const m of ms.slice(0,40)){const e=await makeEvent(m,grades);if(!e||known.has(e.game_hash))continue;q.push(e);known.add(e.game_hash);added++}
    if(added)saveQueue(q);return{added}
  }
  async function upload(){
    if(!cfg?.enabled||!accepted()||!cfg?.endpoint)return{status:'disabled'};
    const endpoint=str(cfg.endpoint);if(!/^https:\/\//i.test(endpoint))return{status:'invalid-endpoint'};
    const q=queue();if(!q.length)return{status:'idle',pending:0};
    const batch=q.slice(0,20),body={schema_version:Number(cfg.schema_version)||1,policy_version:Number(cfg.policy_version)||1,events:batch};
    const res=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    if(!res.ok)throw new Error(`Community Calibration upload ${res.status}`);
    const ack=await res.json().catch(()=>({ok:true}));if(ack?.ok===false)throw new Error(ack?.error||'upload rejected');
    const hashes=batch.map(x=>x.game_hash),ss=sent();saveSent([...ss,...hashes]);saveQueue(q.slice(batch.length));
    return{status:'uploaded',uploaded:batch.length,pending:Math.max(0,q.length-batch.length)}
  }
  function accepted(){const c=lsGet(K_CONSENT,null);return !!(c&&Number(c.policy_version)===Number(cfg?.policy_version)&&c.accepted===true)}
  function css(){
    if(document.getElementById('cc34style'))return;const s=document.createElement('style');s.id='cc34style';s.textContent=`
    .cc34back{position:fixed;inset:0;z-index:2147483646;background:rgba(3,8,18,.94);display:flex;align-items:center;justify-content:center;padding:24px}
    .cc34box{width:min(720px,94vw);max-height:88vh;overflow:auto;background:#0d1828;border:1px solid #29445f;border-radius:18px;padding:24px;color:#eaf4ff;box-shadow:0 24px 90px #0009}
    .cc34box h2{margin:0 0 10px;font-size:22px}.cc34box p,.cc34box li{line-height:1.55;color:#b9cce0}.cc34box b{color:#fff}.cc34buttons{display:flex;gap:10px;justify-content:flex-end;margin-top:20px;flex-wrap:wrap}
    .cc34buttons button{border:1px solid #35526f;background:#14263a;color:#eaf4ff;padding:11px 16px;border-radius:10px;font-weight:800;cursor:pointer}.cc34buttons .ok{background:#183c59;border-color:#3f7ca5}
    `;document.head.appendChild(s)
  }
  function prompt(){
    if(promptOpen||accepted()||!cfg?.enabled)return;promptOpen=true;css();const d=document.createElement('div');d.className='cc34back';d.id='cc34prompt';
    d.innerHTML=`<div class="cc34box"><h2>Community Calibration 데이터 이용 안내</h2>
      <p>이 프로그램은 칼바람 분석 정확도를 개선하기 위해 <b>동의한 사용자의 경기 데이터를 익명화해 중앙 Calibration 데이터셋에 저장</b>합니다. 이 데이터 제공은 배포판 이용 조건입니다.</p>
      <ul><li>수집: 챔피언·역할·Queue·패치·경기 통계·ROLE 평가·Riot Grade·현재 앱이 확보한 안전한 숫자형/참거짓형 게임 통계</li>
      <li>수집 안 함: Riot ID, 닉네임, PUUID, 친구목록, 채팅, 이메일, 전화번호, LCU 인증정보, 원본 gameId</li>
      <li>원본 gameId는 PC 안에서만 사용하고 서버에는 익명 설치 ID와 조합한 SHA-256 해시만 전송합니다.</li>
      <li>목적: 챔피언/역할/패치별 평가 편향 탐지와 ROLE 엔진 검증. Riot Grade를 자동으로 ROLE 점수에 더하지 않습니다.</li></ul>
      <p>동의하지 않으면 프로그램을 종료합니다. 수집 항목이 크게 바뀌면 policy version을 올려 다시 안내합니다.</p>
      <div class="cc34buttons"><button id="cc34no">동의하지 않고 종료</button><button class="ok" id="cc34yes">동의하고 시작</button></div></div>`;
    document.body.appendChild(d);
    d.querySelector('#cc34yes').onclick=()=>{lsSet(K_CONSENT,{accepted:true,policy_version:Number(cfg.policy_version)||1,accepted_at:Date.now()});d.remove();promptOpen=false;tick(true)};
    d.querySelector('#cc34no').onclick=()=>{localStorage.removeItem(K_CONSENT);try{window.close()}catch{}};
  }
  async function fetchConfig(){
    try{const r=await fetch(`${CONFIG_URL}?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(String(r.status));const x=await r.json();cfg=x&&typeof x==='object'?x:null}
    catch(e){cfg={enabled:false,policy_version:1,schema_version:1,endpoint:'',error:e?.message||String(e)}}return cfg
  }
  async function tick(force=false){
    if(busy)return lastResult;busy=true;
    try{
      if(!cfg||force)await fetchConfig();
      if(!cfg?.enabled){lastResult={status:'staged-disabled',pending:queue().length};return lastResult}
      if(!accepted()){prompt();lastResult={status:'consent-required',pending:queue().length};return lastResult}
      const en=await enqueueLoaded();let up={status:'idle'};try{up=await upload()}catch(e){up={status:'upload-error',error:e?.message||String(e),pending:queue().length}}
      lastResult={status:up.status,added:en.added||0,...up,at:Date.now()};return lastResult
    }finally{busy=false}
  }
  function start(){if(timer)return;setTimeout(()=>tick(true),4500);timer=setInterval(()=>tick(false),60000)}
  try{const old=typeof renderAramHistoryFeedback==='function'?renderAramHistoryFeedback:null;if(old)renderAramHistoryFeedback=function(...a){const r=old.apply(this,a);setTimeout(()=>tick(false),1200);return r}}catch{}
  window.addEventListener('focus',()=>setTimeout(()=>tick(false),900),{passive:true});start();
  window.aramCommunityCalibrationV01534={tick,fetchConfig,enqueueLoaded,upload,get config(){return cfg},get lastResult(){return lastResult}};
  window.__ARAM_COMMUNITY_CALIBRATION_V01534__=true;
  if(typeof DATA!=='undefined'){DATA.version=V;DATA.community_calibration_v01534={version:'v0.15.34 · Community Calibration staged',remote_kill_switch:true,consent_required_when_enabled:true,identity_upload:false,raw_game_id_upload:false,scoring_use:false}}
  if(typeof syncAppVersionUI==='function')syncAppVersionUI();
})();
