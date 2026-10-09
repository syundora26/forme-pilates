(function(){
  var d=document, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* global menu (small screens) */
  var mb=d.getElementById('menu-btn'), nav=d.getElementById('gnav');
  if(mb&&nav){
    var setM=function(open,focus){
      nav.classList.toggle('open',open);
      mb.setAttribute('aria-expanded',open?'true':'false');
      mb.querySelector('span').textContent=open?'閉じる':'メニュー';
      if(focus)mb.focus();
    };
    mb.addEventListener('click',function(){setM(mb.getAttribute('aria-expanded')!=='true')});
    d.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&mb.getAttribute('aria-expanded')==='true')setM(false,true);
    });
  }

  /* before / after */
  var ba=d.getElementById('ba'), rg=d.getElementById('ba-range');
  if(ba&&rg){
    var setBA=function(){var v=+rg.value;ba.style.setProperty('--p',v/100);rg.setAttribute('aria-valuetext','施工前 '+v+'％ ／ 施工後 '+(100-v)+'％')};
    rg.addEventListener('input',setBA);setBA();
  }

  /* form (demo only) */
  var form=d.getElementById('form');
  if(form)form.addEventListener('submit',function(e){
    e.preventDefault();
    var m=d.getElementById('msg');m.hidden=false;m.textContent='デモサイトのため、送信はされません。';
    m.scrollIntoView({block:'nearest'});
  });

  /* light on paint */
  if(reduce)return;
  var lit=[].slice.call(d.querySelectorAll('.lit')).map(function(el){return{el:el,on:false}});
  if(!lit.length)return;
  var cx=.5,cy=.5,tx=.5,ty=.5,mouse=false,last=0,raf=0;
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){lit.forEach(function(l){if(l.el===e.target)l.on=e.isIntersecting})});kick()});
    lit.forEach(function(l){io.observe(l.el)});
  }else lit.forEach(function(l){l.on=true});
  addEventListener('pointermove',function(e){
    if(e.pointerType!=='mouse')return;
    mouse=true;last=performance.now();tx=e.clientX/innerWidth;ty=e.clientY/innerHeight;kick();
  },{passive:true});
  addEventListener('scroll',kick,{passive:true});
  function frame(t){
    raf=0;
    var any=lit.some(function(l){return l.on});
    if(!any)return;
    var idle=!mouse||t-last>4000;
    if(idle){
      var s=scrollY/innerHeight;
      tx=.5+.34*Math.sin(t*.00042+s*1.6);
      ty=.5+.3*Math.cos(t*.00031)+Math.min(.2,s*.25);
    }
    cx+=(tx-cx)*.07;cy+=(ty-cy)*.07;
    var x=cx.toFixed(4),y=Math.max(0,Math.min(1,cy)).toFixed(4);
    lit.forEach(function(l){if(l.on){l.el.style.setProperty('--lx',x);l.el.style.setProperty('--ly',y)}});
    if(idle||Math.abs(tx-cx)>.0008||Math.abs(ty-cy)>.0008)raf=requestAnimationFrame(frame);
    else setTimeout(kick,4100);
  }
  function kick(){if(!raf)raf=requestAnimationFrame(frame)}
  kick();
})();
