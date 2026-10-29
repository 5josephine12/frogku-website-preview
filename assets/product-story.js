// Cash App-inspired marketing sequence, on the native document scroller.
// Desktop transports a rounded window over stationary app content.
// Mobile chapters use their own centered, viewport-aware composition.
export function mountProductStory({reduced,onChapterChange}){
 const root=document.querySelector('.product-story'),viewport=root.querySelector('.story-viewport');
 const chapters=[...root.querySelectorAll('.story-chapter')];
 const dock=document.querySelector('.mobile-apply'),launcher=document.querySelector('.chat-launcher'),header=document.querySelector('#header');
 const aperture=root.querySelector('.story-aperture'),footer=document.querySelector('.footer');
 let frame=0,geometry,chapter=-1,lastDock,lastHeroVisible;
 function measure(){
  const w=innerWidth,h=innerHeight,natural=w<1000||reduced.matches||h<650;
  root.classList.toggle('static-story',natural);
  root.querySelectorAll('.device-visual').forEach(el=>el.style.setProperty('--device-scale',String(el.getBoundingClientRect().width/400)));
  geometry={top:root.getBoundingClientRect().top+scrollY,h,natural,storyBottom:root.getBoundingClientRect().bottom+scrollY,chapterTops:chapters.map(el=>el.getBoundingClientRect().top+scrollY),deviceHeight:root.querySelector('.device-visual').getBoundingClientRect().height,deviceWidth:root.querySelector('.device-visual').getBoundingClientRect().width,w,headerHeight:header.clientHeight,surfaces:[...document.querySelectorAll('.tasks-section,.download-section,.footer')].map(el=>({top:el.getBoundingClientRect().top+scrollY,tone:el.matches('.download-section')?'green':'dark'}))};
  geometry.footerTop=footer.getBoundingClientRect().top+scrollY;
  schedule();
 }
 function paint(){
  frame=0;if(!geometry)return;
  const {top,h,natural}=geometry,rawP=Math.max(0,(scrollY-top)/h),p=Math.min(2,rawP);
  // Both clipping rectangles share the same center and size. The inner window
  // follows native scrolling while its app content counter-translates. This
  // reproduces the moving aperture without an external SVG mask dependency.
  const next=natural?chapters.reduce((n,el,i)=>el.getBoundingClientRect().top<h*.5?i:n,0):Math.round(p);
  chapters.forEach((el,i)=>{
   const offset=(i-p)*h,windowOffset=(i-rawP)*h;
   el.style.opacity='1';
   const visible=natural||Math.abs(windowOffset)<geometry.deviceHeight;
   el.querySelector('.device-visual').style.visibility=visible?'visible':'hidden';
   el.style.transform=natural?'none':`translateY(${offset.toFixed(3)}px)`;
   el.style.setProperty('--phone-counter-y',natural?'0px':`${(-windowOffset).toFixed(3)}px`);
   el.style.setProperty('--screen-window-y',natural?'0px':`${windowOffset.toFixed(3)}px`);
   el.inert=!natural&&i!==next;
   el.setAttribute('aria-hidden',String(!natural&&i!==next));
  });
  // Cash App’s opening green field contracts into a rounded phone aperture.
  // Its product chapters then use direct 1:1 window travel, including reverse.
  const intro=Math.min(1,rawP),contract=intro;
  const startWidth=Math.max(geometry.w*2,geometry.h*1.2),width=startWidth+(geometry.deviceWidth-startWidth)*contract;
  const height=width*866/400;
  aperture.style.setProperty('--aperture-x',`${((geometry.w-width)/2).toFixed(3)}px`);
  aperture.style.setProperty('--aperture-y',`${((h-height)/2).toFixed(3)}px`);
  aperture.style.setProperty('--aperture-radius',`${(width*44/336).toFixed(3)}px`);
  // At the end the aperture is exactly covered by the incoming phone.
  aperture.style.opacity=natural||intro>=1?'0':'1';
  root.style.setProperty('--hero-opacity',String(natural?1:Math.max(0,1-intro*2)));
  root.style.setProperty('--intro-counter-y',natural?'0px':`${Math.min(rawP,.5)*h}px`);
  const heroVisible=natural||rawP<.5;
  if(chapter!==next||lastHeroVisible!==heroVisible){chapter=next;lastHeroVisible=heroVisible;onChapterChange?.(chapter,heroVisible);}
  header.classList.toggle('scrolled',scrollY>60);
  document.documentElement.classList.toggle('footer-scroll',scrollY+geometry.headerHeight>=geometry.footerTop-1);
  // Match the existing dark header treatment to every dark page section.
  const surfaceAt=y=>{
   const storyTone=natural?geometry.chapterTops.reduce((tone,chapterTop,i)=>y>=chapterTop?['green','paper','mint'][i]:tone,'green'):['green','paper','mint'][Math.min(2,Math.max(0,Math.floor((y-top)/h)))];
   return geometry.surfaces.reduce((tone,section)=>y>=section.top?section.tone:tone,storyTone);
  };
  const headerSurface=surfaceAt(scrollY+geometry.headerHeight);
  header.classList.toggle('dark-section',headerSurface==='dark');
  if(header.dataset.surface!==headerSurface)header.dataset.surface=headerSurface;
  // The header owns signup during the phone story. The bottom dock begins at
  // the task gallery, so it cannot cover a chapter's copy or illustration.
  const showDock=scrollY+geometry.headerHeight>=geometry.storyBottom;
  const dockEdge=scrollY+h-dock.clientHeight;
  const surface=surfaceAt(dockEdge);
  if(dock.dataset.surface!==surface)dock.dataset.surface=surface;
  if(showDock!==lastDock){lastDock=showDock;dock.classList.toggle('visible',showDock);dock.inert=!showDock;dock.setAttribute('aria-hidden',String(!showDock));launcher.classList.toggle('dock-visible',showDock);launcher.inert=false;launcher.removeAttribute('aria-hidden');}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{lastDock=undefined;measure();});
 addEventListener('frogku:language',()=>requestAnimationFrame(measure));reduced.addEventListener('change',measure);
 const resize=new ResizeObserver(measure);document.querySelectorAll('.device-visual,.chapter-title,.chapter-copy,.tasks-section,.download-section,.faq-section,.footer').forEach(el=>resize.observe(el));
 document.fonts.ready.then(measure);measure();
 function goTo(id){
  const index=id==='#earn'?1:['#how','#requirements'].includes(id)?2:id==='#top'?0:-1;
  if(index<0)return false;
  const target=geometry.natural?chapters[index].getBoundingClientRect().top+scrollY:geometry.top+geometry.h*index;
  scrollTo({top:Math.max(0,target),behavior:reduced.matches?'instant':'smooth'});return true;
 }
 return{goTo,goToEarnings(){goTo('#earn');},get chapter(){return chapter;}};
}
