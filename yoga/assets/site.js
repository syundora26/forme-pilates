(function(){
  /* menu */
  var btn=document.querySelector('.menu-btn'),nav=document.getElementById('gnav');
  if(btn&&nav){
    var label=btn.querySelector('span');
    function set(open){
      nav.classList.toggle('is-open',open);
      btn.setAttribute('aria-expanded',open?'true':'false');
      if(label)label.textContent=open?'とじる':'メニュー';
    }
    btn.addEventListener('click',function(){set(btn.getAttribute('aria-expanded')!=='true');});
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&btn.getAttribute('aria-expanded')==='true'){set(false);btn.focus();}
    });
    if(window.matchMedia){
      var mq=window.matchMedia('(min-width:1080px)');
      var onmq=function(){if(mq.matches)set(false);};
      if(mq.addEventListener)mq.addEventListener('change',onmq);else if(mq.addListener)mq.addListener(onmq);
    }
  }

  /* booking form (demo) */
  var form=document.getElementById('form'),msg=document.getElementById('form-msg');
  if(form&&msg)form.addEventListener('submit',function(e){e.preventDefault();msg.textContent='デモサイトのため、送信はされません。';});

  /* a day at the studio: morning -> midday -> night */
  var day=document.querySelector('.day');
  if(!day||!window.requestAnimationFrame||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var blocks=day.querySelectorAll('[data-time]'),track=day.querySelector('.sky__track'),mark=day.querySelector('.sky__mark');
  if(blocks.length!==3||!track||!mark)return;
  var M=[232,238,230],N=[239,235,217],D=[230,205,184],B=[51,65,76],K=[30,40,48];
  var stops=[[0,M],[.35,M],[.75,N],[1.3,N],[1.6,D]],dark=[[1.6,B],[1.85,K],[9,K]];
  function mix(a,b,t){return 'rgb('+a.map(function(v,i){return Math.round(v+(b[i]-v)*t)}).join(',')+')';}
  function at(list,t){for(var i=1;i<list.length;i++){if(t<=list[i][0]){var a=list[i-1],b=list[i];return mix(a[1],b[1],(t-a[0])/(b[0]-a[0]));}}var l=list[list.length-1][1];return mix(l,l,0);}
  var ticking=false;
  function update(){
    ticking=false;
    var mid=window.innerHeight/2,c=[];
    for(var i=0;i<3;i++){var r=blocks[i].getBoundingClientRect();c.push(r.top+r.height/2);}
    var t;
    if(mid<=c[0])t=0;else if(mid>=c[2])t=2;
    else if(mid<c[1])t=(mid-c[0])/(c[1]-c[0]);else t=1+(mid-c[1])/(c[2]-c[1]);
    var night=t>1.6;
    day.style.backgroundColor=night?at(dark,t):at(stops,t);
    day.classList.toggle('is-night',night);
    var s=t/2,h=track.clientHeight;
    mark.style.transform='translate('+(26-88*s*(1-s))+'px,'+(s*h)+'px)';
    day.__t=t;if(window.__moSky)window.__moSky(t);
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
  day.classList.add('day--live');
  update();
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',req);
})();
