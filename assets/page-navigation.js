// Real document navigation retains browser history, modified links and loading
// cancellation. Native snapshots crossfade with the shared finite spring.
const root=document.documentElement,preference=matchMedia('(prefers-reduced-motion:reduce)'),motion=window.FrogkuPageMotion;
let animation;
const restore=()=>{animation?.cancel();animation=null;};
function reveal(event){
 const arrival=window.FrogkuPageArrival;
 if(event?.viewTransition||!arrival||preference.matches||!motion)return;
 restore();
 const main=document.querySelector('body>main');
 if(main)animation=main.animate(motion.fallback,{duration:motion.duration,easing:'linear'});
 window.FrogkuPageArrival=null;
 window.FrogkuPageFallbackPending=false;
}
addEventListener('pagereveal',reveal);
addEventListener('frogku:page-fallback',()=>reveal());
if(window.FrogkuPageFallbackPending)reveal();
if(!('onpagereveal' in window))addEventListener('pageshow',event=>{if(!event.persisted)reveal();},{once:true});
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href]');
 if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;
 const url=new URL(link.href),direction=motion?.direction(location.href,url.href)||0;
 if(url.origin!==location.origin||!direction)return;
 if(!preference.matches)try{
  sessionStorage.setItem('frogku-page-arrival',JSON.stringify({url:url.href,time:Date.now(),direction}));
 }catch{}
});
const warmed=new Set();
function warm(event){
 const link=event.target.closest('a[href]');if(!link||navigator.connection?.saveData)return;
 const url=new URL(link.href);if(url.origin!==location.origin||!motion?.direction(location.href,url.href)||warmed.has(url.href))return;
 warmed.add(url.href);const hint=document.createElement('link');hint.rel='prefetch';hint.href=url.href;hint.as='document';document.head.append(hint);
}
document.addEventListener('pointerover',warm);document.addEventListener('focusin',warm);
addEventListener('pageshow',event=>{if(event.persisted){window.FrogkuPageArrival=null;restore();}});
addEventListener('pagehide',restore);addEventListener('resize',restore);
preference.addEventListener('change',()=>{if(preference.matches){window.FrogkuPageArrival=null;restore();}});
