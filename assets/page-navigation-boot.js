// Shared-v187 spring/lifecycle; caller-owned Frogku routes.
(()=>{'use strict';
// One interaction contract shared by React, native chart popups and generated CSS.
// Layout, navigation and expressive controls intentionally keep their own roles.
const interactionMotion=Object.freeze({
 rowRadius:12,menuInset:8,menuBorder:1,feedbackMs:180,ease:[.22,1,.36,1],easeCSS:'cubic-bezier(.22,1,.36,1)',
 popupSpring:Object.freeze({type:'spring',stiffness:500,damping:18,mass:.9}),
 popupSettleMs:800,popupOpacityMs:160,popupExitMs:200,switchMs:240,chevronMs:220
});
const popupSpring=interactionMotion.popupSpring;
const navigationSpring=Object.freeze({type:'spring',stiffness:240,damping:32,mass:1});
// The Popup and both dropdowns share exact poses as well as spring physics.
const popupPoses=Object.freeze({
 enter:Object.freeze({opacity:0,y:-10,scaleX:.86,scaleY:.72}),
 rest:Object.freeze({opacity:1,y:0,scaleX:1,scaleY:1}),
 exit:Object.freeze({opacity:0,y:-8,scaleX:.92,scaleY:.86})
});
const popupExit={duration:interactionMotion.popupExitMs/1000,ease:interactionMotion.ease};
const popupOpacity={duration:interactionMotion.popupOpacityMs/1000,ease:'linear'};
// Closed-form response of the same spring as Framer's popup transition. WAAPI
// samples it once; no per-frame JS, layout reads or permanent animation loop.
function popupProgress(seconds){
 const {stiffness:k,damping:c,mass:m}=popupSpring,decay=c/(2*m),frequency=Math.sqrt(k/m-decay*decay);
 return 1-Math.exp(-decay*seconds)*(Math.cos(frequency*seconds)+decay/frequency*Math.sin(frequency*seconds));
}
const timeline=Array.from({length:49},(_,index)=>{const offset=index/48,seconds=offset*interactionMotion.popupSettleMs/1000;return {offset,progress:index===48?1:popupProgress(seconds),opacity:Math.min(1,seconds*1000/interactionMotion.popupOpacityMs)};});
const numeric=(value,fallback)=>{const number=parseFloat(value);return Number.isFinite(number)?number:fallback;};
const translate=value=>{const parts=String(value||'none').split(/\s+/);return [numeric(parts[0],0),numeric(parts[1],0)];};
const lerp=(a,b,p)=>a+(b-a)*p;
function popupFrames(from,to,enter=true){
 if(!enter)return [from,to];
 const a=translate(from.translate),b=translate(to.translate),startScale=numeric(from.scale,1),endScale=numeric(to.scale,1),startOpacity=numeric(from.opacity,1),endOpacity=numeric(to.opacity,1);
 return timeline.map(({offset,progress,opacity})=>({offset,translate:`${lerp(a[0],b[0],progress)}px ${lerp(a[1],b[1],progress)}px`,scale:lerp(startScale,endScale,progress),opacity:lerp(startOpacity,endOpacity,opacity)}));
}
const popupOptions=enter=>({duration:enter?interactionMotion.popupSettleMs:interactionMotion.popupExitMs,easing:enter?'linear':interactionMotion.easeCSS,fill:'both'});

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

})();
