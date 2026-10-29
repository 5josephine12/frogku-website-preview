import {mountSloshSlider} from '../native-controls.js?v=20261028-shared-v184';
// Keep the existing media input as the value/event bridge; render the shared slider.
export function mountPlaybackSeek(input,options={}){
 const host=document.createElement('div');host.className='ply slo playback-slider';host.style.setProperty('--slo-r','20px');
 host.innerHTML='<div class="slo-track" role="slider" aria-valuemin="0" aria-valuemax="100"><div class="slo-rail playback-rail"><div class="slo-fill"></div><div class="slo-knob"></div></div></div>';
 input.before(host);input.hidden=true;input.tabIndex=-1;input.setAttribute('aria-hidden','true');
 const track=host.firstElementChild;track.setAttribute('aria-label',input.getAttribute('aria-label')||'Episode playhead');
 const slider=mountSloshSlider(track,track.querySelector('.slo-fill'),track.querySelector('.slo-knob'),{getOptions:options.getOptions,value:Number(input.value),handleInset:'calc(var(--playback-rail-height) / 2)',step:Number(input.step)||.05,disabled:input.disabled,onChange(value){input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},onRelease(){sync();}});
 function sync({immediate=false}={}){slider.setDisabled(input.disabled);track.setAttribute('aria-valuetext',input.getAttribute('aria-valuetext')||input.value+'%');slider.setValue(Number(input.value),{immediate});}
 sync({immediate:true});return {sync,destroy(){slider.destroy();host.remove();input.hidden=false;input.removeAttribute('tabindex');input.removeAttribute('aria-hidden');}};
}
