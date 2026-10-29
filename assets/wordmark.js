// Center the visible Inter letterforms, including their unequal side bearings.
// The layout stays text-based and retains the same brand font and tracking.
export function mountOpticalLabel(selector){
 const label=document.querySelector(selector),context=document.createElement('canvas').getContext('2d');
 if(!label||!context)return;
 let frame=0;
 const measure=()=>{
  frame=0;label.style.setProperty('--optical-label-shift','0px');
  if(document.documentElement.lang!=='zh-CN'||!matchMedia('(max-width:999px)').matches)return;
  const style=getComputedStyle(label);
  context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;context.fontKerning=style.fontKerning;
  const ink=context.measureText(label.textContent.trim());
  const shift=(ink.width+ink.actualBoundingBoxLeft-ink.actualBoundingBoxRight)/2;
  if(Number.isFinite(shift))label.style.setProperty('--optical-label-shift',`${shift.toFixed(3)}px`);
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
 new ResizeObserver(schedule).observe(label);document.fonts.ready.then(schedule);
 addEventListener('resize',schedule,{passive:true});addEventListener('frogku:language',schedule);schedule();
}
export function mountWordmark(){
 const root=document.querySelector('.footer-wordmark'),text=root?.querySelector('span');
 if(!text)return;
 const context=document.createElement('canvas').getContext('2d');
 if(!context)return;
 let frame=0;
 function measure(){
  frame=0;root.style.setProperty('--wordmark-shift','0px');
  const style=getComputedStyle(text),spacing=parseFloat(style.letterSpacing)||0;
  // The crop belongs to the footer artwork, independent of FAQ length.
  root.style.removeProperty('--wordmark-crop-height');
  context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.fontKerning=style.fontKerning;
  const characters=[...text.textContent.trim()];
  let x=0,left=Infinity,right=-Infinity,previousWidth=0;
  characters.forEach((character,i)=>{
   const glyph=context.measureText(character);
   if(i)x+=context.measureText(characters[i-1]+character).width-previousWidth-glyph.width+spacing;
   left=Math.min(left,x-glyph.actualBoundingBoxLeft);
   right=Math.max(right,x+glyph.actualBoundingBoxRight);
   x+=glyph.width;previousWidth=glyph.width;
  });
  if(!Number.isFinite(left+right))return;
  const box=root.getBoundingClientRect(),span=text.getBoundingClientRect();
  const shift=box.left+box.width/2-(span.left+(left+right)/2);
  root.style.setProperty('--wordmark-shift',`${shift.toFixed(3)}px`);
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
 const resize=new ResizeObserver(schedule);resize.observe(root);
 document.fonts.ready.then(schedule);
 addEventListener('resize',schedule,{passive:true});schedule();
}
