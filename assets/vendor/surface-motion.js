import {popupFrames,popupOptions} from './interaction-motion.js';
import {motionDisabled,cardMotionPreference} from './card-motion.js';
// Shared with the CSS tokens used by invitations and experiment disclosures.
export const surfaceMotion={ease:'cubic-bezier(.22,1,.36,1)',enter:420,exit:280,disclosure:620};
const surfaces=new WeakMap();
const reduced=motionDisabled;

// Keep a closing surface painted until its exit ends. Reversals start from the
// current frame; an obsolete completion can never hide a reopened surface.
// Independent `translate` leaves cursor-following transforms untouched.
export function setSurfaceVisible(element,visible,{immediate=false,distance=6,onFinish}={}){
 let state=surfaces.get(element);
 if(!state){state={visible:!element.hidden,animation:null,revision:0,cleanup:null};surfaces.set(element,state);}
 if(state.visible===visible&&!immediate)return;
 const style=getComputedStyle(element),from={opacity:element.hidden?'0':style.opacity,translate:element.hidden?`0 ${distance}px`:style.translate,scale:element.hidden?.96:style.scale};
 state.visible=visible;const revision=++state.revision;
 state.animation?.cancel();state.animation=null;state.cleanup?.();state.cleanup=null;
 element.inert=!visible;element.setAttribute('aria-hidden',String(!visible));
 const finish=()=>{
  if(revision!==state.revision)return;
  element.hidden=!visible;state.animation?.cancel();state.animation=null;state.cleanup?.();state.cleanup=null;onFinish?.();
 };
 const preference=cardMotionPreference(element),settle=()=>{if(preference.matches)finish();};
 if(immediate||preference.matches||!element.animate){finish();return;}
 preference.addEventListener('change',settle);state.cleanup=()=>preference.removeEventListener('change',settle);
 element.hidden=false;
 const to={opacity:visible?1:0,translate:visible?'0 0':`0 ${distance}px`,scale:visible?1:.96};
 state.animation=element.animate(popupFrames(from,to,visible),popupOptions(visible));
 state.animation.finished.then(finish,()=>{});
}

const disclosures=new WeakSet();
export function mountDisclosureMotion(details){
 if(disclosures.has(details))return;disclosures.add(details);
 const summary=details.querySelector(':scope > summary');if(!summary)return;
 let expanded=details.open,animation=null,revision=0;
 summary.setAttribute('aria-expanded',String(expanded));
 summary.addEventListener('click',event=>{
  event.preventDefault();
  const from=details.getBoundingClientRect().height;
  expanded=!expanded;const current=++revision;
  animation?.cancel();animation=null;
  details.style.overflow='';details.open=true;
  summary.setAttribute('aria-expanded',String(expanded));
  [...details.children].filter(child=>child!==summary).forEach(child=>{child.inert=!expanded;child.setAttribute('aria-hidden',String(!expanded));});
  // Measure both natural states without leaving an intermediate state painted.
  const openedHeight=details.getBoundingClientRect().height;
  details.open=false;const closedHeight=details.getBoundingClientRect().height;details.open=true;
  const finish=()=>{
   if(current!==revision)return;
   details.open=expanded;animation?.cancel();animation=null;details.style.overflow='';
  };
  if(reduced(details)){finish();return;}
  details.style.overflow='clip';
  animation=details.animate([{height:`${from}px`},{height:`${expanded?openedHeight:closedHeight}px`}],{
   duration:surfaceMotion.disclosure,easing:surfaceMotion.ease,fill:'both'
  });
  animation.finished.then(finish,()=>{});
 });
}

// Content and position can change while a panel remains open. Animate the
// children so this never interrupts the panel's reversible entrance/exit.
export function animateSurfaceContent(element){
 if(reduced(element))return;
 for(const child of element.children)child.animate([{opacity:.35,translate:'0 3px'},{opacity:1,translate:'0 0'}],{duration:surfaceMotion.enter,easing:surfaceMotion.ease});
}

// Keep the outgoing text/logo until it fades out. Repeated choices start from
// the painted frame and only the latest render may commit.
export function createContentSwap(element){
 let animation=null,revision=0,pending=null,disposed=false;
 const cancel=()=>{animation?.cancel();animation=null;};
 function finish(){
  revision++;cancel();const render=pending;pending=null;if(!disposed)render?.();
 }
 function swap(render,{immediate=false}={}){
  if(disposed)return;
  const current=++revision,style=getComputedStyle(element);
  const from={opacity:style.opacity,translate:style.translate};
  cancel();pending=render;
  if(immediate||reduced(element)){finish();return;}
  animation=element.animate([from,{opacity:0,translate:'0 -3px'}],{duration:180,easing:surfaceMotion.ease,fill:'both'});
  animation.finished.then(()=>{
   if(disposed||current!==revision)return;
   cancel();const update=pending;pending=null;update?.();
   animation=element.animate([{opacity:0,translate:'0 3px'},{opacity:1,translate:'0 0'}],{duration:surfaceMotion.enter,easing:surfaceMotion.ease,fill:'both'});
   animation.finished.then(()=>{if(current===revision)cancel();},()=>{});
  },()=>{});
 }
 swap.finish=finish;
 swap.dispose=()=>{disposed=true;pending=null;revision++;cancel();};
 return swap;
}

// Swap only the affected views after their exit. A newer choice supersedes any
// pending swap, and a reversal starts at the currently painted opacity.
export function contentTransition(elements,layout){
 let revision=0,animations=[];
 return update=>{
  const id=++revision,from=elements.map(el=>({opacity:getComputedStyle(el).opacity,translate:getComputedStyle(el).translate}));
  const oldHeight=layout.getBoundingClientRect().height;
  animations.forEach(a=>a.cancel());animations=[];
  const swap=()=>{
   if(id!==revision)return;
   update();
   if(reduced(layout))return;
   const height=layout.getBoundingClientRect().height;
   animations=elements.map(el=>el.animate([{opacity:0,translate:'0 5px'},{opacity:1,translate:'0 0'}],{duration:surfaceMotion.enter,easing:surfaceMotion.ease,fill:'both'}));
   if(Math.abs(oldHeight-height)>1)animations.push(layout.animate([{height:`${oldHeight}px`},{height:`${height}px`}],{duration:surfaceMotion.enter,easing:surfaceMotion.ease,fill:'both'}));
   Promise.all(animations.map(a=>a.finished)).then(()=>{if(id===revision){animations.forEach(a=>a.cancel());animations=[];}},()=>{});
  };
  if(reduced(layout)){swap();return;}
  animations=elements.map((el,i)=>el.animate([from[i],{opacity:0,translate:'0 -3px'}],{duration:180,easing:'ease-in',fill:'both'}));
  Promise.all(animations.map(a=>a.finished)).then(()=>{if(id!==revision)return;animations.forEach(a=>a.cancel());swap();},()=>{});
 };
}

const expansions=new WeakMap();
export function expansionDuration(distance){return Math.min(900,Math.max(surfaceMotion.disclosure,surfaceMotion.disclosure+Math.abs(distance)*.06));}
export function animateExpansion(element,expanded,{onFinish=()=>{}}={}){
 const previous=expansions.get(element),from=element.getBoundingClientRect().height;
 previous?.animation?.cancel();previous?.cleanup?.();
 element.style.height='auto';element.style.visibility='visible';
 const to=expanded?element.scrollHeight:0,duration=expansionDuration(to-from),preference=cardMotionPreference(element),state={animation:null};
 expansions.set(element,state);
 const finish=()=>{
  if(expansions.get(element)!==state)return;
  element.style.height=expanded?'auto':'0px';element.style.visibility=expanded?'visible':'hidden';
  state.animation?.cancel();expansions.delete(element);preference.removeEventListener('change',settleReduced);onFinish();
 };
 const settleReduced=()=>{if(preference.matches)finish();};
 if(preference.matches){finish();return 0;}
 preference.addEventListener('change',settleReduced);
 state.cleanup=()=>preference.removeEventListener('change',settleReduced);
 state.animation=element.animate([{height:`${from}px`},{height:`${to}px`}],{duration,easing:surfaceMotion.ease,fill:'both'});
 state.animation.finished.then(finish,()=>{});
 return duration;
}

// Tooltip contents crossfade independently of the floating surface itself.
// Keep outgoing text until its fade ends; rapid point changes commit only the
// newest readout and begin from the currently painted child opacities.
export function createInspectionContentSwap(element,{stableSize=false}={}){
 let revision=0,animations=[],resize=null,pending=null,disposed=false;
 const cancel=()=>{animations.forEach(animation=>animation.cancel());animations=[];};
 function swap(render){
  if(disposed)return;
  const current=++revision,children=[...element.children];
  const from=children.map(child=>{const style=getComputedStyle(child);return {opacity:style.opacity,translate:style.translate};});
  cancel();pending=render;
  const commit=()=>{const update=pending;pending=null;update?.();};
  if(element.hidden||reduced(element)||!children.length){resize?.cancel();resize=null;commit();return;}
  animations=children.map((child,i)=>child.animate([from[i],{opacity:0,translate:'0 -2px'}],{duration:140,easing:surfaceMotion.ease,fill:'both'}));
  Promise.all(animations.map(animation=>animation.finished)).then(()=>{
   if(disposed||revision!==current)return;
   const before=stableSize?null:element.getBoundingClientRect();
   resize?.cancel();resize=null;
   cancel();commit();
   const after=before?element.getBoundingClientRect():null;
   if(before&&(Math.abs(before.height-after.height)>.5||Math.abs(before.width-after.width)>.5)){
    const size=element.animate([{width:`${before.width}px`,height:`${before.height}px`},{width:`${after.width}px`,height:`${after.height}px`}],{duration:320,easing:surfaceMotion.ease,fill:'both'});
    resize=size;size.finished.then(()=>{if(resize===size){size.cancel();resize=null;}},()=>{});
   }
   animations=[...element.children].map(child=>child.animate([{opacity:0,translate:'0 2px'},{opacity:1,translate:'0 0'}],{duration:280,easing:surfaceMotion.ease,fill:'both'}));
   Promise.all(animations.map(animation=>animation.finished)).then(()=>{if(revision===current)cancel();},()=>{});
  },()=>{});
 }
 swap.finish=()=>{revision++;cancel();resize?.cancel();resize=null;const update=pending;pending=null;if(!disposed)update?.();};
 swap.dispose=()=>{disposed=true;revision++;pending=null;cancel();resize?.cancel();resize=null;};
 return swap;
}
