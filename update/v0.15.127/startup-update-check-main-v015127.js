'use strict';
const https=require('https');
const {ipcMain}=require('electron');
let installed=false;
function verParts(v){return String(v||'0').split('.').map(x=>Number.parseInt(x,10)||0)}
function compareVersion(a,b){const A=verParts(a),B=verParts(b),L=Math.max(A.length,B.length);for(let i=0;i<L;i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y?1:-1}return 0}
function getBuffer(url,redirects=0){return new Promise((resolve,reject)=>{let u;try{u=new URL(url)}catch(e){reject(e);return}if(u.protocol!=='https:'||u.hostname!=='raw.githubusercontent.com'){reject(new Error('허용되지 않은 업데이트 확인 호스트입니다.'));return}const req=https.get(u,{headers:{'User-Agent':'ARAM-Fearless-Draft-Startup-Update-Check/0.15.127','Cache-Control':'no-cache'}},res=>{const code=Number(res.statusCode)||0;if(code>=300&&code<400&&res.headers.location){res.resume();if(redirects>=4){reject(new Error('업데이트 확인 리다이렉트가 너무 많습니다.'));return}let next;try{next=new URL(res.headers.location,u).toString()}catch(e){reject(e);return}getBuffer(next,redirects+1).then(resolve,reject);return}if(code!==200){res.resume();reject(new Error(`업데이트 서버 응답 ${code}`));return}const chunks=[];let size=0;res.on('data',c=>{size+=c.length;if(size>2*1024*1024){req.destroy(new Error('업데이트 manifest가 허용 크기를 초과했습니다.'));return}chunks.push(c)});res.on('end',()=>resolve(Buffer.concat(chunks)))});req.setTimeout(10000,()=>req.destroy(new Error('업데이트 확인 시간이 초과되었습니다.')));req.on('error',reject)})}
function cleanRepo(v){const s=String(v||'').trim();if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(s))throw new Error('업데이트 저장소 형식이 올바르지 않습니다.');return s}
function cleanBranch(v){const s=String(v||'main').trim();if(!/^[A-Za-z0-9._\/-]+$/.test(s)||s.includes('..'))throw new Error('업데이트 브랜치 형식이 올바르지 않습니다.');return s}
function install(options={}){
  if(installed)return{installed:true,already:true};
  const current=String(options.version||'0.15.127');
  const repo=cleanRepo(options.repo||process.env.ARAM_UPDATE_REPO||'dbswo2910-oss/ARAM-Fearless-Draft');
  const branch=cleanBranch(options.branch||'main');
  const launcher=String(options.launcherVersion||process.env.ARAM_LAUNCHER_VERSION||'2.0.2');
  ipcMain.handle('desktop:update-check',async()=>{
    try{
      const url=`https://raw.githubusercontent.com/${repo}/${branch.split('/').map(encodeURIComponent).join('/')}/update/manifest.json?t=${Date.now()}`;
      const buf=await getBuffer(url);
      const manifest=JSON.parse(buf.toString('utf8'));
      const latest=String(manifest?.version||'');
      if(!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(latest)||!Array.isArray(manifest?.files))throw new Error('업데이트 manifest 형식이 올바르지 않습니다.');
      if(compareVersion(latest,current)<=0)return{status:'current',current,latest,message:`최신 버전입니다 · v${current}`};
      if(manifest.min_launcher&&compareVersion(launcher,String(manifest.min_launcher))<0)return{status:'launcher-required',current,latest,launcher,minLauncher:String(manifest.min_launcher),message:`Launcher v${manifest.min_launcher} 이상이 필요합니다.`};
      return{status:'available',current,latest,message:String(manifest.message||`v${latest} 업데이트가 있습니다.`),releaseMessage:String(manifest.message||''),minLauncher:String(manifest.min_launcher||'')};
    }catch(e){return{status:'error',current,latest:current,message:e?.message||String(e)}}
  });
  installed=true;
  return{installed:true,channel:'desktop:update-check',current};
}
module.exports={install,compareVersion,score_logic_changed:false,random_scoring_changed:false,policy_version:'0.15.127'};
