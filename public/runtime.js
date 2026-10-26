import {decryptEnvelope, fromBase64} from './crypto.js';
import {protectedRoutes} from './site-config.js';

const main=document.querySelector('main');
let key=null, bundle=null, blobURLs=[];
let generation=0, navigation=0, busy=false;
let homeHTML=location.pathname==='/'?main.innerHTML:null;
let pending=null, viewPrivate=false;
const normalize=path=>path.endsWith('/index.html')?path.slice(0,-10):path==='/'?'/':path.replace(/\/$/,'')+'/';
const route=()=>normalize(location.pathname);
const pageId=path=>protectedRoutes[path];
const unlockHTML=`<div id="unlock-screen" class="unlock-screen"><div class="unlock-box">
<h1>Lodging Details</h1><p>Enter the shared password to view private trip information.</p>
<form id="unlock-form" autocomplete="off"><label for="password-input">Shared password</label>
<input type="password" id="password-input" autocomplete="off" required>
<button class="cta" type="submit">Unlock</button></form>
<p id="unlock-error" role="status" hidden></p><noscript>JavaScript is required to decrypt this page.</noscript>
</div></div>`;
function revokeImages(){for(const url of blobURLs) URL.revokeObjectURL(url);blobURLs=[];}
function navState(){
  for(const a of document.querySelectorAll('.site-nav a')) {
    if(normalize(new URL(a.href).pathname)===route()) a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  }
  const mountains=document.querySelector('.mountains');if(mountains) mountains.hidden=route()!=='/';
  let lockButton=document.getElementById('lock-btn');
  if(key&&!lockButton){lockButton=document.createElement('button');lockButton.id='lock-btn';lockButton.className='cta lock-button';lockButton.textContent='Lock';lockButton.onclick=lock;document.body.append(lockButton);}
  if(!key&&lockButton) lockButton.remove();
}
function renderLocked(){
  clearInterval(window.__countdownTimer);
  revokeImages();viewPrivate=false;main.innerHTML=unlockHTML;document.title='Lodging — Snow Blowout 2027';
  main.querySelector('form').addEventListener('submit',unlock);
  navState();
}
function renderPrivate(){
  const html=bundle?.pages?.[pageId(route())];
  if(typeof html!=='string') {renderLocked();return;}
  clearInterval(window.__countdownTimer);
  revokeImages();viewPrivate=true;main.innerHTML=html;document.title='Lodging — Snow Blowout 2027';
  for(const img of main.querySelectorAll('img[data-private-image]')) {
    const data=bundle.images?.[img.dataset.privateImage];
    if(!data) continue;
    const bytes=fromBase64(data.data);const url=URL.createObjectURL(new Blob([bytes],{type:data.mime}));bytes.fill(0);blobURLs.push(url);img.src=url;
  }
  navState();
}
function lock(){
  generation++;navigation++;pending?.abort();pending=null;busy=false;key=null;bundle=null;revokeImages();
  const input=document.getElementById('password-input');if(input) input.value='';
  if(pageId(route())) renderLocked();else if(viewPrivate){viewPrivate=false;main.innerHTML='';navigate('/',false);}else navState();
}
async function unlock(event){
  event.preventDefault();if(busy)return;
  const epoch=generation;
  const form=event.currentTarget,input=form.querySelector('input'),button=form.querySelector('button');
  const error=document.getElementById('unlock-error');
  let password=input.value;input.value='';
  busy=true;button.disabled=true;error.hidden=true;
  let phase='fetch';
  pending=new AbortController();
  try {
    if(!crypto?.subtle) throw new Error('Crypto unavailable');
    const response=await fetch('/encrypted-bundle.json',{cache:'no-store',signal:pending.signal});
    if(!response.ok) throw new Error('Encrypted file unavailable');
    const envelope=await response.json();phase='decrypt';
    const result=await decryptEnvelope(password,envelope);password=null;
    if(epoch!==generation)return;
    if(!result.bundle?.pages || typeof result.bundle.pages[pageId(route())]!=='string') throw new Error('Page unavailable');
    key=result.key;bundle=result.bundle;renderPrivate();
  } catch(e) {
    if(epoch!==generation)return;
    error.textContent=phase==='decrypt'?'Incorrect password or damaged encrypted content. Please try again.':'Private content is unavailable. Please check your connection or ask the organizer.';
    error.hidden=false;input.focus();
  } finally {
    password=null;
    if(epoch===generation){busy=false;button.disabled=false;pending=null;}
  }
}
async function navigate(path,push=true){
  if(busy)lock();
  const ticket=++navigation;
  if(push)history.pushState(null,'',path);
  if(pageId(path)){if(bundle)renderPrivate();else renderLocked();window.scrollTo(0,0);return;}
  revokeImages();
  try {
    if(homeHTML===null){
      const response=await fetch('/',{cache:'no-cache'});if(!response.ok)throw new Error('Home unavailable');
      const doc=new DOMParser().parseFromString(await response.text(),'text/html');
      homeHTML=doc.querySelector('main').innerHTML;
      if(!document.querySelector('.mountains')&&doc.querySelector('.mountains')) main.before(doc.querySelector('.mountains').cloneNode(true));
    }
    if(ticket!==navigation)return;
    viewPrivate=false;main.innerHTML=homeHTML;document.title='Snow Blowout 2027';navState();window.startCountdown?.();window.scrollTo(0,0);
  } catch {if(ticket===navigation) location.assign('/');}
}
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const a=event.target.closest('a[href]');if(!a||a.target||a.hasAttribute('download'))return;
  const url=new URL(a.href);if(url.origin!==location.origin||url.hash)return;
  const path=normalize(url.pathname);if(path!=='/'&&!pageId(path))return;
  event.preventDefault();navigate(path);
});
window.addEventListener('popstate',()=>navigate(route(),false));
window.addEventListener('pagehide',lock);
window.addEventListener('pageshow',e=>{if(e.persisted)lock();});
if(pageId(route()))renderLocked();else navState();
