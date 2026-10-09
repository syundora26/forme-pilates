(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fmt(sec){var m=Math.floor(sec/60),s=Math.floor(sec%60);return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;}

  /* global menu (mobile panel) */
  var btn=document.getElementById('menuBtn'),nav=document.getElementById('gnav');
  if(btn&&nav){
    var txt=btn.querySelector('.menu-txt');
    var setOpen=function(open){
      nav.classList.toggle('is-open',open);
      btn.setAttribute('aria-expanded',open?'true':'false');
      if(txt)txt.textContent=open?'閉じる':'メニュー';
    };
    btn.addEventListener('click',function(){setOpen(btn.getAttribute('aria-expanded')!=='true');});
    document.addEventListener('keydown',function(e){
      if((e.key==='Escape'||e.key==='Esc')&&btn.getAttribute('aria-expanded')==='true'){setOpen(false);btn.focus();}
    });
    document.addEventListener('click',function(e){
      if(btn.getAttribute('aria-expanded')==='true'&&!nav.contains(e.target)&&!btn.contains(e.target))setOpen(false);
    });
  }

  /* booking form: UI only */
  var form=document.getElementById('bookForm');
  if(form){form.addEventListener('submit',function(e){e.preventDefault();var m=document.getElementById('formMsg');m.hidden=false;if(m.scrollIntoView)m.scrollIntoView({block:'nearest'});});}

  function markAll(){var p=document.querySelectorAll('.phase');for(var i=0;i<p.length;i++)p[i].classList.add('is-active');}
  if(reduce||!window.requestAnimationFrame){root.classList.add('done');markAll();return;}

  /* home hero: clock counts 00:00 -> 50:00 */
  var hc=document.getElementById('heroClock');
  if(hc){
    hc.textContent='00:00';
    var t0=null,delay=300,dur=1200;
    requestAnimationFrame(function tick(t){
      if(t0===null)t0=t;
      var k=Math.min(1,Math.max(0,(t-t0-delay)/dur));
      var e=1-Math.pow(1-k,3);
      hc.textContent=fmt(Math.round(e*3000));
      if(k<1)requestAnimationFrame(tick);
    });
  }
  /* safety: never leave the hero in its start state */
  setTimeout(function(){root.classList.add('done');if(hc)hc.textContent='50:00';},2600);

  /* sessions page: scroll-linked 50-minute clock + progress bar */
  var list=document.getElementById('phases'),fill=document.getElementById('runFill'),rc=document.getElementById('runClock'),labels=document.getElementById('runLabels');
  if(!list||!fill||!rc)return;
  var phases=list.children,labs=labels?labels.children:[],range=[[0,10],[10,40],[40,50]],ticking=false,last='',active=-1;
  function update(){
    ticking=false;
    var line=window.innerHeight*0.55,min=0,idx=0;
    for(var i=0;i<phases.length;i++){
      var r=phases[i].getBoundingClientRect();
      if(line>=r.bottom){min=range[i][1];idx=i;}
      else if(line>r.top){min=range[i][0]+(range[i][1]-range[i][0])*((line-r.top)/r.height);idx=i;break;}
      else break;
    }
    fill.style.transform='scaleX('+(min/50).toFixed(4)+')';
    var txt=fmt(Math.round(min*60));
    if(txt!==last){rc.textContent=txt;last=txt;}
    if(idx!==active){
      active=idx;
      for(var j=0;j<phases.length;j++){
        phases[j].classList.toggle('is-active',j===idx);
        if(labs[j])labs[j].classList.toggle('is-active',j===idx);
      }
    }
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
  try{
    window.addEventListener('scroll',req,{passive:true});
    window.addEventListener('resize',req);
    update();
  }catch(err){fill.style.transform='';rc.textContent='50:00';markAll();}
})();
