#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import readline from 'node:readline';
import {encryptBundle} from '../public/crypto.js';
import {publicFiles, privatePages, privateImages, sourceFiles, forbidden} from './config.mjs';
const root = path.resolve(import.meta.dirname,'..');
const dist = path.join(root,'dist');
const manifestPath = path.join(root,'.build-manifest.json');
const hash = bytes=>createHash('sha256').update(bytes).digest('hex');
function cleanup() {
  fs.rmSync(dist,{recursive:true,force:true});
  fs.rmSync(manifestPath,{force:true});
}
async function readPassword() {
  if (!process.stdin.isTTY) {
    const chunks=[];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const input=Buffer.concat(chunks);
    try { return input.toString('utf8').replace(/\r?\n$/, ''); }
    finally { input.fill(0); for(const chunk of chunks) chunk.fill(0); }
  }
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  try {
    return await new Promise((resolve,reject)=>{
      let first=null, text='';
      process.stderr.write('Shared password (hidden): ');
      function finish(error,value){process.stdin.removeListener('keypress',keypress);process.stderr.write('\n');if(error)reject(error);else resolve(value);}
      function keypress(character,key){
        if(key?.ctrl&&key.name==='c'){finish(new Error('Build cancelled'));return;}
        if(key?.name==='return'||key?.name==='enter'){
          if(first===null){first=text;text='';process.stderr.write('\nConfirm password (hidden): ');}
          else finish(first!==text?new Error('Passwords do not match'):null,first);
          return;
        }
        if(key?.name==='backspace')text=text.slice(0,-1);
        else if(!key?.ctrl&&!key?.meta&&character)text+=character;
      }
      process.stdin.on('keypress',keypress);
    });
  } finally {process.stdin.setRawMode(false);process.stdin.pause();}

}
async function main() {
  cleanup();
  let password=await readPassword();
  if (!password || password.includes('\n')) throw new Error('A single nonempty shared password is required');
  const bundle={pages:{},images:{}};
  for(const [id,file] of Object.entries(privatePages)) bundle.pages[id]=fs.readFileSync(path.join(root,'private',file),'utf8');
  for(const [id,file] of Object.entries(privateImages)) {
    const mime={'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'}[path.extname(file)];
    if(!mime) throw new Error('Unsupported private image type');
    bundle.images[id]={mime,data:fs.readFileSync(path.join(root,'private',file)).toString('base64')};
  }
  // An allowlist prevents arbitrary plaintext files from being copied to Hosting.
  for(const file of publicFiles) {
    const bytes=fs.readFileSync(path.join(root,'public',file));
    if(forbidden.test(bytes.toString('utf8')) || bytes.includes(Buffer.from(password))) throw new Error('Sensitive content in public source: '+file);
  }
  const envelope=await encryptBundle(password,JSON.stringify(bundle));
  password=null;
  fs.mkdirSync(dist,{recursive:true});
  for(const file of publicFiles) {
    const dest=path.join(dist,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,'public',file),dest);
  }
  fs.writeFileSync(path.join(dist,'encrypted-bundle.json'),JSON.stringify(envelope));
  const manifest={sources:{},outputs:{}};
  for(const file of sourceFiles) manifest.sources[file]=hash(fs.readFileSync(path.join(root,file)));
  for(const file of [...publicFiles,'encrypted-bundle.json']) manifest.outputs[file]=hash(fs.readFileSync(path.join(dist,file)));
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2),{mode:0o600});
  console.error('Encrypted build ready. Run npm run check before preview or deployment.');
}
process.on('SIGINT',()=>{cleanup();process.exit(130);});
main().catch(()=>{cleanup();console.error('Build failed or cancelled. Check the password and required local source files. No deployable build remains.');process.exitCode=1;});
