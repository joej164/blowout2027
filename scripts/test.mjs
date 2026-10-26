#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {decryptEnvelope} from '../public/crypto.js';
import {outputFiles} from './config.mjs';
const root=path.resolve(import.meta.dirname,'..');
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'blowout-security-'));
let count=0;
const pass=message=>{console.log('PASS: '+message);count++;};
const run=(script,input)=>execFileSync(process.execPath,[path.join(fixture,'scripts',script)],{cwd:fixture,input,stdio:['pipe','pipe','pipe']});
const build=password=>run('build.mjs',password+'\n');
const envelope=()=>JSON.parse(fs.readFileSync(path.join(fixture,'dist/encrypted-bundle.json')));
const failed=fn=>{assert.throws(fn);};
const secret=randomUUID()+randomUUID();
try {
  for(const dir of ['public','private','scripts'])fs.cpSync(path.join(root,dir),path.join(fixture,dir),{recursive:true});
  for(const file of ['firebase.json','package.json'])fs.copyFileSync(path.join(root,file),path.join(fixture,file));
  build(secret);run('check-build.mjs');
  const first=envelope();const {key,bundle}=await decryptEnvelope(secret,first);
  assert.equal(key.extractable,false);
  assert.equal(bundle.pages.lodging,fs.readFileSync(path.join(fixture,'private/lodging.html'),'utf8'));
  assert.deepEqual(Buffer.from(bundle.images['lodging-map.png'].data,'base64'),fs.readFileSync(path.join(fixture,'private/lodging-map.png')));
  pass('actual build decrypts private HTML and image bytes exactly; key is nonextractable');
  await assert.rejects(decryptEnvelope(randomUUID(),first));pass('wrong password rejected');
  const ct=Buffer.from(first.ciphertext,'base64');ct[0]^=1;
  await assert.rejects(decryptEnvelope(secret,{...first,ciphertext:ct.toString('base64')}));pass('modified ciphertext rejected');
  build(secret);const second=envelope();assert.notEqual(first.salt,second.salt);assert.notEqual(first.iv,second.iv);assert.notEqual(first.ciphertext,second.ciphertext);pass('fresh salts and IVs on rebuild');
  const privateText=fs.readFileSync(path.join(fixture,'private/lodging.html'),'utf8');
  const knownPrivate=['Todd #1','Torin','Adrianne','17700',...(privateText.match(/<strong>([a-z0-9]{4,})<\/strong>/g)||[]).map(s=>s.replace(/<[^>]+>/g,''))];
  for(const file of outputFiles){
    const bytes=fs.readFileSync(path.join(fixture,'dist',file));assert(!bytes.includes(Buffer.from(secret)));
    if(file==='encrypted-bundle.json')continue;
    for(const text of knownPrivate)assert(!bytes.includes(Buffer.from(text)),`${file} contains private text`);
  }
  pass('output has no plaintext private text, access values, images or password');
  fs.writeFileSync(path.join(fixture,'dist/leak.png'),'private image');failed(()=>run('check-build.mjs'));fs.rmSync(path.join(fixture,'dist/leak.png'));pass('unexpected output blocked');
  fs.appendFileSync(path.join(fixture,'dist/index.html'),'tamper');failed(()=>run('check-build.mjs'));pass('modified output blocked');
  build(secret);fs.appendFileSync(path.join(fixture,'private/lodging.html'),'changed');failed(()=>run('check-build.mjs'));pass('stale private content blocked');
  build(secret);fs.appendFileSync(path.join(fixture,'scripts/config.mjs'),'\n');failed(()=>run('check-build.mjs'));pass('changed build configuration blocked');
  build(secret);fs.unlinkSync(path.join(fixture,'dist/styles.css'));fs.symlinkSync(path.join(fixture,'public/styles.css'),path.join(fixture,'dist/styles.css'));failed(()=>run('check-build.mjs'));pass('symlink output blocked');
  failed(()=>build(''));assert(!fs.existsSync(path.join(fixture,'dist')));assert(!fs.existsSync(path.join(fixture,'.build-manifest.json')));pass('failed build removes deployable output and manifest');
  fs.appendFileSync(path.join(fixture,'public/index.html'),'<p>Torin</p>');failed(()=>build(secret));pass('known private content in public source blocked');
  console.log(`${count} security checks passed; only a disposable temporary project was used.`);
} finally {fs.rmSync(fixture,{recursive:true,force:true});}
