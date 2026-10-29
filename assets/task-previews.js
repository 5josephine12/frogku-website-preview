// Every visible preview autoplays. Keep mounted media and pause hidden or
// modal-obscured sources; hover is a visual treatment, never a playback gate.
export function mountTaskPreviews(track,{reduced}){
 const records=[...track.querySelectorAll('.sample-card')].map(button=>({video:button.querySelector('video'),visible:false,wanted:false,pending:false,revision:0}));
 const removals=[];let disposed=false;
 const listen=(target,name,handler,options)=>{target.addEventListener(name,handler,options);removals.push(()=>target.removeEventListener(name,handler,options));};
 function sync(record){
  if(disposed)return;
  const {video}=record;
  const wanted=record.visible&&!document.hidden&&!reduced.matches&&!navigator.connection?.saveData&&!document.querySelector('dialog[open]');
  if(wanted!==record.wanted){record.wanted=wanted;record.revision++;}
  if(!wanted){video.pause();return;}
  if(!video.getAttribute('src')){video.src=video.dataset.src;video.load();}
  if(!video.paused||record.pending)return;
  record.pending=true;const revision=record.revision;
  video.play().then(()=>{if(disposed||!record.wanted)video.pause();}).catch(()=>{}).finally(()=>{
   record.pending=false;
   if(!disposed&&record.wanted&&record.revision!==revision)sync(record);
  });
 }
 const syncAll=()=>records.forEach(sync);
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){const record=records.find(item=>item.video===entry.target);if(record){record.visible=entry.isIntersecting&&entry.intersectionRatio>=.35;sync(record);}}},{threshold:[0,.35]});
 for(const record of records){
  const {video}=record;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=true;
  observer.observe(video);
 }
 listen(reduced,'change',syncAll);listen(document,'visibilitychange',syncAll);
 if(navigator.connection)listen(navigator.connection,'change',syncAll);
 listen(window,'pagehide',()=>records.forEach(({video})=>video.pause()));listen(window,'pageshow',syncAll);
 return{sync:syncAll,destroy(){disposed=true;observer.disconnect();removals.forEach(remove=>remove());records.forEach(({video})=>{video.pause();video.removeAttribute('src');video.load();});}};
}
