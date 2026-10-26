#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateEnvelope} from '../public/crypto.js';
import {sourceFiles,outputFiles,forbidden} from './config.mjs';
const root=path.resolve(import.meta.dirname,'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function sameKeys(actual,expected){return JSON.stringify(Object.keys(actual).sort())===JSON.stringify([...expected].sort());}
function check(){
  const hosting=JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8')).hosting;
  if(hosting.public!=='dist' || !hosting.predeploy?.includes('node scripts/check-build.mjs')) throw new Error('Unsafe Hosting configuration');
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'.build-manifest.json'),'utf8'));
  if(!sameKeys(manifest.sources,sourceFiles)||!sameKeys(manifest.outputs,outputFiles)) throw new Error('Build manifest file list mismatch');
  const found=[];
  function walk(dir,base=''){
    for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
      if(e.isSymbolicLink()) throw new Error('Symlink in output');
      const rel=path.posix.join(base,e.name);
      if(e.isDirectory()) walk(path.join(dir,e.name),rel); else if(e.isFile()) found.push(rel); else throw new Error('Unexpected output type');
    }
  }
  walk(path.join(root,'dist'));
  if(JSON.stringify(found.sort())!==JSON.stringify([...outputFiles].sort())) throw new Error('Unexpected or missing build files');
  for(const [file,expected] of Object.entries(manifest.sources)) if(hash(fs.readFileSync(path.join(root,file)))!==expected) throw new Error('Source changed; rebuild required: '+file);
  for(const [file,expected] of Object.entries(manifest.outputs)) {
    const bytes=fs.readFileSync(path.join(root,'dist',file));
    if(hash(bytes)!==expected) throw new Error('Output changed: '+file);
    if(file==='encrypted-bundle.json') validateEnvelope(JSON.parse(bytes));
    else if(forbidden.test(bytes.toString('utf8'))) throw new Error('Private content in output: '+file);
  }
}
try{check();console.error('Deploy check passed. Only public files and authenticated ciphertext are present.');}
catch(e){console.error('DEPLOY CHECK FAILED: '+e.message);process.exitCode=1;}
