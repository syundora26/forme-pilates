/* CLEARLINE AUTO CARE — motion layer 「映り込み」 (vanilla, no dependencies) */
(function(){
'use strict';
var d=document,H=d.documentElement,W=window;
W.__mo=1;
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
var MO=!RM&&H.classList.contains('mo')&&'IntersectionObserver' in W&&!!W.requestAnimationFrame;
if(!MO)H.classList.remove('mo','mo-enter');
var FINE=matchMedia('(hover:hover) and (pointer:fine)').matches;
var SMALL=Math.min(innerWidth,screen.width||innerWidth)<700;
var T0=H.classList.contains('mo-enter')?.3:0;
var raf=W.requestAnimationFrame?W.requestAnimationFrame.bind(W):function(f){return setTimeout(function(){f(Date.now())},16)};

function $(s,c){return (c||d).querySelector(s)}
function $$(s,c){return [].slice.call((c||d).querySelectorAll(s))}
function E(t,c){var e=d.createElement(t);if(c)e.className=c;return e}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function seed(s){return function(){s=(s*16807)%2147483647;return (s-1)/2147483646}}
function fail(e){
  H.classList.remove('mo','mo-enter');
  $$('[data-mo]').forEach(function(n){n.classList.add('in')});
  if(W.console&&console.error)console.error('motion: '+(e&&e.message?e.message:e));
}
function safe(fn){try{fn()}catch(e){fail(e)}}

/* one rAF for everything that follows the scroll position */
var ticks=[],tq=0;
function tick(){tq=0;for(var i=0;i<ticks.length;i++)ticks[i]()}
function reqTick(){if(!tq)tq=raf(tick)}
addEventListener('scroll',reqTick,{passive:true});
var lastW=innerWidth,resizers=[];
addEventListener('resize',function(){if(innerWidth===lastW)return;lastW=innerWidth;resizers.forEach(function(f){safe(f)});reqTick()});

/* =====================================================================
   page transition : squeegee pass
   ===================================================================== */
if(MO)safe(function(){
  setTimeout(function(){H.classList.remove('mo-enter')},1100);
  d.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
    if(!a||a.target||a.hasAttribute('download'))return;
    var raw=a.getAttribute('href');
    if(!raw||/^(#|tel:|mailto:|https?:|\/\/)/i.test(raw))return;
    var u;try{u=new URL(a.href)}catch(x){return}
    if(!/\.html$/.test(u.pathname)||(u.pathname===location.pathname&&u.search===location.search))return;
    e.preventDefault();
    var gone=false,go=function(){if(gone)return;gone=true;location.href=a.href};
    try{
      var w=E('div','mo-wipe');w.setAttribute('aria-hidden','true');d.body.appendChild(w);
      try{sessionStorage.setItem('clw','1')}catch(x){}
      w.getBoundingClientRect();w.classList.add('go');
      setTimeout(go,330);
    }catch(x){go()}
  });
  addEventListener('pageshow',function(e){if(e.persisted){$$('.mo-wipe').forEach(function(n){n.parentNode.removeChild(n)});H.classList.remove('mo-enter')}});
});

/* =====================================================================
   headline : split into lines / characters, sweep a highlight through
   (the original markup is put back when the sweep has finished)
   ===================================================================== */
function splitHead(h,delay){
  if(h._sp)return;h._sp=1;
  var done=function(){h.classList.remove('mo-split');h.classList.add('mo-done')};
  if(h.querySelector(':not(br)')){done();return}
  var orig=h.innerHTML,label=h.textContent.replace(/\s+/g,' ').trim();
  var lines=[],cur=null,top=null,rg=d.createRange(),tw=d.createTreeWalker(h,NodeFilter.SHOW_TEXT,null),n;
  while((n=tw.nextNode())){
    var s=n.nodeValue;
    for(var i=0;i<s.length;i++){
      var ch=s.charAt(i);if(ch==='\n'||ch==='\r'||ch==='\t')continue;
      rg.setStart(n,i);rg.setEnd(n,i+1);
      var r=rg.getClientRects()[0];if(!r||!r.height)continue;
      if(top===null||Math.abs(r.top-top)>r.height*.5){cur=[];lines.push(cur);top=r.top}
      cur.push(ch===' '?' ':ch);
    }
  }
  if(!lines.length){done();return}
  var frag=d.createDocumentFragment(),dur=.95,gap=.14;
  lines.forEach(function(chars,j){
    var ln=E('span','mo-ln'),mid=(chars.length-1)/2;
    ln.setAttribute('aria-hidden','true');
    ln.style.setProperty('--d',(delay+j*gap).toFixed(2)+'s');
    ['mo-bs','mo-sh'].forEach(function(c){
      var b=E('span',c);
      chars.forEach(function(ch,k){var cs=E('span','mo-c');cs.textContent=ch;cs.style.setProperty('--o',(k-mid).toFixed(1));b.appendChild(cs)});
      ln.appendChild(b);
    });
    frag.appendChild(ln);
  });
  var had=h.getAttribute('aria-label');
  h.setAttribute('aria-label',label);
  h.innerHTML='';h.appendChild(frag);h.classList.add('mo-split');
  var back=function(){
    if(!h._sp||h._sp===2)return;h._sp=2;
    h.innerHTML=orig;if(had===null)h.removeAttribute('aria-label');else h.setAttribute('aria-label',had);done();
  };
  setTimeout(back,(delay+(lines.length-1)*gap+dur+.3)*1000+60);
  resizers.push(back);
}

/* =====================================================================
   odometer : digits roll into place, original text is restored afterwards
   ===================================================================== */
function roll(el,delay){
  if(!MO||el._rl||el.querySelector('.mo-rollw'))return;
  var tw=d.createTreeWalker(el,NodeFilter.SHOW_TEXT,null),ns=[],n;
  while((n=tw.nextNode()))if(/\d/.test(n.nodeValue))ns.push(n);
  if(!ns.length)return;
  el._rl=1;var k=0,made=[];
  ns.forEach(function(node){
    var txt=node.nodeValue,w=E('span','mo-rollw'),sr=E('span','mo-sr'),v=E('span');
    sr.textContent=txt;v.setAttribute('aria-hidden','true');
    txt.split('').forEach(function(ch){
      if(!/\d/.test(ch)){v.appendChild(d.createTextNode(ch));return}
      var dg=E('span','mo-d'),g=E('i','mo-g'),s=E('i','mo-s');
      g.textContent=ch;
      for(var j=0;j<10;j++){var b=E('span','mo-n');b.textContent=String((+ch+1+j)%10);s.appendChild(b)}
      s.style.setProperty('--d',(delay+k*.06).toFixed(2)+'s');
      s.style.setProperty('--rd',(.8+Math.min(k,5)*.08).toFixed(2)+'s');k++;
      dg.appendChild(g);dg.appendChild(s);v.appendChild(dg);
    });
    w.appendChild(sr);w.appendChild(v);
    node.parentNode.replaceChild(w,node);made.push([w,txt]);
  });
  setTimeout(function(){
    made.forEach(function(m){if(m[0].parentNode)m[0].parentNode.replaceChild(d.createTextNode(m[1]),m[0])});
    el._rl=0;
  },(delay+k*.06+1.3)*1000);
}

/* =====================================================================
   scroll entrances
   ===================================================================== */
var reveal=function(){};
if(MO)safe(function(){
  /* photos get a wrapper that carries the sweep, the tilt and the glare */
  $$('main img').forEach(function(img){
    var w=E('span','mo-ph');img.parentNode.insertBefore(w,img);w.appendChild(img);w.setAttribute('data-mo','polish');
  });
  var TAG=[
    ['.shead .num,.cta .num','num'],
    ['.shead h2,.cta h2,.seq h2','hl'],
    ['.h3,.care h3','h3'],
    ['.shead p,.prose > p,.small,.tnote,.sub,.cta .wrap > p:not(.num):not(.tel),.ba-cap,figcaption,.quote,.scroll-hint,.foot dl,.foot .demo,.foot .copy,.fnav,.foot .mark,.care-ill li,.sizer-len,.hint','focus'],
    ['.more,.btn,.tel,.when,.mini-btn,.ld-ctl','rise'],
    ['.teaser,.spec3 > div,.anchors a,.mini li,.fgroup,.ba-keys > div,.sizer-out','card'],
    ['.limits,.sizer','frame'],
    ['.rows > li,.care li','drop'],
    ['.news li,.kv > div,.faq details','line'],
    ['.tbl-wrap','scan'],
    ['.field .paint,.ba,.mapbox,.ld-box,.sizer-stage','open']
  ];
  var all=[];
  TAG.forEach(function(t){
    $$(t[0]).forEach(function(el){
      if(el.hasAttribute('data-mo')||el.closest('.hero,.phead,.head,.crumb,.faq .a,.sizer fieldset'))return;
      el.setAttribute('data-mo',t[1]);all.push(el);
    });
  });
  $$('.mo-ph').forEach(function(el){all.push(el)});
  $$('.tbl-wrap').forEach(function(w){
    var rows=$$('tr',w);rows.forEach(function(tr,i){tr.style.setProperty('--r',i)});
    w.style.setProperty('--sd',(.5+rows.length*.095).toFixed(2)+'s');
  });
  /* numbers that roll when they arrive */
  var rolls=$$('.tbl.price td,.tnum,.teaser .t b,.tel a,.news time,.spec3 dd strong').filter(function(el){return !el.closest('.faq .a,.sizer,.head')});

  reveal=function(el,dl){
    if(el.classList.contains('in'))return;
    el.style.setProperty('--d',dl.toFixed(2)+'s');el.classList.add('in');
    var t=el.getAttribute('data-mo');
    if(t==='hl')splitHead(el,dl);
    if(t==='num')roll(el,dl+.1);
    /* anything tagged inside a revealed block comes with it (an ancestor's clip must never strand it) */
    $$('[data-mo]:not(.in)',el).forEach(function(c,i){reveal(c,dl+.18+Math.min(i,8)*.07)});
  };
  var io=new IntersectionObserver(function(es){
    var early=performance.now()<1300,k=0;
    es=es.filter(function(en){return en.isIntersecting});
    es.sort(function(a,b){return (a.boundingClientRect.top-b.boundingClientRect.top)||(a.boundingClientRect.left-b.boundingClientRect.left)});
    es.forEach(function(en){
      var el=en.target;io.unobserve(el);
      if(el.hasAttribute('data-mo')){reveal(el,(early?.5+T0:0)+Math.min(k,8)*.07);k++}
      else roll(el,(early?.7+T0:.15));
    });
  },{rootMargin:'0px 0px -5% 0px',threshold:.01});
  all.forEach(function(el){io.observe(el)});
  rolls.forEach(function(el){io.observe(el)});
  var sweepIn=function(){
    $$('[data-mo]:not(.in)').forEach(function(el){var r=el.getBoundingClientRect();if(r.width&&r.top<innerHeight&&r.bottom>0)reveal(el,0)});
  };
  setTimeout(function(){safe(sweepIn)},2500);
  ticks.push(function(){if(scrollY+innerHeight>=H.scrollHeight-6)sweepIn()});
  /* whatever has been scrolled past without the observer seeing it (very fast scrolling, jumps) must not stay hidden */
  var pt=0,passed=function(){
    pt=0;var vh=innerHeight;
    $$('[data-mo]:not(.in)').forEach(function(el){var r=el.getBoundingClientRect();if(r.width&&r.top<vh*.95)reveal(el,0)});
  };
  addEventListener('scroll',function(){if(!pt)pt=setTimeout(function(){safe(passed)},160)},{passive:true});

  /* h1 : part of the page intro */
  var h1=$('h1');
  if(h1){h1.getBoundingClientRect();splitHead(h1,T0+.3)}

  /* things that loop only while on screen */
  var vis=new IntersectionObserver(function(es){es.forEach(function(en){en.target.classList.toggle('mo-vis',en.isIntersecting)})},{threshold:.15});
  $$('.btn,[data-loop],.hero .panel').forEach(function(el){vis.observe(el)});
});
addEventListener('error',function(){if(H.classList.contains('mo'))fail('script error')});

/* =====================================================================
   ambient : drifting showroom light, water beads, paint-flake sparkle,
   scroll progress line
   ===================================================================== */
if(MO)safe(function(){
  var light=E('div','mo-light'),li=E('i'),cv=E('canvas','mo-water'),prog=E('div','mo-prog');
  [light,cv,prog].forEach(function(n){n.setAttribute('aria-hidden','true')});
  light.appendChild(li);d.body.appendChild(light);d.body.appendChild(cv);d.body.appendChild(prog);
  var ctx=cv.getContext('2d');if(!ctx)return;
  var dpr=Math.min(2,W.devicePixelRatio||1),vw=0,vh=0;
  var lx=innerWidth*.5,ly=innerHeight*.3,tx=lx,ty=ly,mouse=false,mt=0,rq=0,lastY=scrollY,lastT=0,hidden=false,force=true;
  var N=SMALL?9:24,beads=[],lights=$$('.light'),R=SMALL?170:290,cell=SMALL?66:84;
  function size(){vw=innerWidth;vh=innerHeight;cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);force=true}
  function spawn(b,wait){
    b.r=SMALL?2.5+Math.random()*4.5:3+Math.pow(Math.random(),1.7)*9;
    var edge=!SMALL&&Math.random()<.72;
    b.x=(edge?(Math.random()<.5?Math.random()*.15:1-Math.random()*.15):Math.random())*vw;
    b.y=(.04+Math.random()*.8)*vh;b.g=0;b.w=wait;b.vy=0;b.tr=[];b.s=Math.random()*6.28;
  }
  size();
  for(var i=0;i<N;i++){var b={};spawn(b,1300+i*240);beads.push(b)}
  function drawBead(x,y,r){
    ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fillStyle='rgba(150,195,240,.07)';ctx.fill();
    ctx.lineWidth=1;ctx.strokeStyle='rgba(205,228,250,.24)';ctx.stroke();
    ctx.beginPath();ctx.arc(x,y,Math.max(.5,r-1),.3,2.05);ctx.strokeStyle='rgba(126,212,240,.5)';ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();ctx.ellipse(x-r*.36,y-r*.4,Math.max(.7,r*.2),Math.max(.5,r*.13),-.6,0,6.2832);ctx.fillStyle='rgba(255,255,255,.8)';ctx.fill();
  }
  function frame(now){
    rq=0;if(hidden)return;
    var dt=lastT?Math.min(3,(now-lastT)/16.7):1;lastT=now;
    var sy=scrollY,dy=sy-lastY;lastY=sy;
    var sh=Math.max(1,H.scrollHeight-vh),p=clamp(sy/sh,0,1);
    if(mouse&&now-mt>6000)mouse=false;
    if(!mouse){tx=vw*(.5+.34*Math.sin(p*9.4+.6));ty=vh*(.3+.14*Math.cos(p*7))}
    var mv=Math.abs(tx-lx)+Math.abs(ty-ly)>.6;
    lx+=(tx-lx)*Math.min(1,.09*dt);ly+=(ty-ly)*Math.min(1,.09*dt);
    li.style.transform='translate3d('+lx.toFixed(1)+'px,'+ly.toFixed(1)+'px,0) rotate(-12deg)';
    prog.style.transform='scaleX('+p.toFixed(4)+')';
    var active=false,j,k,a,c;
    for(j=0;j<N;j++){
      a=beads[j];
      if(a.w>0){a.w-=dt*16.7;active=true;continue}
      if(a.g<1){a.g=Math.min(1,a.g+.035*dt);active=true}
      if(dy&&(a.r>4.2||Math.abs(dy)>40))a.vy=Math.min(9,a.vy+Math.abs(dy)*.012*(a.r/6));
      if(a.vy>.05){
        a.tr.push(a.x,a.y);if(a.tr.length>26)a.tr.splice(0,2);
        a.y+=a.vy*dt;a.x+=Math.sin(a.y*.045+a.s)*a.vy*.2*dt;a.vy*=Math.pow(.955,dt);active=true;
        if(a.y-a.r>vh)spawn(a,500+Math.random()*2600);
      }else{a.vy=0;if(a.tr.length){a.tr.splice(0,2);active=true}}
    }
    for(j=0;j<N;j++){a=beads[j];if(a.w>0||a.g<.5)continue;
      for(k=j+1;k<N;k++){c=beads[k];if(c.w>0||c.g<.5)continue;
        var ex=a.x-c.x,ey=a.y-c.y,rr=a.r+c.r;
        if(ex*ex+ey*ey<rr*rr){var big=a.r>=c.r?a:c,sm=big===a?c:a;big.r=Math.min(15,Math.sqrt(big.r*big.r+sm.r*sm.r));big.vy+=.9;spawn(sm,900+Math.random()*2400);active=true}
      }
    }
    if(active||mv||dy||force){
      force=false;
      ctx.clearRect(0,0,vw,vh);
      /* paint flakes glint where the light passes */
      var gx0=Math.floor((lx-R)/cell),gx1=Math.floor((lx+R)/cell),gy0=Math.floor((ly+sy-R)/cell),gy1=Math.floor((ly+sy+R)/cell),gx,gy;
      ctx.fillStyle='#eaf6ff';
      for(gx=gx0;gx<=gx1;gx++)for(gy=gy0;gy<=gy1;gy++){
        var h1=Math.sin(gx*127.1+gy*311.7)*43758.5453;h1-=Math.floor(h1);
        if(h1<.4)continue;
        var h2=Math.sin(gx*269.5+gy*183.3)*43758.5453;h2-=Math.floor(h2);
        var px=(gx+h2)*cell,py=(gy+h1)*cell-sy,dd=Math.sqrt((px-lx)*(px-lx)+(py-ly)*(py-ly));
        if(dd>R)continue;
        var twk=Math.sin(h2*40+lx*.021+ly*.017+sy*.012);if(twk<=0)continue;
        var al=(1-dd/R)*Math.pow(twk,4);if(al<.05)continue;
        var len=1.2+3.6*al*h2;
        ctx.globalAlpha=Math.min(.9,al);
        ctx.fillRect(px-.5,py-len,1,len*2);ctx.fillRect(px-len,py-.5,len*2,1);
      }
      ctx.globalAlpha=1;
      for(j=0;j<N;j++){
        a=beads[j];if(a.w>0)continue;
        if(a.tr.length>3){
          ctx.beginPath();ctx.moveTo(a.tr[0],a.tr[1]);for(k=2;k<a.tr.length;k+=2)ctx.lineTo(a.tr[k],a.tr[k+1]);ctx.lineTo(a.x,a.y);
          ctx.strokeStyle='rgba(170,210,245,.13)';ctx.lineWidth=Math.max(1,a.r*.55);ctx.lineCap='round';ctx.stroke();
        }
        drawBead(a.x,a.y,a.r*(1-(1-a.g)*(1-a.g)));
      }
      /* keep the light sections dry */
      for(j=0;j<lights.length;j++){var lr=lights[j].getBoundingClientRect();if(lr.bottom>0&&lr.top<vh)ctx.clearRect(0,lr.top,vw,lr.height)}
    }
    if(active||mv)kick();else lastT=0;
  }
  function kick(){if(!rq&&!hidden)rq=raf(frame)}
  addEventListener('scroll',kick,{passive:true});
  addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;mouse=true;mt=performance.now();tx=e.clientX;ty=e.clientY;kick()},{passive:true});
  addEventListener('resize',function(){size();kick()});
  d.addEventListener('visibilitychange',function(){hidden=d.hidden;if(!hidden){lastT=0;kick()}});
  kick();
});

/* =====================================================================
   interaction feedback
   ===================================================================== */
if(MO)safe(function(){
  /* liquid-metal sheen follows the pointer, press ripples like water */
  d.addEventListener('pointermove',function(e){
    var t=e.target&&e.target.closest?e.target.closest('.btn,.nbtn,.teaser,.limits'):null;if(!t)return;
    var r=t.getBoundingClientRect(),x=((e.clientX-r.left)/r.width*100).toFixed(1)+'%',y=((e.clientY-r.top)/r.height*100).toFixed(1)+'%';
    if(t.classList.contains('teaser')||t.classList.contains('limits')){t.style.setProperty('--cx',x);t.style.setProperty('--cy',y)}
    else{t.style.setProperty('--bx',x);t.style.setProperty('--by',y)}
  },{passive:true});
  d.addEventListener('pointerdown',function(e){
    var t=e.target&&e.target.closest?e.target.closest('.btn,.nbtn,.mini-btn'):null;if(!t)return;
    var r=t.getBoundingClientRect();
    for(var i=0;i<2;i++){
      var s=E('span','mo-rip'+(i?' r2':''));s.setAttribute('aria-hidden','true');
      s.style.setProperty('--x',(e.clientX-r.left)+'px');s.style.setProperty('--y',(e.clientY-r.top)+'px');
      t.appendChild(s);
      (function(s){setTimeout(function(){if(s.parentNode)s.parentNode.removeChild(s)},950)})(s);
    }
  },{passive:true});

  /* photos : 3D tilt with a moving glare (pointer), scroll-driven on touch */
  var phs=$$('.mo-ph');
  if(FINE){
    phs.forEach(function(p){
      p.addEventListener('pointermove',function(e){
        var r=p.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
        p.style.setProperty('--ry',((x-.5)*9).toFixed(2)+'deg');p.style.setProperty('--rx',((.5-y)*7).toFixed(2)+'deg');
        p.style.setProperty('--gx',(x*100).toFixed(1)+'%');p.style.setProperty('--gy',(y*100).toFixed(1)+'%');p.style.setProperty('--go','1');
      });
      p.addEventListener('pointerleave',function(){p.style.setProperty('--rx','0deg');p.style.setProperty('--ry','0deg');p.style.setProperty('--go','0')});
    });
  }else if(phs.length){
    var on=[],pio=new IntersectionObserver(function(es){es.forEach(function(en){var i=on.indexOf(en.target);if(en.isIntersecting){if(i<0)on.push(en.target)}else if(i>=0)on.splice(i,1)})});
    phs.forEach(function(p){pio.observe(p)});
    ticks.push(function(){
      var vh=innerHeight;
      on.forEach(function(p){
        var r=p.getBoundingClientRect(),t=clamp((r.top+r.height/2)/vh,0,1);
        p.style.setProperty('--rx',((t-.5)*9).toFixed(2)+'deg');
        p.style.setProperty('--gy',((1-t)*130-15).toFixed(1)+'%');p.style.setProperty('--gx',(30+t*40).toFixed(1)+'%');p.style.setProperty('--go','.9');
      });
    });
  }

  /* FAQ : let the answer leave before the row closes */
  $$('.faq details').forEach(function(dt){
    var sm=$('summary',dt);if(!sm)return;
    sm.addEventListener('click',function(e){
      if(!dt.open||dt.classList.contains('closing'))return;
      e.preventDefault();dt.classList.add('closing');
      setTimeout(function(){dt.open=false;dt.classList.remove('closing')},210);
    });
  });

  /* form fields : a light runs round the border while focused */
  $$('.form .inp').forEach(function(inp){
    var w=E('span','mo-fld');inp.parentNode.insertBefore(w,inp);w.appendChild(inp);
    var NS='http://www.w3.org/2000/svg',s=d.createElementNS(NS,'svg'),r=d.createElementNS(NS,'rect');
    s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');
    r.setAttribute('x','0');r.setAttribute('y','0');r.setAttribute('width','100%');r.setAttribute('height','100%');r.setAttribute('rx','2');r.setAttribute('pathLength','100');
    s.appendChild(r);w.appendChild(s);
  });
});

/* =====================================================================
   showpieces
   ===================================================================== */

/* ---------- home : foam -> rinse -> shine, scrubbed by the scroll ---------- */
if(MO)safe(function(){
  var panel=$('.hero .panel');if(!panel)return;
  var cv=E('canvas','p-foam');cv.setAttribute('aria-hidden','true');
  panel.insertBefore(cv,$('.p-shut',panel));
  var ctx=cv.getContext('2d');if(!ctx)return;
  var dpr=Math.min(2,W.devicePixelRatio||1),w=0,h=0,end=1,last=-1,rnd=seed(11),B=[],D=[],S=[],i;
  for(i=0;i<(SMALL?130:170);i++)B.push({x:rnd(),y:rnd(),r:(.05+rnd()*.06)*(SMALL?1.35:1),t:rnd()});
  for(i=0;i<(SMALL?70:150);i++)D.push({x:rnd(),y:rnd(),r:.006+rnd()*.02,t:rnd()});
  for(i=0;i<16;i++)S.push(rnd());
  function size(){
    var r=panel.getBoundingClientRect();w=r.width;h=r.height;if(!w)return;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    end=Math.max(120,(r.top+scrollY+h)*.46);last=-1;draw();
  }
  function front(x,fy,wv){return fy+Math.sin(x*.035+wv*14)*h*.03+Math.sin(x*.011+wv*5)*h*.05}
  function draw(){
    var p=clamp(scrollY/end,0,1);if(p===last)return;last=p;
    ctx.clearRect(0,0,w,h);if(p<=0||p>=1)return;
    var f=Math.min(1,p/.33),wv=clamp((p-.36)/.42,0,1),s=clamp((p-.8)/.2,0,1),u=Math.sqrt(w*h),k,x,g;
    if(wv<1){
      ctx.fillStyle='rgba(238,245,252,.96)';
      B.forEach(function(b){k=clamp((f-b.t*.65)/.35,0,1);if(!k)return;k=1-(1-k)*(1-k);ctx.beginPath();ctx.arc(b.x*w,b.y*h,b.r*u*1.5*k,0,6.2832);ctx.fill()});
      ctx.lineWidth=1;
      D.forEach(function(b){k=clamp((f-b.t*.65)/.35,0,1);if(k<.6)return;
        ctx.beginPath();ctx.arc(b.x*w,b.y*h,b.r*u,0,6.2832);ctx.strokeStyle='rgba(140,172,210,.55)';ctx.stroke();
        ctx.beginPath();ctx.arc(b.x*w-b.r*u*.3,b.y*h-b.r*u*.3,Math.max(.6,b.r*u*.18),0,6.2832);ctx.fillStyle='#fff';ctx.fill();
      });
      if(wv>0){
        var fy=-.14*h+wv*1.34*h;
        ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';
        ctx.beginPath();ctx.moveTo(0,-10);for(x=0;x<=w+12;x+=12)ctx.lineTo(x,front(x,fy,wv));ctx.lineTo(w+12,-10);ctx.closePath();ctx.fill();
        ctx.globalCompositeOperation='source-over';
        /* the sheet of water above the front */
        g=ctx.createLinearGradient(0,fy-h*.55,0,fy+h*.08);g.addColorStop(0,'rgba(150,205,245,0)');g.addColorStop(.85,'rgba(170,220,250,.2)');g.addColorStop(1,'rgba(200,235,255,.32)');
        ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,fy-h*.55);for(x=0;x<=w+12;x+=12)ctx.lineTo(x,front(x,fy,wv));ctx.lineTo(w+12,fy-h*.55);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(190,228,250,.16)';ctx.lineWidth=2;ctx.lineCap='round';
        S.forEach(function(sx,n){var X=sx*w,y1=front(X,fy,wv);ctx.beginPath();ctx.moveTo(X,Math.max(0,y1-h*(.25+.3*S[(n+5)%16])));ctx.lineTo(X,y1);ctx.stroke()});
        ctx.beginPath();for(x=0;x<=w+12;x+=12){var y=front(x,fy,wv);if(x)ctx.lineTo(x,y);else ctx.moveTo(x,y)}
        ctx.strokeStyle='rgba(126,212,240,.3)';ctx.lineWidth=12;ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.stroke();
      }
    }
    if(s>0&&s<1){
      var bx=(-.25+s*1.5)*w,bw=w*.16;
      g=ctx.createLinearGradient(bx-bw,0,bx+bw,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(235,246,255,.75)');g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(bx-bw,0,bw*2,h);ctx.globalCompositeOperation='source-over';
    }
  }
  size();resizers.push(size);addEventListener('load',size);
  var on=true;
  new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on)draw()}).observe(panel);
  ticks.push(function(){if(on)draw()});
});

/* ---------- home : light pulse along the six mini steps ---------- */
/* (handled in CSS through the card / connector entrance) */

/* ---------- menu : foam you can wipe away ---------- */
safe(function(){
  var fig=$('#wipe');if(!fig)return;
  var box=$('.paint',fig),cv=$('canvas',fig),btn=$('#wipe-btn'),ctx=cv.getContext('2d');if(!ctx){fig.style.display='none';return}
  var dpr=Math.min(2,W.devicePixelRatio||1),w=0,h=0,foamy=false,last=null,busy=0;
  function label(){btn.textContent=foamy?'水で流す':'泡をかける'}
  function fill(a){
    var rnd=seed(29),u=Math.sqrt(w*h),i,x,y,r;
    ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);ctx.globalAlpha=a;
    ctx.fillStyle='rgba(236,244,252,.97)';ctx.fillRect(0,0,w,h);
    for(i=0;i<(SMALL?120:240);i++){
      x=rnd()*w;y=rnd()*h;r=(.012+rnd()*rnd()*.06)*u;
      ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fill();
      ctx.strokeStyle='rgba(140,172,212,.5)';ctx.lineWidth=1;ctx.stroke();
      ctx.beginPath();ctx.arc(x+r*.25,y+r*.3,r*.62,.2,1.5);ctx.strokeStyle='rgba(126,190,235,.5)';ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  function erase(x0,y0,x1,y1){
    ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=SMALL?46:64;
    ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1+.01,y1);ctx.stroke();ctx.globalCompositeOperation='source-over';
  }
  function size(){
    var r=box.getBoundingClientRect();if(!r.width)return;w=r.width;h=r.height;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(foamy)fill(1);
  }
  function foam(){
    var id=++busy;foamy=true;label();
    if(!MO){fill(1);return}
    var t0=performance.now();(function st(n){if(id!==busy)return;var t=clamp((n-t0)/450,0,1);fill(t);if(t<1)raf(st)})(t0);
  }
  function rinse(){
    var id=++busy;foamy=false;label();
    if(!MO){ctx.clearRect(0,0,w,h);return}
    var t0=performance.now();(function st(n){
      if(id!==busy)return;var t=clamp((n-t0)/800,0,1),fy=-.1*h+ease(t)*1.3*h,x;
      ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.moveTo(0,-10);
      for(x=0;x<=w+12;x+=12)ctx.lineTo(x,fy+Math.sin(x*.04+t*9)*h*.04);
      ctx.lineTo(w+12,-10);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over';
      if(t<1)raf(st);else ctx.clearRect(0,0,w,h);
    })(t0);
  }
  function pt(e){var r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
  box.addEventListener('pointerdown',function(e){if(!foamy)return;busy++;last=pt(e);erase(last[0],last[1],last[0],last[1])});
  box.addEventListener('pointermove',function(e){
    if(!foamy)return;
    if(e.pointerType==='mouse'||last){var p=pt(e);if(!last)last=p;busy++;erase(last[0],last[1],p[0],p[1]);last=p}
  });
  ['pointerup','pointercancel','pointerleave'].forEach(function(ev){box.addEventListener(ev,function(){last=null})});
  btn.addEventListener('click',function(){if(foamy)rinse();else foam()});
  size();resizers.push(size);addEventListener('load',size);
  if(MO){
    foamy=true;label();fill(1);
    /* one automatic stroke when it first comes into view, as a hint */
    var io=new IntersectionObserver(function(es){
      if(!es[0].isIntersecting)return;io.disconnect();
      var id=busy;
      setTimeout(function(){
        if(id!==busy||!foamy)return;
        var t0=performance.now(),px=null,py=null;
        (function st(n){
          if(id!==busy)return;var t=clamp((n-t0)/1300,0,1),e=ease(t),x=w*(.06+.88*e),y=h*(.5-.24*Math.sin(e*6.2832));
          if(px!==null)erase(px,py,x,y);px=x;py=y;if(t<1)raf(st);
        })(t0);
      },900);
    },{threshold:.55});
    io.observe(box);
  }else label();
});

/* ---------- menu : beads scatter from the pointer ---------- */
if(MO)safe(function(){
  var svg=$('#coating .field .beads-svg');if(!svg)return;
  var gs=$$('g',svg);if(gs.length<2)return;
  var A=$$('use',gs[0]),Bs=$$('use',gs[1]),box=svg.parentNode,px=null,py=0,rq=0,on=false,R=135;
  var P=A.map(function(u,i){var x=+u.getAttribute('x'),y=+u.getAttribute('y'),s=+u.getAttribute('width');return{cx:x+s/2,cy:y+s/2,r:s/2.8,ox:0,oy:0,vx:0,vy:0,a:u,b:Bs[i],m:false}});
  function at(e){var m=svg.getScreenCTM();if(!m)return;var q=svg.createSVGPoint();q.x=e.clientX;q.y=e.clientY;q=q.matrixTransform(m.inverse());px=q.x;py=q.y;kick()}
  function frame(){
    rq=0;var act=false;
    for(var i=0;i<P.length;i++){
      var p=P[i];
      if(px!==null){var dx=p.cx+p.ox-px,dy=p.cy+p.oy-py,d2=dx*dx+dy*dy;
        if(d2<R*R){var dd=Math.sqrt(d2)||1,f=(1-dd/R)*7/(.6+p.r/14);p.vx+=dx/dd*f;p.vy+=dy/dd*f}}
      p.vx-=p.ox*.03;p.vy-=p.oy*.03;p.vx*=.86;p.vy*=.86;p.ox+=p.vx;p.oy+=p.vy;
      if(Math.abs(p.ox)+Math.abs(p.oy)+Math.abs(p.vx)+Math.abs(p.vy)>.08){
        act=true;p.m=true;var t='translate('+p.ox.toFixed(1)+'px,'+p.oy.toFixed(1)+'px)';p.a.style.transform=t;if(p.b)p.b.style.transform=t;
      }else if(p.m){p.m=false;p.ox=p.oy=p.vx=p.vy=0;p.a.style.transform='';if(p.b)p.b.style.transform=''}
    }
    if(act&&on)kick();
  }
  function kick(){if(!rq)rq=raf(frame)}
  box.addEventListener('pointermove',at);box.addEventListener('pointerdown',at);
  ['pointerleave','pointerup','pointercancel'].forEach(function(ev){box.addEventListener(ev,function(e){if(ev==='pointerup'&&e.pointerType==='mouse')return;px=null;kick()})});
  new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on)kick()}).observe(box);
});

/* ---------- menu : the before / after slider demonstrates itself once ---------- */
if(MO)safe(function(){
  var rg=$('#ba-range'),ba=$('#ba');if(!rg||!ba)return;
  var stop=false;
  ['pointerdown','keydown','touchstart'].forEach(function(ev){rg.addEventListener(ev,function(){stop=true},{passive:true})});
  function set(v){rg.value=v;rg.dispatchEvent(new Event('input'))}
  var io=new IntersectionObserver(function(es){
    if(!es[0].isIntersecting)return;io.disconnect();
    setTimeout(function(){
      var t0=performance.now();
      (function st(n){
        if(stop)return;var t=(n-t0)/2600,v;
        if(t>=1){set(50);return}
        if(t<.25)v=50-34*ease(t/.25);else if(t<.72)v=16+68*ease((t-.25)/.47);else v=84-34*ease((t-.72)/.28);
        set(Math.round(v));raf(st);
      })(t0);
    },700);
  },{threshold:.6});
  io.observe(ba);
});

/* ---------- price : size selector, the outline morphs and the prices roll ---------- */
safe(function(){
  var box=$('#sizer');if(!box)return;
  var tbl=$('table',$('#cap-base').closest('.tbl-wrap')),out=$('#sz-out'),len=$('#sz-len'),svg=$('svg',box);
  var rows=$$('tbody tr',tbl).map(function(tr){
    var th=$('th',tr),name='';[].forEach.call(th.childNodes,function(n){if(n.nodeType===3)name+=n.nodeValue});
    return{name:name.trim(),p:$$('td',tr).map(function(td){return td.firstChild.nodeValue.trim()})};
  });
  var LEN=['全長 4.0m 未満','全長 4.0〜4.6m','全長 4.6〜4.9m','全長 4.9m 以上／車高 1.8m 以上'];
  /* 11 outline points (rear -> roof -> nose), then wheel x, wheel x, wheel r */
  var SH=[
    [132,172,128,138,138,100,166,66,270,58,346,64,398,108,430,114,456,122,470,144,470,172,196,410,30],
    [100,172,96,140,112,112,180,72,280,62,352,68,412,110,450,116,482,124,500,146,500,172,178,424,32],
    [76,172,72,142,100,116,196,74,290,64,366,70,430,112,472,118,506,126,526,148,526,172,166,444,33],
    [60,174,56,130,62,74,92,38,270,32,372,40,440,100,484,108,520,118,540,144,540,174,156,452,38]
  ];
  var body=$('.sz-body',svg),win=$('.sz-win',svg),ws=$$('.sz-w',svg),hs=$$('.sz-h',svg),dim=$('.sz-dim',svg);
  var cur=SH[0].slice(),from=cur,to=cur,t0=0,anim=0;
  function f(n){return n.toFixed(1)}
  function draw(a){
    var P=[],i,dd='';for(i=0;i<11;i++)P.push([a[i*2],a[i*2+1]]);
    dd='M'+f(P[0][0])+' '+f(P[0][1]);
    for(i=0;i<10;i++){
      var p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2,k=.14;
      dd+='C'+f(p1[0]+(p2[0]-p0[0])*k)+' '+f(p1[1]+(p2[1]-p0[1])*k)+' '+f(p2[0]-(p3[0]-p1[0])*k)+' '+f(p2[1]-(p3[1]-p1[1])*k)+' '+f(p2[0])+' '+f(p2[1]);
    }
    var w1=a[22],w2=a[23],r=a[24],ar=r+7,by=P[10][1];
    dd+='L'+f(w2+ar)+' '+f(by)+'A'+f(ar)+' '+f(ar)+' 0 0 0 '+f(w2-ar)+' '+f(by)+'L'+f(w1+ar)+' '+f(by)+'A'+f(ar)+' '+f(ar)+' 0 0 0 '+f(w1-ar)+' '+f(by)+'Z';
    body.setAttribute('d',dd);
    var belt=P[6][1]-1;
    win.setAttribute('d','M'+f(P[2][0]+26)+' '+f(belt)+'L'+f(P[3][0]+12)+' '+f(P[3][1]+11)+'L'+f(P[4][0])+' '+f(P[4][1]+9)+'L'+f(P[5][0]-6)+' '+f(P[5][1]+9)+'L'+f(P[6][0]-16)+' '+f(belt)+'Z'+'M'+f(P[4][0]+4)+' '+f(P[4][1]+9)+'L'+f(P[4][0]+8)+' '+f(belt));
    [w1,w2].forEach(function(x,j){ws[j].setAttribute('cx',f(x));ws[j].setAttribute('cy',f(181-r));ws[j].setAttribute('r',f(r));hs[j].setAttribute('cx',f(x));hs[j].setAttribute('cy',f(181-r));hs[j].setAttribute('r',f(r*.38))});
    var x0=P[1][0],x1=P[10][0];
    dim.setAttribute('d','M'+f(x0)+' 200H'+f(x1)+'M'+f(x0)+' 194V206M'+f(x1)+' 194V206');
  }
  function step(n){
    var t=clamp((n-t0)/650,0,1),e=1-Math.pow(1-t,3);
    for(var i=0;i<cur.length;i++)cur[i]=from[i]+(to[i]-from[i])*e;
    draw(cur);anim=t<1?raf(step):0;
  }
  rows.forEach(function(r){
    var dv=E('div'),dt=E('dt'),dd=E('dd'),v=E('span','sz-v'),y=E('span','yen');
    dt.textContent=r.name;v.textContent=r.p[0];y.textContent='円';dd.appendChild(v);dd.appendChild(y);dv.appendChild(dt);dv.appendChild(dd);out.appendChild(dv);r.v=v;
  });
  function pick(i,first){
    len.textContent=LEN[i];
    rows.forEach(function(r,j){
      if(r.v._rl){r.v.textContent=r.p[i];r.v._rl=0}else r.v.textContent=r.p[i];
      if(MO&&!first)roll(r.v,j*.05);
    });
    if(MO&&!first){from=cur.slice();to=SH[i];t0=performance.now();if(!anim)anim=raf(step)}
    else{cur=SH[i].slice();draw(cur)}
  }
  $$('input[name=size]',box).forEach(function(inp){inp.addEventListener('change',function(){if(inp.checked)pick(+inp.value)})});
  var c=$('input[name=size]:checked',box);pick(c?+c.value:0,true);
  /* roll once on arrival as well */
  if(MO){var io=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;io.disconnect();rows.forEach(function(r,j){roll(r.v,.5+j*.06)})},{threshold:.4});io.observe(out)}
});

/* ---------- flow : chrome track with a travelling light pulse ---------- */
if(MO)safe(function(){
  var seq=$('.seq');if(!seq)return;
  var lis=$$(':scope > li',seq),tr=E('div','mo-track'),fill=E('i','fill'),pulse=E('i','pulse'),nodes=[],ys=[],Ht=0,cur=0,rq=0,on=false;
  tr.setAttribute('aria-hidden','true');tr.appendChild(fill);tr.appendChild(pulse);seq.appendChild(tr);
  lis.forEach(function(){var n=E('i','mo-node');n.setAttribute('aria-hidden','true');seq.appendChild(n);nodes.push(n)});
  function measure(){
    ys=lis.map(function(li){return li.offsetTop});
    Ht=ys[ys.length-1]-ys[0];tr.style.height=Ht+'px';tr.style.top=(ys[0]+14)+'px';
    nodes.forEach(function(n,i){n.style.top=ys[i]+'px'});
  }
  function frame(){
    rq=0;
    var r=seq.getBoundingClientRect(),target=clamp(innerHeight*.52-r.top-ys[0]-14,0,Ht);
    cur+=(target-cur)*.16;if(Math.abs(target-cur)<.4)cur=target;
    fill.style.transform='scaleY('+(Ht?cur/Ht:0).toFixed(4)+')';
    pulse.style.transform='translateY('+cur.toFixed(1)+'px)';
    for(var i=0;i<lis.length;i++){var o=(cur>0||target>0)&&ys[i]-ys[0]<=cur+3;nodes[i].classList.toggle('on',o);lis[i].classList.toggle('on',o)}
    if(cur!==target&&on)kick();
  }
  function kick(){if(!rq)rq=raf(frame)}
  measure();resizers.push(measure);addEventListener('load',function(){measure();kick()});
  new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on)kick()}).observe(seq);
  ticks.push(function(){if(on)kick()});
});

/* ---------- studio : swing the inspection light, swirl marks appear ---------- */
safe(function(){
  var fig=$('#lightdemo');if(!fig)return;
  var box=$('.ld-box',fig),cv=$('canvas',fig),ctx=cv.getContext('2d');if(!ctx){fig.style.display='none';return}
  var dpr=Math.min(2,W.devicePixelRatio||1),w=0,h=0,S=[],warm=false,lx=.4,ly=.4,tx=.4,ty=.4,rq=0,on=false,ptr=false,auto=0,autoT=0;
  function size(){
    var r=box.getBoundingClientRect();if(!r.width)return;w=r.width;h=r.height;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    var rnd=seed(5),n=Math.min(1500,Math.round(w*h/170)),i;S=[];
    for(i=0;i<n;i++)S.push({x:rnd()*w,y:rnd()*h,a:rnd()*Math.PI,l:5+rnd()*rnd()*26,k:.4+rnd()*.6});
    for(i=0;i<7;i++)S.push({x:rnd()*w,y:rnd()*h,a:rnd()*Math.PI,l:50+rnd()*90,k:1});
    draw();
  }
  function draw(){
    var X=lx*w,Y=ly*h,R=Math.max(w*.36,150),g,i,s;
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0d2244');g.addColorStop(.6,'#081730');g.addColorStop(1,'#050c1a');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='lighter';
    g=ctx.createRadialGradient(X,Y,0,X,Y,R*1.15);
    g.addColorStop(0,warm?'rgba(255,200,130,.34)':'rgba(170,205,255,.3)');g.addColorStop(.35,warm?'rgba(255,180,110,.1)':'rgba(120,165,240,.1)');g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.lineCap='round';ctx.strokeStyle=warm?'#ffe0b0':'#e6f1ff';
    var gain=warm?1.5:1;
    for(i=0;i<S.length;i++){
      s=S[i];var dx=X-s.x,dy=Y-s.y,dd=Math.sqrt(dx*dx+dy*dy);if(dd>R)continue;
      var al=Math.abs(Math.sin(s.a-Math.atan2(dy,dx)));al=Math.pow(al,12)*Math.pow(1-dd/R,1.2)*s.k*gain;
      if(al<.03)continue;
      var cx=Math.cos(s.a)*s.l*.5,cy=Math.sin(s.a)*s.l*.5;
      ctx.globalAlpha=Math.min(1,al);ctx.lineWidth=s.l>40?1.1:.8;
      ctx.beginPath();ctx.moveTo(s.x-cx,s.y-cy);ctx.lineTo(s.x+cx,s.y+cy);ctx.stroke();
    }
    /* the lamp itself, reflected in the paint */
    ctx.globalAlpha=1;ctx.shadowColor=warm?'rgba(255,190,110,.95)':'rgba(170,210,255,.95)';ctx.shadowBlur=26;
    ctx.fillStyle=warm?'#fff3dc':'#fff';var lw=Math.max(60,w*.16),lh=Math.max(5,h*.022);
    ctx.beginPath();ctx.moveTo(X-lw/2+lh,Y-lh);ctx.arcTo(X+lw/2,Y-lh,X+lw/2,Y+lh,lh);ctx.arcTo(X+lw/2,Y+lh,X-lw/2,Y+lh,lh);ctx.arcTo(X-lw/2,Y+lh,X-lw/2,Y-lh,lh);ctx.arcTo(X-lw/2,Y-lh,X+lw/2,Y-lh,lh);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';
  }
  function frame(n){
    rq=0;
    if(auto){var t=clamp((n-autoT)/2800,0,1);tx=.5+.34*Math.sin(t*6.2832+3.6)*(1-t*.55);ty=.4+.1*Math.sin(t*9);if(t>=1)auto=0}
    else if(!ptr){var r=box.getBoundingClientRect(),p=clamp(1-(r.top+r.height/2)/innerHeight,0,1);tx=.14+.72*p;ty=.4}
    lx+=(tx-lx)*.14;ly+=(ty-ly)*.14;draw();
    if(on&&(auto||Math.abs(tx-lx)+Math.abs(ty-ly)>.002))kick();
  }
  function kick(){if(!rq&&MO)rq=raf(frame)}
  $$('input[name=ld]',fig).forEach(function(inp){inp.addEventListener('change',function(){warm=$('input[name=ld]:checked',fig).value==='a';draw()})});
  size();resizers.push(size);addEventListener('load',size);
  if(!MO)return;
  function at(e){var r=box.getBoundingClientRect();ptr=true;auto=0;tx=clamp((e.clientX-r.left)/r.width,0,1);ty=clamp((e.clientY-r.top)/r.height,0,1);kick()}
  box.addEventListener('pointermove',at);box.addEventListener('pointerdown',at);
  ['pointerleave','pointercancel'].forEach(function(ev){box.addEventListener(ev,function(){ptr=false;kick()})});
  box.addEventListener('pointerup',function(e){if(e.pointerType!=='mouse'){ptr=false;kick()}});
  var first=true;
  new IntersectionObserver(function(es){
    on=es[0].isIntersecting;
    if(on&&first&&es[0].intersectionRatio>.5){first=false;auto=1;autoT=performance.now()+300}
    if(on)kick();
  },{threshold:[0,.55]}).observe(box);
  ticks.push(function(){if(on&&!ptr)kick()});
});

/* ---------- contact : a droplet that grows as the fields are filled ---------- */
safe(function(){
  var form=$('#form');if(!form)return;
  var m=E('div','meter');
  m.innerHTML='<svg viewBox="0 0 48 60" aria-hidden="true" focusable="false"><defs><clipPath id="m-clip"><path d="M24 3C24 3 6 26 6 38a18 18 0 0 0 36 0C42 26 24 3 24 3Z"/></clipPath></defs><g clip-path="url(#m-clip)"><rect class="m-w" x="0" y="0" width="48" height="60"/></g><path class="m-o" d="M24 3C24 3 6 26 6 38a18 18 0 0 0 36 0C42 26 24 3 24 3Z"/><path class="m-g" d="M14 38a10 10 0 0 0 6 9"/></svg><span role="status">入力済み <b>0</b>／6</span>';
  form.insertBefore(m,form.firstChild);
  var b=$('b',m),ids=['f-date','f-name','f-contact','f-model','f-note'],prev=-1;
  function upd(){
    var n=$$('input[name=svc]:checked',form).length?1:0;
    ids.forEach(function(id){var el=d.getElementById(id);if(el&&el.value.trim())n++});
    if(n===prev)return;prev=n;
    b.textContent=String(n);m.style.setProperty('--p',(n/6).toFixed(3));m.classList.toggle('full',n===6);
  }
  form.addEventListener('input',upd);form.addEventListener('change',upd);upd();
});

})();
