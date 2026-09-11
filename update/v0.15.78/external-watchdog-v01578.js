'use strict';
const fs=require('fs'),path=require('path');
const parentPid=Number(process.argv[2]||0),dir=String(process.argv[3]||'');
if(!parentPid||!dir)process.exit(2);
const mainFile=path.join(dir,'heartbeat-main-v01578.json');
const rendererFile=path.join(dir,'heartbeat-renderer-v01578.json');
const logFile=path.join(dir,'external-hang-v01578.log');
const started=Date.now();let lastCode='',lastWrite=0;
const append=(code,detail={})=>{try{fs.mkdirSync(dir,{recursive:true});fs.appendFileSync(logFile,JSON.stringify({at:new Date().toISOString(),version:'0.15.78',code,detail})+'\n','utf8')}catch{}};
const ageOf=f=>{try{return Date.now()-fs.statSync(f).mtimeMs}catch{return 1000000000000}};
const alive=()=>{try{process.kill(parentPid,0);return true}catch{return false}};
function check(){
  if(!alive()){append('HNG-EXIT',{parentPid});process.exit(0)}
  if(Date.now()-started<8000)return;
  const mainAge=ageOf(mainFile),rendererAge=ageOf(rendererFile),m=mainAge>2600,r=rendererAge>2600;
  const code=m&&r?'HNG-B001':m?'HNG-M001':r?'HNG-R001':'HNG-OK';
  if(code!==lastCode||((m||r)&&Date.now()-lastWrite>8000)){
    append(code,{parentPid,mainAgeMs:Math.round(mainAge),rendererAgeMs:Math.round(rendererAge)});
    lastCode=code;lastWrite=Date.now();
  }
}
append('HNG-START',{parentPid});
setInterval(check,500);
