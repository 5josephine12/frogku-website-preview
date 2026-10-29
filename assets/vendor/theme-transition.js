let activeTransition, fallbackAnimation, pending, release;
let revision=0;
const cancel=()=>{activeTransition?.skipTransition();activeTransition=null;fallbackAnimation?.cancel();fallbackAnimation=null;release?.();release=null;};
const commit=()=>{const update=pending;pending=null;update?.();};
const settle=()=>{++revision;cancel();commit();};

// Crossfade complete, already-composited frames. Interpolating the video's
// filter independently of its blend mode would expose its opaque background.
export function transitionTheme(update,{snapshot=true}={}){
 const current=++revision,root=document.documentElement,from=getComputedStyle(root).opacity,media=matchMedia('(prefers-reduced-motion: reduce)');
 cancel();pending=update;
 const disabled=()=>media.matches||document.body?.dataset.motion==='off';
 if(disabled()){settle();return;}
 const changed=()=>{if(disabled())settle();},finish=()=>{if(current!==revision)return;cancel();};
 media.addEventListener('change',changed);document.addEventListener('frogku-card-motion',changed);window.addEventListener('pagehide',settle);
 release=()=>{media.removeEventListener('change',changed);document.removeEventListener('frogku-card-motion',changed);window.removeEventListener('pagehide',settle);};
 if(snapshot&&document.startViewTransition){
  activeTransition=document.startViewTransition(()=>{if(current===revision)commit();});
  activeTransition.ready?.catch(()=>{});
  activeTransition.finished.then(finish,finish);
  return;
 }
 // Older browsers fade the complete surface, never the video filter alone.
 if(!root.animate){settle();return;}
 fallbackAnimation=root.animate([{opacity:from},{opacity:0}],{duration:120,fill:'forwards'});
 fallbackAnimation.finished.then(()=>{
  if(current!==revision)return;
  commit();fallbackAnimation.cancel();
  fallbackAnimation=root.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
  fallbackAnimation.finished.then(finish,finish);
 },()=>{});
}
