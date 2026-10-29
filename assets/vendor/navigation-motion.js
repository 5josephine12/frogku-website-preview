const ease='cubic-bezier(.22,1,.36,1)';
let revision=0,frame=0,releaseScroll=()=>{};
const animations=new Set();
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
function animate(element,frames,options){
 const animation=element.animate(frames,options);animations.add(animation);
 animation.finished.then(()=>{if(options.fill!=='forwards')animations.delete(animation);},()=>animations.delete(animation));
 return animation;
}
export function cancelNavigationMotion(){
 revision++;cancelAnimationFrame(frame);frame=0;releaseScroll();releaseScroll=()=>{};
 animations.forEach(animation=>animation.cancel());animations.clear();
}
export async function transitionPage(outgoing,update,getIncoming){
 const opacity=getComputedStyle(outgoing).opacity;
 cancelNavigationMotion();const current=revision;
 if(!reduced()){
  const exit=animate(outgoing,[{opacity,transform:'translateY(0)'},{opacity:0,transform:'translateY(-10px)'}],{duration:180,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'});
  await exit.finished.catch(()=>{});
  if(current!==revision)return;
  update();exit.cancel();animations.delete(exit);
 }else update();
 if(current!==revision||reduced())return;
 const incoming=getIncoming();
 animate(incoming,[{opacity:.35,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:620,easing:ease});
 const heading=incoming.querySelector('.task-heading,.swiss-opening');
 if(heading&&heading.getBoundingClientRect().top<innerHeight)animate(heading,[{transform:'translateY(8px)'},{transform:'translateY(0)'}],{duration:700,easing:ease});
}
export function transitionSection(target,{headerSelector='.site-header',onFinish}={}){
 cancelNavigationMotion();const current=revision;
 const start=scrollY;
 const destination=()=>{const header=document.querySelector(headerSelector)?.getBoundingClientRect().height||0;return target.id==='top'?0:Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,scrollY+target.getBoundingClientRect().top-header-24));};
 const distance=destination()-start;
 if(reduced()){window.scrollTo({top:destination(),behavior:'instant'});onFinish?.();return;}
 const duration=Math.min(1000,520+Math.abs(distance)*.08);let began=null;
 const stop=()=>cancelNavigationMotion();
 const key=event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))stop();};
 addEventListener('wheel',stop,{passive:true});addEventListener('touchstart',stop,{passive:true});addEventListener('keydown',key);
 releaseScroll=()=>{removeEventListener('wheel',stop);removeEventListener('touchstart',stop);removeEventListener('keydown',key);};
 function tick(time){
  if(current!==revision)return;
  if(began===null)began=time;
  const t=Math.min(1,(time-began)/duration),position=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  window.scrollTo({top:start+(destination()-start)*position,behavior:'instant'});
  if(t<1){frame=requestAnimationFrame(tick);return;}
  frame=0;releaseScroll();releaseScroll=()=>{};
  const heading=target.matches('h1,h2')?target:target.querySelector('.section-heading,.experiment-toolbar')||target.querySelector('h2');
  if(heading)animate(heading,[{opacity:.65,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:480,easing:ease});
  onFinish?.();
 }
 frame=requestAnimationFrame(tick);
}
