import {ensureInputModality} from './vendor/input-modality.js?v=27fca7142643';
import {popupFrames,popupOptions} from './vendor/interaction-motion.js?v=27fca7142643';
import {translate,t,getLang,setLanguage} from './i18n.js?v=27fca7142643';
import {mountProductStory} from './product-story.js?v=27fca7142643';
import {mountWordmark,mountOpticalLabel} from './wordmark.js?v=27fca7142643';
import {mountHeadingRotation} from './heading-rotation.js?v=27fca7142643';
import {mountTaskPreviews} from './task-previews.js?v=27fca7142643';
import {mountSegmentedPill} from './vendor/segmented-pill.js?v=27fca7142643';
import {mountSelect,closeSelects} from './vendor/select.js?v=27fca7142643';
import {actionArrowMarkup} from './vendor/action-arrow.js?v=27fca7142643';
import {mountAmbientPlayback,mountTaskPlayback} from './media-player.js?v=27fca7142643';
import {applicationDraft,isServiceArea} from './application-draft.js?v=27fca7142643';
import {faqAnswer} from './faq-answer.js?v=27fca7142643';
import {animateExpansion,animateSurfaceContent,contentTransition,mountDisclosureMotion} from './vendor/surface-motion.js?v=27fca7142643';
import {anchorDisclosureCollapse} from './vendor/disclosure-scroll.js?v=27fca7142643';
ensureInputModality();
mountWordmark();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const $=s=>document.querySelector(s);
const icon=(name,extra='')=>name==='arrow'||name==='arrow-up'?actionArrowMarkup({direction:name==='arrow'?'right':'up-right',className:extra}):`<svg class="icon ${extra}" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
let content,category='Semua',showAllFaqs=false,chatPending=false,chatOpen=false,taskPreviews;
const chatHistory=[];
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.language)));
$('#language').addEventListener('change',e=>setLanguage(e.target.value));
translate();
mountHeadingRotation($('#tasks-title'),t);
mountOpticalLabel('.download-intro>.eyebrow');
// Compact labels preserve the full category names for assistive technology.
const compactFaqLabels={id:['Semua','Mulai','Bayaran','Privasi'],en:['All','Start','Pay','Privacy'],zh:['全部','开始','报酬','隐私']};
const faqCategoryButtons=[...document.querySelectorAll('.faq-filters [data-category]')];
faqCategoryButtons.forEach(button=>{
 button.setAttribute('aria-label',button.dataset.category);
 const full=document.createElement('span');full.className='faq-category-full';full.append(...button.childNodes);
 const compact=document.createElement('span');compact.className='faq-category-compact';compact.dataset.noTranslate='';compact.setAttribute('aria-hidden','true');
 button.append(full,compact);
});
translate($('.faq-filters'));
function syncFaqLabels(){faqCategoryButtons.forEach((button,index)=>{button.setAttribute('aria-label',t(button.dataset.category));button.querySelector('.faq-category-compact').textContent=compactFaqLabels[getLang()][index];});}
syncFaqLabels();
const downloadLayout=matchMedia('(min-width:1180px)'),downloadNote=$('.download-section .download-note');
const placeDownloadNote=()=>{(downloadLayout.matches?$('.download-intro'):$('.download-content')).append(downloadNote);};
placeDownloadNote();downloadLayout.addEventListener('change',placeDownloadNote);
const languagePill=mountSegmentedPill($('.language-segments'),$('.language-indicator'),'[aria-pressed=true]');
const filterPill=mountSegmentedPill($('.faq-filters'),$('.faq-filter-indicator'),'[aria-pressed=true]');
const selectControls=new Map();
for(const [selector,label] of [['#language','Pilih bahasa'],['select[name=location]','Domisili'],['#activity-options','Aktivitas yang bisa kamu rekam']]){const select=$(selector);selectControls.set(select,mountSelect(select,{label:()=>t(label),compact:selector==='#language'}));}
window.addEventListener('frogku:language',()=>{syncFaqLabels();languagePill.move();filterPill.move(true);selectControls.forEach(control=>control.sync());});

// Native dialogs keep keyboard containment and restore focus to their trigger.
const dialogAnimations=new WeakMap();
function animateSurface(el,enter,onFinish){
 const previous=dialogAnimations.get(el),paint=getComputedStyle(el);
 const from={opacity:paint.opacity,scale:paint.scale==='none'?'1':paint.scale,translate:paint.translate==='none'?'0px 0px':paint.translate};
 previous?.cancel();
 const target=enter?{opacity:1,scale:1,translate:'0px 0px'}:{opacity:0,scale:.96,translate:'0px 8px'};
 if(reduced.matches){Object.assign(el.style,target);onFinish?.();return;}
 const animation=el.animate(popupFrames(from,target,enter),popupOptions(enter));
 dialogAnimations.set(el,animation);
 animation.onfinish=()=>{if(dialogAnimations.get(el)!==animation)return;Object.assign(el.style,target);animation.cancel();dialogAnimations.delete(el);onFinish?.();};
}
const dialogTriggers=new WeakMap();
function openDialog(dialog,trigger){
 closeSelects();
 dialogTriggers.set(dialog,trigger);
 // Restore interactivity before showModal runs its native focus algorithm.
 dialog.inert=false;
 if(!dialog.open){dialog.style.opacity='0';dialog.style.scale='.94';dialog.style.translate='0px 14px';dialog.showModal();if(!reduced.matches)dialog.querySelectorAll('#qualification-form>label,#qualification-form .form-row>label').forEach((field,i)=>field.animate([{opacity:0,translate:'0px 8px'},{opacity:1,translate:'0px 0px'}],{duration:280,delay:Math.min(i*18,90),easing:'cubic-bezier(.22,1,.36,1)'}));}
 document.body.style.overflow='hidden';document.querySelectorAll('video').forEach(v=>v.pause());taskPreviews?.sync();animateSurface(dialog,true);
}
function closeDialog(dialog,after){
 if(!dialog.open){after?.();return;}closeSelects();dialog.inert=true;
 animateSurface(dialog,false,()=>{
  dialog.close();dialog.querySelectorAll('video').forEach(v=>v.pause());
  if(dialog.id==='task-dialog'){taskPlayerCleanup?.();taskPlayerCleanup=null;taskPlayerVersion++;}
  if(dialog.id==='menu-dialog')$('.menu-button').setAttribute('aria-expanded','false');
  if(!document.querySelector('dialog[open]'))document.body.style.overflow='';
  const trigger=dialogTriggers.get(dialog);if(trigger?.isConnected)trigger.focus({preventScroll:true});
  after?.();videos.forEach(syncVideo);taskPreviews?.sync();
 });
}
function openApplication(trigger){
 if(chatOpen)setChat(false);
 const current=document.querySelector('dialog[open]');
 if(current&&current.id!=='application-dialog'){
  const returnTo=dialogTriggers.get(current)||trigger;
  closeDialog(current,()=>openApplication(returnTo));return;
 }
 openDialog($('#application-dialog'),trigger);
}
function openDownloads(){
 if(chatOpen)setChat(false);
 const show=()=>$('#download').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});
 const current=document.querySelector('dialog[open]');
 if(current)closeDialog(current,show);else show();
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href="#join"],a[href="#download"],[data-open-download]');if(!link)return;
 event.preventDefault();if(link.matches('a[href="#join"]'))openApplication(link);else openDownloads(link);
});
$('.menu-button').addEventListener('click',e=>{e.currentTarget.setAttribute('aria-expanded','true');openDialog($('#menu-dialog'),e.currentTarget);});
for(const dialog of document.querySelectorAll('dialog')){
 // Keep the native modal's keyboard loop inside its current visible controls,
 // including WebViews that otherwise send reverse Tab to browser chrome.
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||event.defaultPrevented||event.target.closest('.product-options'))return;
  const fields=[...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&!el.closest('[hidden],[inert]')&&el.getClientRects().length);
  const first=fields[0],last=fields.at(-1);
  if(!first){event.preventDefault();dialog.focus({preventScroll:true});return;}
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus({preventScroll:true});}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus({preventScroll:true});}
 });
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog);});
 dialog.addEventListener('click',e=>{if(e.target===dialog&&dialog.id!=='menu-dialog'){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(dialog);}});
}
document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.closest('dialog'))));
document.querySelectorAll('[data-install-guide]').forEach(button=>button.addEventListener('click',()=>{
 const platform=button.dataset.installGuide,dialog=$('#installation-dialog');
 $('#installation-platform').textContent=platform==='android'?'Android':'iPhone';
 $('#installation-mark').src=`assets/platform/${platform==='android'?'android':'apple'}.svg`;
 $('#installation-steps').replaceChildren($(`#install-guide-${platform}`).content.cloneNode(true));
 translate(dialog);openDialog(dialog,button);
}));
document.querySelectorAll('.desktop-installation').forEach(mountDisclosureMotion);
$('#menu-dialog').querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const href=a.getAttribute('href');if(['#download','#join'].includes(href))return;e.preventDefault();closeDialog($('#menu-dialog'),()=>{if(!productStory.goTo(href))document.querySelector(href)?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});});}));
document.addEventListener('click',event=>{const link=event.target.closest('a[href="#top"],a[href="#earn"],a[href="#how"],a[href="#requirements"]');if(!link||link.closest('#menu-dialog'))return;event.preventDefault();productStory.goTo(link.getAttribute('href'));});

function renderTasks(){
 taskPreviews?.destroy();
 const track=$('#task-track');track.innerHTML=content.tasks.map(task=>`<button class="sample-card" data-task="${task.id}" aria-label="${task.title} — Lihat contoh tugas"><div class="sample-image"><video class="task-card-video" muted loop playsinline preload="none" poster="assets/media/task-${task.id}.jpg" aria-label="${task.title}" data-src="assets/video/task-${task.id}.mp4"></video></div><div class="sample-card-copy"><h3><span>${task.title}</span>${icon('arrow-up')}</h3><p>${task.tag}</p><div class="sample-count"><strong>Rp 0–100.000</strong><span>/ jam*</span></div></div></button>`).join('');
 track.querySelectorAll('[data-task]').forEach(button=>{
 button.addEventListener('click',()=>openTask(button.dataset.task,button));
 });
 taskPreviews=mountTaskPreviews(track,{reduced});translate(track);updateTaskArrows();
}
function updateTaskArrows(){const track=$('#task-track');$('.carousel-buttons').hidden=track.scrollWidth<=track.clientWidth+4;$('#tasks-prev').disabled=track.scrollLeft<4;$('#tasks-next').disabled=track.scrollWidth-track.clientWidth-track.scrollLeft<4;}
$('#task-track').addEventListener('scroll',updateTaskArrows,{passive:true});window.addEventListener('resize',updateTaskArrows);
for(const [selector,direction] of [['#tasks-prev',-1],['#tasks-next',1]])$(selector).addEventListener('click',()=>$('#task-track').scrollBy({left:direction*(($('#task-track').querySelector('.sample-card')?.clientWidth||280)+(parseFloat(getComputedStyle($('#task-track')).columnGap)||0)),behavior:reduced.matches?'instant':'smooth'}));
let taskPlayerCleanup,taskPlayerVersion=0;
function openTask(id,trigger){
 taskPlayerCleanup?.();taskPlayerCleanup=null;const playerVersion=++taskPlayerVersion;
 const task=content.tasks.find(x=>x.id===id);if(!task)return;
 $('#task-dialog-content').innerHTML=`<div class="task-dialog-media"><video playsinline preload="metadata" poster="assets/media/task-${id}.jpg" src="assets/video/task-${id}.mp4" aria-label="${task.title}"></video><div class="task-media-controls"><button class="task-video-play playback-button" data-icon-only type="button" aria-label="Putar video">${icon('play')}</button><div class="playback-progress"><input class="task-video-seek" type="range" min="0" max="100" step=".05" value="0" aria-label="Posisi video" disabled></div><span class="slo-time" data-no-translate>00:00 / --:--</span></div><div class="task-video-status" hidden role="status"><p>Video belum bisa diputar. Coba lagi.</p><button class="ui-secondary" type="button">Coba lagi</button></div></div><div class="task-dialog-copy"><span class="eyebrow">Contoh rekaman</span><h2 id="task-dialog-title">${task.title}</h2><p>${task.text}</p><div class="task-dialog-rate"><strong>Rp 0–100.000</strong><span>/ jam rekaman yang lolos peninjauan*</span><span>Bayaran tergantung kualitas video yang lolos peninjauan.</span></div><a class="pill dark" href="#join" data-start-task>Mulai tugas ini ${icon('arrow')}</a></div>`;
 translate($('#task-dialog-content'));openDialog($('#task-dialog'),trigger);const playerRoot=$('#task-dialog-content');mountTaskPlayback(playerRoot,{t}).then(cleanup=>{if(playerVersion===taskPlayerVersion&&playerRoot.isConnected&&$('#task-dialog').open)taskPlayerCleanup=cleanup;else cleanup?.();});
}
const faqEmpty=$('.faq-empty');
const faqTransition=contentTransition([$('#faq-list'),$('#faq-more')],$('.faq-content'));
let stopFaqFollowing;
function syncFaqMore(){
 const more=$('#faq-more');more.setAttribute('aria-expanded',String(showAllFaqs));
 more.innerHTML=t(showAllFaqs?'Tampilkan lebih sedikit':'Lihat semua pertanyaan')+' '+icon('arrow');
 more.setAttribute('data-no-translate','');
}
function renderFaqs(){
 const search=$('#faq-search').value.toLocaleLowerCase(getLang()==='zh'?'zh-CN':getLang()).trim();
 const openQuestions=new Set([...document.querySelectorAll('.faq-question[aria-expanded=true]')].map(x=>Number(x.dataset.faq)));
 const items=content.faqs.map((f,i)=>({...f,i})).filter(f=>(category==='Semua'||category===f.category)&&(!search||`${t(f.q)} ${t(f.a)}`.toLocaleLowerCase().includes(search)));
 const filtered=!!search||category!=='Semua';
 $('#faq-more').hidden=filtered||items.length<=5;syncFaqMore();
 const markup=f=>`<article class="faq-item"><h3><button class="faq-question" id="faq-question-${f.i}" aria-controls="faq-answer-${f.i}" aria-expanded="${openQuestions.has(f.i)}" data-faq="${f.i}"><span>${f.q}</span>${icon('plus')}</button></h3><div class="faq-answer ${openQuestions.has(f.i)?'open':''}" style="height:${openQuestions.has(f.i)?'auto':'0px'};visibility:${openQuestions.has(f.i)?'visible':'hidden'}" id="faq-answer-${f.i}" role="region" aria-labelledby="faq-question-${f.i}" aria-hidden="${!openQuestions.has(f.i)}" ${openQuestions.has(f.i)?'':'inert'}><div>${f.a}</div></div></article>`;
 const split=!filtered&&items.length>5;
 $('#faq-list').innerHTML=split?items.slice(0,5).map(markup).join('')+`<div class="faq-extra" id="faq-extra" style="height:${showAllFaqs?'auto':'0px'};visibility:${showAllFaqs?'visible':'hidden'}" aria-hidden="${!showAllFaqs}" ${showAllFaqs?'':'inert'}>${items.slice(5).map(markup).join('')}</div>`:items.map(markup).join('');
 $('#faq-list').querySelectorAll('.faq-question').forEach(b=>b.addEventListener('click',()=>{
  const expanded=b.getAttribute('aria-expanded')!=='true',answer=document.getElementById(b.getAttribute('aria-controls'));
  b.setAttribute('aria-expanded',String(expanded));answer.classList.toggle('open',expanded);answer.inert=!expanded;answer.setAttribute('aria-hidden',String(!expanded));
  animateExpansion(answer,expanded);
 }));
 faqEmpty.hidden=items.length!==0;$('#faq-list').append(faqEmpty);
 const visibleCount=split&&!showAllFaqs?5:items.length;
 $('.faq-results').textContent=getLang()==='zh'?`找到 ${visibleCount} 个问题`:getLang()==='en'?`${visibleCount} questions found`:`${visibleCount} pertanyaan ditemukan`;
 translate($('#faq-list'));
}
$('#faq-more').addEventListener('click',()=>{
 const extra=$('#faq-extra');if(!extra)return;
 showAllFaqs=!showAllFaqs;syncFaqMore();extra.inert=!showAllFaqs;extra.setAttribute('aria-hidden',String(!showAllFaqs));
 stopFaqFollowing?.();stopFaqFollowing=null;
 const duration=animateExpansion(extra,showAllFaqs,{onFinish:()=>{stopFaqFollowing?.();stopFaqFollowing=null;}});
 if(showAllFaqs)animateSurfaceContent(extra);else stopFaqFollowing=anchorDisclosureCollapse($('#faq-more'),duration);
});
$('#faq-search').addEventListener('input',()=>content&&faqTransition(renderFaqs));
document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(item=>{const active=item===b;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});faqTransition(renderFaqs);filterPill.move();}));
// Decorative video only runs while visible, with user and system controls.
const videos=[...document.querySelectorAll('.ambient-video')];
const visibleVideos=new Set(),userPaused=new Set(),ambientControls=new Map();
for(const button of document.querySelectorAll('[data-video]')){const video=document.getElementById(button.dataset.video);mountAmbientPlayback(button,()=>!video.paused).then(control=>{if(control)ambientControls.set(button,control);updateVideoControl(video);});}
function updateVideoControl(v){const button=document.querySelector(`[data-video="${v.id}"]`);if(!button)return;const playing=!v.paused&&!v.ended;ambientControls.get(button)?.update(playing);button.setAttribute('aria-label',t(playing?'Jeda video':'Putar video'));if(!ambientControls.has(button))button.querySelector('use')?.setAttribute('href',playing?'#icon-pause':'#icon-play');}
let storyChapter=0,storyHeroVisible=true;
const productStory=mountProductStory({reduced,onChapterChange(chapter,heroVisible){storyChapter=chapter;storyHeroVisible=heroVisible;const video=$('#hero-video');syncVideo(video);}});
function syncVideo(v){
 const canPlay=visibleVideos.has(v)&&!document.querySelector('dialog[open]')&&!(v.id==='hero-video'&&!storyHeroVisible)&&!document.hidden&&!reduced.matches&&!navigator.connection?.saveData&&!userPaused.has(v);
 if(canPlay){if(!v.src){v.src=v.dataset.src;v.load();}v.play().then(()=>updateVideoControl(v)).catch(()=>updateVideoControl(v));}else v.pause();
 updateVideoControl(v);
}
const videoObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)visibleVideos.add(e.target);else visibleVideos.delete(e.target);syncVideo(e.target);}},{threshold:.15});
videos.forEach(v=>{v.addEventListener('play',()=>updateVideoControl(v));v.addEventListener('pause',()=>updateVideoControl(v));videoObserver.observe(v);v.addEventListener('error',()=>{v.pause();const b=document.querySelector(`[data-video="${v.id}"]`);if(b)b.hidden=true;});});
document.querySelectorAll('[data-video]').forEach(b=>b.addEventListener('click',()=>{const v=document.getElementById(b.dataset.video);if(userPaused.has(v))userPaused.delete(v);else userPaused.add(v);syncVideo(v);}));
document.addEventListener('visibilitychange',()=>videos.forEach(syncVideo));
reduced.addEventListener('change',()=>{videos.forEach(syncVideo);document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));if(reduced.matches){for(const dialog of document.querySelectorAll('dialog')){dialogAnimations.get(dialog)?.finish();}}});
if(!reduced.matches){document.documentElement.classList.add('motion-ready');const revealObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target);}},{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));}

let chatReturnFocus;
function setChat(open,trigger){
 chatReturnFocus=open?trigger:chatReturnFocus;
 const panel=$('#chat-panel');chatOpen=open;
 document.querySelectorAll('[data-open-chat]').forEach(b=>b.setAttribute('aria-expanded',String(open)));
 if(open){
  if(panel.hidden){panel.style.opacity='0';panel.style.scale='.94';panel.style.translate='0px 14px';}
  panel.hidden=false;panel.inert=false;animateSurface(panel,true);$('#chat-input').focus({preventScroll:true});
 }else{
  panel.inert=true;animateSurface(panel,false,()=>{if(!chatOpen)panel.hidden=true;});chatReturnFocus?.focus({preventScroll:true});
 }
}
document.querySelectorAll('[data-open-chat]').forEach(b=>b.addEventListener('click',()=>setChat(!chatOpen,b)));
$('#close-chat').addEventListener('click',()=>setChat(false));
$('#chat-panel').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setChat(false);}});
function appendBubble(message,who,original){
 const bubble=document.createElement('div');bubble.className=`chat-bubble ${who}`;
 if(who==='user')bubble.dataset.noTranslate='';
 const text=document.createElement('span');text.textContent=original||message;bubble.append(text);$('#chat-messages').append(bubble);translate(bubble.parentElement);animateSurfaceContent(bubble);$('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;return bubble;
}
async function sendChat(message){
 if(chatPending||!message.trim())return;
 message=message.trim().slice(0,1000);chatPending=true;
 appendBubble(message,'user');$('#chat-input').value='';const pending=appendBubble('Sebentar, ya…','bot');
 const send=$('.chat-form button');send.disabled=true;$('#chat-messages').setAttribute('aria-busy','true');
 try{
  let answer;
  if(document.querySelector('meta[name="frogku-static-preview"]')){
   if(!content)throw new Error('FAQ not loaded');
   answer=faqAnswer(message,content,t);
  }else{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,language:getLang(),history:chatHistory.slice(-6)}),signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw new Error('Chat unavailable');answer=await response.json();
  }
  if(typeof answer.message!=='string')throw new Error('Invalid answer');pending.remove();appendBubble(answer.message,'bot',answer.source_original);
  chatHistory.push({role:'user',content:message},{role:'assistant',content:answer.message});
 }catch{pending.remove();const error=appendBubble('Koneksi terputus. Pertanyaanmu masih tersimpan. Coba kirim lagi.','bot');error.classList.add('chat-error');error.setAttribute('role','alert');$('#chat-input').value=message;}
 finally{chatPending=false;send.disabled=false;$('#chat-messages').setAttribute('aria-busy','false');$('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;}
}
$('.chat-form').addEventListener('submit',e=>{e.preventDefault();sendChat($('#chat-input').value);});
$('.chat-suggestions').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>sendChat(b.textContent)));
window.addEventListener('frogku:language',()=>{if(content){renderFaqs();translate();}videos.forEach(syncVideo);});
async function loadContent(){
 try{const response=await fetch('assets/content.json?v=27fca7142643');if(!response.ok)throw new Error('No content');content=await response.json();renderTasks();renderFaqs();
 const activity=$('#activity-options');activity.innerHTML='<option value="">Pilih aktivitasmu</option>'+content.activities.map((name,i)=>`<option value="${i}">${name}</option>`).join('');translate(activity.parentElement);
 document.querySelectorAll('a.signup').forEach(a=>a.href=content.signup);}
 catch{for(const selector of ['#task-track','#faq-list']){$(selector).innerHTML=`<div class="load-error"><p>Konten belum bisa dimuat.</p><button class="ui-secondary">Coba lagi</button></div>`;$(selector).querySelector('button').addEventListener('click',loadContent);}translate();}
}
loadContent();

const qualificationForm=$('#qualification-form');
const qualificationTransition=contentTransition([$('.form-heading'),qualificationForm,$('.qualification-result')],$('.join-form-shell'));
function updateApplicationDraft(){
 const values=Object.fromEntries(new FormData(qualificationForm));
 const activity=content?.activities[Number(values.activity)]||'';
 const href=applicationDraft(values,{language:getLang(),activityLabel:t(activity)});
 $('#application-email').href=href;$('#coverage-email').href=href;
}
qualificationForm.addEventListener('submit',event=>{
 event.preventDefault();const data=new FormData(qualificationForm),status=$('#qualification-status');
 qualificationForm.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
 let problem='',field=null;
 if(String(data.get('full_name')||'').trim().length<2){problem='Lengkapi nama lengkapmu.';field=qualificationForm.elements.full_name;}
 else if(!/^(?:\+62|62|0)8\d{7,12}$/.test(String(data.get('phone')||'').replace(/[\s()-]/g,''))){problem='Masukkan nomor HP Indonesia yang valid.';field=qualificationForm.elements.phone;}
 else if(!qualificationForm.elements.email.validity.valid||!data.get('email')){problem='Masukkan alamat email yang valid.';field=qualificationForm.elements.email;}
 else if(!data.get('location')||!data.get('activity')){problem='Pilih domisili dan aktivitasmu.';field=!data.get('location')?qualificationForm.elements.location:qualificationForm.elements.activity;}
 else if(!data.get('eligible')){problem='Konfirmasi syarat usia, KTP, dan HP terlebih dahulu.';field=qualificationForm.elements.eligible;}
 if(problem){status.dataset.source=problem;status.textContent=t(problem);status.setAttribute('data-no-translate','');field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby','qualification-status');if(selectControls.has(field))selectControls.get(field).focus();else field.focus();return;}
 status.textContent='';delete status.dataset.source;updateApplicationDraft();
 if(!isServiceArea(String(data.get('location')))){translate($('#coverage-dialog'));openDialog($('#coverage-dialog'),qualificationForm.querySelector('[type=submit]'));return;}
 qualificationTransition(()=>{qualificationForm.hidden=true;$('.form-heading').hidden=true;$('.qualification-result').hidden=false;
 $('.qualification-result').setAttribute('tabindex','-1');$('.qualification-result').focus({preventScroll:true});});
});
$('.edit-application').addEventListener('click',()=>qualificationTransition(()=>{qualificationForm.hidden=false;$('.form-heading').hidden=false;$('.qualification-result').hidden=true;qualificationForm.elements.full_name.focus({preventScroll:true});}));

window.addEventListener('frogku:language',()=>{const status=$('#qualification-status');if(status.dataset.source)status.textContent=t(status.dataset.source);if(qualificationForm.elements.full_name.value)updateApplicationDraft();});

requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.add('scroll-ready')));
