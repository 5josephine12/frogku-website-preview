/* Pointer focus never paints keyboard rings. One controller per document. */
const controllers=new WeakMap(),pageOwners=new WeakMap();
export function mountInputModality(doc=document){
 let state=controllers.get(doc);
 if(!state){
  const root=doc.documentElement,previous=root.getAttribute('data-input-modality');
  const set=value=>{if(root.dataset.inputModality!==value)root.dataset.inputModality=value;};
  const pointer=()=>set('pointer');
  const keyboard=event=>{
   if(event.metaKey||event.ctrlKey||event.altKey)return;
   const typing=event.target?.closest?.('input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,[contenteditable]:not([contenteditable=false])');
   if(event.key==='Tab'||(!typing&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','PageUp','PageDown','Enter',' ','Escape'].includes(event.key)))set('keyboard');
  };
  // Default keyboard indicators remain available before the first pointer event.
  set('keyboard');
  doc.addEventListener('pointerdown',pointer,true);doc.addEventListener('mousedown',pointer,true);doc.addEventListener('touchstart',pointer,{capture:true,passive:true});doc.addEventListener('keydown',keyboard,true);
  state={users:0,dispose(){doc.removeEventListener('pointerdown',pointer,true);doc.removeEventListener('mousedown',pointer,true);doc.removeEventListener('touchstart',pointer,true);doc.removeEventListener('keydown',keyboard,true);if(previous===null)root.removeAttribute('data-input-modality');else root.setAttribute('data-input-modality',previous);controllers.delete(doc);}};controllers.set(doc,state);
 }
 state.users++;let disposed=false;
 return()=>{if(disposed)return;disposed=true;if(!--state.users)state.dispose();};
}
export function ensureInputModality(doc=document){
 if(pageOwners.has(doc))return;
 const release=mountInputModality(doc),win=doc.defaultView;
 const dispose=event=>{if(event.persisted)return;release();pageOwners.delete(doc);win?.removeEventListener('pagehide',dispose);};
 pageOwners.set(doc,release);win?.addEventListener('pagehide',dispose);
}
