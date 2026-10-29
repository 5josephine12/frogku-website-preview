import {interactionMotion,popupProgress} from './vendor/interaction-motion.js';
// Early cross-document lifecycle adapted from the shared gallery owner. The
// caller requests a spring/crossfade rather than directional page transport.
const root=document.documentElement,preference=matchMedia('(prefers-reduced-motion:reduce)');
const pages=['index.html','privacy.html','terms.html'];
function direction(from,to){
 try{const page=url=>new URL(url,location.href).pathname.split('/').pop()||'index.html',a=pages.indexOf(page(from)),b=pages.indexOf(page(to));return a<0||b<0?0:Math.sign(b-a);}catch{return 0;}
}
const incoming=Array.from({length:49},(_,i)=>{const offset=i/48,seconds=offset*interactionMotion.popupSettleMs/1000,p=i===48?1:popupProgress(seconds);return {offset,opacity:Math.min(1,seconds*1000/interactionMotion.popupOpacityMs),scale:.985+.015*p};});
const fallback=incoming.map(({offset})=>{const seconds=offset*interactionMotion.popupSettleMs/1000,impulse=offset===1?0:popupProgress(seconds)-popupProgress(Math.max(0,seconds-.12));return {offset,opacity:1,scale:1-.015*impulse};});
window.FrogkuPageMotion=Object.freeze({direction,incoming,fallback,duration:interactionMotion.popupSettleMs});
try{const arrival=JSON.parse(sessionStorage.getItem('frogku-page-arrival')||'null');sessionStorage.removeItem('frogku-page-arrival');if(arrival&&arrival.url===location.href&&Date.now()-arrival.time<10000&&!preference.matches)window.FrogkuPageArrival=arrival;}catch{}
let activeTransition=null;
for(const name of ['pageswap','pagereveal'])addEventListener(name,event=>{
 let departure;
 try{if(name==='pageswap')sessionStorage.setItem('frogku-page-departure',JSON.stringify({url:location.href,time:Date.now()}));else{departure=JSON.parse(sessionStorage.getItem('frogku-page-departure')||'null');sessionStorage.removeItem('frogku-page-departure');}}catch{}
 const transition=event.viewTransition;if(!transition)return;
 transition.ready.catch(()=>{});
 transition.updateCallbackDone?.catch(()=>{});
 if(preference.matches){transition.skipTransition();return;}
 const activation=event.activation||window.navigation?.activation;
 const travel=activation?.from?.url&&activation?.entry?.url?direction(activation.from.url,activation.entry.url):window.FrogkuPageArrival?.direction||(departure&&Date.now()-departure.time<10000?direction(departure.url,location.href):0);
 if(name==='pagereveal'&&!travel){transition.skipTransition();window.FrogkuPageArrival=null;return;}
 transition.types?.add('frogku-page');activeTransition=transition;
 if(name==='pagereveal'){
  const arrival=window.FrogkuPageArrival||{url:location.href,time:Date.now(),direction:travel};
  transition.ready.catch(()=>{window.FrogkuPageArrival=arrival;window.FrogkuPageFallbackPending=true;dispatchEvent(new Event('frogku:page-fallback'));});
  window.FrogkuPageArrival=null;
 }
 const clear=()=>{if(activeTransition===transition)activeTransition=null;};transition.finished.then(clear,clear);
});
preference.addEventListener('change',()=>{if(preference.matches){activeTransition?.skipTransition();window.FrogkuPageArrival=null;}});
addEventListener('resize',()=>activeTransition?.skipTransition());
