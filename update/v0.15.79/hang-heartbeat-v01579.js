'use strict';
const fs=require('fs'),path=require('path');
const {spawn}=require('child_process');
const {app}=require('electron');
let installed=false,timer=null,child=null;
function install(opts={}){
  if(installed)return;installed=true;
  let dir='';try{dir=path.join(app.getPath('userData'),'diagnostics')}catch{dir=path.join(__dirname,'diagnostics')}
  try{fs.mkdirSync(dir,{recursive:true})}catch{}
  const stable=path.join(dir,'heartbeat-main.json'),legacy=path.join(dir,'heartbeat-main-v01578.json');
  const write=()=>{const body=JSON.stringify({at:Date.now(),pid:process.pid,version:String(opts.version||'0.15.79')});fs.writeFile(stable,body,()=>{});fs.writeFile(legacy,body,()=>{})};
  write();timer=setInterval(write,500);timer.unref?.();
  try{
    child=spawn(process.execPath,[path.join(__dirname,'external-watchdog-v01579.js'),String(process.pid),dir],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},detached:true,stdio:'ignore',windowsHide:true});
    child.on?.('error',e=>{try{opts.record?.('HNG-S001','external-watchdog-spawn-error',{message:e?.message||String(e)})}catch{}});child.unref?.();
    try{opts.record?.('HNG-S000','external-watchdog-started',{pid:child.pid||0,dir})}catch{}
  }catch(e){try{opts.record?.('HNG-S001','external-watchdog-spawn-error',{message:e?.message||String(e)})}catch{}}
  return{dir,file:stable};
}
module.exports={install};
