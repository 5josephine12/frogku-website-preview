// One interaction contract shared by React, native chart popups and generated CSS.
// Layout, navigation and expressive controls intentionally keep their own roles.
export const interactionMotion=Object.freeze({
 rowRadius:12,menuInset:8,menuBorder:1,feedbackMs:180,ease:[.22,1,.36,1],easeCSS:'cubic-bezier(.22,1,.36,1)',
 popupSpring:Object.freeze({type:'spring',stiffness:500,damping:18,mass:.9}),
 popupSettleMs:800,popupOpacityMs:160,popupExitMs:200,switchMs:240,chevronMs:220
});
export const popupSpring=interactionMotion.popupSpring;
export const navigationSpring=Object.freeze({type:'spring',stiffness:240,damping:32,mass:1});
// The Popup and both dropdowns share exact poses as well as spring physics.
export const popupPoses=Object.freeze({
 enter:Object.freeze({opacity:0,y:-10,scaleX:.86,scaleY:.72}),
 rest:Object.freeze({opacity:1,y:0,scaleX:1,scaleY:1}),
 exit:Object.freeze({opacity:0,y:-8,scaleX:.92,scaleY:.86})
});
export const popupExit={duration:interactionMotion.popupExitMs/1000,ease:interactionMotion.ease};
export const popupOpacity={duration:interactionMotion.popupOpacityMs/1000,ease:'linear'};
// Closed-form response of the same spring as Framer's popup transition. WAAPI
// samples it once; no per-frame JS, layout reads or permanent animation loop.
export function popupProgress(seconds){
 const {stiffness:k,damping:c,mass:m}=popupSpring,decay=c/(2*m),frequency=Math.sqrt(k/m-decay*decay);
 return 1-Math.exp(-decay*seconds)*(Math.cos(frequency*seconds)+decay/frequency*Math.sin(frequency*seconds));
}
const timeline=Array.from({length:49},(_,index)=>{const offset=index/48,seconds=offset*interactionMotion.popupSettleMs/1000;return {offset,progress:index===48?1:popupProgress(seconds),opacity:Math.min(1,seconds*1000/interactionMotion.popupOpacityMs)};});
const numeric=(value,fallback)=>{const number=parseFloat(value);return Number.isFinite(number)?number:fallback;};
const translate=value=>{const parts=String(value||'none').split(/\s+/);return [numeric(parts[0],0),numeric(parts[1],0)];};
const lerp=(a,b,p)=>a+(b-a)*p;
export function popupFrames(from,to,enter=true){
 if(!enter)return [from,to];
 const a=translate(from.translate),b=translate(to.translate),startScale=numeric(from.scale,1),endScale=numeric(to.scale,1),startOpacity=numeric(from.opacity,1),endOpacity=numeric(to.opacity,1);
 return timeline.map(({offset,progress,opacity})=>({offset,translate:`${lerp(a[0],b[0],progress)}px ${lerp(a[1],b[1],progress)}px`,scale:lerp(startScale,endScale,progress),opacity:lerp(startOpacity,endOpacity,opacity)}));
}
export const popupOptions=enter=>({duration:enter?interactionMotion.popupSettleMs:interactionMotion.popupExitMs,easing:enter?'linear':interactionMotion.easeCSS,fill:'both'});
