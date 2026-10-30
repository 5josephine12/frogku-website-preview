import {createContentSwap} from './vendor/surface-motion.js?v=d74b419c1354';

// Use the shared cancellable text transition; idle/offscreen headings do no work.
export function mountHeadingRotation(heading,t){
 if(!heading)return;
 const messages=['Ada cuan di keseharianmu.','Makin unik, makin cuan.'];
 const copy=heading.querySelector('[data-heading-copy]');
 const measurements=[...heading.querySelectorAll('[data-heading-measure]')];
 const swap=createContentSwap(copy);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let index=0,timer=null,visible=false,suspended=false,disposed=false;
 const allowed=()=>!disposed&&!suspended&&visible&&!document.hidden&&!reduced.matches&&!document.querySelector('dialog[open]');
 const clear=()=>{clearTimeout(timer);timer=null;};
 const render=()=>{copy.textContent=t(messages[index]);};
 function schedule(){
  clear();
  if(!allowed()){swap.finish();return;}
  timer=setTimeout(()=>{
   timer=null;
   if(!allowed())return;
   index=(index+1)%messages.length;
   swap(render);
   schedule();
  },5000);
 }
 function language(){
  swap.finish();
  measurements.forEach((element,i)=>{element.textContent=t(messages[i]);});
  render();schedule();
 }
 function preference(){
  if(reduced.matches){swap.finish();index=0;render();}
  schedule();
 }
 const observer=new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;schedule();
 });
 observer.observe(heading);
 const dialogs=new MutationObserver(schedule);
 document.querySelectorAll('dialog').forEach(dialog=>dialogs.observe(dialog,{attributes:true,attributeFilter:['open']}));
 window.addEventListener('frogku:language',language);
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',preference);
 function pagehide(event){
  suspended=true;clear();swap.finish();
  if(event.persisted)return;
  disposed=true;observer.disconnect();dialogs.disconnect();swap.dispose();
  window.removeEventListener('frogku:language',language);
  document.removeEventListener('visibilitychange',schedule);
  reduced.removeEventListener('change',preference);
  window.removeEventListener('pagehide',pagehide);
  window.removeEventListener('pageshow',pageshow);
 }
 function pageshow(){suspended=false;schedule();}
 window.addEventListener('pagehide',pagehide);
 window.addEventListener('pageshow',pageshow);
 language();
}
