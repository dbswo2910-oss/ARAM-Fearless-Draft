'use strict';
// Loaded into every RC canonical-exercise child process through NODE_OPTIONS.
// Fail closed if a deterministic fixture accidentally attempts external I/O.
const fail=(kind)=>{throw new Error(`RC_OFFLINE_GUARD blocked ${kind}`)};
try{const http=require('http');http.request=()=>fail('http.request');http.get=()=>fail('http.get')}catch{}
try{const https=require('https');https.request=()=>fail('https.request');https.get=()=>fail('https.get')}catch{}
try{const net=require('net');net.connect=()=>fail('net.connect');net.createConnection=()=>fail('net.createConnection')}catch{}
try{const tls=require('tls');tls.connect=()=>fail('tls.connect')}catch{}
try{const dns=require('dns');dns.lookup=()=>fail('dns.lookup');dns.resolve=()=>fail('dns.resolve')}catch{}
if(typeof globalThis.fetch==='function')globalThis.fetch=()=>fail('fetch');
if(typeof globalThis.WebSocket==='function')globalThis.WebSocket=class{constructor(){fail('WebSocket')}};
globalThis.__ARAM_RC_OFFLINE_GUARD__=true;
