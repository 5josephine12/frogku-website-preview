import {transitionTheme} from './vendor/theme-transition.js?v=27fca7142643';
let language='id';
try{const saved=localStorage.getItem('frogku-language');if(['id','en','zh'].includes(saved))language=saved;}catch{}
if(document.body.classList.contains('legal-page')){const specified=new URLSearchParams(location.search).get('lang');if(['id','en','zh'].includes(specified))language=specified;}
const dictionaries=await fetch('assets/translations.json?v=27fca7142643').then(r=>{if(!r.ok)throw new Error('Translations unavailable');return r.json();});
const textSources=new WeakMap(),attributeSources=new WeakMap();
export const getLang=()=>language;
export function t(value){
 if(language==='id')return value;
 const version=value.match(/^Versi ([0-9.]+) · sekitar ([0-9]+) MB$/);
 if(version)return language==='zh'?`版本 ${version[1]} · 约 ${version[2]} MB`:`Version ${version[1]} · about ${version[2]} MB`;
 return dictionaries[value]?.[language]||value;
}
export function translate(root=document.body){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){return node.parentElement?.closest('script,style,[data-no-translate]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
 while(walker.nextNode()){
  const node=walker.currentNode;
  if(!textSources.has(node))textSources.set(node,node.textContent);
  const source=textSources.get(node),clean=source.trim();
  if(clean&&(dictionaries[clean]||/^Versi [0-9.]+ · sekitar [0-9]+ MB$/.test(clean)))node.textContent=source.replace(clean,t(clean));
 }
 root.querySelectorAll?.('[aria-label],[placeholder],[alt],[title]').forEach(el=>{
  if(el.closest('[data-no-translate]'))return;
  if(!attributeSources.has(el))attributeSources.set(el,{});
  const saved=attributeSources.get(el);
  for(const name of ['aria-label','placeholder','alt','title']){
   if(!el.hasAttribute(name))continue;
   if(!(name in saved))saved[name]=el.getAttribute(name);
   el.setAttribute(name,t(saved[name]));
  }
 });
 document.documentElement.lang=language==='zh'?'zh-CN':language;
 document.title=document.body.dataset.page==='privacy'?t('Kebijakan privasi')+' · Frogku':document.body.dataset.page==='terms'?t('Ketentuan pengguna')+' · Frogku':t('Frogku — Cuan kapan aja, di mana aja. Jalanin aja kayak biasa.');
 const select=document.querySelector('#language');if(select)select.value=language;document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
}
let requestedLanguage=language;
export function setLanguage(next){
 if(!['id','en','zh'].includes(next)||next===requestedLanguage)return;
 requestedLanguage=next;
 // Keep the reading position when translated copy changes its natural height.
 // The shared appearance owner cancels obsolete requests and reverses from paint.
 transitionTheme(()=>{
  const focused=document.activeElement,focusId=focused?.id;
  const anchor=focused?.closest('.footer-links,.faq-content')||[...document.querySelectorAll('.story-chapter,.tasks-section,.download-section,.footer')].reverse().find(el=>el.getBoundingClientRect().top<=innerHeight/3);
  const top=anchor?.getBoundingClientRect().top,position=scrollY;
  language=next;
  try{localStorage.setItem('frogku-language',next);localStorage.setItem('frog-site-lang',next);}catch{}
  translate();window.dispatchEvent(new CustomEvent('frogku:language'));
  if(focusId&&!focused.isConnected)document.getElementById(focusId)?.focus({preventScroll:true});
  if(!document.body.classList.contains('legal-page'))scrollTo({top:position+(anchor&&anchor.isConnected?anchor.getBoundingClientRect().top-top:0),behavior:'instant'});
 },{snapshot:false});
}
