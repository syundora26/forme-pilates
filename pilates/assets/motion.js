/* FORME PILATES — motion layer「軸」. Runs after site.js.
   html.mo is set in <head> only when motion is allowed; if this file fails, the head timeout removes it. */
(function(){
  'use strict';
  var root=document.documentElement;
  window.__fpmo=1;
  var MO=root.classList.contains('mo');
  var T0=root.classList.contains('mo-in')?300:0;
  function all(s,c){return [].slice.call((c||document).querySelectorAll(s));}
  function el(tag,cls,html){var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e;}
  function clamp(v,a,b){return v<a?a:(v>b?b:v);}
  function restart(e,cls){e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls);}
  function bail(){root.classList.remove('mo','mo-in','mo-out'); root.classList.add('mo-ready'); MO=false;}

  /* ---------- reserve: the form as a balance (works with or without motion) ---------- */
  var lv=null;
  try{
    var form=document.getElementById('book-form');
    if(form){
      var req=all('[required]',form);
      lv=el('div','level full','<div class="lv-tube" aria-hidden="true"><i class="lv-b"></i></div><p class="lv-t"></p>');
      form.insertBefore(lv,form.firstChild);
      var lvT=lv.querySelector('.lv-t'), lvN=-1;
      var upd=function(){
        var n=0;
        req.forEach(function(f){
          var ok=f.value.replace(/\s/g,'')!==''&&(f.type!=='email'||f.checkValidity());
          if(ok) n++;
          var w=f.closest('.f'); if(w) w.classList.toggle('is-ok',ok);
        });
        if(n===lvN) return; lvN=n;
        var r=(req.length-n)/req.length;
        lv.style.setProperty('--off',(-r*44).toFixed(1)+'px');
        lv.style.setProperty('--tilt',(-r*9).toFixed(1)+'deg');
        lv.classList.toggle('is-level',n===req.length);
        lvT.innerHTML=n===req.length?'必須の'+req.length+'項目がそろいました。水平です。':'必須'+req.length+'項目のうち <b>'+n+'</b> 項目が入力済み';
      };
      form.addEventListener('input',upd); form.addEventListener('change',upd); upd();
    }
  }catch(e){}

  if(!MO){ root.classList.add('mo-ready'); return; }

  try{
    var main=document.querySelector('main');
    var axis=document.querySelector('.axis');
    var secs=all('main > section:not(.page-head):not(.hero)');
    var pending=[], io=null;

    /* ---------- frame loop (runs only while something is moving) ---------- */
    var subs=[], running=false, lastT=0, lastY=window.pageYOffset;
    var tick=function(now){
      var k=lastT?clamp((now-lastT)/16.667,.2,3):1; lastT=now;
      var y=window.pageYOffset, dy=y-lastY; lastY=y;
      var active=false;
      for(var i=0;i<subs.length;i++){ try{ if(subs[i](dy,k,now)) active=true; }catch(e){} }
      if(active) requestAnimationFrame(tick); else running=false;
    };
    var kick=function(){ if(!running){ running=true; lastT=0; requestAnimationFrame(tick); } };
    window.addEventListener('scroll',kick,{passive:true});
    window.addEventListener('resize',kick);

    /* ---------- numbers roll like a counter ---------- */
    var roll=function(target,delay){
      var nodes=[].filter.call(target.childNodes,function(n){return n.nodeType===3&&/\d/.test(n.nodeValue);});
      if(!nodes.length) return;
      var k=0, undo=[];
      nodes.forEach(function(t){
        var w=el('span','od-w'), vh=el('span','vh'), vis=el('span');
        vis.setAttribute('aria-hidden','true'); vh.textContent=t.nodeValue;
        t.nodeValue.split(/(\d[\d,:.]*\d|\d)/).forEach(function(part,i){
          if(!part) return;
          if(i%2===0){ vis.appendChild(document.createTextNode(part)); return; }
          var g=el('span','od-g');
          Array.from(part).forEach(function(c){
            if(!/\d/.test(c)){ g.appendChild(document.createTextNode(c)); return; }
            var d=+c, o=el('span','od'), f=el('span','od-f'), s=el('span','od-s'), h='';
            f.textContent=c;
            for(var j=1;j<=11;j++){ h+='<i>'+((d+j)%10)+'</i>'; }
            s.innerHTML=h; s.style.setProperty('--k',k++);
            o.appendChild(f); o.appendChild(s); g.appendChild(o);
          });
          vis.appendChild(g);
        });
        w.appendChild(vh); w.appendChild(vis); w.style.setProperty('--od',delay+'ms');
        t.parentNode.replaceChild(w,t); undo.push([w,t]);
      });
      setTimeout(function(){
        undo.forEach(function(u){ if(u[0].parentNode) u[0].parentNode.replaceChild(u[1],u[0]); });
      },delay+k*70+1100);
    };
    var numsIn=function(scope){
      return all('td, th, dd',scope).filter(function(x){
        if(x.closest('thead')) return false;
        if(x.matches('td.num, .figs dd')) return true;
        var s=x.textContent.replace(/\s+/g,'');
        return s.length<=30&&/^[＋+]?\d/.test(s);
      });
    };

    /* ---------- headlines: split into characters, straighten, then restore the plain text ---------- */
    var rnd=function(i,s){ var v=Math.sin(i*12.9898+s*78.233)*43758.5453; return v-Math.floor(v); };
    var split=function(h){
      var tw=document.createTreeWalker(h,NodeFilter.SHOW_TEXT,null), list=[], n;
      while((n=tw.nextNode())){
        if(!n.nodeValue.replace(/\s/g,'')) continue;
        if(n.parentNode.closest('.node,.kana,.vh')) continue;
        list.push(n);
      }
      var range=document.createRange(), built=[], idx=0;
      list.forEach(function(t){
        var wrap=el('span','sp'), line=null, lastTop=null, off=0;
        wrap.setAttribute('aria-hidden','true');
        Array.from(t.nodeValue).forEach(function(ch){
          range.setStart(t,off); range.setEnd(t,off+ch.length); off+=ch.length;
          var r=range.getClientRects()[0], top=r&&r.height?Math.round(r.top):lastTop;
          if(line===null||(lastTop!==null&&top!==null&&Math.abs(top-lastTop)>6)){
            if(line) wrap.appendChild(document.createElement('br'));
            line=el('span','sl'); wrap.appendChild(line);
          }
          if(top!==null) lastTop=top;
          var s=el('span','ch'); s.textContent=ch;
          var dir=idx%2?1:-1;
          s.style.setProperty('--x',(dir*(.14+.2*rnd(idx,1))).toFixed(3)+'em');
          s.style.setProperty('--y',((rnd(idx,2)-.5)*.8).toFixed(3)+'em');
          s.style.setProperty('--r',(-dir*(9+17*rnd(idx,3))).toFixed(1)+'deg');
          s._i=idx++;
          line.appendChild(s);
        });
        built.push([t,wrap]);
      });
      var step=idx?Math.min(46,520/idx):0;
      built.forEach(function(b){
        all('.ch',b[1]).forEach(function(s){ s.style.setProperty('--cd',Math.round(s._i*step)+'ms'); });
        b[0].parentNode.replaceChild(b[1],b[0]);
      });
      return {built:built,n:idx,total:idx*step+760};
    };
    var heading=function(h,d){
      setTimeout(function(){
        try{
          var info=split(h);
          h.classList.add('sp-on');
          setTimeout(function(){
            info.built.forEach(function(b){ if(b[1].parentNode) b[1].parentNode.replaceChild(b[0],b[1]); });
            h.classList.add('sp-done'); h.classList.remove('sp-on');
          },info.total+80);
        }catch(e){ h.classList.add('sp-done'); }
      },d);
    };

    /* ---------- tagging: every content block gets an entrance that fits it ---------- */
    var tag=function(e,cls){ e.classList.add('mo-e'); e.classList.add(cls); pending.push(e); };

    all('main h1, main h2').forEach(function(h){
      var k=h.querySelector('.kana'), txt=h.textContent.replace(/\s+/g,' ').trim();
      if(k){ var kt=k.textContent.trim(); txt=txt.replace(kt,'').trim()+'（'+kt+'）'; }
      h.setAttribute('aria-label',txt);
      if(h.tagName==='H1'){ heading(h,T0+220); }
      else { h._h=true; pending.push(h); }
    });

    all('.dash > li',main).forEach(function(li){
      var s=el('span','mo-t'); while(li.firstChild) s.appendChild(li.firstChild); li.appendChild(s);
    });
    all('main .facts > div, main .info > div, main .figs > div, main .side-list > li, main .dash > li, main .news > li, main .legend > li, .foot-nav li').forEach(function(e){
      e._nums=numsIn(e); tag(e,'e-line');
    });
    all('main .tbl tr').forEach(function(tr){
      [].forEach.call(tr.children,function(c,i){ c.style.setProperty('--c',i); });
      tr._nums=numsIn(tr); tag(tr,'e-row');
    });
    all('main .tbl caption').forEach(function(c){ tag(c,'e-fade'); });
    all('main .tt tr').forEach(function(tr){
      [].forEach.call(tr.children,function(c,i){ c.style.setProperty('--c',i); });
      tag(tr,'e-ttrow');
    });
    all('main .steps').forEach(function(ol){
      ol.classList.add('mo-steps');
      var lis=[].filter.call(ol.children,function(c){return c.tagName==='LI';});
      lis.forEach(function(li,i){
        var sn=el('span','sn'); sn.setAttribute('aria-hidden','true'); sn.textContent=String(i+1);
        li.insertBefore(sn,li.firstChild);
        if(i<lis.length-1){ li.appendChild(el('i','seg')); li.appendChild(el('i','seg-d')); }
        li._sn=sn; tag(li,'e-step');
      });
    });
    all('main .ph.init').forEach(function(e){ tag(e,'e-split'); });
    all('main .map').forEach(function(e){ tag(e,'e-mask'); });
    all('main .book.cta').forEach(function(e){ tag(e,'e-band'); });
    all('main .spr').forEach(function(e){ tag(e,'e-spr'); });
    var sw=0;
    secs.forEach(function(sec){
      all('p, blockquote, a.more, .btn, .alt, .filter, h3.sub, form .f, details, .tl, .level',sec).forEach(function(e){
        if(e.classList.contains('msg')||e.classList.contains('mo-e')) return;
        if(e.parentNode.closest('li, blockquote, .alt, details, td, th, .spr, .f, .level, .tl, figure')) return;
        e.style.setProperty('--sw',(sw++%2)?'2deg':'-2.4deg');
        tag(e,'e-swing');
      });
    });

    var show=function(e,d){
      if(e._h){ heading(e,d); return; }
      e.style.setProperty('--d',d+'ms');
      if(e._sn){ var seg=e.querySelector('.seg'); if(seg) e.style.setProperty('--sh',seg.offsetHeight+'px'); }
      e.classList.add('mo-in');
      if(e._nums) e._nums.forEach(function(t){ roll(t,d+280); });
      if(e._sn) roll(e._sn,d+80);
      if(e._on) e._on(d);
    };
    var reveal=function(list){
      var d=0;
      list.forEach(function(e){
        if(e._done) return; e._done=true;
        if(io) io.unobserve(e);
        show(e,d);
        d=e.classList.contains('e-step')?d+260:Math.min(d+70,630);
      });
    };
    var inView=function(){
      var vh=window.innerHeight, list=[];
      pending.forEach(function(e){
        if(e._done) return;
        var r=e.getBoundingClientRect();
        if((r.width||r.height)&&r.top<vh&&r.bottom>0) list.push(e);
      });
      reveal(list);
    };

    /* children of the clipped booking band are checked by geometry (the observer cannot see through the clip) */
    var manual=[];
    var checkManual=function(){
      var lim=window.innerHeight*.91, list=[];
      manual=manual.filter(function(e){
        if(e._done) return false;
        var r=e.getBoundingClientRect();
        if((r.width||r.height)&&r.top<lim&&r.bottom>0){ list.push(e); return false; }
        return true;
      });
      if(list.length) reveal(list);
    };

    /* ---------- axis: plumb bob + reading-progress tick scale ---------- */
    var gauge=el('div','gauge'), ticks=[], gm=el('b');
    for(var gi=0;gi<=20;gi++){ var tk=el('i',gi%5===0?'mj':''); tk.style.top=(gi*5)+'%'; gauge.appendChild(tk); ticks.push(tk); }
    gauge.appendChild(gm);
    var bob=el('div','bob','<svg viewBox="-12 0 24 48" aria-hidden="true"><path class="b-s" d="M0 0V26"/><rect class="b-c" x="-3" y="24" width="6" height="3"/><path class="b-w" d="M-5.5 27h11L3 34 0 47-3 34z"/></svg>');
    var bobS=bob.firstChild;
    axis.appendChild(gauge); axis.appendChild(bob);
    var gh=gauge.offsetHeight, ang=0, av=0, lastTi=-1;
    window.addEventListener('resize',function(){ gh=gauge.offsetHeight; });
    subs.push(function(dy,k){
      var vh=window.innerHeight, max=root.scrollHeight-vh, y=window.pageYOffset;
      var p=max>0?clamp(y/max,0,1):1;
      var r=axis.getBoundingClientRect();
      var len=Math.min(r.height,Math.max(0,vh*(.56+.44*p)-r.top));
      av+=(-clamp(dy,-80,80)*.045-ang*.085)*k; av*=Math.pow(.9,k); ang=clamp(ang+av*k,-34,34);
      bob.style.transform='translate3d(0,'+len.toFixed(1)+'px,0)';
      bobS.style.transform='rotate('+ang.toFixed(2)+'deg)';
      gm.style.transform='translate3d(0,'+(p*gh).toFixed(1)+'px,0)';
      var ti=Math.round(p*20);
      if(ti!==lastTi){ lastTi=ti; for(var i=0;i<ticks.length;i++) ticks[i].classList.toggle('on',i<=ti); }
      if(max>0&&y>=max-4) inView();
      else if(manual.length) checkManual();
      return Math.abs(ang)>.06||Math.abs(av)>.03;
    });
    setTimeout(function(){ av=4.2; kick(); },T0+1250);

    /* ---------- visibility flags (pause ambient loops off-screen) ---------- */
    var visIO=null, onVis=[];
    if('IntersectionObserver' in window){
      visIO=new IntersectionObserver(function(es){
        es.forEach(function(en){
          en.target.classList.toggle('is-vis',en.isIntersecting);
          if(en.target._vis) en.target._vis(en.isIntersecting);
        });
      },{rootMargin:'40px 0px 40px 0px'});
      all('.ph:not(.init), #tt').forEach(function(e){ visIO.observe(e); });
    }

    /* ---------- photos lean toward the pointer ---------- */
    try{
      if(window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches){
        all('.ph').forEach(function(ph){
          var rect=null, raf=0, px=0, py=0;
          var apply=function(){
            raf=0;
            if(!rect) rect=ph.getBoundingClientRect();
            var nx=clamp((px-rect.left)/rect.width-.5,-.5,.5), ny=clamp((py-rect.top)/rect.height-.5,-.5,.5);
            ph.style.setProperty('--ry',(nx*5.5).toFixed(2)+'deg');
            ph.style.setProperty('--rx',(-ny*4.5).toFixed(2)+'deg');
          };
          ph.addEventListener('pointerenter',function(){ rect=null; ph.classList.add('is-tilt'); });
          ph.addEventListener('pointermove',function(e){ px=e.clientX; py=e.clientY; if(!raf) raf=requestAnimationFrame(apply); });
          ph.addEventListener('pointerleave',function(){
            if(raf){ cancelAnimationFrame(raf); raf=0; }
            ph.classList.remove('is-tilt'); ph.style.setProperty('--rx','0deg'); ph.style.setProperty('--ry','0deg'); rect=null;
          });
          window.addEventListener('scroll',function(){ rect=null; },{passive:true});
        });
      }
    }catch(e){}

    /* ---------- home showpiece: the reformer spring ---------- */
    try{
      var spr=document.getElementById('spr');
      if(spr){
        var sSvg=spr.querySelector('svg'), coil=spr.querySelector('.sp-coil'), sh=spr.querySelector('.sp-h');
        var REST=204, sx=REST, sv=0, drag=false, sVis=false, sRect=null, sOff=0;
        spr.querySelector('.sp-hint').textContent='つまみを横に引くと伸び、離すと戻ります。';
        var toU=function(cx){ return (cx-sRect.left)*360/sRect.width; };
        var draw=function(){
          var s=(sx-14)/190;
          coil.style.transform='scale('+s.toFixed(4)+','+clamp(1-(s-1)*.24,.62,1.3).toFixed(4)+')';
          sh.style.transform='translate('+sx.toFixed(2)+'px,36px)';
        };
        subs.push(function(dy,k){
          if(drag){ draw(); return true; }
          if(!sVis) return false;
          sv=clamp(sv+dy*5,-1100,1100);
          var dt=k/60;
          sv+=(-150*(sx-REST)-5.2*sv)*dt; sx+=sv*dt;
          if(sx<72){ sx=72; sv=-sv*.4; } else if(sx>346){ sx=346; sv=-sv*.4; }
          var live=Math.abs(sv)>2||Math.abs(sx-REST)>.25;
          if(!live){ sx=REST; sv=0; }
          draw();
          return live;
        });
        sh.addEventListener('pointerdown',function(e){
          drag=true; sh.classList.add('is-drag'); sRect=sSvg.getBoundingClientRect(); sOff=toU(e.clientX)-sx;
          try{ sh.setPointerCapture(e.pointerId); }catch(x){}
          e.preventDefault(); kick();
        });
        sh.addEventListener('pointermove',function(e){ if(!drag) return; sx=clamp(toU(e.clientX)-sOff,96,346); sv=0; kick(); });
        var sEnd=function(){ if(!drag) return; drag=false; sh.classList.remove('is-drag'); kick(); };
        sh.addEventListener('pointerup',sEnd); sh.addEventListener('pointercancel',sEnd); sh.addEventListener('lostpointercapture',sEnd);
        spr._vis=function(v){ sVis=v; if(v) kick(); };
        if(visIO) visIO.observe(spr); else sVis=true;
        spr._on=function(d){ setTimeout(function(){ sv=760; kick(); },d+250); };
      }
    }catch(e){}

    /* ---------- classes showpiece: the 55-minute timeline fills with the scroll ---------- */
    try{
      var tl=document.getElementById('tl');
      if(tl){
        var tBar=tl.querySelector('.tl-bar'), tBlocks=all('.tl-bar i',tl), tFill=tl.querySelector('.tl-fill b'), tNum=document.getElementById('tl-n');
        var tMarks=all('.tl-sc span',tl), tStart=[0,5,15,40,50], tAt=[0,5,15,40,55];
        var tw=tl.nextElementSibling, tRows=tw?all('tbody tr',tw):[];
        var tp=0, tv=0, tShown=-1;
        tl.classList.add('is-live'); tNum.textContent='0'; tFill.style.transform='scaleX(0)';
        subs.push(function(dy,k){
          var r=tBar.getBoundingClientRect(), vh=window.innerHeight;
          var target=clamp((vh*.88-r.top)/(vh*.48),0,1);
          if(target>tp) tp=target;
          tv+=(tp-tv)*Math.min(1,.1*k);
          if(tp-tv<.002) tv=tp;
          var m=tv*55, mi=Math.round(m);
          tFill.style.transform='scaleX('+tv.toFixed(4)+')';
          if(mi!==tShown){
            tShown=mi; tNum.textContent=String(mi);
            var cur=-1;
            tBlocks.forEach(function(b,i){ var on=m>tStart[i]+.3; b.classList.toggle('on',on); if(on) cur=i; });
            tMarks.forEach(function(s,i){ s.classList.toggle('on',m>=tAt[i]-.5&&m>0); });
            tRows.forEach(function(tr,i){ tr.classList.toggle('tl-cur',i===cur&&mi<55); });
          }
          return tv!==tp;
        });
      }
    }catch(e){}

    /* ---------- schedule showpiece: filter flip + today's column ---------- */
    try{
      var tt=document.getElementById('tt');
      if(tt){
        var ttRows=all('tbody tr',tt), cnt=document.getElementById('tt-count'), fl=0;
        ttRows.forEach(function(tr,r){
          all('.c',tr).forEach(function(c){ c.style.setProperty('--fd',((r+c.parentNode.cellIndex)*38)+'ms'); });
        });
        all('.filter button').forEach(function(b){
          b.addEventListener('click',function(){
            fl^=1; tt.classList.toggle('flip-a',fl===1); tt.classList.toggle('flip-b',fl===0);
            if(cnt) restart(cnt,'is-chg');
          });
        });
        var th=tt.querySelector('thead th.today');
        if(th){ ttRows.forEach(function(tr){ var td=tr.children[th.cellIndex]; if(td&&td.tagName==='TD') td.classList.add('tcol'); }); }
      }
    }catch(e){}

    /* ---------- access showpiece: the route draws itself and a dot walks it ---------- */
    try{
      var map=document.querySelector('.map');
      if(map){
        var mSvg=map.querySelector('svg'), route=mSvg.querySelector('.route'), L=route.getTotalLength();
        var wps=all('.wp',mSvg), goal=mSvg.querySelector('.goal'), mSteps=all('.steps > li',map.parentNode);
        var walker=document.createElementNS('http://www.w3.org/2000/svg','circle');
        walker.setAttribute('class','walker'); walker.setAttribute('r','5.5'); walker.style.opacity='0'; walker.style.transition='opacity .4s';
        mSvg.appendChild(walker);
        route.style.strokeDasharray=L+' '+L; route.style.strokeDashoffset=String(L);
        var marks=[0,101/L,231/L,1], playing=false;
        var play=function(){
          if(playing) return; playing=true;
          wps.forEach(function(w){ w.classList.remove('on'); }); if(goal) goal.classList.remove('on');
          route.style.strokeDashoffset=String(L);
          var t0=null, hit=-1;
          var fr=function(now){
            if(t0===null) t0=now;
            var t=Math.min(1,(now-t0)/2900), e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
            var pt=route.getPointAtLength(L*e);
            route.style.strokeDashoffset=(L*(1-e)).toFixed(1);
            walker.style.opacity='1';
            walker.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+(pt.y+Math.sin(t*52)*1.2).toFixed(1)+')');
            for(var i=hit+1;i<marks.length;i++){
              if(e>=marks[i]-.004){
                hit=i; if(wps[i]) wps[i].classList.add('on');
                if(mSteps[i]&&mSteps[i].classList.contains('mo-in')) restart(mSteps[i],'hit');
              }
            }
            if(t<1){ requestAnimationFrame(fr); }
            else{ if(goal) goal.classList.add('on'); walker.style.opacity='0'; playing=false; }
          };
          requestAnimationFrame(fr);
        };
        map._on=function(d){ setTimeout(play,d+700); };
        var rb=el('button','map-replay'); rb.type='button'; rb.textContent='道順をもう一度たどる';
        rb.addEventListener('click',play);
        map.insertBefore(rb,mSvg.nextSibling);
      }
    }catch(e){}

    /* ---------- reserve: focus node on the axis, demo message ---------- */
    try{
      var bf=document.getElementById('book-form');
      if(bf){
        bf.addEventListener('focusin',function(ev){
          var f=ev.target.closest&&ev.target.closest('.f');
          if(f) f.style.setProperty('--fx',(axis.getBoundingClientRect().left-f.getBoundingClientRect().left).toFixed(1)+'px');
        });
        var msg=document.getElementById('book-msg'), sbtn=bf.querySelector('.btn');
        bf.addEventListener('submit',function(){
          if(!msg.querySelector('.msg-ic')){
            var ic=el('span','',''); ic.innerHTML='<svg class="msg-ic" viewBox="0 0 26 26" aria-hidden="true"><circle class="p" cx="13" cy="13" r="11"/><circle class="r" cx="13" cy="13" r="11"/><circle class="d" cx="13" cy="13" r="4"/></svg>';
            msg.insertBefore(ic.firstChild,msg.firstChild); msg.classList.add('has-ic');
          }
          if(sbtn) restart(sbtn,'is-snap');
          if(lv) restart(lv,'wob');
        });
      }
    }catch(e){}

    /* ---------- page-to-page: sweep the curtain, then go ---------- */
    try{
      var sweep=document.querySelector('.sweep'), leaving=false;
      if(sweep){
        document.addEventListener('click',function(ev){
          if(leaving||ev.defaultPrevented||ev.button||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey) return;
          var a=ev.target.closest&&ev.target.closest('a[href]');
          if(!a||a.target||a.hasAttribute('download')) return;
          var h=a.getAttribute('href');
          if(!h||/^(#|tel:|mailto:|https?:|\/\/|javascript:)/i.test(h)) return;
          var u; try{ u=new URL(a.href); }catch(e){ return; }
          if(u.pathname===location.pathname&&u.search===location.search) return;
          ev.preventDefault(); leaving=true;
          try{ sessionStorage.setItem('fp-nav',String(Date.now())); }catch(e){}
          var done=false, go=function(){ if(done) return; done=true; location.href=a.href; };
          try{ root.classList.add('mo-out'); sweep.addEventListener('animationend',go); }catch(e){ go(); }
          setTimeout(go,340);
        });
        window.addEventListener('pageshow',function(e){ if(e.persisted){ leaving=false; root.classList.remove('mo-out'); } });
      }
    }catch(e){}

    /* ---------- go ---------- */
    root.classList.add('mo-ready');
    if('IntersectionObserver' in window){
      io=new IntersectionObserver(function(es){
        var vis=es.filter(function(en){return en.isIntersecting;});
        vis.sort(function(a,b){ var d=a.boundingClientRect.top-b.boundingClientRect.top; return Math.abs(d)>4?d:a.boundingClientRect.left-b.boundingClientRect.left; });
        reveal(vis.map(function(en){return en.target;}));
      },{rootMargin:'0px 0px -9% 0px',threshold:0});
      pending.forEach(function(e){
        if(!e.classList.contains('e-band')&&e.closest('.e-band')){ manual.push(e); } else { io.observe(e); }
      });
      all('.e-band').forEach(function(e){ e._on=function(){ setTimeout(checkManual,200); }; });
      /* safety: nothing that is on screen may stay hidden */
      setTimeout(inView,2500);
    }else{
      pending.forEach(function(e){ e._done=true; show(e,0); });
    }
    kick();
  }catch(e){ bail(); }
})();
