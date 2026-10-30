// Adapter around the gallery's actual PlaybackButton and PlaybackProgress owners.
const runtime=import('./vendor/media/native-controls.js?v=27fca7142643');
const seekModule=()=>import('./vendor/media/modules/playback-seek.js?v=27fca7142643');
export async function mountAmbientPlayback(button,playing){
 const {mountPlaybackButton}=await runtime;if(!button.isConnected)return null;
 button.dataset.iconOnly='';
 const control=mountPlaybackButton(button,{playLabel:'',pauseLabel:''});control.update(playing());return control;
}
export async function mountTaskPlayback(root,{t}){
 const video=root.querySelector('video'),button=root.querySelector('.task-video-play'),input=root.querySelector('.task-video-seek'),time=root.querySelector('.slo-time'),status=root.querySelector('.task-video-status');
 const [{mountPlaybackButton},{mountPlaybackSeek}]=await Promise.all([runtime,seekModule()]);
 if(!root.isConnected)return()=>{};
 const playback=mountPlaybackButton(button,{playLabel:'',pauseLabel:'',playAriaLabel:t('Putar video'),pauseAriaLabel:t('Jeda video')});
 const seek=mountPlaybackSeek(input,{getOptions:()=>({viscosity:12,momentum:0,tilt:12})});
 const format=value=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(Math.floor(value%60)).padStart(2,'0')}`;
 const sync=()=>{
  const ready=Number.isFinite(video.duration)&&video.duration>0;input.disabled=!ready;button.disabled=!!video.error;
  input.value=ready?String(video.currentTime/video.duration*100):'0';input.setAttribute('aria-valuetext',`${format(video.currentTime||0)} / ${ready?format(video.duration):'--:--'}`);
  time.textContent=input.getAttribute('aria-valuetext');seek.sync({immediate:!video.paused});playback.update(!video.paused&&!video.ended);
 };
 const error=()=>{status.hidden=false;status.querySelector('p').textContent=t('Video belum bisa diputar. Coba lagi.');sync();};
 const play=()=>{if(video.paused)video.play().catch(error);else video.pause();};
 const retry=()=>{status.hidden=true;video.load();button.disabled=false;video.play().catch(error);};
 const seekTo=()=>{if(Number.isFinite(video.duration))video.currentTime=video.duration*Number(input.value)/100;};
 button.addEventListener('click',play);input.addEventListener('input',seekTo);status.querySelector('button').addEventListener('click',retry);
 const events=['loadedmetadata','timeupdate','play','pause','ended','durationchange'];events.forEach(e=>video.addEventListener(e,sync));video.addEventListener('error',error);sync();if(video.error)error();
 return()=>{video.pause();events.forEach(e=>video.removeEventListener(e,sync));video.removeEventListener('error',error);button.removeEventListener('click',play);input.removeEventListener('input',seekTo);playback.destroy();seek.destroy();};
}
