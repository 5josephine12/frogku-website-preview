// Card-local motion preference. Never replace the browser's global media query:
// independent examples must be comparable without affecting their neighbours.
export const motionEvent='frogku-card-motion';
const query='(prefers-reduced-motion: reduce)';
export function cardOwner(element){
 if(!element)return null;
 const local=element.closest?.('[data-implementation]');
 if(local)return local;
 const key=element.closest?.('[data-motion-owner]')?.dataset.motionOwner;
 return key?[...element.ownerDocument.querySelectorAll('[data-implementation]')].find(card=>card.dataset.implementation===key):null;
}
export function storedMotion(key){try{return sessionStorage.getItem('frogku-motion:'+key)!=='off';}catch{return true;}}
export function motionDisabled(element){return matchMedia(query).matches||cardOwner(element)?.dataset.motion==='off';}
export function cardMotionPreference(element){
 const media=typeof matchMedia==='function'?matchMedia(query):element.ownerDocument.defaultView.matchMedia(query),listeners=new Map(),doc=element?.ownerDocument||(typeof document!=='undefined'?document:null);
 return {get matches(){return media.matches||cardOwner(element)?.dataset.motion==='off';},
  addEventListener(type,listener){if(type!=='change'||listeners.has(listener))return;const local=event=>{if(event.detail?.key===cardOwner(element)?.dataset.implementation)listener(event);};listeners.set(listener,local);media.addEventListener?.('change',listener);doc?.addEventListener(motionEvent,local);},
  removeEventListener(type,listener){if(type!=='change')return;media.removeEventListener?.('change',listener);const local=listeners.get(listener);if(local)doc?.removeEventListener(motionEvent,local);listeners.delete(listener);}
 };
}
export function setCardMotion(card,enabled){
 const key=card.dataset.implementation,doc=card.ownerDocument;
 card.dataset.motion=enabled?'on':'off';
 try{sessionStorage.setItem('frogku-motion:'+key,enabled?'on':'off');}catch{}
 // Finish running WAAPI/CSS work so completion callbacks still commit state.
 // JS springs use cardMotionPreference or the React CardMotion context.
 const surfaces=[card,...[...doc.querySelectorAll('[data-motion-owner]')].filter(surface=>surface.dataset.motionOwner===key)];
 for(const surface of surfaces.slice(1))surface.dataset.motion=enabled?'on':'off';
 if(!enabled)for(const surface of surfaces)for(const animation of surface.getAnimations?.({subtree:true})||[]){
  try{const timing=animation.effect?.getComputedTiming();if(timing?.iterations===Infinity)animation.cancel();else animation.finish();}catch{animation.cancel();}
 }
 doc.dispatchEvent(new doc.defaultView.CustomEvent(motionEvent,{detail:{key,enabled}}));
}
