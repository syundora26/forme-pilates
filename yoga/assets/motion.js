/* 呼吸舎 — motion layer 「呼吸」. Vanilla JS; runs only when html.mo is allowed. */
(function(){
  'use strict';
  var root=document.documentElement,W=window;
  var reduce=W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!W.IntersectionObserver||!W.requestAnimationFrame){root.classList.remove('mo','mo-arrive');return;}
  W.__mo=1;root.classList.add('mo');

  function $(s,c){return (c||document).querySelector(s);}
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));}
  function el(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e;}
  function svg(tag,attrs){var e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(var k in attrs)e.setAttribute(k,attrs[k]);return e;}
  function clamp(v,a,b){return v<a?a:v>b?b:v;}
  function smooth(a,b,v){var t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);}
  function safe(fn){try{fn();}catch(e){if(W.console)console.warn('motion:',e);}}
  function anim(e,kf,o){return e.animate?e.animate(kf,o):null;}
  var small=W.innerWidth<700;
  var fine=W.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* one rAF-throttled scroll/resize bus */
  var subs=[],queued=false;
  function tick(){queued=false;for(var i=0;i<subs.length;i++)safe(subs[i]);}
  function req(){if(!queued){queued=true;requestAnimationFrame(tick);}}
  function onScroll(fn){subs.push(fn);}
  W.addEventListener('scroll',req,{passive:true});
  W.addEventListener('resize',req);

  /* ============ page transition: the breath covers the page ============ */
  safe(function(){
    function clear(){$$('.mo-veil').forEach(function(v){v.remove();});}
    W.addEventListener('pageshow',function(e){if(e.persisted)clear();});
    document.addEventListener('click',function(e){
      if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      var a=e.target.closest&&e.target.closest('a[href]');
      if(!a||a.target||a.hasAttribute('download'))return;
      var raw=a.getAttribute('href');
      if(!raw||/^(#|tel:|mailto:|https?:|javascript:)/i.test(raw))return;
      var to;
      try{
        to=new URL(a.href,location.href);
        if(to.pathname===location.pathname&&to.search===location.search)return;
        var x=e.clientX,y=e.clientY;
        if(!x&&!y){var r=a.getBoundingClientRect();x=r.left+r.width/2;y=r.top+r.height/2;}
        var w=W.innerWidth,h=W.innerHeight;
        var rad=Math.sqrt(Math.pow(Math.max(x,w-x),2)+Math.pow(Math.max(y,h-y),2))*1.08;
        var veil=el('div','mo-veil'),c=el('i');
        veil.setAttribute('aria-hidden','true');
        c.style.cssText='left:'+(x-rad)+'px;top:'+(y-rad)+'px;width:'+rad*2+'px;height:'+rad*2+'px';
        veil.appendChild(c);document.body.appendChild(veil);
        try{sessionStorage.setItem('mo-veil','1');}catch(_){}
        e.preventDefault();
        setTimeout(function(){location.href=to.href;},390);
        setTimeout(clear,2500);
      }catch(err){/* fall through to the normal navigation */}
    });
  });

  /* ============ headlines ============ */
  var BRUSH='M1 7.2C28 2.4 62 2.6 104 5.2S172 8.6 199 4.6C173 10.8 121 10 91 8.9S29 8.6 1 7.2Z';
  function addBrush(h){
    if(!h.matches('main h1,.sec h2,.tease h2,.day__intro h2,.book h2')||h.matches('.person h2,.policy h2'))return null;
    var s=svg('svg',{'class':'mo-brush',viewBox:'0 0 200 12',preserveAspectRatio:'none','aria-hidden':'true',focusable:'false'});
    s.appendChild(svg('path',{d:BRUSH}));
    return s;
  }
  function splitHead(h){
    var orig=h.innerHTML,label=h.textContent.replace(/\s+/g,' ').trim();
    var walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,null);
    var n,range=document.createRange(),nodes=[],prevBottom=null,afterBr=true,count=0;
    while((n=walker.nextNode())){
      if(n.nodeType===1){if(n.tagName==='BR')afterBr=true;continue;}
      var chars=Array.from(n.nodeValue),off=0,list=[];
      for(var k=0;k<chars.length;k++){
        var ch=chars[k],it={ch:ch,space:/\s/.test(ch),nl:false};
        if(!it.space){
          range.setStart(n,off);range.setEnd(n,off+ch.length);
          var r=range.getBoundingClientRect();
          if(prevBottom!==null&&!afterBr&&r.height&&r.top>prevBottom-2)it.nl=true;
          if(r.height)prevBottom=r.bottom;
          afterBr=false;count++;
        }
        off+=ch.length;list.push(it);
      }
      nodes.push([n,list]);
    }
    if(!count)return;
    var i=0,step=Math.min(48,Math.round(520/count));
    nodes.forEach(function(pair){
      var node=pair[0],frag=document.createDocumentFragment(),first=true,lead=null;
      pair[1].forEach(function(it){
        if(it.space){frag.appendChild(document.createTextNode(it.ch));return;}
        if(it.nl){
          var br=el('br','mo-br');
          if(first){lead=br;}else frag.appendChild(br);
        }
        var s=el('i','mo-ch');s.setAttribute('aria-hidden','true');s.style.setProperty('--i',i++);s.textContent=it.ch;
        frag.appendChild(s);first=false;
      });
      if(lead){var t=node;while(t.parentNode!==h&&!t.previousSibling)t=t.parentNode;t.parentNode.insertBefore(lead,t);}
      node.parentNode.replaceChild(frag,node);
    });
    h.style.setProperty('--st',step+'ms');
    h.setAttribute('aria-label',label);
    h.style.whiteSpace='nowrap';
    if(h.scrollWidth>h.clientWidth+2)h.style.whiteSpace='';
    var brush=addBrush(h);
    if(brush){brush.style.setProperty('--bd',(count*step+250)+'ms');h.appendChild(brush);}
    var cs=getComputedStyle(h);
    var wait=parseFloat(cs.getPropertyValue('--d'))||0;
    wait+=(parseFloat(cs.getPropertyValue('--d0'))||0)+(parseFloat(cs.getPropertyValue('--arr'))||0);
    setTimeout(function(){
      h.innerHTML=orig;h.removeAttribute('aria-label');h.style.whiteSpace='';
      if(brush){brush.style.animation='none';h.appendChild(brush);}
    },wait+count*step+1250);
  }

  /* ============ numbers: fade through like counted breaths ============ */
  function fadeNum(node){anim(node,[{opacity:0,transform:'translateY(.28em)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:260,easing:'ease-out'});}
  function countThrough(node,frames,delay){
    var i=0;node.textContent=frames[0];
    setTimeout(function(){
      fadeNum(node);
      var id=setInterval(function(){i++;if(i>=frames.length){clearInterval(id);return;}node.textContent=frames[i];fadeNum(node);},250);
    },delay||0);
  }
  function wrapNum(textNode){
    var s=el('span','mo-num');textNode.parentNode.insertBefore(s,textNode);s.appendChild(textNode);
    s.style.minWidth=Math.ceil(s.getBoundingClientRect().width*10)/10+'px';
    return s;
  }
  function countPrice(td,delay){
    var t=td.firstChild;if(!t||t.nodeType!==3)return;
    var fin=t.nodeValue.trim(),v=parseInt(fin.replace(/,/g,''),10);if(!v)return;
    var unit=v>=10000?1000:v>=1000?100:10,frames=[];
    for(var k=1;k<5;k++)frames.push((Math.max(unit,Math.round(v*k/5/unit)*unit)).toLocaleString('en-US'));
    frames.push(fin);
    countThrough(wrapNum(t),frames,delay);
  }
  function countTime(tm,delay){
    var m=/^(\d+):(\d\d)$/.exec(tm.textContent.trim());if(!m)return;
    var total=m[1]*60+ +m[2],frames=[];
    for(var k=3;k>=0;k--){var v=total-k*15;frames.push(Math.floor(v/60)+':'+('0'+v%60).slice(-2));}
    countThrough(wrapNum(tm.firstChild),frames,delay);
  }

  /* ============ showpiece helpers used by the reveal hooks ============ */
  function pond(tr,delay){
    var box=tr.closest('.tbl');if(!box)return;
    var p=$('.mo-pond',box);
    if(!p){p=el('div','mo-pond');p.setAttribute('aria-hidden','true');box.appendChild(p);}
    var a=tr.getBoundingClientRect(),b=box.getBoundingClientRect();
    [0,260].forEach(function(lag,k){
      var ring=el('i');ring.style.top=(a.top-b.top+a.height/2)+'px';ring.style.left=(k?-40:-70)+'px';
      ring.style.animationDelay=(delay+420+lag)+'ms';
      p.appendChild(ring);
      setTimeout(function(){ring.remove();},delay+2600);
    });
  }
  var inkN=0,defs=null;
  function inkWash(fig){
    if(!defs){defs=svg('svg',{'class':'mo-defs','aria-hidden':'true',focusable:'false'});document.body.appendChild(defs);}
    var id='mo-ink-'+(++inkN),cp=svg('clipPath',{id:id,clipPathUnits:'objectBoundingBox'});
    var blots=[[.3,.34,.5,0],[.68,.26,.46,.12],[.44,.66,.56,.2],[.82,.7,.5,.3],[.12,.82,.48,.36],[.56,.44,.78,.4],[.9,.1,.42,.48],[.08,.1,.44,.52],[.5,.5,1.2,.55]];
    var cs=blots.map(function(b){var c=svg('circle',{cx:b[0],cy:b[1],r:0});cp.appendChild(c);return c;});
    defs.appendChild(cp);
    fig.style.clipPath='url(#'+id+')';
    var t0=null,D=1700;
    function step(t){
      if(t0===null)t0=t;
      var p=(t-t0)/D,done=true;
      for(var i=0;i<cs.length;i++){
        var q=clamp((p-blots[i][3])/.45,0,1);if(q<1)done=false;
        q=1-Math.pow(1-q,3);
        cs[i].setAttribute('r',(blots[i][2]*q).toFixed(4));
      }
      if(done){fig.style.clipPath='';cp.remove();}else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var mapDraw=null;

  /* ============ scroll choreography ============ */
  var SEL=[
    'main h1','main h2:not(.vh)','.time h3>b','.time h3>span',
    '.hero__lead','.hero .btn','.hero__note','.sec__lead','.tease__in>div>p','.more','.note','.day__intro p','.time__lead','.book__lead','.book .btn','.book__tel','.policy>p','.policy>ul','.person__role','.person blockquote','.form>:not(.form__msg)','.tbl caption','.tbl__hint','h3.sec__sub','.sec__sub>h3','.mo-prog','.faq details',
    '.photo','.person__ph','.map',
    '.notes','.access','.person dl','.glance','.news','.steps',
    '.notes>div','.access>div','.person dl>div','.glance>li','.news>li','.steps>li',
    '.tbl tr','.cls','.sec','.tease'
  ].join(',');
  var HEAD='main h1,main h2:not(.vh),.time h3>b,.time h3>span';
  function reveal(e,d){
    if(e.classList.contains('is-in'))return;
    e.style.setProperty('--d',d+'ms');
    if(e.matches(HEAD))safe(function(){splitHead(e);});
    e.classList.add('is-in');
    if(e.matches('.tbl--price tbody tr')){safe(function(){pond(e,d);var n=$('.num',e);if(n)countPrice(n,d+380);});}
    else if(e.matches('.cls')){safe(function(){var t=$('.cls__time time',e);if(t)countTime(t,d+450);});}
    else if(e.matches('.person>.photo,.person__ph')){safe(function(){inkWash(e);});}
    else if(e.matches('.map')&&mapDraw){safe(function(){mapDraw(d);});}
  }
  var io=new IntersectionObserver(function(entries){
    var inn=entries.filter(function(en){return en.isIntersecting;});
    inn.sort(function(a,b){return (a.boundingClientRect.top-b.boundingClientRect.top)||(a.boundingClientRect.left-b.boundingClientRect.left);});
    var k=0;
    inn.forEach(function(en){
      var e=en.target;io.unobserve(e);
      var intro=e.closest('.hero,.phead'),plain=e.matches('.sec,.tease');
      reveal(e,(intro||plain)?0:Math.min(k*70,630));
      if(!intro&&!plain)k++;
    });
  },{rootMargin:'0px 0px -9% 0px',threshold:0});
  function inView(e){var r=e.getBoundingClientRect();return r.bottom>0&&r.top<W.innerHeight&&(r.width||r.height);}
  function sweep(){$$(SEL).forEach(function(e){if(!e.classList.contains('is-in')&&inView(e)){io.unobserve(e);reveal(e,0);}});}

  /* ============ features (each isolated) ============ */

  /* ambient 1: drifting motes of light / pollen */
  safe(function(){
    var cv=el('canvas','mo-motes');cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);
    var ctx=cv.getContext('2d');if(!ctx){cv.remove();return;}
    var dpr=Math.min(W.devicePixelRatio||1,1.5),w=0,h=0,N=small?14:36,motes=[],sprites=[];
    ['231,176,143','143,162,134','255,247,228','214,140,96'].forEach(function(rgb){
      var s=el('canvas');s.width=s.height=64;var c=s.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0,'rgba('+rgb+',1)');g.addColorStop(.25,'rgba('+rgb+',.75)');g.addColorStop(1,'rgba('+rgb+',0)');
      c.fillStyle=g;c.fillRect(0,0,64,64);sprites.push(s);
    });
    function size(){w=W.innerWidth;h=W.innerHeight;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
    size();W.addEventListener('resize',size);
    for(var i=0;i<N;i++){var z=.3+Math.random()*.7;motes.push({x:Math.random()*w,y:Math.random()*h,z:z,r:(small?4:5)+z*z*(small?7:11),a:.3+Math.random()*.45,s:sprites[i%4],ph:Math.random()*6.28,f:.25+Math.random()*.5,vx:0,vy:0});}
    var px=-999,py=-999,lastY=W.scrollY,imp=0,last=0,run=false;
    W.addEventListener('pointermove',function(e){px=e.clientX;py=e.clientY;},{passive:true});
    W.addEventListener('pointerdown',function(e){px=e.clientX;py=e.clientY;for(var i=0;i<N;i++){var m=motes[i],dx=m.x-px,dy=m.y-py,d=Math.sqrt(dx*dx+dy*dy)+1;if(d<220){m.vx+=dx/d*(220-d)*.9;m.vy+=dy/d*(220-d)*.9;}}},{passive:true});
    root.addEventListener('pointerleave',function(){px=py=-999;});
    W.addEventListener('scroll',function(){var y=W.scrollY;imp+=(y-lastY);lastY=y;},{passive:true});
    function frame(t){
      if(!run)return;
      var dt=Math.min((t-last)/1000,.05);last=t;
      ctx.clearRect(0,0,w,h);
      var push=imp;imp=0;
      for(var i=0;i<N;i++){
        var m=motes[i];
        m.y-=push*m.z*.3;
        var dx=m.x-px,dy=m.y-py,d2=dx*dx+dy*dy;
        if(d2<19600){var d=Math.sqrt(d2)+1,fo=(140-d)*2.2*dt;m.vx+=dx/d*fo;m.vy+=dy/d*fo;}
        m.vx*=.94;m.vy*=.94;
        m.x+=(Math.sin(t/1000*m.f+m.ph)*9*m.z+4*m.z+m.vx)*dt*(1+m.z);
        m.y+=(-(5+11*m.z)+Math.cos(t/1300*m.f+m.ph)*4+m.vy)*dt*(1+m.z);
        if(m.y<-20||m.y>h+20)m.y=((m.y+20)%(h+40)+(h+40))%(h+40)-20;
        if(m.x<-20||m.x>w+20)m.x=((m.x+20)%(w+40)+(w+40))%(w+40)-20;
        ctx.globalAlpha=m.a*(.7+.3*Math.sin(t/900*m.f+m.ph*2));
        ctx.drawImage(m.s,m.x-m.r,m.y-m.r,m.r*2,m.r*2);
      }
      requestAnimationFrame(frame);
    }
    function start(){if(!run&&!document.hidden){run=true;last=performance.now();requestAnimationFrame(frame);}}
    document.addEventListener('visibilitychange',function(){if(document.hidden)run=false;else start();});
    start();
  });

  /* ambient 2: a patch of sunlight that crosses the page with the scroll */
  safe(function(){
    var sun=el('div','mo-sun');sun.setAttribute('aria-hidden','true');document.body.insertBefore(sun,document.body.firstChild);
    function place(){
      var max=Math.max(1,root.scrollHeight-W.innerHeight),p=clamp(W.scrollY/max,0,1);
      var x=W.innerWidth*(.82-.72*p),y=W.innerHeight*(.12+.62*p+.1*Math.sin(p*9));
      sun.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
    }
    place();onScroll(place);
  });

  /* ambient 3: photos float (slow parallax) */
  safe(function(){
    var live=[];
    var pio=new IntersectionObserver(function(es){es.forEach(function(en){var i=live.indexOf(en.target);if(en.isIntersecting){if(i<0)live.push(en.target);}else if(i>=0)live.splice(i,1);});req();},{rootMargin:'10% 0px'});
    $$('.photo').forEach(function(f){pio.observe(f);});
    onScroll(function(){
      var vh=W.innerHeight;
      for(var i=0;i<live.length;i++){
        var f=live[i],r=f.getBoundingClientRect(),o=clamp((r.top+r.height/2-vh/2)/vh,-1,1),img=f.firstElementChild;
        if(img)img.style.setProperty('--py',(o*-3.6).toFixed(2)+'%');
      }
    });
  });

  /* ambient 4: ripple rings from the breathing circle in the page header (4 s in / 6 s out) */
  safe(function(){
    var b=$('.phead__breath');if(!b)return;
    for(var i=0;i<3;i++)b.appendChild(el('i','mo-ring'));
  });

  /* interaction: buttons ripple like a drop in water; gentle magnetic pull */
  function ripple(host,x,y,ring){
    var r=host.getBoundingClientRect(),s=Math.max(r.width,r.height)*2.2,i=el('span','mo-rip'+(ring?' mo-rip--ring':''));
    i.setAttribute('aria-hidden','true');
    i.style.cssText='left:'+(x-r.left-s/2)+'px;top:'+(y-r.top-s/2)+'px;width:'+s+'px;height:'+s+'px';
    host.appendChild(i);setTimeout(function(){i.remove();},1250);
  }
  safe(function(){
    document.addEventListener('pointerdown',function(e){
      var b=e.target.closest&&e.target.closest('.btn,.nav__book,.menu-btn');
      if(b)safe(function(){ripple(b,e.clientX,e.clientY);setTimeout(function(){ripple(b,e.clientX,e.clientY,true);},140);});
    },{passive:true});
    document.addEventListener('keydown',function(e){
      if(e.key!=='Enter'&&e.key!==' ')return;
      var b=e.target.closest&&e.target.closest('.btn,.nav__book,.menu-btn');
      if(b&&!e.repeat){var r=b.getBoundingClientRect();ripple(b,r.left+r.width/2,r.top+r.height/2);}
    });
    if(fine)$$('.btn').forEach(function(b){
      b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)/r.width*10).toFixed(1)+'px,'+((e.clientY-r.top-r.height/2)/r.height*7).toFixed(1)+'px)';});
      b.addEventListener('pointerleave',function(){b.style.transform='';});
    });
  });

  /* interaction: FAQ answers unfold like fabric; what follows glides (FLIP, transforms only) */
  safe(function(){
    var faq=$('.faq');if(!faq)return;
    function tail(d){
      var out=[],n=d;
      while(n&&n.tagName!=='MAIN'){var s=n.nextElementSibling;while(s){out.push(s);s=s.nextElementSibling;}n=n.parentElement;}
      var f=$('.foot');if(f)out.push(f);
      return out;
    }
    var OPEN=[{opacity:0,clipPath:'inset(0 0 100% 0)',transform:'perspective(700px) rotateX(-38deg) translateY(-10px)'},{opacity:1,clipPath:'inset(0 0 8% 0)',transform:'perspective(700px) rotateX(7deg)',offset:.62},{opacity:1,clipPath:'inset(0 0 0 0)',transform:'perspective(700px) rotateX(0deg)'}];
    var busy=false;
    faq.addEventListener('click',function(e){
      var s=e.target.closest('summary');if(!s)return;
      var d=s.parentNode,body=d.querySelector('div');if(!body||!body.animate)return;
      if(busy){e.preventDefault();return;}
      if(!d.open){
        requestAnimationFrame(function(){
          if(!d.open)return;
          var h=body.offsetHeight;
          anim(body,OPEN,{duration:1100,easing:'cubic-bezier(.45,.05,.3,1)'});
          tail(d).forEach(function(t){anim(t,[{transform:'translateY('+(-h)+'px)'},{transform:'none'}],{duration:900,easing:'cubic-bezier(.45,.05,.3,1)'});});
        });
      }else{
        e.preventDefault();busy=true;
        var h=body.offsetHeight,o={duration:380,easing:'cubic-bezier(.5,0,.6,.4)',fill:'forwards'};
        var list=tail(d).map(function(t){return anim(t,[{transform:'none'},{transform:'translateY('+(-h)+'px)'}],o);});
        var a=anim(body,[OPEN[2],OPEN[0]],o);
        var end=function(){d.open=false;list.forEach(function(x){if(x)x.cancel();});if(a)a.cancel();busy=false;};
        if(a){a.onfinish=end;a.oncancel=function(){busy=false;};setTimeout(function(){if(busy)end();},700);}else end();
      }
    });
  });

  /* interaction: the demo message arrives with a ring of ripples */
  safe(function(){
    var form=$('#form'),msg=$('#form-msg');if(!form||!msg)return;
    form.addEventListener('submit',function(){
      setTimeout(function(){
        if(!msg.textContent)return;
        var book=msg.closest('.book')||msg.parentNode,a=msg.getBoundingClientRect(),b=book.getBoundingClientRect();
        anim(msg,[{opacity:0,transform:'scale(.94)',filter:'blur(6px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:900,easing:'cubic-bezier(.22,.61,.2,1)'});
        var rings=el('span','mo-msg-rings');rings.setAttribute('aria-hidden','true');
        rings.style.left=(a.left-b.left+a.width/2)+'px';rings.style.top=(a.top-b.top+a.height/2)+'px';
        for(var i=0;i<4;i++){var r=el('i');r.style.animationDelay=(i*230)+'ms';rings.appendChild(r);}
        book.appendChild(rings);setTimeout(function(){rings.remove();},3200);
      },0);
    });
  });

  /* showpiece (home): interactive breathing guide */
  safe(function(){
    var b=$('.breath');if(!b)return;
    var hero=b.closest('.hero'),fig=$('.photo',b);
    var rings=el('div','mo-rings');rings.setAttribute('aria-hidden','true');b.insertBefore(rings,b.firstChild);
    var btn=el('button','breath__btn');btn.type='button';btn.setAttribute('aria-label','呼吸のガイド。押しているあいだ息を吸い、離すとゆっくり吐きます');
    var count=el('span','breath__count');count.setAttribute('aria-hidden','true');
    var hint=el('p','breath__hint');hint.setAttribute('aria-hidden','true');hint.innerHTML='円を長押しで<br>いっしょに呼吸';
    b.insertBefore(btn,fig);b.insertBefore(count,fig);b.insertBefore(hint,fig);
    b.classList.add('mo-guide');
    var timers=[],held=false,visible=true,reach=5,loop=false;
    function later(fn,ms){timers.push(setTimeout(fn,ms));}
    function stop(){timers.forEach(clearTimeout);timers=[];loop=false;}
    function measure(){var r=b.getBoundingClientRect(),hr=hero.getBoundingClientRect();reach=Math.max(3,Math.sqrt(hr.width*hr.width+hr.height*hr.height)/r.width*1.15);}
    function ring(kf,o){var i=el('i');rings.appendChild(i);var a=anim(i,kf,o);if(a)a.onfinish=function(){i.remove();};else i.remove();}
    function say(n){count.textContent=n;anim(count,[{opacity:0,transform:'translateY(.4em)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0)',offset:.3},{opacity:.85,transform:'none',offset:.8},{opacity:0,transform:'translateY(-.3em)'}],{duration:1000,easing:'ease-out'});}
    function counting(n){for(var k=0;k<n;k++)(function(k){later(function(){say(k+1);},k*1000);})(k);}
    function inhale(auto){
      stop();loop=true;b.classList.add('is-inhale');
      for(var k=0;k<3;k++)ring([{transform:'scale('+(2.2+k*.5)+')',opacity:0},{opacity:.5,offset:.55},{transform:'scale(1)',opacity:0}],{duration:3600,delay:k*280,easing:'cubic-bezier(.4,0,.5,1)'});
      counting(4);
      if(auto)later(function(){exhale();},4000);
    }
    function exhale(){
      stop();loop=true;b.classList.remove('is-inhale');measure();
      for(var k=0;k<4;k++)ring([{transform:'scale(1)',opacity:.6},{transform:'scale('+reach+')',opacity:0}],{duration:5600,delay:k*520,easing:'cubic-bezier(.15,.5,.3,1)'});
      counting(6);
      later(function(){if(visible&&!document.hidden)inhale(true);else loop=false;},6000);
    }
    function press(e){if(held)return;held=true;if(e&&e.clientX!==undefined)safe(function(){ripple(btn,e.clientX,e.clientY,true);});hint.style.opacity='0';hint.style.transition='opacity .8s';inhale(false);}
    function release(){if(!held)return;held=false;exhale();}
    btn.addEventListener('pointerdown',function(e){if(e.button)return;try{btn.setPointerCapture(e.pointerId);}catch(_){}press(e);});
    btn.addEventListener('pointerup',release);btn.addEventListener('pointercancel',release);btn.addEventListener('lostpointercapture',release);
    btn.addEventListener('contextmenu',function(e){e.preventDefault();});
    btn.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();press();}});
    btn.addEventListener('keyup',function(e){if(e.key===' '||e.key==='Enter')release();});
    btn.addEventListener('blur',release);
    new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible){if(!loop&&!held)inhale(true);}else if(!held)stop();}).observe(hero);
    document.addEventListener('visibilitychange',function(){if(document.hidden){if(!held)stop();}else if(visible&&!loop&&!held)inhale(true);});
    loop=true;later(function(){inhale(true);},700);
  });

  /* showpiece (classes): sky — the sun arcs, clouds drift, dusk blooms, stars come out */
  safe(function(){
    var day=$('.day--live'),host=$('.day__sky');if(!day||!host)return;
    var sky=el('div','sky');
    var dusk=el('div','sky__dusk'),stars=el('div','sky__stars'),sun=el('div','sky__sun'),clouds=el('div','sky__clouds');
    var seed=7;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647;}
    for(var i=0;i<(small?34:70);i++){var s=el('i'),z=rnd();s.style.cssText='left:'+(rnd()*100).toFixed(2)+'%;top:'+(rnd()*92).toFixed(2)+'%;animation-delay:-'+(rnd()*5).toFixed(2)+'s;animation-duration:'+(3+rnd()*4).toFixed(2)+'s'+(z>.82?';width:3px;height:3px':'');stars.appendChild(s);}
    stars.appendChild(el('b'));
    ['a','b','c'].forEach(function(k){clouds.appendChild(el('div','sky__cloud sky__cloud--'+k));});
    sky.appendChild(dusk);sky.appendChild(sun);sky.appendChild(clouds);sky.appendChild(stars);
    host.insertBefore(sky,host.firstChild);
    var w=0,h=0;function size(){w=host.clientWidth;h=host.clientHeight;}
    size();W.addEventListener('resize',function(){size();W.__moSky(day.__t||0);});
    W.__moSky=function(t){
      var u=clamp(t/1.64,0,1),x=w*(.07+.86*u),y=h*(.84-.7*Math.sin(Math.PI*u)),sc=(small?.62:1)*(1+.35*smooth(.7,1,u));
      sun.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) scale('+sc.toFixed(3)+')';
      sun.style.opacity=(smooth(-.02,.08,u)*(1-smooth(1.52,1.66,t))).toFixed(3);
      dusk.style.opacity=(smooth(1.1,1.55,t)*(t>1.6?.2*(1-smooth(1.7,1.95,t)):1)).toFixed(3);
      clouds.style.opacity=(1-smooth(1.35,1.62,t)).toFixed(3);
      stars.style.opacity=smooth(1.62,1.9,t).toFixed(3);
    };
    W.__moSky(day.__t||0);
  });

  /* showpiece (beginners / directions / policy): a line that draws like a river between steps */
  function river(host,anchors,o){
    /* anchors: [y...] in host coordinates; segments flow from anchors[i]+o.from to anchors[i+1]+o.to */
    var s=svg('svg',{'class':'mo-river','aria-hidden':'true',focusable:'false'}),segs=[];
    s.style.left=o.left+'px';s.setAttribute('width',o.w);
    var H=0;
    for(var i=0;i<anchors.length-1;i++){
      var y1=anchors[i]+o.from,y2=anchors[i+1]+o.to;if(y2-y1<24)continue;
      var n=Math.max(2,Math.round((y2-y1)/70)),d='M'+o.x+' '+y1,dy=(y2-y1)/n;
      for(var k=0;k<n;k++){var sgn=k%2?-1:1,ya=y1+dy*k;d+='C'+(o.x+o.amp*sgn)+' '+(ya+dy*.3).toFixed(1)+' '+(o.x+o.amp*sgn)+' '+(ya+dy*.7).toFixed(1)+' '+o.x+' '+(ya+dy).toFixed(1);}
      var wide=svg('path',{'class':'w',d:d}),line=svg('path',{'class':'l',d:d});
      s.appendChild(wide);s.appendChild(line);
      segs.push({y1:y1,y2:y2,w:wide,l:line,len:0});H=y2;
    }
    var knots=[];
    if(o.knots)anchors.forEach(function(y){var c=svg('circle',{'class':'k',cx:o.x,cy:y+o.knots,r:3.5});s.appendChild(c);knots.push({y:y+o.knots,c:c});});
    var head=svg('circle',{'class':'h',r:4.5});s.appendChild(head);
    s.setAttribute('height',H+10);
    host.appendChild(s);
    segs.forEach(function(g){g.len=g.l.getTotalLength();[g.w,g.l].forEach(function(p){p.style.strokeDasharray=g.len;p.style.strokeDashoffset=g.len;});});
    var vis=false;
    new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)req();},{rootMargin:'20% 0px'}).observe(host);
    function draw(){
      if(!vis||!s.isConnected)return;
      var line=W.innerHeight*.7-host.getBoundingClientRect().top,on=null;
      for(var i=0;i<segs.length;i++){
        var g=segs[i],p=clamp((line-g.y1)/(g.y2-g.y1),0,1),off=g.len*(1-p);
        g.w.style.strokeDashoffset=off;g.l.style.strokeDashoffset=off;
        if(p>0&&p<1)on=g.l.getPointAtLength(g.len*p);
      }
      if(on){head.setAttribute('cx',on.x);head.setAttribute('cy',on.y);head.classList.add('is-on');}else head.classList.remove('is-on');
      for(var j=0;j<knots.length;j++)knots[j].c.classList.toggle('is-on',line>knots[j].y);
    }
    onScroll(draw);draw();
    return s;
  }
  safe(function(){
    function build(){
      $$('.mo-river').forEach(function(x){x.remove();});
      $$('.steps').forEach(function(ol){
        var lis=$$(':scope>li',ol);if(lis.length<2)return;
        var ys=lis.map(function(li){return li.offsetTop;});
        river(lis[0],ys,{left:0,w:52,x:9,amp:13,from:72,to:12});
      });
      var pol=$('.policy');
      if(pol){
        pol.style.position='relative';
        var hs=$$(':scope>h2',pol),ys=hs.map(function(h){return h.offsetTop+h.offsetHeight/2;});
        ys.push(pol.offsetHeight-6);
        var g=small?15:26;
        river(pol,ys,{left:-g,w:20,x:8,amp:small?5:7,from:10,to:-10,knots:0.01});
      }
    }
    build();
    var lw=W.innerWidth,to;
    W.addEventListener('resize',function(){if(W.innerWidth===lw)return;lw=W.innerWidth;clearTimeout(to);to=setTimeout(function(){safe(build);},250);});
    W.addEventListener('load',function(){safe(build);});
  });

  /* showpiece (studio): the route as a brush stroke with a walking dot; leaf shadows on the photo */
  safe(function(){
    var fig=$('.map'),s=fig&&$('svg',fig),route=s&&$('.map__route',s);if(!route)return;
    var d=route.getAttribute('d'),L=route.getTotalLength();
    var defs=svg('defs',{});
    var f=svg('filter',{id:'mo-rough',x:'-10%',y:'-10%',width:'120%',height:'120%'});
    f.appendChild(svg('feTurbulence',{type:'fractalNoise',baseFrequency:'.11',numOctaves:'2',seed:'4',result:'n'}));
    f.appendChild(svg('feDisplacementMap',{'in':'SourceGraphic',in2:'n',scale:'5'}));
    defs.appendChild(f);s.insertBefore(defs,s.firstChild);
    var g=svg('g',{'class':'mo-route',filter:'url(#mo-rough)',fill:'none',stroke:'#C97F55','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'});
    var wide=svg('path',{d:d,'stroke-width':'9',opacity:'.3'}),core=svg('path',{d:d,'stroke-width':'3.8'});
    [wide,core].forEach(function(p){p.style.strokeDasharray=L;p.style.strokeDashoffset=L;g.appendChild(p);});
    var ringEl=svg('circle',{cx:286,cy:70,r:17,fill:'none',stroke:'#8FA286','stroke-width':'2',opacity:'0','aria-hidden':'true'});
    ringEl.style.transformBox='fill-box';ringEl.style.transformOrigin='center';
    var dot=svg('circle',{'class':'mo-walker',r:6.5,fill:'#2F3A2E',stroke:'#F4F7F2','stroke-width':'2.5','aria-hidden':'true'});
    route.parentNode.insertBefore(g,route.nextSibling);s.appendChild(ringEl);s.appendChild(dot);
    var vis=false,walking=false;
    new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(fig);
    function walk(dur,draw){
      if(walking)return;walking=true;var t0=null;
      g.classList.add('is-on');dot.classList.add('is-on');
      function step(t){
        if(t0===null)t0=t;
        var q=clamp((t-t0)/dur,0,1),p=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;
        if(draw){core.style.strokeDashoffset=L*(1-p);wide.style.strokeDashoffset=L*(1-Math.pow(p,1.35));}
        var pt=route.getPointAtLength(L*p);
        dot.setAttribute('cx',pt.x.toFixed(1));dot.setAttribute('cy',(pt.y+Math.sin(q*56)*1.3).toFixed(1));
        if(q<1)requestAnimationFrame(step);
        else{walking=false;anim(ringEl,[{transform:'scale(1)',opacity:.9},{transform:'scale(2.6)',opacity:0}],{duration:1400,easing:'ease-out'});}
      }
      requestAnimationFrame(step);
    }
    mapDraw=function(delay){
      setTimeout(function(){walk(3000,true);},delay+700);
      setInterval(function(){if(vis&&!document.hidden)walk(4200,false);},9000);
    };
  });
  safe(function(){
    $$('.photo img[src$="studio-a.jpg"]').forEach(function(img){
      var fig=img.parentNode;
      if(getComputedStyle(fig).position==='static')fig.style.position='relative';
      var s=svg('svg',{'class':'mo-leaves',viewBox:'0 0 400 240',preserveAspectRatio:'xMidYMid slice','aria-hidden':'true',focusable:'false'});
      var seed=11;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647;}
      [['a',300,20],['b',200,0],['c',90,10]].forEach(function(c){
        var g=svg('g',{'class':c[0],fill:'#2F3A2E'});
        for(var i=0;i<13;i++){var x=c[1]+rnd()*130-40,y=c[2]+rnd()*120,r=rnd()*180;g.appendChild(svg('ellipse',{cx:x.toFixed(0),cy:y.toFixed(0),rx:(14+rnd()*16).toFixed(0),ry:(5+rnd()*6).toFixed(0),transform:'rotate('+r.toFixed(0)+' '+x.toFixed(0)+' '+y.toFixed(0)+')'}));}
        s.appendChild(g);
      });
      fig.appendChild(s);
    });
  });

  /* showpiece (reserve): a calm ring that fills breath by breath */
  safe(function(){
    var form=$('#form');if(!form)return;
    var req4=$$('[required]',form);if(!req4.length)return;
    var n=req4.length,box=el('div','mo-prog');
    box.setAttribute('role','progressbar');box.setAttribute('aria-label','入力の進みぐあい');box.setAttribute('aria-valuemin','0');box.setAttribute('aria-valuemax',n);
    var s=svg('svg',{viewBox:'0 0 68 68','aria-hidden':'true',focusable:'false'});
    var defs=svg('defs',{}),gr=svg('radialGradient',{id:'mo-prog-g',cx:'42%',cy:'38%',r:'70%'});
    gr.appendChild(svg('stop',{offset:'0','stop-color':'#E7B08F','stop-opacity':'.85'}));gr.appendChild(svg('stop',{offset:'.6','stop-color':'#BEC4A0','stop-opacity':'.7'}));gr.appendChild(svg('stop',{offset:'1','stop-color':'#8FA286','stop-opacity':'.55'}));
    defs.appendChild(gr);s.appendChild(defs);
    var rip=svg('circle',{'class':'mo-prog__rip',cx:34,cy:34,r:29});
    var inner=svg('g',{'class':'mo-prog__in'});inner.appendChild(svg('circle',{cx:34,cy:34,r:25}));
    var C=2*Math.PI*29;
    var arc=svg('circle',{'class':'mo-prog__arc',cx:34,cy:34,r:29,transform:'rotate(-90 34 34)'});
    arc.style.strokeDasharray=C;arc.style.strokeDashoffset=C;
    s.appendChild(rip);s.appendChild(svg('circle',{'class':'mo-prog__bg',cx:34,cy:34,r:29}));s.appendChild(inner);s.appendChild(arc);
    var p=el('p'),num=el('b'),rest=document.createTextNode('／'+n+' 項目'),line=el('span');
    p.setAttribute('aria-hidden','true');p.appendChild(num);p.appendChild(rest);p.appendChild(line);
    box.appendChild(s);box.appendChild(p);
    form.parentNode.insertBefore(box,form);
    var prev=-1;
    function update(){
      var done=req4.filter(function(f){return f.value&&f.value.trim()&&f.checkValidity();}).length;
      if(done===prev)return;
      arc.style.strokeDashoffset=C*(1-done/n);inner.style.setProperty('--s',(.3+.7*done/n).toFixed(3));
      box.setAttribute('aria-valuenow',done);box.setAttribute('aria-valuetext',n+'項目のうち'+done+'項目を入力ずみ');
      num.textContent=done;line.textContent=done===n?'準備ができました。ひと息ついて、送信を。':'ひとつ入力するたびに、ひと呼吸ぶん進みます。';
      if(prev>=0){fadeNum(num);if(done>prev)anim(rip,[{transform:'scale(1)',opacity:.9},{transform:'scale(1.9)',opacity:0}],{duration:1500,easing:'ease-out'});}
      prev=done;
    }
    form.addEventListener('input',update);form.addEventListener('change',update);
    update();
  });

  /* ============ start the choreography ============ */
  try{
    $$(SEL).forEach(function(e){io.observe(e);});
    setTimeout(function(){safe(sweep);},2500);
    req();
  }catch(e){root.classList.remove('mo');}
})();
