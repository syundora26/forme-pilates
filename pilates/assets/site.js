/* FORME PILATES — shared script: axis, menu, timetable filter, booking form (UI only) */
(function(){
  var root=document.documentElement;
  function all(s,c){return [].slice.call((c||document).querySelectorAll(s));}

  /* ---- menu (small screens) ---- */
  try{
    var btn=document.getElementById('menu-btn'), nav=document.getElementById('menu');
    var label=btn.querySelector('.t');
    var rest=all('main,.site-foot,.skip');
    var isOpen=false;
    function setMenu(o){
      isOpen=o;
      nav.classList.toggle('open',o);
      btn.setAttribute('aria-expanded',String(o));
      label.textContent=o?'閉じる':'メニュー';
      document.body.style.overflow=o?'hidden':'';
      rest.forEach(function(e){ if(o){e.setAttribute('inert','');} else {e.removeAttribute('inert');} });
    }
    btn.addEventListener('click',function(){setMenu(!isOpen);});
    document.addEventListener('keydown',function(ev){
      if(!isOpen) return;
      if(ev.key==='Escape'||ev.key==='Esc'){ setMenu(false); btn.focus(); return; }
      if(ev.key==='Tab'){
        var links=all('a',nav), last=links[links.length-1];
        if(!ev.shiftKey && document.activeElement===last){ ev.preventDefault(); btn.focus(); }
        else if(ev.shiftKey && document.activeElement===btn){ ev.preventDefault(); last.focus(); }
      }
    });
    all('a',nav).forEach(function(a){a.addEventListener('click',function(){ if(isOpen) setMenu(false); });});
    if(window.matchMedia){
      var mq=matchMedia('(min-width:1020px)'), close=function(){ if(mq.matches && isOpen) setMenu(false); };
      if(mq.addEventListener) mq.addEventListener('change',close); else if(mq.addListener) mq.addListener(close);
    }
  }catch(e){}

  /* ---- axis: drawn length follows scroll ---- */
  function showAll(){
    root.classList.add('live');
    all('.reveal').forEach(function(e){e.classList.add('in')});
    all('.node').forEach(function(e){e.classList.add('is-lit')});
    var f=document.querySelector('.axis-fill'); if(f) f.style.transform='none';
  }
  try{
    var axis=document.querySelector('.axis'), fill=axis.querySelector('.axis-fill');
    var nodes=all('.node'), revs=all('.reveal');
    var reduce=window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ticking=false;
    function update(){
      ticking=false;
      var vh=window.innerHeight, max=root.scrollHeight-vh;
      var p=max>0?Math.min(1,Math.max(0,window.pageYOffset/max)):1;
      var tip=vh*(0.56+0.44*p);
      var r=axis.getBoundingClientRect();
      var len=Math.min(r.height,Math.max(0,tip-r.top));
      fill.style.transform='scaleY('+(r.height?len/r.height:1).toFixed(5)+')';
      for(var i=0;i<nodes.length;i++){
        var n=nodes[i].getBoundingClientRect();
        nodes[i].classList.toggle('is-lit', n.top+n.height/2<=tip+1);
      }
      for(var j=revs.length-1;j>=0;j--){
        if(revs[j].getBoundingClientRect().top<vh*0.86){revs[j].classList.add('in');revs.splice(j,1);}
      }
    }
    function req(){ if(!ticking){ticking=true;requestAnimationFrame(update);} }
    if(reduce || !window.requestAnimationFrame){ showAll(); }
    else{
      requestAnimationFrame(function(){requestAnimationFrame(update)});
      window.addEventListener('scroll',req,{passive:true});
      window.addEventListener('resize',req);
      window.addEventListener('load',req);
      all('details').forEach(function(d){d.addEventListener('toggle',req);});
      setTimeout(function(){root.classList.add('live');req();},1500);
      /* safety: never leave an in-view photo hidden */
      setTimeout(function(){ if(!fill.style.transform){ showAll(); } else { update(); } },3000);
    }
  }catch(e){ root.classList.remove('js'); }

  /* ---- timetable filter + today marker (schedule page) ---- */
  try{
    var tt=document.getElementById('tt');
    if(tt){
      var count=document.getElementById('tt-count');
      var btns=all('.filter button');
      var names={all:'すべてのクラス',mat:'マット',reformer:'リフォーマー'};
      var setFilter=function(k){
        tt.setAttribute('data-show',k);
        btns.forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-f')===k))});
        var n=k==='all'?tt.querySelectorAll('.c').length:tt.querySelectorAll('.c[data-type="'+k+'"]').length;
        count.textContent=names[k]+'：週'+n+'本';
      };
      btns.forEach(function(b){b.addEventListener('click',function(){setFilter(b.getAttribute('data-f'))})});
      setFilter('all');
      var th=tt.querySelector('thead th[data-d="'+new Date().getDay()+'"]');
      if(th){
        th.classList.add('today');
        var s=th.querySelector('small'); s.textContent=s.textContent?'今日（定休）':'今日';
        var sc=document.getElementById('tt-scroll');
        if(sc.scrollWidth>sc.clientWidth){ sc.scrollLeft=Math.max(0,th.offsetLeft-90); }
      }
    }
  }catch(e){}

  /* ---- booking form (UI only; nothing is sent) ---- */
  try{
    var form=document.getElementById('book-form');
    if(form){
      var msg=document.getElementById('book-msg'), date=document.getElementById('f-date');
      var d=new Date(), iso=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
      date.min=iso;
      form.addEventListener('submit',function(ev){
        ev.preventDefault();
        msg.hidden=true; void msg.offsetWidth; msg.hidden=false;
        if(msg.scrollIntoView) msg.scrollIntoView({block:'nearest'});
      });
    }
  }catch(e){}
})();
