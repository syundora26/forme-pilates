(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- night switch (carried across pages for this visit) ---- */
  var sw=document.getElementById('nightSwitch'), stars=document.getElementById('stars'), made=false, timer;
  function makeStars(){
    if(made||!stars)return; made=true;
    var f=document.createDocumentFragment();
    for(var i=0;i<110;i++){
      var s=document.createElement('i');
      s.style.left=(Math.random()*100).toFixed(2)+'%';
      s.style.top=(Math.random()*100).toFixed(2)+'%';
      if(i%6===0)s.className='big';
      if(i%9===0){s.className+=' tw';s.style.animationDelay=(Math.random()*3).toFixed(2)+'s';}
      f.appendChild(s);
    }
    stars.appendChild(f);
  }
  function store(night){ try{ if(night)sessionStorage.setItem('fn-mode','night'); else sessionStorage.removeItem('fn-mode'); }catch(e){} }
  if(sw){
    if(root.getAttribute('data-mode')==='night'){ sw.setAttribute('aria-checked','true'); makeStars(); }
    sw.addEventListener('click',function(){
      var night=sw.getAttribute('aria-checked')!=='true';
      makeStars();
      if(!reduce){
        root.classList.add('theme-anim');
        clearTimeout(timer);
        timer=setTimeout(function(){root.classList.remove('theme-anim');},950);
      }
      sw.setAttribute('aria-checked',night?'true':'false');
      if(night)root.setAttribute('data-mode','night'); else root.removeAttribute('data-mode');
      store(night);
    });
  }

  /* ---- menu (もくじ) ---- */
  var mb=document.getElementById('menuBtn'), nav=document.getElementById('gnav');
  if(mb&&nav){
    var setMenu=function(open){
      mb.setAttribute('aria-expanded',open?'true':'false');
      nav.classList.toggle('open',open);
    };
    mb.addEventListener('click',function(){ setMenu(mb.getAttribute('aria-expanded')!=='true'); });
    document.addEventListener('keydown',function(e){
      if((e.key==='Escape'||e.key==='Esc')&&mb.getAttribute('aria-expanded')==='true'){ setMenu(false); mb.focus(); }
    });
  }

  /* ---- booking form (demo) ---- */
  var form=document.getElementById('bookForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var m=document.getElementById('bookMsg');
      m.textContent='デモサイトのため、送信はされません。';
      if(m.scrollIntoView)m.scrollIntoView({block:'nearest'});
    });
  }

  /* ---- trail ---- */
  var box=document.getElementById('trailBox');
  if(!box||!box.querySelector)return;
  var svg=document.getElementById('trailSvg'), dots=document.getElementById('trailDots'), done=document.getElementById('trailDone'),
      walker=document.getElementById('walker'), stops=[].slice.call(box.querySelectorAll('.stop')), len=0, ys=[], ticking=false;
  function build(){
    try{
      var b=box.getBoundingClientRect(), pts=stops.map(function(s){
        var r=s.querySelector('.stop-pin').getBoundingClientRect();
        return [r.left+r.width/2-b.left, r.top+r.height/2-b.top];
      });
      if(pts.length<2)return;
      var d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
      for(var i=1;i<pts.length;i++){
        var a=pts[i-1], c=pts[i], my=(a[1]+c[1])/2, same=Math.abs(a[0]-c[0])<60, w=same?(i%2?1:-1)*(b.width>600?46:16):0;
        d+=' C'+(a[0]+w).toFixed(1)+' '+my.toFixed(1)+' '+(c[0]+w).toFixed(1)+' '+my.toFixed(1)+' '+c[0].toFixed(1)+' '+c[1].toFixed(1);
      }
      svg.setAttribute('width',b.width); svg.setAttribute('height',b.height);
      dots.setAttribute('d',d); done.setAttribute('d',d);
      len=dots.getTotalLength(); ys=pts.map(function(p){return p[1];});
      root.classList.add('trail-on');
      update();
    }catch(err){ root.classList.remove('trail-on'); }
  }
  function update(){
    ticking=false;
    if(!len)return;
    var b=box.getBoundingClientRect(), vh=window.innerHeight||800;
    var first=ys[0], last=ys[ys.length-1];
    var p=reduce?0:Math.max(0,Math.min(1,(vh*0.56-(b.top+first))/(last-first)));
    var ty=first+(last-first)*p, lo=0, hi=len, pt;
    for(var k=0;k<18;k++){var mid=(lo+hi)/2; pt=dots.getPointAtLength(mid); if(pt.y<ty)lo=mid; else hi=mid;}
    var L=(lo+hi)/2; pt=dots.getPointAtLength(L);
    var rot=reduce?0:Math.sin(L/14)*9;
    walker.style.transform='translate('+pt.x.toFixed(1)+'px,'+pt.y.toFixed(1)+'px) rotate('+rot.toFixed(1)+'deg)';
    done.style.strokeDasharray=L.toFixed(1)+' '+(len+10).toFixed(1);
    for(var i=0;i<stops.length;i++){ stops[i].classList.toggle('on', ys[i]<=pt.y+2); }
  }
  function onScroll(){ if(!ticking){ticking=true; requestAnimationFrame(update);} }
  build();
  window.addEventListener('load',build);
  window.addEventListener('resize',build);
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(build);}
  if('ResizeObserver' in window){ new ResizeObserver(build).observe(box); }
  if(!reduce){ window.addEventListener('scroll',onScroll,{passive:true}); }
})();
