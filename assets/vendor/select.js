// Native-DOM adapter of shared product.tsx Select + PopupSurface.
// Retains the native form value, label focus, top-layer ancestry, placement,
// keyboard/typeahead, mutation/reset synchronization and exact popup poses.
import {interactionMotion,popupProgress,popupPoses} from './interaction-motion.js?v=d74b419c1354';
const mounted=new Set();
export const closeSelects=()=>mounted.forEach(control=>control.close());
export function mountSelect(select,{label,compact=false}={}){
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const host=document.createElement('span');host.className='product-select-host';host.dataset.noTranslate='';
 const root=document.createElement('div');root.className='product-select';if(compact)root.classList.add('compact-select');host.append(root);
 select.id ||= `frogku-select-${select.name}`;
 const id=select.id+'-options';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='product-select-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-controls',id);trigger.setAttribute('aria-expanded','false');
 const value=document.createElement('span');trigger.append(value);trigger.insertAdjacentHTML('beforeend','<svg class="ui-chevron icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" vector-effect="non-scaling-stroke"/></svg>');
 const panel=document.createElement('div');panel.id=id;panel.className='product-options';panel.setAttribute('role','listbox');panel.setAttribute('popover','manual');panel.tabIndex=-1;panel.dataset.noTranslate='';panel.inert=true;panel.setAttribute('aria-hidden','true');
 root.append(trigger,panel);select.after(host);select.hidden=true;select.setAttribute('aria-hidden','true');select.tabIndex=-1;
 let open=false,active=0,animation=null,revision=0,buffer='',timer,optionSignature='';
 const options=()=>[...select.options],selected=()=>Math.max(0,options().findIndex(o=>o.value===select.value));
 const pose=(p)=>({opacity:String(p.opacity),scale:`${p.scaleX} ${p.scaleY}`,translate:`0px ${p.y}px`});
 function animate(enter,done){
  const paint=getComputedStyle(panel),from={opacity:paint.opacity,scale:paint.scale==='none'?'1 1':paint.scale,translate:paint.translate==='none'?'0px 0px':paint.translate};
  const current=++revision;animation?.cancel();animation=null;
  const target=pose(enter?popupPoses.rest:popupPoses.exit);
  const finish=()=>{if(current!==revision)return;Object.assign(panel.style,target);animation?.cancel();animation=null;done?.();};
  if(reduce.matches){finish();return;}
  const pair=(v,f)=>{const p=String(v).split(/\s+/).map(Number.parseFloat);return [Number.isFinite(p[0])?p[0]:f,Number.isFinite(p[1])?p[1]:Number.isFinite(p[0])?p[0]:f];};
  const a=pair(from.scale,1),b=pair(target.scale,1),ay=parseFloat(from.translate.split(' ')[1])||0,by=parseFloat(target.translate.split(' ')[1])||0;
  const lerp=(x,y,p)=>x+(y-x)*p;
  const frames=enter?Array.from({length:49},(_,i)=>{const offset=i/48,seconds=offset*interactionMotion.popupSettleMs/1000,p=i===48?1:popupProgress(seconds);return {offset,scale:`${lerp(a[0],b[0],p)} ${lerp(a[1],b[1],p)}`,translate:`0px ${lerp(ay,by,p)}px`,opacity:lerp(Number(from.opacity),Number(target.opacity),Math.min(1,seconds*1000/interactionMotion.popupOpacityMs))};}):[from,target];
  animation=panel.animate(frames,{duration:enter?interactionMotion.popupSettleMs:interactionMotion.popupExitMs,easing:enter?'linear':interactionMotion.easeCSS,fill:'both'});animation.onfinish=finish;
 }
 function position(){
  if(!open)return;
  const r=trigger.getBoundingClientRect(),width=Math.min(Math.max(r.width,compact?216:180),innerWidth-24);
  panel.style.width=width+'px';panel.style.left=Math.min(Math.max(12,r.left),innerWidth-width-12)+'px';
  const below=innerHeight-r.bottom-12,above=r.top-12,up=below<Math.min(panel.scrollHeight,240)&&above>below;
  panel.style.maxHeight=Math.max(80,up?above-8:below-8)+'px';panel.style.top=up?'auto':r.bottom+8+'px';panel.style.bottom=up?innerHeight-r.top+8+'px':'auto';panel.style.transformOrigin=up?'bottom left':'top left';
 }
 function setActive(index,scroll=false){
  active=index;panel.setAttribute('aria-activedescendant',id+'-'+index);
  panel.querySelectorAll('[role=option]').forEach((row,i)=>row.dataset.active=String(i===active));
  if(scroll)panel.querySelector(`[data-option="${active}"]`)?.scrollIntoView({block:'nearest'});
 }
 function sync(){
  const items=options(),index=selected();value.textContent=items[index]?.dataset.short||items[index]?.text||'';
  const name=label?.()||select.getAttribute('aria-label')||select.labels?.[0]?.textContent.trim()||'Choose option';
  trigger.setAttribute('aria-label',name);panel.setAttribute('aria-label',name);trigger.disabled=select.disabled;
  for(const key of ['aria-invalid','aria-describedby','aria-required']){const v=select.getAttribute(key);if(v!==null)trigger.setAttribute(key,v);else trigger.removeAttribute(key);}
  if(select.required)trigger.setAttribute('aria-required','true');
  const signature=JSON.stringify(items.map(o=>[o.value,o.text,o.disabled]))+'|'+index;
  if(signature!==optionSignature){
   optionSignature=signature;const scrollTop=panel.scrollTop;panel.replaceChildren();
   items.forEach((option,i)=>{
    const row=document.createElement('div');row.id=id+'-'+i;row.dataset.option=i;row.setAttribute('role','option');row.setAttribute('aria-selected',String(i===index));row.setAttribute('aria-disabled',String(option.disabled));
    const text=document.createElement('span');text.textContent=option.text;row.append(text);
    if(i===index)row.insertAdjacentHTML('beforeend','<svg class="product-option-check icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" vector-effect="non-scaling-stroke"/></svg>');
    row.addEventListener('pointermove',()=>setActive(i));row.addEventListener('click',()=>choose(i));panel.append(row);
   });panel.scrollTop=scrollTop;
  }
  active=Math.min(active,items.length-1);setActive(active);if(open)position();
 }
 function outside(e){if(!root.contains(e.target))close();}
 function dismiss(){close();}
 function listen(on){for(const [target,name,handler,capture] of [[document,'pointerdown',outside,true],[window,'resize',position,false],[window,'scroll',position,true],[window,'hashchange',dismiss,false]])target[on?'addEventListener':'removeEventListener'](name,handler,capture);}
 function show(){
  closeSelects();sync();active=selected();setActive(active);open=true;trigger.setAttribute('aria-expanded','true');panel.inert=false;panel.removeAttribute('aria-hidden');
  if(!panel.matches(':popover-open')){Object.assign(panel.style,pose(popupPoses.enter));panel.showPopover();}
  position();listen(true);panel.focus({preventScroll:true});setActive(active,true);animate(true);
 }
 function close(focus=false){
  if(!open)return;open=false;listen(false);trigger.setAttribute('aria-expanded','false');panel.inert=true;panel.setAttribute('aria-hidden','true');
  animate(false,()=>{if(!open&&panel.matches(':popover-open'))panel.hidePopover();});if(focus)trigger.focus({preventScroll:true});
 }
 function choose(index){if(options()[index]?.disabled)return;select.value=options()[index].value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close(true);}
 function key(e){
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);return;}
  if(e.key==='Tab'){close();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();if(!open){show();return;}setActive(e.key==='Home'?0:e.key==='End'?options().length-1:(active+(e.key==='ArrowDown'?1:-1)+options().length)%options().length,true);return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();if(open)choose(active);else show();return;}
  if(e.key.length===1&&!e.ctrlKey&&!e.metaKey){buffer+=e.key.toLowerCase();clearTimeout(timer);timer=setTimeout(()=>buffer='',500);const index=options().findIndex(o=>o.text.toLowerCase().startsWith(buffer));if(index>=0){if(!open)show();setActive(index,true);}}
 }
 trigger.addEventListener('click',()=>open?close():show());trigger.addEventListener('keydown',key);panel.addEventListener('keydown',key);
 select.addEventListener('change',sync);select.addEventListener('frogku-select-sync',sync);select.form?.addEventListener('reset',()=>queueMicrotask(sync));
 const observer=new MutationObserver(sync);observer.observe(select,{childList:true,subtree:true,attributes:true,characterData:true});
 const labelListeners=[];select.labels?.forEach(element=>{const focus=e=>{if(e.target.closest('.product-select-host'))return;e.preventDefault();trigger.focus();};element.addEventListener('click',focus);labelListeners.push([element,focus]);});
 reduce.addEventListener('change',()=>{if(reduce.matches)animation?.finish();});
 const controller={sync,close,focus:()=>trigger.focus(),dispose(){close();observer.disconnect();mounted.delete(controller);clearTimeout(timer);labelListeners.forEach(([el,fn])=>el.removeEventListener('click',fn));host.remove();select.hidden=false;select.removeAttribute('aria-hidden');select.removeAttribute('tabindex');}};
 mounted.add(controller);sync();return controller;
}
