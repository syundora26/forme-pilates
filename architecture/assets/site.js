(function(){
  var d=document,root=d.documentElement,mo=root.classList.contains('mo');
  var $=function(s,c){return (c||d).querySelector(s)},$$=function(s,c){return [].slice.call((c||d).querySelectorAll(s))};

  /* menu (top strip, below 900px) */
  var rail=$('.rail'),btn=$('.rail__btn'),menu=$('#menu');
  if(rail&&btn&&menu){
    var setOpen=function(o){rail.classList.toggle('is-open',o);btn.setAttribute('aria-expanded',o?'true':'false');btn.setAttribute('aria-label',o?'図面リストを閉じる':'図面リストを開く')};
    btn.addEventListener('click',function(){setOpen(btn.getAttribute('aria-expanded')!=='true')});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&rail.classList.contains('is-open')){setOpen(false);btn.focus()}});
    d.addEventListener('click',function(e){if(rail.classList.contains('is-open')&&!rail.contains(e.target))setOpen(false)});
    if(window.matchMedia){var mq=matchMedia('(min-width:900px)'),off=function(){if(mq.matches)setOpen(false)};mq.addEventListener?mq.addEventListener('change',off):mq.addListener(off)}
  }

  /* plan: draw once, then interactive */
  var plan=$('.plan');
  if(plan){
    var live=$('#room-live'),items=$$('#rooms li'),groups=$$('.room',plan),labels=$$('[data-l]',plan);
    var select=function(key,announce){
      items.forEach(function(li){var on=li.dataset.room===key;li.classList.toggle('is-on',on);$('button',li).setAttribute('aria-expanded',on)});
      groups.forEach(function(g){g.setAttribute('aria-pressed',g.dataset.room===key)});
      labels.forEach(function(t){t.classList.toggle('on',t.dataset.l===key)});
      if(announce){var li=items.filter(function(l){return l.dataset.room===key})[0];live.textContent=$('button',li).firstChild.textContent+'。'+$('.note',li).textContent}
    };
    groups.forEach(function(g){
      g.addEventListener('click',function(){select(g.dataset.room,true)});
      g.addEventListener('mouseenter',function(){if(matchMedia('(hover:hover)').matches)select(g.dataset.room,false)});
      g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(g.dataset.room,true)}});
    });
    items.forEach(function(li){$('button',li).addEventListener('click',function(){select(li.dataset.room,false)})});
    if(mo){
      var io=new IntersectionObserver(function(en){
        if(en[0].isIntersecting){io.disconnect();plan.classList.add('is-go');try{plan.dispatchEvent(new CustomEvent('plan:go'))}catch(e){}setTimeout(function(){plan.classList.add('is-done');select('court',false)},3400)}
      },{threshold:.3});
      io.observe(plan);
    }else select('court',false);
  }

  /* sun: scroll-linked until the visitor takes the slider (or drags the sun itself) */
  var fig=$('#sunfig');
  if(fig){
    var svg=$('svg',fig),sun=$('#sun'),ray=$('#ray'),beam=$('#beam'),lit=$('#lit'),shd=$('#shd'),shdT=$('#shd-t'),rA=$('#r-alt'),rS=$('#r-shd'),rI=$('#r-in');
    var NS='http://www.w3.org/2000/svg',mk=function(t,id){var e=d.createElementNS(NS,t);e.id=id;return e};
    var tsh=mk('path','tsh'),hit=mk('circle','sunhit');hit.setAttribute('r','30');svg.insertBefore(tsh,beam);svg.appendChild(hit);
    var ctl=d.createElement('div');ctl.className='sunctl';
    ctl.innerHTML='<label for="sun-r">季節を動かす<output id="sun-o" for="sun-r"></output></label><input id="sun-r" type="range" min="0" max="100" step="1" value="51"><div class="tk" aria-hidden="true"><span>夏至</span><span>春分・秋分</span><span>冬至</span></div>';
    var ro=$('.readout',fig);ro.parentNode.insertBefore(ctl,ro.nextSibling);
    var range=$('#sun-r'),out=$('#sun-o'),manual=false;
    var f=function(n){return Math.round(n*10)/10};
    var mm=function(u){return (Math.round(u*18.2/10)*10).toLocaleString('en-US')};
    var setSun=function(a){
      var r=a*Math.PI/180,t=Math.tan(r),sx=310+230*Math.cos(r),sy=208-230*Math.sin(r),xh=310-132/t,hx,hy;
      if(xh<110){hx=110;hy=208+200*t}else{hx=xh;hy=340}
      sun.setAttribute('cx',f(sx));sun.setAttribute('cy',f(sy));hit.setAttribute('cx',f(sx));hit.setAttribute('cy',f(sy));
      ray.setAttribute('d','M'+f(sx)+' '+f(sy)+'L'+f(hx)+' '+f(hy));
      var yg=208+50*t;
      if(yg<340){beam.setAttribute('d',xh<110?'M260 '+f(yg)+'L110 '+f(hy)+'V340H260z':'M260 '+f(yg)+'L'+f(xh)+' 340H260z');lit.setAttribute('d','M'+f(Math.max(xh,110))+' 340H260')}
      else{beam.setAttribute('d','');lit.setAttribute('d','')}
      var x0=Math.max(xh,110);
      shd.setAttribute('d','M'+f(x0)+' 378H310M'+f(x0)+' 372v12M310 372v12');
      shdT.setAttribute('x',f((x0+310)/2));shdT.textContent=(310-x0<70?'':'軒の影 ')+mm(132/t);
      tsh.setAttribute('d','M385 357H'+f(Math.max(385-148/t,314)));
      rA.textContent=Math.round(a)+'°';rS.textContent=mm(132/t)+' mm';rI.textContent=xh>=260?'0 mm':(xh<=110?'奥の壁まで':mm(260-xh)+' mm');
      var nm=a>=76?'夏至':a<=33?'冬至':(a>=52&&a<=56)?'春分・秋分':a>56?'夏至と秋分のあいだ':'秋分と冬至のあいだ';
      range.value=Math.round((78-a)/47*100);out.textContent=nm+'　'+Math.round(a)+'°';range.setAttribute('aria-valuetext',nm+'、正午の太陽高度 '+Math.round(a)+'度');
    };
    range.addEventListener('input',function(){manual=true;setSun(78-47*range.value/100)});
    var drag=false,pt=function(e){var m=svg.getScreenCTM();if(!m)return;var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;p=p.matrixTransform(m.inverse());
      var a=Math.atan2(208-p.y,p.x-310)*180/Math.PI;manual=true;setSun(Math.max(31,Math.min(78,a)))};
    hit.addEventListener('pointerdown',function(e){drag=true;try{hit.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault()});
    hit.addEventListener('pointermove',function(e){if(drag)pt(e)});
    ['pointerup','pointercancel'].forEach(function(n){hit.addEventListener(n,function(){drag=false})});
    var s=$('.smo');
    if(mo){
      if(s)s.textContent='画面を送るか、つまみ（または太陽）を動かすと、夏至から冬至へ太陽が下がります';
      var tick=false,vis=false;
      var upd=function(){tick=false;if(manual)return;var b=fig.getBoundingClientRect(),vh=innerHeight,c=b.top+b.height/2,p=Math.max(0,Math.min(1,(vh*.95-c)/(vh*.8)));setSun(78-47*p)};
      new IntersectionObserver(function(en){vis=en[0].isIntersecting;if(vis)upd()}).observe(fig);
      addEventListener('scroll',function(){if(vis&&!tick&&!manual){tick=true;requestAnimationFrame(upd)}},{passive:true});
      addEventListener('resize',upd);upd();
    }else{if(s)s.textContent='つまみ（または太陽）を動かすと、夏至から冬至へ太陽が下がります';setSun(54)}
  }

  /* form (demo) */
  var form=$('#form');
  if(form)form.addEventListener('submit',function(e){e.preventDefault();var m=$('#form-msg');m.textContent='デモサイトのため、送信はされません。';m.focus&&m.focus()});
})();
