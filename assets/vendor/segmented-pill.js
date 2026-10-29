/** The compact segmented-control glide shared with implementation view sliders.
 * Move one backing, keep labels fixed, and reverse from its painted rectangle. */
export function mountSegmentedPill(group,indicator,selected){
 const win=group.ownerDocument.defaultView,reduce=win.matchMedia('(prefers-reduced-motion:reduce)');
 let animation=null,disposed=false,last=null;
 const move=(immediate=false)=>{
  if(disposed)return;const button=group.querySelector(selected);if(!button)return;
  const target=button.getBoundingClientRect(),bar=group.getBoundingClientRect(),box={left:target.left-bar.left,top:target.top-bar.top,width:target.width,height:target.height};
  if(!immediate&&last&&Object.keys(box).every(key=>Math.abs(box[key]-last[key])<.05))return;
  const painted=indicator.getBoundingClientRect();animation?.cancel();animation=null;last=box;
  Object.assign(indicator.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
  if(immediate||reduce.matches||!indicator.animate||!painted.width||!target.width)return;
  animation=indicator.animate([{transform:`translateX(${painted.left-target.left}px) translateY(${painted.top-target.top}px) scaleX(${painted.width/target.width}) scaleY(${painted.height/target.height})`},{transform:'none'}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'});
 };
 const resize=new win.ResizeObserver(()=>move(true));resize.observe(group);
 const preference=()=>{if(reduce.matches)move(true);};reduce.addEventListener('change',preference);
 group.dataset.slidingPill='true';move(true);group.ownerDocument.fonts?.ready.then(()=>move(true));
 return{move,dispose(){disposed=true;animation?.cancel();resize.disconnect();reduce.removeEventListener('change',preference);}};
}
