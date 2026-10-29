import {ensureInputModality} from './vendor/input-modality.js';
import {mountSegmentedPill} from './vendor/segmented-pill.js';
import {mountSelect,closeSelects} from './vendor/select.js';
import {popupFrames,popupOptions} from './vendor/interaction-motion.js';
import {translate,t,getLang,setLanguage} from './i18n.js';
import {mountWordmark} from './wordmark.js';
import {mountStickyTables} from './vendor/sticky-tables.js';
import {transitionSection,cancelNavigationMotion} from './vendor/navigation-motion.js';
ensureInputModality();
const $=selector=>document.querySelector(selector),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const sectionSelect=$('#legal-section'),toc=$('.legal-toc-links'),dialog=$('#menu-dialog'),opener=$('.menu-button');
let sectionControl,menuAnimation,menuOpen=false,returnFocus;
const labels={id:'Di halaman ini',en:'On this page',zh:'本页内容'};
let activeSection;
function selectSection(id){
 activeSection=id;
 toc.querySelectorAll('a').forEach(link=>{if(link.hash==='#'+id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 sectionSelect.value=id;sectionControl?.sync();
}
function goToSection(id,{history=true}={}){
 const target=document.getElementById(id);if(!target||target.closest('article')?.hidden)return;
 if(history&&location.hash!=='#'+id)window.history.pushState(null,'','#'+id);
 selectSection(id);transitionSection(target,{headerSelector:'.header',onFinish:()=>{target.tabIndex=-1;target.focus({preventScroll:true});}});
}
toc.addEventListener('click',event=>{const link=event.target.closest('a');if(!link||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();goToSection(link.hash.slice(1));});
function renderArticle(initial=false){
 cancelNavigationMotion();
 const old=document.querySelector('article[data-l]:not([hidden])');
 const headings=old?[...old.querySelectorAll('h2')]:[];
 const index=Math.max(0,headings.reduce((value,heading,i)=>heading.getBoundingClientRect().top<=120?i:value,-1));
 const previousTop=headings[index]?.getBoundingClientRect().top;
 document.querySelectorAll('article[data-l]').forEach(article=>article.hidden=article.dataset.l!==getLang());
 const article=document.querySelector(`article[data-l="${getLang()}"]`),next=[...article.querySelectorAll('h2')];
 $('#legal-contents-label').textContent=labels[getLang()];
 toc.replaceChildren(...next.map(heading=>{const a=document.createElement('a');a.href='#'+heading.id;a.textContent=heading.textContent;return a;}));
 sectionSelect.replaceChildren(...next.map(heading=>{const option=document.createElement('option');option.value=heading.id;option.textContent=heading.textContent;return option;}));
 sectionSelect.value=next[index]?.id||next[0]?.id;
 selectSection(sectionSelect.value);
 sectionControl?.sync();
 if(!initial&&previousTop!==undefined&&previousTop<innerHeight&&scrollY>0){scrollTo({top:scrollY+next[index].getBoundingClientRect().top-previousTop,behavior:'instant'});}
 document.querySelectorAll('a[href]').forEach(a=>{const url=new URL(a.getAttribute('href'),location.href);if(url.origin!==location.origin||!/^(privacy|terms)\.html$/.test(url.pathname.split('/').pop()))return;url.searchParams.set('lang',getLang());a.href=url.pathname+url.search+url.hash;if(url.pathname===location.pathname)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
}
translate();renderArticle(true);mountWordmark();mountStickyTables();
const languageSelect=$('#language');
const languageControl=mountSelect(languageSelect,{label:()=>t('Pilih bahasa'),compact:true});
sectionControl=mountSelect(sectionSelect,{label:()=>labels[getLang()]});
languageSelect.addEventListener('change',()=>setLanguage(languageSelect.value));
sectionSelect.addEventListener('change',()=>goToSection(sectionSelect.value));
const languagePill=mountSegmentedPill($('.language-segments'),$('.language-indicator'),'[aria-pressed=true]');
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.language)));
window.addEventListener('frogku:language',()=>{renderArticle();languagePill.move();languageControl.sync();try{const url=new URL(location.href);url.searchParams.set('lang',getLang());history.replaceState(null,'',url);}catch{}});
function animateMenu(enter,finish){
 const style=getComputedStyle(dialog),from={opacity:style.opacity,scale:style.scale==='none'?'1':style.scale,translate:style.translate==='none'?'0px 0px':style.translate};
 menuAnimation?.cancel();
 const target=enter?{opacity:1,scale:1,translate:'0px 0px'}:{opacity:0,scale:.96,translate:'0px 8px'};
 if(reduced.matches){Object.assign(dialog.style,target);finish?.();return;}
 const animation=dialog.animate(popupFrames(from,target,enter),popupOptions(enter));menuAnimation=animation;
 animation.onfinish=()=>{if(menuAnimation!==animation)return;Object.assign(dialog.style,target);animation.cancel();menuAnimation=null;finish?.();};
}
function setMenu(open){
 menuOpen=open;opener.setAttribute('aria-expanded',String(open));closeSelects();
 if(open){cancelNavigationMotion();returnFocus=document.activeElement;dialog.inert=false;if(!dialog.open){Object.assign(dialog.style,{opacity:0,scale:.94,translate:'0px 14px'});dialog.showModal();}document.body.style.overflow='hidden';animateMenu(true);}
 else{dialog.inert=true;animateMenu(false,()=>{if(menuOpen)return;dialog.close();document.body.style.overflow='';returnFocus?.focus({preventScroll:true});});}
}
opener.addEventListener('click',()=>setMenu(true));
dialog.querySelector('[data-close-dialog]').addEventListener('click',()=>setMenu(false));
dialog.addEventListener('cancel',event=>{event.preventDefault();setMenu(false);});
dialog.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const fields=[...dialog.querySelectorAll('a[href],button')].filter(el=>el.getClientRects().length),first=fields[0],last=fields.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
reduced.addEventListener('change',()=>{if(reduced.matches){menuAnimation?.finish();cancelNavigationMotion();if(activeSection)goToSection(activeSection,{history:false});}});
addEventListener('popstate',()=>{if(location.hash)goToSection(location.hash.slice(1),{history:false});});
addEventListener('pagehide',cancelNavigationMotion);
const hash=location.hash.slice(1),target=document.getElementById(hash)||document.getElementById(getLang()+'-'+hash);
if(hash&&target)requestAnimationFrame(()=>target.scrollIntoView());
