// Keep the original header inside its own table/card. Native sticky positions
// clear measured page chrome and remain clipped to their original scrollport.
const key=Symbol.for('frogku.sticky-tables'),mounted={get:doc=>doc[key],set:(doc,value)=>Object.defineProperty(doc,key,{value,writable:true,configurable:true}),delete:doc=>delete doc[key]};
const lease=state=>{let released=false;return()=>{if(released)return;released=true;if(--state.users===0)state.dispose();};};
const chromeSelector='.gallery-header,.gallery-search,.app-header,.sample-header';
const columnHeaders='.capability-readings>.capability-column-labels,.library-action-readings>.library-action-heading,.library-experiments>.library-experiment-head';
const scrollports='.reference-table-scroll,.information-table-scroll,.demo-table-wrap,.table-scroll,.sample-log,.detail-table-scroll,.statistics-scroll,.multi-model-table,.runs-scroll,.implementation-scroll,.live-diagnostics-dock';
export function mountStickyTables(doc=document){
 const existing=mounted.get(doc);if(existing){existing.users++;return lease(existing);}
 const tables=new Map(),hosts=new Map(),columns=new Map(),localStyles=new Map(),chrome=new Set(),root=doc.documentElement,oldTop=root.style.getPropertyValue('--card-table-sticky-top'),oldPriority=root.style.getPropertyPriority('--card-table-sticky-top');let disposed=false,frame=0;
 const measureChrome=()=>{if(disposed)return;const top=Math.max(0,...[...chrome].map(node=>{const s=doc.defaultView.getComputedStyle(node),r=node.getBoundingClientRect();return r.width&&['sticky','fixed'].includes(s.position)?(parseFloat(s.top)||0)+r.height:0;}));const value=top+'px';if(root.style.getPropertyValue('--card-table-sticky-top')!==value)root.style.setProperty('--card-table-sticky-top',value);measureLocal();};

 function measureLocal(){
  if(disposed)return;
  const chromeTop=parseFloat(root.style.getPropertyValue('--card-table-sticky-top'))||0;
  for(const host of hosts.keys()){
   if(!host.isConnected)continue;
   const r=host.getBoundingClientRect(),s=doc.defaultView.getComputedStyle(host),head=host.querySelector('table[data-card-table-header=local]>thead'),height=head?.getBoundingClientRect().height||0;
   const insetTop=(parseFloat(s.paddingTop)||0)+(parseFloat(s.borderTopWidth)||0),insetBottom=(parseFloat(s.paddingBottom)||0)+(parseFloat(s.borderBottomWidth)||0);
   const floating=host.closest('.detail-drawer,.live-diagnostics-dock,[role=dialog],dialog');
   const top=!floating&&r.width?Math.max(0,Math.min(chromeTop-r.top-insetTop,Math.max(0,r.height-insetTop-insetBottom-height))):0,value=top+'px';
   if(!localStyles.has(host))localStyles.set(host,[host.style.getPropertyValue('--card-table-local-top'),host.style.getPropertyPriority('--card-table-local-top')]);
   if(host.style.getPropertyValue('--card-table-local-top')!==value)host.style.setProperty('--card-table-local-top',value);
  }
 }
 const schedule=()=>{if(disposed||frame)return;frame=doc.defaultView.requestAnimationFrame(()=>{frame=0;measureLocal();});};
 const resize=new doc.defaultView.ResizeObserver(measureChrome);
 const mark=(node,name,value,records)=>{if(!records.has(node))records.set(node,new Map());const attrs=records.get(node);if(!attrs.has(name))attrs.set(name,node.getAttribute(name));node.setAttribute(name,value);};
 const restore=(node,attrs)=>{for(const [name,value]of attrs)value===null?node.removeAttribute(name):node.setAttribute(name,value);};
 function scan(){
  if(disposed)return;
  for(const node of chrome)if(!node.isConnected){resize.unobserve(node);chrome.delete(node);}
  for(const node of doc.querySelectorAll(chromeSelector))if(!chrome.has(node)){chrome.add(node);resize.observe(node);}
  measureChrome();
  for(const [node,attrs]of columns)if(!node.isConnected){restore(node,attrs);columns.delete(node);}
  for(const node of doc.querySelectorAll(columnHeaders))mark(node,'data-card-column-header','card',columns);
  for(const [node,attrs]of tables)if(!node.isConnected){restore(node,attrs);tables.delete(node);}
  for(const [node,attrs]of hosts)if(!node.isConnected){restore(node,attrs);hosts.delete(node);resize.unobserve(node);const previous=localStyles.get(node);if(previous){previous[0]?node.style.setProperty('--card-table-local-top',previous[0],previous[1]):node.style.removeProperty('--card-table-local-top');localStyles.delete(node);}}
  for(const table of doc.querySelectorAll('table')){
   // A paired chart owns its visible column labels outside the semantic table.
   // Do not force its clipped accessible thead back into normal flow.
   if(table.hasAttribute('data-external-heading')||!table.tHead||!table.tHead.querySelector('tr'))continue;
   const host=table.parentElement?.closest(scrollports),card=table.closest('.implementation-card,.chart-study,.reference-study,.device-card,.sample-reference-panel,.reference-panel,.data-panel,[role=dialog],dialog');
   // An outside page/list container cannot own a table inside another card.
   const local=host&&(!card||card.contains(host));
   if(local){
    if(!hosts.has(host))resize.observe(host);
    mark(host,'data-card-table-scroll','',hosts);mark(table,'data-card-table-header','local',tables);
    if(!host.hasAttribute('role'))mark(host,'role','region',hosts);
    if(!host.hasAttribute('aria-label')&&!host.hasAttribute('aria-labelledby'))mark(host,'aria-label',table.getAttribute('aria-label')||card?.querySelector('h2,h3')?.textContent?.trim()||'Table',hosts);
    if(!host.hasAttribute('tabindex'))mark(host,'tabindex','0',hosts);
   }else mark(table,'data-card-table-header','card',tables);
  }
  measureLocal();
 }
 scan();
 doc.fonts?.ready.then(()=>{if(!disposed)measureChrome();});
 const observer=new doc.defaultView.MutationObserver(changes=>{if(changes.some(change=>[...change.addedNodes,...change.removedNodes].some(node=>node.nodeType===1&&(node.matches?.('table,thead,'+chromeSelector+','+columnHeaders)||node.querySelector?.('table,thead,'+chromeSelector+','+columnHeaders)))))scan();});
 observer.observe(doc.body,{subtree:true,childList:true});
 doc.addEventListener('scroll',schedule,{capture:true,passive:true});
 const state={users:1,dispose(){if(disposed)return;disposed=true;observer.disconnect();resize.disconnect();doc.removeEventListener('scroll',schedule,true);doc.defaultView.cancelAnimationFrame(frame);for(const [node,[value,priority]]of localStyles)value?node.style.setProperty('--card-table-local-top',value,priority):node.style.removeProperty('--card-table-local-top');for(const [node,attrs]of columns)restore(node,attrs);if(oldTop)root.style.setProperty('--card-table-sticky-top',oldTop,oldPriority);else root.style.removeProperty('--card-table-sticky-top');for(const [node,attrs]of tables)restore(node,attrs);for(const [node,attrs]of hosts)restore(node,attrs);mounted.delete(doc);}};
 mounted.set(doc,state);return lease(state);
}
