// Existing production-only first-party funnel events. Local previews send nothing.
let lang=document.documentElement.lang==='zh-CN'?'zh':document.documentElement.lang;window.addEventListener('frogku:language',()=>{lang=document.documentElement.lang==='zh-CN'?'zh':document.documentElement.lang;});
const plat=/android/i.test(navigator.userAgent)?'android':/iphone|ipad|ipod/i.test(navigator.userAgent)?'ios':null;
if(/^(www\.)?frogku\.com$/.test(location.hostname)){
  const LP='https://api.frogku.com/api/lp',hex=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>b.toString(16).padStart(2,'0')).join('');
  let sid,vid='';try{sid=sessionStorage.getItem('frog-sid')||'';if(!/^[0-9a-f]{16}$/.test(sid)){sid=hex(8);sessionStorage.setItem('frog-sid',sid)}}catch(e){sid=hex(8)}
  try{const v=JSON.parse(localStorage.getItem('frog-vid')||'null');if(v&&v.e>Date.now()&&/^[0-9a-f]{12}$/.test(v.v))vid=v.v;else{vid=hex(6);localStorage.setItem('frog-vid',JSON.stringify({v:vid,e:Date.now()+180*864e5}))}}catch(e){}
  const q=new URLSearchParams(location.search),u={};['source','medium','campaign','term','content'].forEach(k=>{const v=q.get('utm_'+k);if(v)u[k]=v.slice(0,64)});
  const cid=(q.get('fbclid')||q.get('ttclid')||'').slice(0,128),cs=q.get('fbclid')?'fb':q.get('ttclid')?'tt':'';
  let ref='';try{ref=new URL(document.referrer).host}catch(e){}
  const send=(e,x)=>{const body=JSON.stringify(Object.assign({e,sid,vid,p:plat||'',l:document.documentElement.lang.replace('zh-CN','zh'),u,cid,cs,r:ref,w:screen.width},x||{}));
    try{if(navigator.sendBeacon&&navigator.sendBeacon(LP,new Blob([body],{type:'text/plain'})))return}catch(e){}
    try{fetch(LP,{method:'POST',body,keepalive:true,headers:{'Content-Type':'text/plain'}}).catch(()=>{})}catch(e){}};
  send('lp_view',{t:Math.round(performance.now())});
  document.querySelectorAll('[data-plat-link]').forEach(a=>a.addEventListener('click',()=>send('cta_click',{target:a.dataset.platLink})));
  document.querySelectorAll('[data-plat="android"] a[href*="/download/"]').forEach(a=>a.addEventListener('click',()=>{
    const h=a.getAttribute('href');send('download_click',{target:'android',apk:h.split('/').pop().split('?')[0]});
    // 把会话 sid 带上，/download/ 跳转时服务端再记一条（真下载数）；只改这次点击的地址，HTML 里的 href 不动（release.sh 靠它换版本号）
    if(h.indexOf('?')<0)a.href=h+'?s='+sid}));
  document.querySelectorAll('[data-plat="ios"] a[href*="testflight.apple.com/join"]').forEach(a=>a.addEventListener('click',()=>send('download_click',{target:'ios'})));
  // Track the support action without recording application details.
  document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(a&&/^mailto:adminfrogku@gmail\.com(?:\?|$)/i.test(a.getAttribute('href')))send('cta_click',{target:'email'})});
}
