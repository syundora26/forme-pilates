/* PACE TRAINING — motion layer 「ペース」 (vanilla, no dependencies).
   Runs only when <html> has .mo (set in <head>: JS on, motion allowed, IntersectionObserver available).
   If anything here throws, .mo is removed and the page falls back to its plain, fully visible state. */
(function(){
  'use strict';
  var W=window,D=document,root=D.documentElement,cl=root.classList;
  if(!cl.contains('mo'))return;
  var raf=function(f){return W.requestAnimationFrame(f);};
  function q(s,c){return (c||D).querySelector(s);}
  function qa(s,c){return Array.prototype.slice.call((c||D).querySelectorAll(s));}
  function el(t,c,h){var e=D.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
  function deco(e){e.setAttribute('aria-hidden','true');return e;}
  function pad(n){return (n<10?'0':'')+n;}
  function rehit(e,c){c=c||'mo-hit';e.classList.remove(c);void e.offsetWidth;e.classList.add(c);}
  var fine=W.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var SLAM='cubic-bezier(.2,1.6,.35,1)';
  var D0=cl.contains('mo-arrive')?200:0;
  var IMPACT=[{transform:'none'},{transform:'translate(-5px,4px)'},{transform:'translate(4px,-3px)'},{transform:'translate(-3px,2px)'},{transform:'translate(2px,-1px)'},{transform:'none'}];

  try{init();W.__mo=1;}
  catch(err){cl.remove('mo','mo-arrive','mo-intro');W.__moError=String(err&&err.stack||err);}

  function init(){
    /* ================= reveal plumbing ================= */
    var pend=[];
    function mkio(m){return new IntersectionObserver(function(es){
      for(var i=0;i<es.length;i++){var r=es[i].boundingClientRect;if(es[i].isIntersecting||(r.height>0&&r.bottom<0))fire(es[i].target);}
    },{rootMargin:m,threshold:0});}
    var ioA=mkio('0px 0px -8% 0px'),ioB=mkio('0px 0px -22% 0px');
    function watch(e,fn,late){if(!e||e.__w)return;e.__w=1;e.__fn=fn||null;(late?ioB:ioA).observe(e);pend.push(e);}
    function inn(e){e.classList.add('is-in');setTimeout(function(){e.classList.add('is-set');},1700);}
    function fire(e){
      if(e.__f)return;e.__f=1;ioA.unobserve(e);ioB.unobserve(e);
      var i=pend.indexOf(e);if(i>-1)pend.splice(i,1);
      try{(e.__fn||inn)(e);}catch(x){inn(e);}
    }
    function sweep(){ /* reveal whatever is on screen (or already passed) but still waiting */
      var vh=W.innerHeight;
      pend.slice().forEach(function(e){var r=e.getBoundingClientRect();if(r.height>0&&r.top<vh)fire(e);});
    }
    function order(list,cap){list.forEach(function(e,i){e.style.setProperty('--i',Math.min(i,cap||9));});}

    /* things that are "live" only while on screen */
    var visHeads=[],visFrames=[],visMq=[];
    function track(arr,e,on){var i=arr.indexOf(e);if(on&&i<0)arr.push(e);else if(!on&&i>-1)arr.splice(i,1);}
    var vis=new IntersectionObserver(function(es){es.forEach(function(en){
      var e=en.target,on=en.isIntersecting;
      if(e.__k==='h'){track(visHeads,e,on);if(!on)e.__sp.style.removeProperty('--v');}
      else if(e.__k==='f')track(visFrames,e,on);
      else if(e.__k==='m'){track(visMq,e,on);if(on)mqStart();}
      else e.classList.toggle('is-live',on);
    });},{rootMargin:'40px 0px 40px 0px'});

    /* ================= page transition ================= */
    var leaving=false;
    function leave(url){
      if(leaving)return;leaving=true;
      try{
        try{W.sessionStorage.setItem('pace-slash',String(Date.now()));}catch(_){}
        var c=deco(el('div','mo-slash','<i></i><i></i><i></i>'));D.body.appendChild(c);
        setTimeout(function(){W.location.href=url;},330);
        setTimeout(function(){if(c.parentNode)c.parentNode.removeChild(c);leaving=false;},1800); /* navigation did not happen */
      }catch(e){W.location.href=url;}
    }
    D.addEventListener('click',function(e){
      if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      var a=e.target.closest&&e.target.closest('a[href]');
      if(!a||a.target||a.hasAttribute('download'))return;
      var h=a.getAttribute('href');
      if(!h||/^(#|tel:|mailto:|https?:|\/\/)/i.test(h))return;
      var u;try{u=new URL(a.href,W.location.href);}catch(_){return;}
      if(u.protocol!==W.location.protocol||u.host!==W.location.host)return;
      if(u.pathname===W.location.pathname&&u.search===W.location.search)return; /* same page: plain anchor jump */
      if(!/\.html?$/.test(u.pathname))return;
      e.preventDefault();leave(a.href);
    });
    W.addEventListener('pageshow',function(e){
      if(!e.persisted)return;
      qa('.mo-slash').forEach(function(c){c.parentNode.removeChild(c);});leaving=false;cl.remove('mo-arrive');
    });
    if(D0)setTimeout(function(){cl.remove('mo-arrive');},900);

    /* ================= ambient chrome ================= */
    var prog=deco(el('div','mo-prog','<i></i>')),progFill=prog.firstChild;D.body.appendChild(prog);
    var head=q('.head'),lapT=null;
    if(head){
      var lap=deco(el('div','mo-lap','<i></i><b>LAP</b><span>00:00.0</span>')),lapS=lap.lastChild,t0=performance.now(),held=0,hidAt=0;
      head.appendChild(lap);
      var lapTick=function(){var s=(performance.now()-t0-held)/1000,m=Math.floor(s/60);lapS.textContent=pad(m%100)+':'+pad(Math.floor(s%60))+'.'+Math.floor(s*10%10);};
      var lapRun=function(on){if(on&&!lapT)lapT=setInterval(lapTick,100);else if(!on&&lapT){clearInterval(lapT);lapT=null;}};
      lapRun(true);
      D.addEventListener('visibilitychange',function(){
        if(D.hidden){hidAt=performance.now();lapRun(false);}else{if(hidAt)held+=performance.now()-hidAt;hidAt=0;lapRun(true);}
      });
    }
    order(qa('.head .nav li'),8);
    cl.add('mo-intro');setTimeout(function(){cl.remove('mo-intro');},1800);

    /* ================= headlines ================= */
    function lines(h){
      var label=h.textContent.replace(/\s+/g,' ').trim(),groups=[[]];
      Array.prototype.slice.call(h.childNodes).forEach(function(n){if(n.nodeName==='BR')groups.push([]);else groups[groups.length-1].push(n);});
      while(h.firstChild)h.removeChild(h.firstChild);
      groups.forEach(function(g,i){
        var l=deco(el('span','mo-l')),li=el('span','mo-li');li.style.setProperty('--i',i);
        g.forEach(function(n){li.appendChild(n);});l.appendChild(li);h.appendChild(l);
      });
      h.setAttribute('aria-label',label);h.classList.add('mo-split');
    }
    function chars(h){
      var label=h.textContent.replace(/\s+/g,' ').trim(),i=0,wrapc=deco(el('span','mo-l'));
      Array.prototype.slice.call(label).forEach(function(ch){
        if(ch===' '){wrapc.appendChild(D.createTextNode(' '));return;}
        var c=el('span','mo-c');c.textContent=ch;c.style.setProperty('--i',i++);wrapc.appendChild(c);
      });
      while(h.firstChild)h.removeChild(h.firstChild);
      h.appendChild(wrapc);h.setAttribute('aria-label',label);h.classList.add('mo-split');
    }
    var h1=q('h1');
    if(h1){
      if(h1.closest('.hero')){ /* three stacked lines already marked up as spans */
        var lab=h1.textContent.replace(/\s+/g,' ').trim();
        qa(':scope > span',h1).forEach(function(s,i){
          var li=el('span','mo-li');li.style.setProperty('--i',i);
          while(s.firstChild)li.appendChild(s.firstChild);s.appendChild(li);s.classList.add('mo-l');deco(s);
        });
        h1.setAttribute('aria-label',lab);h1.classList.add('mo-split');
      }else if(!h1.querySelector('*'))chars(h1);
      else lines(h1);
    }
    qa('.sec .tilt').forEach(function(h){
      lines(h);
      if(h.tagName==='H2'){var sp=deco(el('span','mo-sp'));h.appendChild(sp);h.__sp=sp;h.__k='h';vis.observe(h);}
      watch(h);
    });

    /* ================= numbers: scoreboard reels ================= */
    function roll(num,delay){
      if(num.__rolling)return;
      var nodes=[],k=0,orig=num.innerHTML;
      Array.prototype.slice.call(num.childNodes).forEach(function(n){if(n.nodeType===3&&/\d/.test(n.nodeValue))nodes.push(n);});
      if(!nodes.length)return;
      num.__rolling=1;
      nodes.forEach(function(t){
        var f=D.createDocumentFragment(),s=t.nodeValue;
        for(var i=0;i<s.length;i++){
          var ch=s.charAt(i);
          if(ch<'0'||ch>'9'){f.appendChild(D.createTextNode(ch));continue;}
          var d=el('span','mo-d'),c=el('span','mo-dc'),n=+ch,steps=5+(k%3)*2;
          for(var j=steps;j>=1;j--){var g=deco(el('i'));g.textContent=((n-j)%10+10)%10;g.style.top=(-j*100)+'%';c.appendChild(g);}
          c.appendChild(D.createTextNode(ch));
          c.style.setProperty('--s',steps);c.style.animationDelay=((delay||0)+k*55)+'ms';
          d.appendChild(c);f.appendChild(d);k++;
        }
        num.replaceChild(f,t);
      });
      setTimeout(function(){num.innerHTML=orig;num.__rolling=0;},(delay||0)+k*55+950);
    }
    qa('main .num').forEach(function(n){
      if(n.id||!/\d/.test(n.textContent)||n.closest('.tel,.pbars,.chip,[class*="mo-"]'))return;
      watch(n,function(e){var p=e.closest('[style*="--i"]'),d=p?(parseInt(p.style.getPropertyValue('--i'),10)||0)*80:0;roll(e,d+140);});
    });
    var chipNum=q('.phead .chip .num');if(chipNum)roll(chipNum,D0+720);

    /* ================= scroll entrances ================= */
    qa('.sec .lead,.sess-intro,.more,.price-note,.eyebrow,.voice,.policy h2,.sess-head,.form,.split,.map').forEach(function(e){watch(e);});
    [['.slash-list','li'],['.rules','div'],['.numbered','li'],['.news','li'],['.rows','.row'],['.steps','li'],['.figs','li'],['.jump','a'],['.spec','div'],['.faq-list','.qa'],['.band-act','*'],['.pbars-list','li']].forEach(function(p){
      qa(p[0]).forEach(function(c){order(qa(':scope > '+p[1],c),8);watch(c);});
    });
    qa('.map').forEach(function(m){vis.observe(m);});
    qa('.cut').forEach(function(s){watch(s,function(e){e.classList.add('is-cut');},true);});

    /* photos: 3–5 slanted strips grow from alternate edges and lock into the frame */
    function slice(fig){
      var img=q(':scope > img',fig);
      if(!img){inn(fig);return;}
      var go=function(){
        var w=fig.offsetWidth,n=w>420?5:w>180?4:3,box=deco(el('span','mo-strips'));
        for(var i=0;i<n;i++){
          var c=img.cloneNode(false);c.alt='';c.removeAttribute('loading');c.removeAttribute('id');
          c.className='mo-strip'+(i%2?' mo-strip--up':'');
          c.style.setProperty('--a',(i/n).toFixed(4));c.style.setProperty('--b',Math.min(1,(i+1)/n+.004).toFixed(4));c.style.setProperty('--i',i);
          box.appendChild(c);
        }
        fig.appendChild(box);void box.offsetWidth;fig.classList.add('is-slicing');
        setTimeout(function(){
          fig.classList.add('is-in');fig.classList.remove('is-slicing');
          if(box.parentNode)box.parentNode.removeChild(box);
          setTimeout(function(){fig.classList.add('is-set');},500);
        },440+n*70+60);
      };
      var d=fig.closest('.hero')&&!fig.__again?D0+300:fig.closest('.person')?180:0,done=false;
      var start=function(){if(done)return;done=true;setTimeout(go,d);};
      if(img.complete&&img.naturalWidth)start();
      else{img.addEventListener('load',start);img.addEventListener('error',start);setTimeout(start,1200);}
    }
    qa('.frame').forEach(function(f){watch(f,slice);f.__k='f';vis.observe(f);});

    /* tables: rows land one per beat while an orange bar scans down (compare table: column by column) */
    function tbuild(wrap){
      var t=q('table',wrap),rows=qa('tbody tr',t),big=t.classList.contains('tbl--big');
      order(rows,14);inn(wrap);
      if(!rows.length||!wrap.animate)return;
      var bar=deco(el('i','mo-scan'+(big?' mo-scan--v':''))),kf=[],dur,wr=wrap.getBoundingClientRect();
      wrap.appendChild(bar);
      if(big){
        var w=t.offsetWidth-6;
        kf=[{transform:'translateX(0)',opacity:1},{transform:'translateX('+w+'px)',opacity:1,offset:.92},{transform:'translateX('+w+'px)',opacity:0}];dur=900;
      }else{
        var y0=rows[0].getBoundingClientRect().top-wr.top+wrap.scrollTop,yN=y0;
        kf.push({transform:'translateY('+y0+'px)',opacity:1});
        rows.forEach(function(r){yN=r.getBoundingClientRect().bottom-wr.top+wrap.scrollTop-5;kf.push({transform:'translateY('+yN+'px)',opacity:1});});
        kf.push({transform:'translateY('+yN+'px)',opacity:0});
        dur=Math.min(rows.length,15)*70+160;
      }
      var an=bar.animate(kf,{duration:dur,delay:120,easing:'linear',fill:'both'});
      an.onfinish=an.oncancel=function(){if(bar.parentNode)bar.parentNode.removeChild(bar);};
    }
    qa('.tbl-wrap').forEach(function(w){
      if(q('.tbl--eq',w)){w.classList.add('is-in','is-set');return;} /* facility: driven by the barbell below */
      watch(w,tbuild);
    });

    /* ================= marquee: speed follows scroll velocity ================= */
    var vel=0,mqOn=false,mqLast=0;
    qa('.mq').forEach(function(m,i){
      var tr=q('.mq-track',m),set=q('.mq-set',m);if(!tr||!set)return;
      m.__tr=tr;m.__x=0;m.__dir=i%2?-1:1;
      var fill=function(){
        var w=set.offsetWidth;if(!w)return;m.__w=w;
        var need=Math.ceil(W.innerWidth/w)+2;
        while(tr.children.length<need)tr.appendChild(set.cloneNode(true));
      };
      fill();m.__fill=fill;m.__k='m';vis.observe(m);
    });
    function mqStep(t){
      if(!visMq.length||D.hidden){mqOn=false;return;}
      var dt=Math.min(50,t-mqLast);mqLast=t;
      for(var i=0;i<visMq.length;i++){
        var m=visMq[i];if(!m.__w)continue;
        m.__x+=(0.055*m.__dir+vel*0.55)*dt;
        m.__x=((m.__x%m.__w)+m.__w)%m.__w;
        m.__tr.style.transform='translate3d('+(-m.__x).toFixed(1)+'px,0,0)';
      }
      raf(mqStep);
    }
    function mqStart(){if(mqOn||!visMq.length||D.hidden)return;mqOn=true;mqLast=performance.now();raf(mqStep);}
    D.addEventListener('visibilitychange',mqStart);
    var refill=function(){qa('.mq').forEach(function(m){if(m.__fill)m.__fill();});};
    W.addEventListener('resize',refill);
    if(D.fonts&&D.fonts.ready)D.fonts.ready.then(refill);

    /* ================= scroll engine (one rAF loop, only while moving) ================= */
    var ticks=[],lastY=W.pageYOffset,lastT=0,looping=false,dirty=false;
    function frame(t){
      var y=W.pageYOffset,dt=Math.max(8,Math.min(64,t-lastT));lastT=t;
      var rawv=(y-lastY)/dt;lastY=y;
      vel+=(rawv-vel)*.22;if(Math.abs(vel)<.012)vel=0;
      for(var i=0;i<ticks.length;i++)ticks[i](y,vel);
      if(vel!==0||dirty){dirty=false;raf(frame);}else looping=false;
    }
    function kick(){dirty=true;if(!looping){looping=true;lastT=performance.now();raf(frame);}}
    W.addEventListener('scroll',kick,{passive:true});
    W.addEventListener('resize',kick);

    /* progress bar + end-of-page flush */
    ticks.push(function(y){
      var max=root.scrollHeight-W.innerHeight,p=max>0?Math.min(1,Math.max(0,y/max)):0;
      progFill.style.transform='scaleX('+p.toFixed(4)+')';
      if(pend.length&&max-y<6)sweep();
    });
    /* speed-lines behind headings + parallax on frames and the header slabs */
    var slab=q('.hero-visual')||q('.phead'),lastV=-1;
    ticks.push(function(y,v){
      var s=Math.min(1,Math.abs(v)/2.4);s=s<.12?0:Math.round(s*20)/20;
      if(s!==lastV){lastV=s;for(var i=0;i<visHeads.length;i++)visHeads[i].__sp.style.setProperty('--v',s);}
      var vh=W.innerHeight,rs=[],j;
      for(j=0;j<visFrames.length;j++)rs.push(visFrames[j].getBoundingClientRect());
      for(j=0;j<visFrames.length;j++){
        var im=visFrames[j].__img||(visFrames[j].__img=q(':scope > img',visFrames[j]));
        if(im){var d=((rs[j].top+rs[j].height/2)-vh/2)/vh;im.style.translate='0 '+(Math.max(-1,Math.min(1,d))*-8).toFixed(1)+'px';}
      }
      if(slab&&y<vh*1.2)slab.style.setProperty('--hp',(y*-.12).toFixed(1)+'px');
    });

    /* ================= interaction ================= */
    function shock(b){
      for(var i=0;i<2;i++){(function(i){
        var s=deco(el('span','mo-shock'));s.style.animationDelay=(i*90)+'ms';b.appendChild(s);
        setTimeout(function(){if(s.parentNode)s.parentNode.removeChild(s);},750);
      })(i);}
    }
    D.addEventListener('pointerdown',function(e){
      var t=e.target;if(!t.closest)return;
      var b=t.closest('.btn,.mo-start');if(b)shock(b);
      if(e.pointerType!=='mouse'){
        var h=t.closest('.frame,.row,.person,.tbl tbody tr,.pbars-list li');
        if(h){h.classList.add('is-tap');clearTimeout(h.__tap);h.__tap=setTimeout(function(){h.classList.remove('is-tap');},700);}
      }
    },{passive:true});
    D.addEventListener('keydown',function(e){
      if(e.key!=='Enter'&&e.key!==' ')return;
      var b=e.target.closest&&e.target.closest('.btn,.mo-start');if(b&&!e.repeat)shock(b);
    });
    if(fine){
      var follow=function(node,fn,out){
        var busy=false,ev=null;
        node.addEventListener('pointermove',function(e){ev=e;if(busy)return;busy=true;raf(function(){busy=false;if(ev)fn(ev,node.getBoundingClientRect());});});
        node.addEventListener('pointerleave',function(){ev=null;out();});
      };
      qa('.btn:not(.btn--s)').forEach(function(b){ /* magnetic pull */
        follow(b,function(e,r){b.style.translate=(((e.clientX-r.left)/r.width-.5)*14).toFixed(1)+'px '+(((e.clientY-r.top)/r.height-.5)*10).toFixed(1)+'px';},function(){b.style.translate='';});
      });
      qa('.frame:not(.frame--plain)').forEach(function(f){ /* the slab slides away from the pointer */
        follow(f,function(e,r){
          f.style.setProperty('--sx',(((e.clientX-r.left)/r.width-.5)*-22).toFixed(1)+'px');
          f.style.setProperty('--sy',(((e.clientY-r.top)/r.height-.5)*-22).toFixed(1)+'px');
        },function(){f.style.removeProperty('--sx');f.style.removeProperty('--sy');});
      });
    }
    /* faq rows: kick open, snap shut */
    var qas=qa('.qa');
    qas.forEach(function(d){
      var s=q('summary',d),a=q('.qa-a',d);if(!s||!a)return;
      s.addEventListener('click',function(e){
        if(d.__closing){e.preventDefault();return;}
        if(!d.open||!a.animate)return;
        e.preventDefault();d.__closing=1;
        var an=a.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translate(-16px,-12px) skewX(-6deg)'}],{duration:140,easing:'ease-in'});
        an.onfinish=an.oncancel=function(){d.open=false;d.__closing=0;};
      });
      d.addEventListener('toggle',function(){
        if(!d.open)return;
        var n=d.nextElementSibling,k=0;
        while(n&&k<3){if(n.animate)n.animate([{transform:'translateY(-18px)'},{transform:'none'}],{duration:340,easing:SLAM,delay:k*35,fill:'backwards'});n=n.nextElementSibling;k++;}
      });
    });

    /* ================= showpieces ================= */
    home();sessions();trainers();facility();faq();reserve();policy();

    /* ---- home: START runs a 5-second interval on the hero clock (visual only) ---- */
    function home(){
      var clock=q('.hero .clock'),hc=D.getElementById('heroClock'),hero=q('.hero');
      if(!clock||!hc||!hero)return;
      var b=el('button','mo-start','<span>START</span>');b.type='button';
      b.setAttribute('aria-label','5秒のインターバルタイマーを動かす（見た目だけの演出です）');
      var lab=b.firstChild,reps=deco(el('span','mo-reps','<i></i><i></i><i></i><i></i><i></i>')),running=false;
      clock.appendChild(b);clock.appendChild(reps);
      b.addEventListener('click',function(){
        if(running)return;running=true;
        b.setAttribute('aria-disabled','true');clock.classList.add('is-run');
        qa('i',reps).forEach(function(i){i.classList.remove('on');});
        var t0=performance.now(),sec=-1;
        var beat=function(s){
          reps.children[s].classList.add('on');lab.textContent=String(5-s);
          if(clock.animate)clock.animate([{transform:'scale(1.1)'},{transform:'none'}],{duration:260,easing:SLAM});
        };
        var finish=function(){
          hc.textContent='00.00';lab.textContent='GO!';
          hero.classList.remove('mo-go');void hero.offsetWidth;hero.classList.add('mo-go');
          if(hero.animate)hero.animate(IMPACT,{duration:320,easing:'linear'});
          var hit=q('.hit .mo-li',hero);
          if(hit&&hit.animate)hit.animate([{transform:'translate(-.5em,.4em) skewX(-24deg) scale(1.12)',filter:'blur(5px)'},{transform:'none',filter:'blur(0)'}],{duration:520,easing:SLAM});
          var fig=q('.frame',hero);
          if(fig&&fig.classList.contains('is-in')){fig.__again=1;fig.classList.remove('is-in','is-set');slice(fig);}
          var u0=performance.now()+260;
          raf(function up(t){
            var k=Math.min(1,Math.max(0,(t-u0)/800)),e=1-Math.pow(1-k,3),v=Math.round(e*3000);
            if(t>=u0)hc.textContent=pad(Math.floor(v/60))+':'+pad(v%60);
            if(k<1)raf(up);
            else setTimeout(function(){
              running=false;b.removeAttribute('aria-disabled');lab.textContent='START';
              clock.classList.remove('is-run');hero.classList.remove('mo-go');
            },900);
          });
        };
        raf(function run(t){
          var e=(t-t0)/1000,rem=5-e;
          if(rem<=0){finish();return;}
          var s=Math.min(4,Math.floor(e));if(s!==sec){sec=s;beat(s);}
          hc.textContent=pad(Math.floor(rem))+'.'+pad(Math.floor(rem*100)%100);
          raf(run);
        });
      });
    }

    /* ---- sessions: 50 ticks light up on the ring, each phase slams in ---- */
    function sessions(){
      var hud=D.getElementById('hud'),list=D.getElementById('phases');
      if(!hud||!list)return;
      var names=['相談','トレーニング','ふり返り'],phases=list.children,cur=-1,seen=false;
      var ring=deco(el('div','mo-ring',
        '<span class="mo-ring-dial"><svg viewBox="0 0 120 120"><defs><mask id="moTicks" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120"><circle cx="60" cy="60" r="50" fill="none" stroke="#fff" stroke-width="13" pathLength="50" stroke-dasharray=".72 .28"/></mask></defs>'+
        '<g transform="rotate(-90 60 60)"><circle class="mo-ring-base" cx="60" cy="60" r="50" fill="none" stroke-width="13" pathLength="50" stroke-dasharray=".72 .28"/>'+
        '<g mask="url(#moTicks)"><circle class="mo-ring-fill" cx="60" cy="60" r="50" fill="none" stroke-width="13" pathLength="50" stroke-dasharray="50 50" stroke-dashoffset="50"/></g>'+
        '<circle class="mo-ring-ph" cx="60" cy="60" r="39" fill="none" stroke-width="3" pathLength="50" stroke-dasharray="9.5 .5 29.5 .5 9.5 .5"/></g></svg>'+
        '<span class="mo-ring-n"><b class="num">1</b><small>/3</small></span></span><span class="mo-ring-t"><small>PHASE</small><span>相談</span></span>'));
      hud.appendChild(ring);
      var fill=q('.mo-ring-fill',ring),nb=q('.mo-ring-n b',ring),nt=q('.mo-ring-t span',ring),bar=q('.bar',hud);
      if(bar)bar.appendChild(deco(el('span','mo-ticks')));
      new IntersectionObserver(function(es){seen=es[0].isIntersecting;},{}).observe(list);
      W.__paceRun=function(min,idx){
        fill.setAttribute('stroke-dashoffset',(50-min).toFixed(2));
        if(idx===cur)return;
        var first=cur<0;cur=idx;nb.textContent=String(idx+1);nt.textContent=names[idx]||'';
        if(first||!seen)return;
        rehit(phases[idx]);rehit(hud);rehit(ring);
        var n=q('.phase-h .num',phases[idx]);if(n)roll(n,160);
      };
      W.dispatchEvent(new Event('scroll'));
    }

    /* ---- trainers: roster; the chosen trainer's panel wipes in with strips ---- */
    function trainers(){
      var staff=q('.staff'),ps=staff?qa('.person',staff):[];
      if(!ps.length)return;
      var bar=el('div','mo-roster');bar.setAttribute('role','group');bar.setAttribute('aria-label','トレーナーを選ぶ');
      bar.appendChild(deco(el('i','mo-roster-mark')));
      var cur=-1;
      var stacked=function(){return ps.length>1&&ps[1].offsetTop>ps[0].offsetTop+20;};
      var wipe=function(p,mid){
        var o=deco(el('span','mo-wipe','<i></i><i></i><i></i><i></i><i></i>'));p.appendChild(o);
        setTimeout(mid,190);setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o);},720);
      };
      var select=function(i,user){
        if(i===cur)return;cur=i;
        btns.forEach(function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false');});
        bar.style.setProperty('--p',i);bar.classList.add('is-on');
        ps.forEach(function(p,j){if(j!==i)p.classList.remove('is-sel');});
        if(ps[i].classList.contains('is-in'))wipe(ps[i],function(){if(cur===i)ps[i].classList.add('is-sel');});
        else ps[i].classList.add('is-sel');
        if(user){
          var r=ps[i].getBoundingClientRect(),off=stacked()?bar.offsetHeight+18:110;
          if(r.top<off-4||r.top>W.innerHeight*.55)W.scrollTo(0,W.pageYOffset+r.top-off);
        }
      };
      var btns=ps.map(function(p,i){
        var b=el('button'),h=q('h3',p);b.type='button';b.setAttribute('aria-pressed','false');
        b.innerHTML='<span class="num" aria-hidden="true">'+pad(i+1)+'</span><span></span>';b.lastChild.textContent=h?h.textContent:'';
        b.addEventListener('click',function(){select(i,true);});
        p.addEventListener('click',function(){select(i,false);});
        bar.appendChild(b);return b;
      });
      staff.parentNode.insertBefore(bar,staff);
      ps.forEach(function(p,i){
        watch(p,function(){setTimeout(function(){wipe(p,function(){inn(p);});},stacked()?0:i*130);});
      });
      var cen=new IntersectionObserver(function(es){
        es.forEach(function(e){e.target.__c=e.isIntersecting;});
        if(cur>-1&&ps[cur].__c)return;
        for(var i=0;i<ps.length;i++)if(ps[i].__c){select(i,false);break;}
      },{rootMargin:'-42% 0px -42% 0px'});
      ps.forEach(function(p){cen.observe(p);});
    }

    /* ---- facility: every table row that lands puts a plate on the bar ---- */
    function facility(){
      var t=q('.tbl--eq');if(!t)return;
      var wrap=t.closest('.tbl-wrap'),rows=qa('tbody tr',t),n=rows.length,on=0;
      var hs=[88,88,72,72,56,40],cs=['#FF5A1F','#15171A','#FF5A1F','#2F4A63','#15171A','#FF5A1F'],pl='';
      for(var k=0;k<n;k++){
        var slot=Math.floor(k/2)%6,left=k%2===0,h=hs[slot],x=left?180-24*slot:442+24*slot;
        pl+='<rect class="pl" style="--from:'+(left?-70:70)+'px" x="'+x+'" y="'+(50-h/2)+'" width="18" height="'+h+'" rx="3" fill="'+cs[slot]+'"/>';
      }
      var bb=deco(el('div','mo-bb','<span class="mo-bb-n"><b class="num">00</b><span>/'+n+' 器具をのせました</span></span>'+
        '<svg viewBox="0 0 640 100"><g class="mo-bb-g"><rect x="30" y="44" width="580" height="12" fill="#9aa0a6"/><rect x="214" y="46" width="212" height="8" fill="#2F4A63"/>'+
        '<rect x="204" y="34" width="10" height="32" fill="#15171A"/><rect x="426" y="34" width="10" height="32" fill="#15171A"/>'+
        '<rect x="24" y="42" width="8" height="16" fill="#15171A"/><rect x="608" y="42" width="8" height="16" fill="#15171A"/>'+pl+'</g></svg>'));
      wrap.parentNode.insertBefore(bb,wrap);
      var plates=qa('.pl',bb),nb=q('.mo-bb-n b',bb),nw=q('.mo-bb-n',bb),g=q('.mo-bb-g',bb);
      var add=function(i,delay){
        setTimeout(function(){
          rows[i].classList.add('is-on');plates[i].classList.add('on');
          nb.textContent=pad(i+1);rehit(nw);
          if(g.animate)g.animate([{transform:'translateY(4px)'},{transform:'none'}],{duration:260,easing:SLAM});
          setTimeout(function(){rows[i].classList.add('is-set');},600);
        },delay);
      };
      var check=function(){
        if(on>=n)return;
        var line=W.innerHeight*.8,c=0;
        while(on<n&&rows[on].getBoundingClientRect().top<line){add(on,c*70);on++;c++;}
      };
      ticks.push(check);check();
    }

    /* ---- faq: 「Q 03/13」 advances as questions are opened ---- */
    function counter(host,label,pre,n){
      var bar=deco(el('div','mo-count','<span class="mo-count-l">'+label+'</span><span class="mo-count-n num">'+pre+'<b>00</b>/'+pad(n)+'</span><span class="mo-count-t">'+new Array(n+1).join('<i></i>')+'</span>'));
      host.insertBefore(bar,host.firstChild);
      var o={bar:bar,ticks:qa('.mo-count-t i',bar),b:q('.mo-count-n b',bar),nw:q('.mo-count-n',bar),set:function(c){o.b.textContent=pad(c);rehit(o.nw);if(c>=n)bar.classList.add('is-all');}};
      order(o.ticks,40);return o;
    }
    function faq(){
      if(!qas.length)return;
      var c=counter(qas[0].closest('.wrap'),'開いた質問','Q ',qas.length),seen=[],cnt=0;
      qas.forEach(function(d,i){d.addEventListener('toggle',function(){
        if(d.open&&!seen[i]){seen[i]=1;cnt++;c.ticks[i].classList.add('on');c.set(cnt);}
        c.ticks[i].classList.toggle('open',d.open);
      });});
    }
    /* ---- privacy: the same bar counts the clauses you have reached ---- */
    function policy(){
      var hs=qa('.policy h2');if(!hs.length)return;
      var c=counter(q('.policy').closest('.wrap'),'読んだ項目','',hs.length),cnt=0;
      var check=function(){
        var line=W.innerHeight*.6,k=cnt;
        while(k<hs.length&&hs[k].getBoundingClientRect().top<line){c.ticks[k].classList.add('on');k++;}
        if(k!==cnt){cnt=k;c.set(cnt);}
      };
      ticks.push(check);check();
    }

    /* ---- reserve: four-step track; the marker sprints as fields are completed ---- */
    function reserve(){
      var form=D.getElementById('bookForm');if(!form)return;
      var g=function(id){return D.getElementById(id);};
      var steps=[['日時',function(){return !!g('f-date').value;}],['お名前',function(){return g('f-name').value.trim().length>0;}],
        ['電話',function(){return g('f-tel').value.replace(/\D/g,'').length>=10;}],['メール',function(){return /^\S+@\S+\.\S+$/.test(g('f-mail').value);}]];
      var tr=deco(el('div','mo-track','<span class="mo-track-line"><i></i></span><span class="mo-runner"><i></i></span><ol>'+
        steps.map(function(s,i){return '<li><b class="num">'+(i+1)+'</b>'+s[0]+'</li>';}).join('')+'</ol>'));
      var h=q('h2',form);h.parentNode.insertBefore(tr,h.nextSibling);
      var lis=qa('li',tr),runner=q('.mo-runner',tr),cur=-1;
      var charge={'f-date':function(v){return v?1:0;},'f-time':function(){return 1;},'f-purpose':function(){return 1;},
        'f-name':function(v){return Math.min(1,v.trim().length/3);},'f-tel':function(v){return Math.min(1,v.replace(/\D/g,'').length/10);},
        'f-mail':function(v){var a=v.indexOf('@');return /^\S+@\S+\.\S+$/.test(v)?1:a>0?Math.min(.9,.6+(v.length-a-1)*.05):Math.min(.5,v.length/14);},
        'f-note':function(v){return Math.min(1,v.length/30);}};
      var bars={};
      qa('.field',form).forEach(function(f){
        var c=q('input,select,textarea',f);if(!c||!charge[c.id])return;
        var b=deco(el('i','mo-charge'+(c.tagName==='SELECT'?' is-pre':'')));f.appendChild(b);bars[c.id]=[c,b];
      });
      var update=function(e){
        for(var id in bars){
          var c=bars[id][0],b=bars[id][1],v=charge[id](c.value),was=b.__v;
          if(e&&e.target===c)b.classList.remove('is-pre');
          if(v!==was){b.__v=v;b.style.setProperty('--c',v.toFixed(3));if(v===1&&was!==undefined)rehit(b,'is-full');else if(v<1)b.classList.remove('is-full');}
        }
        var done=steps.map(function(s){return s[1]();}),first=done.indexOf(false),all=first<0;
        if(all)first=4;
        lis.forEach(function(li,i){li.classList.toggle('is-done',done[i]);li.classList.toggle('is-cur',i===first);});
        tr.style.setProperty('--f',first);tr.classList.toggle('is-go',all);
        if(first!==cur){runner.style.setProperty('--p',Math.min(3,first));if(cur>-1)rehit(runner);cur=first;}
      };
      form.addEventListener('input',update);form.addEventListener('change',update);update();
      form.addEventListener('submit',function(){
        var m=D.getElementById('formMsg');if(!m)return;
        rehit(m,'mo-fin');if(form.animate)form.animate(IMPACT,{duration:300,easing:'linear'});
      });
    }

    /* ================= go ================= */
    kick();
    setTimeout(sweep,2500); /* safety: nothing on screen may stay hidden */
  }
})();
