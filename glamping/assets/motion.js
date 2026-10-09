/* FIELD NOTE motion layer. Runs only when html.mo is set (motion allowed). */
(function(){
  'use strict';
  var root=document.documentElement, doc=document, win=window;
  if(!root.classList.contains('mo'))return;
  if(!('IntersectionObserver' in win)||!win.requestAnimationFrame){root.classList.remove('mo');return;}
  function $(s,c){return (c||doc).querySelector(s);}
  function $$(s,c){return [].slice.call((c||doc).querySelectorAll(s));}
  function rnd(a,b){return a+Math.random()*(b-a);}
  function clamp(v,a,b){return v<a?a:(v>b?b:v);}
  function wa(el,kf,o){try{return el&&el.animate?el.animate(kf,o):null;}catch(e){return null;}}
  function safe(fn){try{fn();}catch(e){if(win.console)console.error('motion: '+(e&&e.message));}}
  function el(tag,cls,html){var n=doc.createElement(tag);if(cls)n.className=cls;if(html)n.innerHTML=html;return n;}
  var SVGNS='http://www.w3.org/2000/svg';
  var small=win.matchMedia('(max-width:767px)').matches;
  var hover=win.matchMedia('(hover:hover)').matches;
  var Z=root.classList.contains('zip-in')?360:0;
  function isNight(){return root.getAttribute('data-mode')==='night';}
  var t0=Date.now();

  /* ================= page transition: zip the tent shut ================= */
  safe(function(){
    var going=false;
    doc.addEventListener('click',function(e){
      if(going||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      var a=e.target&&e.target.closest?e.target.closest('a[href]'):null; if(!a)return;
      var h=a.getAttribute('href');
      if(!h||a.target||a.hasAttribute('download')||!/^[\w\-]+\.html(#.*)?$/.test(h))return;
      e.preventDefault(); going=true;
      var url=a.href, t=setTimeout(function(){location.href=url;},400);
      try{
        sessionStorage.setItem('fn-zip','1');
        var z=el('div','zipx','<i class="zl"></i><i class="zr"></i><b class="zp"></b>');
        z.setAttribute('aria-hidden','true'); doc.body.appendChild(z);
      }catch(err){clearTimeout(t);location.href=url;}
    });
    win.addEventListener('pageshow',function(e){
      if(e.persisted){going=false;$$('.zipx').forEach(function(z){z.parentNode.removeChild(z);});try{sessionStorage.removeItem('fn-zip');}catch(x){}}
    });
  });

  /* ================= headline split ================= */
  var PUNCT='、。，．！？!?）」』・…';
  var heads=[];
  function splitHead(h,base,still){
    if(h.__html==null){h.__html=h.innerHTML;heads.push(h);}else h.innerHTML=h.__html;
    h.__w=h.clientWidth; h.__t=Date.now();
    var label=(h.textContent||'').replace(/\s+/g,' ').trim();
    var tw=doc.createTreeWalker(h,NodeFilter.SHOW_TEXT,null), nodes=[], n, i=0;
    while((n=tw.nextNode()))nodes.push(n);
    /* 1. measure where the browser broke the lines (keeps the phrase-aware wrapping) */
    var fs=parseFloat(getComputedStyle(h).fontSize)||30, rg=doc.createRange(), lastTop=null, plan=[];
    nodes.forEach(function(t){
      var s=t.nodeValue, chars=Array.from?Array.from(s):s.split(''), off=0, row=[];
      chars.forEach(function(c){
        var brk=false;
        if(/\S/.test(c)){
          rg.setStart(t,off); rg.setEnd(t,off+c.length);
          var r=rg.getClientRects()[0];
          if(r){ if(lastTop!==null&&r.top>lastTop+fs*.55)brk=true; lastTop=r.top; }
        }
        row.push([c,brk]); off+=c.length;
      });
      plan.push(row);
    });
    /* 2. rebuild as stamped letters, glued together except at the measured breaks */
    var prev=null;
    nodes.forEach(function(t,k){
      if(!/\S/.test(t.nodeValue))return;
      var f=doc.createDocumentFragment(), last=null;
      plan[k].forEach(function(cb){
        var c=cb[0];
        if(/\s/.test(c)){ if(c===' '||c==='\u3000'){f.appendChild(doc.createTextNode(c));last=null;prev=null;} return; }
        if(last&&!cb[1]&&PUNCT.indexOf(c)>-1){last.textContent+=c;return;}
        var sp=el('span','ch'); sp.textContent=c;
        if(!still){
          sp.style.setProperty('--cd',Math.round(base+i*42)+'ms');
          sp.style.setProperty('--cr',rnd(-15,15).toFixed(1)+'deg');
        }
        sp.style.setProperty('--cf',rnd(-1.5,1.5).toFixed(2)+'deg');
        if(prev&&!cb[1])f.appendChild(doc.createTextNode('\u2060'));
        f.appendChild(sp); last=sp; prev=sp; i++;
      });
      t.parentNode.replaceChild(f,t);
    });
    $$('br',h).forEach(function(b){ var x=b.nextSibling; while(x&&x.nodeType===3&&x.nodeValue==='\u2060'){var y=x.nextSibling;x.parentNode.removeChild(x);x=y;} });
    var box=el('span','sp'); box.setAttribute('aria-hidden','true');
    while(h.firstChild)box.appendChild(h.firstChild);
    h.setAttribute('aria-label',label); h.appendChild(box);
    h.classList.toggle('still',!!still);
    if(!still)$$('em,.l2',h).forEach(function(e){e.style.setProperty('--ed',Math.round(base+i*42+260)+'ms');});
  }
  /* width or font changed: re-measure quietly (no replay) */
  function resplit(force){
    heads.forEach(function(h){
      if(!h.__in)return;
      if(!force&&h.clientWidth===h.__w)return;
      var wait=Math.max(0,1700-(Date.now()-h.__t));
      clearTimeout(h.__rs); h.__rs=setTimeout(function(){safe(function(){splitHead(h,0,true);});},wait);
    });
  }
  safe(function(){
    var rt; win.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){resplit(false);},200);});
    if(doc.fonts&&doc.fonts.ready&&doc.fonts.status!=='loaded')doc.fonts.ready.then(function(){resplit(true);});
  });

  /* ================= count-up / time roll ================= */
  function fmtNum(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
  function countNode(tn,delay){
    var s=tn.nodeValue, m=s.match(/(\d{1,2}):(\d{2})/), time=!!m, all;
    if(!m){all=s.match(/\d[\d,]*/g); if(!all||all.length!==1)return; m=s.match(/\d[\d,]*/);}
    var val=time?(+m[1])*60+(+m[2]):+m[0].replace(/,/g,''); if(!time&&val<30)return;
    var par=tn.parentNode, sp=el('span','cn'); sp.textContent=m[0];
    par.insertBefore(doc.createTextNode(s.slice(0,m.index)),tn); par.insertBefore(sp,tn);
    par.insertBefore(doc.createTextNode(s.slice(m.index+m[0].length)),tn); par.removeChild(tn);
    sp.style.display='inline-block'; var wdt=sp.offsetWidth;
    sp.style.minWidth=wdt+'px'; sp.style.textAlign='right';
    var from=time?val-85:(val>=1000?Math.pow(10,String(val).length-1):0), fin=m[0], pad=/^0\d:/.test(fin);
    function show(v){
      if(time){v=Math.round(v/5)*5; v=((v%1440)+1440)%1440; var hh=Math.floor(v/60), mi=v%60; sp.textContent=(pad&&hh<10?'0':'')+hh+':'+(mi<10?'0':'')+mi;}
      else sp.textContent=fmtNum(v);
    }
    show(from);
    var st=null, dur=time?820:950;
    function step(t){
      if(st===null)st=t+delay;
      var k=clamp((t-st)/dur,0,1), e=1-Math.pow(1-k,3);
      if(k>=1){sp.textContent=fin;sp.style.minWidth='';return;}
      if(k>0)show(from+(val-from)*e);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function countIn(node,sel,delay){
    $$(sel,node).forEach(function(e){
      if(e.__cnt)return; e.__cnt=1;
      [].slice.call(e.childNodes).forEach(function(c){ if(c.nodeType===3&&/\d/.test(c.nodeValue))countNode(c,delay||0); });
    });
  }

  /* ================= reveal system ================= */
  var SEL_A='.print,.stamp,.memo,.tag,.price,.label,.tbl-scroll,.warn,.honest,.htag,.ticket,.lead,.campfire,.h2,.page-head h1,.hero h1,.policy h2,.faq-list details,.stop';
  var SEL_B='.ticks>li,.three>li,.news>li,.steps>li,.fire-list>li,.rows>div,.access dl>div';
  var SEL_C='.torn,.stitch,.plan,.map,.compass,.contour,.hang';
  var hooks=[], all=[];
  function show(node,dl){
    if(node.__in)return; node.__in=1;
    safe(function(){
      node.style.setProperty('--d',Math.round(dl)+'ms');
      var intro=(Date.now()-t0<700)&&node.closest&&node.closest('.page-head,.hero');
      if(node.matches('.h2,.page-head h1,.hero h1'))splitHead(node,intro?Z+140:dl,false);
      if(node.matches('.print')){
        var r=node.getBoundingClientRect(), left=(r.left+r.width/2)<win.innerWidth/2;
        node.style.setProperty('--tx',(left?-1:1)*(small?96:180)+'px');
        node.style.setProperty('--spin',(left?-1:1)*Math.round(rnd(14,28))+'deg');
      }
    });
    node.classList.add('in');
    for(var i=0;i<hooks.length;i++){ if(node.matches(hooks[i][0])) (function(f){safe(function(){f(node,dl);});})(hooks[i][1]); }
  }
  function onShow(sel,fn){hooks.push([sel,fn]);}
  var io=new IntersectionObserver(function(es){
    var a=[];
    es.forEach(function(e){ if(e.isIntersecting||e.boundingClientRect.bottom<0){io.unobserve(e.target);a.push(e);} });
    a.sort(function(x,y){return (x.boundingClientRect.top-y.boundingClientRect.top)||(x.boundingClientRect.left-y.boundingClientRect.left);});
    var k=0;
    a.forEach(function(e){
      var passed=e.boundingClientRect.bottom<0, deco=e.target.matches(SEL_C);
      show(e.target,(passed||deco)?0:Math.min(k*70,490));
      if(!passed&&!deco)k++;
    });
  },{rootMargin:'0px 0px -7% 0px',threshold:0.01});
  function sweep(){
    var vh=win.innerHeight;
    all.forEach(function(n){ if(n.__in)return; var r=n.getBoundingClientRect(); if((r.width||r.height)&&r.top<vh)show(n,0); });
  }

  /* hooks: counts, rolls */
  onShow('.tbl-scroll',function(n,dl){
    countIn(n,'td.num,td b',dl+350);
    var par=n.offsetParent; if(!par)return;
    var r=el('i','mo-roll'); r.setAttribute('aria-hidden','true');
    r.style.left=(n.offsetLeft-8)+'px'; r.style.top=n.offsetTop+'px'; r.style.width=(n.offsetWidth+16)+'px';
    r.style.setProperty('--h',n.offsetHeight+'px'); r.style.setProperty('--d',Math.round(dl)+'ms');
    par.appendChild(r);
    setTimeout(function(){if(r.parentNode)r.parentNode.removeChild(r);},dl+1300);
  });
  onShow('.tag',function(n,dl){countIn(n,'dd',dl+250);});
  onShow('.htag',function(n,dl){countIn(n,'em',dl+350);});
  onShow('.stamp',function(n,dl){ if(!n.closest('.ph-stamp'))countIn(n,'b',dl+200); });
  onShow('.stop',function(n,dl){countIn(n,'time',dl+120);});
  onShow('.memo',function(n,dl){countIn(n,'p>b',dl+500);});

  /* scribbled underlines */
  safe(function(){
    var SC='<svg class="scrib" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M1 5c9-4 16 3 26 0s17-4 27 0 16 3 24-1 13 0 21 1"/></svg>';
    $$('.rows dt,.access dl dt,.steps li>b,.fire-list b,.news time,.ticks li>b').forEach(function(n){n.insertAdjacentHTML('beforeend',SC);});
    $$('.contour').forEach(function(c){$$('path',c).forEach(function(p){p.setAttribute('pathLength','1');});c.classList.add('pl1');});
    $$('.plan').forEach(function(p){var k=0;[].slice.call(p.children).forEach(function(c){c.style.setProperty('--k',k++);});});
    $$('.map').forEach(function(p){var k=0;$$('text',p).forEach(function(c){c.style.setProperty('--k',k++);});});
  });

  /* ================= canvases: sky (behind text) + fx (sparks, fireflies) ================= */
  var sky=el('canvas','mo-sky'), fx=el('canvas','mo-fx'), sctx, fctx, CW=0, CH=0, DPR=1;
  var leaves=[], flies=[], sparks=[], shoot=null, shootAt=0, emitters=[], ptr={x:-999,y:-999,on:false};
  safe(function(){
    sky.setAttribute('aria-hidden','true'); fx.setAttribute('aria-hidden','true');
    var st=doc.getElementById('stars');
    if(st&&st.parentNode)st.parentNode.insertBefore(sky,st.nextSibling); else doc.body.appendChild(sky);
    doc.body.appendChild(fx);
    sctx=sky.getContext('2d'); fctx=fx.getContext('2d');
    function size(){
      DPR=Math.min(win.devicePixelRatio||1,small?1.25:1.5); CW=win.innerWidth; CH=win.innerHeight;
      [sky,fx].forEach(function(c){c.width=Math.round(CW*DPR);c.height=Math.round(CH*DPR);});
    }
    size(); var rt; win.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(size,180);});
    var LC=['#E8602C','#7FB3C8','#3F7A5F','#C8A45A'], nL=small?6:12, nP=small?7:14, nF=small?9:20, i;
    for(i=0;i<nL+nP;i++)leaves.push({x:rnd(0,CW),y:rnd(0,CH),vx:rnd(-.25,.35),vy:i<nL?rnd(.25,.6):rnd(-.25,-.08),r:rnd(0,6.3),vr:rnd(-.02,.02),s:i<nL?rnd(5,9):rnd(1.2,2.2),c:LC[i%4],leaf:i<nL,ph:rnd(0,6.3)});
    for(i=0;i<nF;i++)flies.push({x:rnd(0,CW),y:rnd(0,CH),a:rnd(0,6.3),sp:rnd(.2,.55),ph:rnd(0,6.3),c:i%3?'#FFD27A':'#D8F27A'});
    win.addEventListener('pointermove',function(e){ptr.x=e.clientX;ptr.y=e.clientY;ptr.on=true;},{passive:true});
    win.addEventListener('pointerleave',function(){ptr.on=false;});
  });
  var MAXS=small?70:150;
  function spark(x,y,vx,vy,life,c,s){ if(sparks.length<MAXS)sparks.push({x:x,y:y,vx:vx,vy:vy,l:life,m:life,c:c||'#FFB347',s:s||2.4,g:0}); }
  function burst(x,y,n,cols,pw){
    for(var i=0;i<n;i++){var a=rnd(-Math.PI,0)*1+rnd(-.3,.3), v=rnd(1.2,4.2)*(pw||1);
      spark(x+rnd(-6,6),y+rnd(-4,4),Math.cos(a)*v,Math.sin(a)*v-1,rnd(380,820),cols?cols[i%cols.length]:(i%3?'#FFB347':'#E8602C'),rnd(2,3.6)); sparks[sparks.length-1]&&(sparks[sparks.length-1].g=.12);}
  }
  function drawSky(dt,dy){
    if(!sctx)return;
    sctx.setTransform(DPR,0,0,DPR,0,0); sctx.clearRect(0,0,CW,CH);
    if(isNight())return;
    for(var i=0;i<leaves.length;i++){
      var p=leaves[i], k=dt/16;
      p.ph+=.02*k; p.x+=(p.vx+Math.sin(p.ph)*.35)*k; p.y+=p.vy*k-dy*(p.leaf?.45:.25); p.r+=p.vr*k;
      if(ptr.on){var dx=p.x-ptr.x, dyy=p.y-ptr.y, d2=dx*dx+dyy*dyy; if(d2<12000&&d2>1){var f=(1-d2/12000)*1.6/Math.sqrt(d2); p.x+=dx*f*k*6; p.y+=dyy*f*k*6; p.r+=.05;}}
      if(p.y>CH+20)p.y=-20; if(p.y<-24)p.y=CH+20; if(p.x>CW+20)p.x=-20; if(p.x<-24)p.x=CW+20;
      sctx.globalAlpha=p.leaf?.5:.38; sctx.fillStyle=p.c;
      if(p.leaf){
        sctx.save(); sctx.translate(p.x,p.y); sctx.rotate(p.r); sctx.scale(1,.55+.45*Math.cos(p.ph*1.3));
        sctx.beginPath(); sctx.moveTo(0,-p.s); sctx.quadraticCurveTo(p.s*.9,0,0,p.s); sctx.quadraticCurveTo(-p.s*.9,0,0,-p.s); sctx.fill(); sctx.restore();
      }else{ sctx.beginPath(); sctx.arc(p.x,p.y,p.s,0,6.3); sctx.fill(); }
    }
    sctx.globalAlpha=1;
  }
  function drawFx(dt,dy,t){
    if(!fctx)return;
    var night=isNight(), k=dt/16, i;
    /* emitters: every visible fire throws sparks */
    for(i=0;i<emitters.length;i++){
      var em=emitters[i]; if(!em.vis)continue;
      var lv=em.lv?em.lv():1;
      if(Math.random()<.07*lv*k){
        var r=em.el.getBoundingClientRect(); if(r.bottom<0||r.top>CH)continue;
        spark(r.left+r.width*rnd(.3,.7),r.top+r.height*rnd(.2,.6),rnd(-.35,.35),-rnd(.7,1.9)*Math.min(1.6,.6+lv*.4),rnd(700,1500),Math.random()<.5?'#FFB347':'#F0712F',rnd(1.6,2.8)*(small?.9:1));
      }
    }
    if(!sparks.length&&!night&&!shoot){ if(fx.__dirty){fctx.setTransform(DPR,0,0,DPR,0,0);fctx.clearRect(0,0,CW,CH);fx.__dirty=0;} return; }
    fx.__dirty=1;
    fctx.setTransform(DPR,0,0,DPR,0,0); fctx.clearRect(0,0,CW,CH);
    for(i=sparks.length-1;i>=0;i--){
      var s=sparks[i]; s.l-=dt; if(s.l<=0){sparks.splice(i,1);continue;}
      s.vy+=s.g*k; s.x+=(s.vx+Math.sin((s.l+i*90)/140)*.3)*k; s.y+=s.vy*k-dy;
      fctx.globalAlpha=Math.min(1,s.l/s.m*1.6); fctx.fillStyle=s.c; fctx.fillRect(s.x-s.s/2,s.y-s.s/2,s.s,s.s);
    }
    if(night){
      for(i=0;i<flies.length;i++){
        var f=flies[i]; f.a+=rnd(-.09,.09)*k; f.ph+=.035*k;
        if(ptr.on){var ax=ptr.x-f.x, ay=ptr.y-f.y, dd=ax*ax+ay*ay; if(dd<52000&&dd>900){f.x+=ax/Math.sqrt(dd)*.25*k; f.y+=ay/Math.sqrt(dd)*.25*k;}}
        f.x+=Math.cos(f.a)*f.sp*k; f.y+=Math.sin(f.a)*f.sp*.7*k-dy*.35;
        if(f.y>CH+10)f.y=-10; if(f.y<-12)f.y=CH+10; if(f.x>CW+10)f.x=-10; if(f.x<-12)f.x=CW+10;
        var b=.5+.5*Math.sin(f.ph); b=b*b;
        fctx.fillStyle=f.c; fctx.globalAlpha=.1+.16*b; fctx.beginPath(); fctx.arc(f.x,f.y,6.5,0,6.3); fctx.fill();
        fctx.globalAlpha=.3+.7*b; fctx.beginPath(); fctx.arc(f.x,f.y,1.7,0,6.3); fctx.fill();
      }
      if(!shoot&&t>shootAt){ if(shootAt)shoot={x:rnd(CW*.25,CW*.95),y:rnd(10,CH*.3),l:0}; shootAt=t+(shootAt?rnd(6000,13000):2600); }
      if(shoot){
        shoot.l+=dt; var q=shoot.l/700;
        if(q>=1)shoot=null; else{
          var hx=shoot.x-q*230, hy=shoot.y+q*120, g=fctx.createLinearGradient(hx,hy,hx+90,hy-47);
          g.addColorStop(0,'rgba(246,239,217,'+(q<.2?q*5:(1-q)*1.2).toFixed(2)+')'); g.addColorStop(1,'rgba(246,239,217,0)');
          fctx.globalAlpha=1; fctx.strokeStyle=g; fctx.lineWidth=2.2; fctx.lineCap='round'; fctx.beginPath(); fctx.moveTo(hx,hy); fctx.lineTo(hx+90,hy-47); fctx.stroke();
        }
      }
    }else{shoot=null;shootAt=0;}
    fctx.globalAlpha=1;
  }
  var visIO=new IntersectionObserver(function(es){es.forEach(function(e){if(e.target.__vis)e.target.__vis.vis=e.isIntersecting;});},{rootMargin:'40px'});
  function watch(node,obj){obj.el=node;obj.vis=false;node.__vis=obj;visIO.observe(node);return obj;}

  /* ================= fires: sparks + tap to flare ================= */
  safe(function(){
    $$('svg.fire').forEach(function(f){
      var cf=f.closest('.campfire'), em=watch(f,{lv:function(){return cf?(cf.__lv||1):(f.__flare?3:1);}});
      emitters.push(em);
      if(cf)return;
      f.addEventListener('click',function(){
        var r=f.getBoundingClientRect();
        f.classList.add('flare'); f.__flare=1; burst(r.left+r.width/2,r.top+r.height*.45,small?14:22,null,1.1);
        clearTimeout(f.__ft); f.__ft=setTimeout(function(){f.classList.remove('flare');f.__flare=0;},900);
      });
    });
  });

  /* ================= springs (compass, hanging tags) ================= */
  var springs=[];
  function spring(node,o){o.a=0;o.v=0;o.el=node;o.rest=true;watch(node,o);springs.push(o);return o;}
  function stepSprings(dt,vel){
    var k=Math.min(dt,34)/16;
    for(var i=0;i<springs.length;i++){
      var s=springs[i]; if(!s.vis&&s.rest)continue;
      var push=clamp(vel,-60,60)*s.gain;
      if(s.rest&&Math.abs(push)<.02)continue;
      s.v+=(-s.k*s.a-s.c*s.v+push)*k; s.a=clamp(s.a+s.v*k,-s.max,s.max);
      s.rest=Math.abs(s.a)<.05&&Math.abs(s.v)<.05&&Math.abs(push)<.02;
      if(s.rest){s.a=0;s.v=0;}
      s.set(s.a);
    }
  }
  safe(function(){
    $$('.compass .needle').forEach(function(n){spring(n,{k:.03,c:.05,gain:.11,max:170,set:function(a){n.style.transform='rotate('+a.toFixed(2)+'deg)';}});});
    $$('.htag').forEach(function(n,i){spring(n,{k:.035+i*.006,c:.06,gain:.035+((i*7)%3)*.008,max:30,set:function(a){n.style.rotate=a.toFixed(2)+'deg';}});});
    $$('.tag').forEach(function(n){spring(n,{k:.05,c:.09,gain:.012,max:9,set:function(a){n.style.rotate=a.toFixed(2)+'deg';}});});
  });

  /* ================= progress trail + hero parallax ================= */
  var prog, progI, progB, far, clouds, heroH=0;
  safe(function(){
    prog=el('div','mo-prog','<i></i><b></b>'); prog.setAttribute('aria-hidden','true'); doc.body.appendChild(prog);
    progI=prog.firstChild; progB=prog.lastChild;
    far=$('.s-far'); clouds=$('.s-clouds'); var hero=$('.hero'); if(hero)heroH=hero.offsetHeight;
  });
  function onScrollFrame(y){
    if(progI){
      var max=Math.max(1,root.scrollHeight-win.innerHeight), p=clamp(y/max,0,1);
      progI.style.clipPath='inset(0 '+((1-p)*100).toFixed(2)+'% 0 0)';
      progB.style.transform='translateX('+(p*win.innerWidth).toFixed(1)+'px) rotate('+(Math.sin(y/26)*12).toFixed(1)+'deg)';
    }
    if(far&&y<heroH+200){
      var o=Math.max(0,y-(heroH-win.innerHeight-300));
      far.style.transform='translateY('+(Math.min(46,o*.05)).toFixed(1)+'px)';
      if(clouds)clouds.style.transform='translateY('+(-Math.min(30,o*.03)).toFixed(1)+'px)';
    }
  }

  /* ================= frame loop ================= */
  var last=0, sy=win.pageYOffset, vel=0, frame=0, running=false, accS=0, accDy=0;
  function tick(t){
    if(!running)return; requestAnimationFrame(tick);
    var dt=last?Math.min(60,t-last):16; last=t; frame++;
    var y=win.pageYOffset, dy=y-sy; sy=y;
    vel+=(dy/dt*16-vel)*.3; if(Math.abs(vel)<.01)vel=0;
    if(dy!==0||frame<3)safe(function(){onScrollFrame(y);});
    stepSprings(dt,vel);
    drawFx(dt,dy,t);
    accS+=dt; accDy+=dy;
    if(frame%2===0){drawSky(accS,accDy);accS=0;accDy=0;}
  }
  function start(){if(running||doc.hidden)return;running=true;last=0;requestAnimationFrame(tick);}
  doc.addEventListener('visibilitychange',function(){ if(doc.hidden)running=false; else start(); });

  /* ================= interactions ================= */
  /* prints: nudge with a finger, spring back; tap = wobble */
  safe(function(){
    doc.addEventListener('dragstart',function(e){if(e.target&&e.target.closest&&e.target.closest('.print'))e.preventDefault();});
    $$('.print').forEach(function(p){
      var sx=0, sy0=0, id=null, moved=false;
      p.addEventListener('pointerdown',function(e){
        if(e.button)return; id=e.pointerId; sx=e.clientX; sy0=e.clientY; moved=false;
        try{p.setPointerCapture(id);}catch(x){}
      });
      p.addEventListener('pointermove',function(e){
        if(e.pointerId!==id)return;
        var dx=e.clientX-sx, dy=e.clientY-sy0;
        if(!moved&&Math.abs(dx)+Math.abs(dy)<6)return;
        moved=true; p.classList.add('drag');
        var tx=54*Math.tanh(dx/110), ty=(e.pointerType==='touch'?12:44)*Math.tanh(dy/110);
        p.style.translate=tx.toFixed(1)+'px '+ty.toFixed(1)+'px'; p.style.rotate=(tx*.11).toFixed(2)+'deg'; p.style.scale='1.04';
      });
      function end(e){
        if(e.pointerId!==id)return; id=null;
        p.classList.remove('drag'); p.style.translate=''; p.style.rotate=''; p.style.scale='';
        if(!moved&&e.type==='pointerup')wa(p,[{rotate:'0deg',scale:'1'},{rotate:'5deg',scale:'1.05'},{rotate:'-4deg',scale:'1.04'},{rotate:'2deg',scale:'1.01'},{rotate:'0deg',scale:'1'}],{duration:560,easing:'ease-out'});
      }
      p.addEventListener('pointerup',end); p.addEventListener('pointercancel',end);
    });
  });
  /* buttons: marshmallow squash + sparks */
  safe(function(){
    function squash(b,x,y){
      wa(b,[{scale:'1 1'},{scale:'1.12 .78'},{scale:'.93 1.1'},{scale:'1.04 .96'},{scale:'1 1'}],{duration:460,easing:'ease-out'});
      var r=b.getBoundingClientRect(); burst(x==null?r.left+r.width/2:x,y==null?r.top:y,small?10:16);
    }
    doc.addEventListener('pointerdown',function(e){var b=e.target.closest&&e.target.closest('.btn');if(b)squash(b,e.clientX,e.clientY);},{passive:true});
    doc.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){var b=doc.activeElement;if(b&&b.classList&&b.classList.contains('btn'))squash(b);} });
    doc.addEventListener('pointerdown',function(e){
      var s=e.target.closest&&e.target.closest('.stamp');
      if(s&&e.pointerType!=='mouse')wa(s,[{scale:'1'},{scale:'.86'},{scale:'1.08'},{scale:'1'}],{duration:380,easing:'ease-out'});
    },{passive:true});
  });
  /* memo cards lean toward the pointer */
  if(hover)safe(function(){
    $$('.memo').forEach(function(m){
      m.addEventListener('pointermove',function(e){
        var r=m.getBoundingClientRect(), fx=(e.clientX-r.left)/r.width-.5, fy=(e.clientY-r.top)/r.height-.5;
        m.style.rotate=(fx*1.8).toFixed(2)+'deg'; m.style.translate=(fx*6).toFixed(1)+'px '+(fy*5).toFixed(1)+'px';
      });
      m.addEventListener('pointerleave',function(){m.style.rotate='';m.style.translate='';});
    });
  });
  /* FAQ: fold shut before closing */
  safe(function(){
    $$('.faq-list details').forEach(function(d){
      var s=$('summary',d); if(!s)return;
      s.addEventListener('click',function(e){
        if(d.classList.contains('folding')){e.preventDefault();return;}
        if(!d.open){d.classList.add('opened');return;}
        e.preventDefault(); d.classList.add('folding');
        setTimeout(function(){d.open=false;d.classList.remove('folding');},210);
      });
    });
  });

  /* ================= night switch: sky wipe, sun & moon, lanterns ================= */
  var lanterns=[];
  function orderLanterns(){
    var k=0;
    lanterns.forEach(function(l){var r=l.getBoundingClientRect();l.style.setProperty('--li',r.bottom<0?0:Math.min(k++,7));});
  }
  safe(function(){
    var LS='<svg viewBox="0 0 30 54" focusable="false"><path d="M15 0v14" stroke="currentColor" stroke-width="2"/><circle class="lg" cx="15" cy="31" r="30" fill="url(#glowg)"/><path d="M9 14h12l2 5H7z" fill="currentColor"/><rect class="ll" x="8" y="19" width="14" height="20" rx="3"/><path d="M7 39h16l-2 5H9z" fill="currentColor"/></svg>';
    $$('.band').forEach(function(b){
      if(b.classList.contains('top')||b.classList.contains('page-head'))return;
      var l=el('i','lantern',LS); l.setAttribute('aria-hidden','true'); b.appendChild(l); lanterns.push(l);
    });
    orderLanterns();
    win.fnWipe=function(sw,night,apply){
      var r=sw.getBoundingClientRect();
      root.style.setProperty('--wx',(r.right-32).toFixed(0)+'px'); root.style.setProperty('--wy',(r.top+r.height/2).toFixed(0)+'px');
      orderLanterns();
      if(!doc.startViewTransition){
        root.classList.add('theme-anim'); apply(night);
        setTimeout(function(){root.classList.remove('theme-anim');},950); return;
      }
      var arc=null, done=function(){root.classList.remove('wiping');if(arc&&arc.parentNode)arc.parentNode.removeChild(arc);};
      root.classList.add('wiping');
      var vt=doc.startViewTransition(function(){
        apply(night);
        arc=el('div','skyarc '+(night?'to-night':'to-day'),'<i class="sa-sun"><b></b></i><i class="sa-moon"><b></b></i>');
        arc.setAttribute('aria-hidden','true'); doc.body.appendChild(arc);
      });
      vt.finished.then(done,done); setTimeout(done,1600);
    };
  });

  /* ================= home: the living poster ================= */
  safe(function(){
    var scene=$('.scene'); if(!scene)return;
    var tent=$$('.s-tent,.s-door',scene);
    tent.forEach(function(t){
      t.addEventListener('click',function(){
        var on=scene.classList.contains('lamp-on')||(isNight()&&!scene.classList.contains('lamp-off'));
        scene.classList.toggle('lamp-on',!on); scene.classList.toggle('lamp-off',on);
        tent.forEach(function(x){wa(x,[{transform:'none'},{transform:'scale(1.05,.93)'},{transform:'scale(.98,1.04)'},{transform:'none'}],{duration:380,easing:'ease-out'});});
        if(!on){var r=tent[0].getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height*.55,8,['#FFC766','#FFE3A1'],.6);}
      });
      t.style.transformBox='fill-box'; t.style.transformOrigin='50% 100%';
    });
  });

  /* ================= food: feed the campfire ================= */
  safe(function(){
    var cf=doc.getElementById('campfire'); if(!cf)return;
    var svg=$('.cf-svg',cf), logs=$('.cf-logs',cf), fire=$('svg.fire',cf), cap=$('.cf-cap',cf), h=$('.cf-txt .h3',cf), n=0, idle;
    var POS=[[150,213,-7],[136,206,17],[166,204,-21],[150,197,5],[141,190,-13]];
    var SAY=['','パチッ。いい音です。','火が育ってきました。','フライパンが鳴りはじめました。','ちょうどいい火です。焼きごろ。','薪はここまで。22時には火を落とします。'];
    if(h)h.textContent='火を、育ててみる。';
    if(cap)cap.textContent='絵の火をたたくか、下のボタンで薪をくべられます。5本まで。';
    var ui=el('div','cf-ui','<button type="button" class="btn btn-s cf-btn">薪を一本くべる</button><p class="cf-say" role="status" aria-live="polite">くべた薪：0本</p>');
    $('.cf-txt',cf).appendChild(ui);
    var say=$('.cf-say',ui);
    function level(){
      cf.__lv=.9+n*.5; cf.style.setProperty('--lv',(.8+n*.17).toFixed(2)); cf.style.setProperty('--st',(.2+n*.16).toFixed(2));
      cf.classList.toggle('sizzle',n>=3);
    }
    function decay(){
      clearTimeout(idle);
      idle=setTimeout(function(){
        if(n>0){n--; var g=logs.lastChild; if(g){var a=wa(g,[{opacity:1},{opacity:0}],{duration:900,fill:'forwards'}); setTimeout(function(){if(g.parentNode)g.parentNode.removeChild(g);},920);} level(); decay();}
      },9000);
    }
    function add(){
      var r=fire.getBoundingClientRect();
      if(n>=5){say.textContent='これ以上は、スタッフに止められます。'; wa(svg,[{translate:'0 0'},{translate:'-5px 0'},{translate:'4px 0'},{translate:'-2px 0'},{translate:'0 0'}],{duration:360}); decay(); return;}
      var p=POS[n], g=doc.createElementNS(SVGNS,'g'), l=doc.createElementNS(SVGNS,'path');
      g.setAttribute('transform','translate('+p[0]+' '+p[1]+') rotate('+p[2]+')'); l.setAttribute('class','cf-log'); l.setAttribute('d','M-27 0h54');
      g.appendChild(l); logs.appendChild(g);
      wa(l,[{transform:'translateY(-150px) rotate(-40deg)',opacity:0},{transform:'translateY(-150px) rotate(-40deg)',opacity:1,offset:.05},{transform:'translateY(4px) rotate(4deg)',opacity:1,offset:.7},{transform:'translateY(-6px) rotate(-2deg)',offset:.85},{transform:'none',opacity:1}],{duration:480,easing:'ease-in'});
      n++; level();
      setTimeout(function(){fire.classList.add('flare');burst(r.left+r.width/2,r.top+r.height*.5,(small?10:18)+n*3,null,1+n*.12);setTimeout(function(){fire.classList.remove('flare');},500);},330);
      say.textContent='くべた薪：'+n+'本。'+SAY[n];
      decay();
    }
    $('.cf-btn',ui).addEventListener('click',add);
    fire.addEventListener('click',add);
    level();
  });

  /* ================= day: footprints, sky along the trail ================= */
  safe(function(){
    var box=doc.getElementById('trailBox'), sec=doc.getElementById('course'); if(!box||!sec)return;
    var svg=doc.getElementById('trailSvg'), g=doc.createElementNS(SVGNS,'g'), fps=[], cuts=null;
    g.setAttribute('id','trailPrints'); svg.insertBefore(g,svg.firstChild);
    var head=$('.course-head',sec), tagEl=null, NAMES={day:'午後',dusk:'夕暮れ',night:'夜',morning:'朝'};
    if(head){tagEl=el('p','sky-tag','<i></i><span>いまの空：午後</span>');tagEl.setAttribute('aria-hidden','true');head.appendChild(tagEl);}
    win.fnTrailBuilt=function(path,len,ys){
      while(g.firstChild)g.removeChild(g.firstChild); fps=[];
      var step=small?30:36, i=0;
      for(var s=26;s<len-10;s+=step,i++){
        var p=path.getPointAtLength(s), q=path.getPointAtLength(s+3), ang=Math.atan2(q.y-p.y,q.x-p.x), side=(i%2?1:-1)*9;
        var x=p.x-Math.sin(ang)*side, y=p.y+Math.cos(ang)*side, f=doc.createElementNS(SVGNS,'g');
        f.setAttribute('class','fp'); f.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+(ang*180/Math.PI+90).toFixed(0)+')');
        f.innerHTML='<g><ellipse cx="0" cy="-3" rx="3.6" ry="5.6"/><ellipse cx="0" cy="6" rx="2.6" ry="2.2"/></g>';
        g.appendChild(f); fps.push([s,f,false]);
      }
      if(ys&&ys.length>=7){var a=ys[0], span=ys[ys.length-1]-a, pp=ys.map(function(v){return (v-a)/span;}); cuts=[(pp[1]+pp[2])/2,(pp[2]+pp[3])/2,(pp[4]+pp[5])/2];}
    };
    var cur='';
    win.fnTrailHook=function(p,L){
      for(var i=0;i<fps.length;i++){var on=fps[i][0]<=L-8; if(on!==fps[i][2]){fps[i][2]=on;fps[i][1].setAttribute('class',on?'fp on':'fp');}}
      if(!cuts)return;
      var s=p<cuts[0]?'day':(p<cuts[1]?'dusk':(p<cuts[2]?'night':'morning'));
      if(s!==cur){cur=s; if(s==='day')sec.removeAttribute('data-sky'); else sec.setAttribute('data-sky',s); if(tagEl)tagEl.lastChild.textContent='いまの空：'+NAMES[s];}
    };
  });

  /* ================= access: car and train on the map ================= */
  safe(function(){
    var map=$('.map.big'); if(!map)return;
    var road=$('.m-road',map), go=$('.m-go',map), car=$('.m-car',map), train=$('.m-train',map), tent=$('.m-tent',map), busy=false;
    if(!road||!go||!car)return;
    var note=$('.map-fig .note'); if(note){var hint=el('p','note map-hint');hint.textContent='地図をたたくと、もう一度走ります。';note.parentNode.insertBefore(hint,note.nextSibling);}
    var len=road.getTotalLength();
    function place(t){
      var p=road.getPointAtLength(len*t), q=road.getPointAtLength(Math.min(len,len*t+2)), a=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
      car.setAttribute('transform','translate('+p.x.toFixed(1)+' '+p.y.toFixed(1)+') rotate('+a.toFixed(0)+')');
      go.style.strokeDashoffset=(t<=0?1.05:1-t).toFixed(4);
      car.setAttribute('class',p.y<126?'m-car lit':'m-car');
    }
    function run(){
      if(busy)return; busy=true; place(0); car.style.opacity=0;
      if(train)wa(train,[{transform:'translateX(130px)'},{transform:'translateX(-6px)',offset:.8},{transform:'none'}],{duration:1000,easing:'cubic-bezier(.2,.7,.3,1)'});
      var st=null, dur=3300;
      function step(ts){
        if(st===null)st=ts+1000;
        var k=clamp((ts-st)/dur,0,1), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
        if(ts>=st){car.style.opacity=1;place(e);}
        if(k<1)requestAnimationFrame(step);
        else{busy=false; if(tent)wa(tent,[{transform:'none'},{transform:'scale(1.3,.8)'},{transform:'scale(.9,1.2)'},{transform:'none'}],{duration:500,easing:'ease-out'});
          var r=(tent||car).getBoundingClientRect(); burst(r.left+r.width/2,r.top+r.height/2,small?10:16);}
      }
      requestAnimationFrame(step);
    }
    if(tent){tent.style.transformBox='fill-box';tent.style.transformOrigin='50% 100%';}
    onShow('.map',function(){setTimeout(run,500);});
    map.addEventListener('click',run);
  });

  /* ================= reserve: punched ticket, handwriting, 受付 stamp ================= */
  safe(function(){
    var form=doc.getElementById('bookForm'); if(!form)return;
    var stub=$('.t-stub'), ticket=$('.ticket'), REQ=[['f-date','日付'],['f-name','名前'],['f-tel','電話'],['f-mail','メール']], holes={}, nOn=0;
    var FS='<svg class="fscrib" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="M1 5c7-4 12 3 20 0s13-4 20 0 13 3 20-1 12-3 19 0 12 2 19 0"/></svg>';
    $$('.field',form).forEach(function(f){
      var c=$('input,select,textarea',f); if(!c)return;
      c.insertAdjacentHTML('afterend',FS); var s=c.nextElementSibling;
      function pos(){s.style.top=(c.offsetTop+c.offsetHeight+2)+'px';}
      function chk(){var v=!!String(c.value||'').trim()&&(!c.checkValidity||c.checkValidity());f.classList.toggle('ok',c.tagName==='SELECT'?!!f.__touched:v);}
      pos(); c.addEventListener('focus',pos); win.addEventListener('resize',pos);
      c.addEventListener('input',chk); c.addEventListener('change',function(){f.__touched=1;chk();}); c.addEventListener('blur',chk);
    });
    if(stub){
      var p=el('div','punch','<p>記入のしるし</p><div>'+REQ.map(function(r){return '<i data-for="'+r[0]+'">'+r[1]+'</i>';}).join('')+'</div>');
      p.setAttribute('aria-hidden','true'); stub.insertBefore(p,stub.firstChild);
      $$('i',p).forEach(function(i){holes[i.getAttribute('data-for')]=i;});
      REQ.forEach(function(r){
        var c=doc.getElementById(r[0]); if(!c)return;
        function upd(){
          var ok=!!String(c.value||'').trim()&&(!c.checkValidity||c.checkValidity()), h=holes[r[0]], was=h.classList.contains('on');
          if(ok===was)return; h.classList.toggle('on',ok); nOn+=ok?1:-1;
          if(ok){var b=h.getBoundingClientRect();burst(b.left+b.width/2,b.top+14,6,['#FFFBF0','#E9DFC8','#E8602C'],.5);}
          $('p',p).textContent=nOn===4?'記入ずみ。あとは送るだけ':'記入のしるし';
          if(nOn===4&&ok&&ticket)wa(ticket,[{rotate:'0deg'},{rotate:'1.2deg'},{rotate:'-1deg'},{rotate:'.4deg'},{rotate:'0deg'}],{duration:520,easing:'ease-out'});
        }
        c.addEventListener('change',upd); c.addEventListener('blur',upd); c.addEventListener('input',function(){if(c.type!=='text')upd();});
      });
    }
    form.addEventListener('submit',function(){
      var box=$('.msg-box',form); if(!box)return;
      var old=$('.uke',box); if(old)box.removeChild(old);
      var u=el('span','uke','<b>受付</b><small>デモ</small>'); u.setAttribute('aria-hidden','true');
      box.classList.add('done'); box.appendChild(u);
      setTimeout(function(){var r=u.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,small?10:18,['#B3260C','#E8602C','#1B1F1C'],.8);},380);
    });
  });

  /* ================= go ================= */
  all=$$(SEL_A+','+SEL_B+','+SEL_C);
  /* intro headings must not wait for the observer */
  $$('.page-head h1,.hero h1').forEach(function(h){show(h,0);});
  all.forEach(function(n){if(!n.__in)io.observe(n);});
  win.__mo=1;
  setTimeout(function(){root.classList.add('intro-done');},2300);
  setTimeout(sweep,2500);
  var st; win.addEventListener('scroll',function(){clearTimeout(st);st=setTimeout(function(){
    all.forEach(function(n){ if(n.__in)return; var r=n.getBoundingClientRect(); if((r.width||r.height)&&r.bottom<win.innerHeight*.9)show(n,0); });
  },260);},{passive:true});
  start();
})();
