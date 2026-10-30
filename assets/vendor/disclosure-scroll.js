import {cardMotionPreference} from './card-motion.js?v=d74b419c1354';
import {surfaceMotion} from './surface-motion.js?v=d74b419c1354';

// Follow the collapsing list's end, preventing browser scroll clamping from
// dropping readers into the footer. User scrolling always takes precedence.
export function anchorDisclosureCollapse(control,motionDuration=surfaceMotion.disclosure){
 const root=document.documentElement;
 const top=control.getBoundingClientRect().top;
 if(top<0||top>innerHeight)return ()=>{};
 const duration=cardMotionPreference(control).matches?0:motionDuration;
 let frame=0,started=null,stopped=false;
 const stop=()=>{
  if(stopped)return;
  stopped=true;cancelAnimationFrame(frame);root.classList.remove('anchoring-disclosure');
  removeEventListener('wheel',stop);removeEventListener('touchstart',stop);
  removeEventListener('keydown',key);removeEventListener('hashchange',stop);
 };
 const key=event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))stop();};
 root.classList.add('anchoring-disclosure');
 addEventListener('wheel',stop,{passive:true});addEventListener('touchstart',stop,{passive:true});
 addEventListener('keydown',key);addEventListener('hashchange',stop);
 function tick(time){
  if(stopped)return;
  if(!control.isConnected){stop();return;}
  if(started===null)started=time;
  const delta=control.getBoundingClientRect().top-top;
  if(Math.abs(delta)>.5)window.scrollTo({top:scrollY+delta,behavior:'instant'});
  if(time-started>=duration){stop();return;}
  frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
 return stop;
}
