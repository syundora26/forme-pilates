/* axonometric model of the courtyard house (W-01). Pure function: YAXO.render(theta, p) -> SVG markup.
   Used by node at build time (static fallback) and in the browser (assembly + rotation). 1 unit = 910mm. */
(function(g){
  var S=27,ZS=25.5,H=2.7,Z0=.18,CX=6,CY=5;
  var U=[[0,0],[12,0],[12,10],[8,10],[8,3],[4,3],[4,7],[0,7]];
  var ROOF=[[-.35,-.35],[12.35,-.35],[12.35,10.35],[7,10.35],[7,4],[5,4],[5,7.35],[-.35,7.35]];
  var SLAB=[[-.2,-.2],[12.2,-.2],[12.2,10.2],[7.8,10.2],[7.8,3.2],[4.2,3.2],[4.2,7.2],[-.2,7.2]];
  /* walls: a->b, outward normal, group, windows [t0,t1,z0,z1] along the wall in modules */
  var WALLS=[
    {a:[0,0],b:[12,0],n:[0,-1],g:'N',w:[[1.2,2.8,1.7,2.3],[5.2,7,1.7,2.3],[10,11,0,2.2,'door']]},
    {a:[4,3],b:[8,3],n:[0,1],g:'N',w:[[.3,3.7,0,2.3,'gl']]},
    {a:[0,0],b:[0,7],n:[-1,0],g:'W',w:[[1,2.4,.9,2.1]]},
    {a:[4,3],b:[4,7],n:[1,0],g:'W',w:[[.3,3.7,0,2.3,'gl']]},
    {a:[0,7],b:[4,7],n:[0,1],g:'W',w:[[.8,3.2,.5,2.2]]},
    {a:[12,0],b:[12,10],n:[1,0],g:'E',w:[[3.6,4.2,1.2,2.1],[5.6,6.5,1.2,2.1],[8,9.2,.9,2.1]]},
    {a:[8,3],b:[8,10],n:[-1,0],g:'E',w:[[.3,3.7,0,2.3,'gl'],[5,6.3,.9,2.1]]},
    {a:[8,10],b:[12,10],n:[0,1],g:'E',w:[[1.2,3.2,.5,2.2]]}
  ];
  var RISE={0:0,5:1,2:2,1:3,3:4,6:5,4:6,7:7};
  function cl(v){return v<0?0:v>1?1:v}
  function seg(p,a,b){return cl((p-a)/(b-a))}
  function eo(t){return 1-Math.pow(1-t,3)}
  function eb(t){var c=1.9;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
  function f(n){return (Math.round(n*10)/10).toString()}
  function mm(n){return (Math.round(n/10)*10).toString().replace(/\B(?=(\d{3})+$)/g,',')}

  function render(th,p){
    var c=Math.cos(th),s=Math.sin(th),cx=c+s,cy=c-s,o=[];
    function P(x,y,z){var X=x-CX,Y=y-CY,xr=X*c-Y*s,yr=X*s+Y*c;return [(xr-yr)*.866*S,(xr+yr)*.5*S-(z||0)*ZS]}
    function pts(a,z,dx,dy){return a.map(function(q){var r=P(q[0]+(dx||0),q[1]+(dy||0),z);return f(r[0])+' '+f(r[1])}).join('L')}
    function path(dd,cls,ex){o.push('<path class="'+cls+'" d="'+dd+'"'+(ex||'')+'/>')}
    function poly(a,z,cls,ex,dx,dy){path('M'+pts(a,z,dx,dy)+'z',cls,ex)}
    function line(a,b,cls,ex){var p1=P(a[0],a[1],a[2]),p2=P(b[0],b[1],b[2]);path('M'+f(p1[0])+' '+f(p1[1])+'L'+f(p2[0])+' '+f(p2[1]),cls,ex)}
    function op(v){return v>=1?'':' opacity="'+f(v*10)/10+'"'}
    function ring(x,y,r,z){var a=[],i;for(i=0;i<14;i++)a.push([x+r*Math.cos(i*Math.PI/7),y+r*Math.sin(i*Math.PI/7)]);return 'M'+pts(a,z)+'z'}
    function part(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,0]}

    var k1=seg(p,0,.2),k2=eo(seg(p,.16,.36)),k3=seg(p,.34,.66),k4=eo(seg(p,.62,.84)),k5=seg(p,.8,1);

    /* 1 site */
    var site=[[-.7,-2.5],[12.7,-2.5],[12.7,11],[-.7,11]],i,t;
    for(i=0;i<4;i++){t=cl(k1*4.6-i);if(t>0)line(site[i].concat(0),part(site[i],site[(i+1)%4],eo(t)),'ax-s')}
    t=eo(seg(k1,.1,.9));
    if(t>0){line([6-9*t,-2.5,0],[6+9*t,-2.5,0],'ax-t');line([6-9*t,-3.7,0],[6+9*t,-3.7,0],'ax-t')}
    t=seg(k1,.5,1);
    if(t>0){
      o.push('<g'+op(t)+'>');
      poly([[2,-2.3],[7.4,-2.3],[7.4,-.4],[2,-.4]],0,'ax-d');
      [[10.15,-2.25,.7,.4],[10.3,-1.7,.7,.4],[9.7,-1.1,1.6,1]].forEach(function(r){poly([[r[0],r[1]],[r[0]+r[2],r[1]],[r[0]+r[2],r[1]+r[3]],[r[0],r[1]+r[3]]],0,'ax-t')});
      [[1.2,8.2,.4],[2.1,9.4,.3],[5.4,9.6,.45],[.4,9.7,.28]].forEach(function(q){path(ring(q[0],q[1],q[2],0),'ax-t')});
      line([9.9,-2.5,0],[9.9,-2.5,.9],'ax-m');line([11.1,-2.5,0],[11.1,-2.5,.9],'ax-m');
      /* north mark on the ground */
      path(ring(-1.9,10,.55,0),'ax-t');line([-1.9,10.55,0],[-1.9,9.1,0],'ax-m');line([-2.12,9.5,0],[-1.9,9.1,0],'ax-m');line([-1.68,9.5,0],[-1.9,9.1,0],'ax-m');
      var np=P(-1.9,8.5,0);o.push('<text class="ax-x" x="'+f(np[0])+'" y="'+f(np[1]+4)+'">N</text>');
      o.push('</g>');
    }

    /* shadow on the ground grows with the walls */
    var hw=eo(seg(k3,.1,1)),sv=[.55*H*hw,-.8*H*hw];
    if(k2>0&&hw>.02){
      for(i=0;i<8;i++){var a=U[i],b=U[(i+1)%8];poly([a,b,[b[0]+sv[0],b[1]+sv[1]],[a[0]+sv[0],a[1]+sv[1]]],0,'ax-sh')}
      poly(U,0,'ax-sh','',sv[0],sv[1]);
    }

    /* 2 slab */
    if(k2>0){
      var zo=-(1-k2)*1.4;
      o.push('<g'+op(Math.min(1,k2*2.2))+'>');
      poly(SLAB,zo,'ax-f');poly(SLAB,Z0+zo,'ax-f');
      poly([[4.2,3.2],[7.8,3.2],[7.8,7.2],[4.2,7.2]],Z0+zo,'ax-c');
      line([4.2,3.75,Z0+zo],[7.8,3.75,Z0+zo],'ax-t');
      [[6.9,6.4],[7,5.6],[6.7,6.95]].forEach(function(q){poly([[q[0],q[1]],[q[0]+.55,q[1]],[q[0]+.55,q[1]+.32],[q[0],q[1]+.32]],Z0+zo,'ax-t')});
      o.push('</g>');
      /* dimension lines extend from their midpoints, numbers count up */
      var e=k2;
      line([6-6*e,11.9,0],[6+6*e,11.9,0],'ax-dm');line([13.5,5-5*e,0],[13.5,5+5*e,0],'ax-dm');
      if(e>.96){[[0,11.9],[12,11.9],[13.5,0],[13.5,10]].forEach(function(q){line([q[0]-.18,q[1]+.18,0],[q[0]+.18,q[1]-.18,0],'ax-m')});
        line([0,11.2,0],[0,12.2,0],'ax-t');line([12,11.2,0],[12,12.2,0],'ax-t');line([12.9,0,0],[13.8,0,0],'ax-t');line([12.9,10,0],[13.8,10,0],'ax-t')}
      var d1=P(6,12.9,0),d2=P(14.5,5,0);
      o.push('<text class="ax-x" x="'+f(d1[0])+'" y="'+f(d1[1]+4)+'">'+mm(10920*e)+'</text><text class="ax-x" x="'+f(d2[0])+'" y="'+f(d2[1]+4)+'">'+mm(9100*e)+'</text>');
    }

    /* 3 walls, drawn back to front */
    function wall(w,idx){
      var h=eo(cl(k3*1.7-RISE[idx]*.1));if(h<=0)return;
      var front=w.n[0]*cx+w.n[1]*cy>0,lit=w.n[0]*-.5+w.n[1]*.85>0,zt=Z0+H*h;
      var q=[P(w.a[0],w.a[1],Z0),P(w.b[0],w.b[1],Z0),P(w.b[0],w.b[1],zt),P(w.a[0],w.a[1],zt)];
      path('M'+q.map(function(r){return f(r[0])+' '+f(r[1])}).join('L')+'z',front?(lit?'ax-w':'ax-w2'):'ax-wi');
      if(front&&h>.5&&w.w){var L=Math.sqrt(Math.pow(w.b[0]-w.a[0],2)+Math.pow(w.b[1]-w.a[1],2)),ux=(w.b[0]-w.a[0])/L,uy=(w.b[1]-w.a[1])/L,v=seg(h,.5,1);
        w.w.forEach(function(m){var a=[w.a[0]+ux*m[0],w.a[1]+uy*m[0]],b=[w.a[0]+ux*m[1],w.a[1]+uy*m[1]],z1=Z0+m[2]*h,z2=Z0+m[3]*h;
          var r=[P(a[0],a[1],z1),P(b[0],b[1],z1),P(b[0],b[1],z2),P(a[0],a[1],z2)];
          path('M'+r.map(function(k){return f(k[0])+' '+f(k[1])}).join('L')+'z',m[4]==='gl'?'ax-g':(m[4]==='door'?'ax-dr':'ax-wn'),op(v));
          if(m[4]==='gl'){var n=Math.round((m[1]-m[0])/.9),j;for(j=1;j<n;j++){var x=a[0]+(b[0]-a[0])*j/n,y=a[1]+(b[1]-a[1])*j/n;line([x,y,z1],[x,y,z2],'ax-t',op(v))}}
        })}
    }
    var grp={N:[],W:[],E:[]};WALLS.forEach(function(w,i){grp[w.g].push(i)});
    function box(k){return function(){var a=grp[k].slice().sort(function(x,y){var fx=WALLS[x].n[0]*cx+WALLS[x].n[1]*cy>0,fy=WALLS[y].n[0]*cx+WALLS[y].n[1]*cy>0;return (fx?1:0)-(fy?1:0)});a.forEach(function(i){wall(WALLS[i],i)})}}
    var g5=k5>0?eb(k5):0;
    function trunk(){if(g5<=0)return;var z=Z0+3.2*g5;line([6.2,5,Z0],[6.2,5,z],'ax-tr');line([6.2,5,Z0+1.5*g5],[5.6,4.7,Z0+3.1*g5],'ax-tr');line([6.2,5,Z0+1.9*g5],[6.9,5.4,Z0+3.4*g5],'ax-tr');line([6.2,5,Z0+1.2*g5],[6.5,4.5,Z0+2.8*g5],'ax-tr')}
    function screen(){var h=eo(cl(k3*1.7-.75));if(h<=0)return;var x;for(x=4.25;x<8;x+=.25)line([x,7,Z0],[x,7,Z0+1.9*h],'ax-t');line([4,7,Z0+1.9*h],[8,7,Z0+1.9*h],'ax-m')}
    var mid=cy>0?[trunk,screen]:[screen,trunk],ord=cx>0?[box('W')].concat(mid,[box('E')]):[box('E')].concat(mid,[box('W')]);
    ord=cy>0?[box('N')].concat(ord):ord.concat([box('N')]);
    if(k3>0)ord.forEach(function(fn){fn()});else trunk();

    /* 4 roof is lowered into place */
    if(k4>0){
      var zr=Z0+H+(1-k4)*3.4;
      o.push('<g'+op(Math.min(1,k4*2.5))+'>');
      poly(ROOF,zr,'ax-e');
      ROOF.forEach(function(q){line([q[0],q[1],zr],[q[0],q[1],zr+.24],'ax-t')});
      poly(ROOF,zr+.24,'ax-r');
      if(k4<1){line([-.35,-.35,zr+.24],[-.35,-.35,zr+2.2],'ax-d');line([12.35,10.35,zr+.24],[12.35,10.35,zr+2.2],'ax-d')}
      o.push('</g>');
    }

    /* 5 tree */
    if(g5>0){
      [[6.2,5,4.3,1.5],[5.45,4.7,3.6,.95],[7,5.35,3.8,1.05]].forEach(function(q){var r=P(q[0],q[1],Z0+q[2]*g5);
        o.push('<circle class="ax-cr" cx="'+f(r[0])+'" cy="'+f(r[1])+'" r="'+f(q[3]*ZS*g5)+'"/>')});
    }
    return o.join('');
  }
  g.YAXO={render:render};
})(typeof window!=='undefined'?window:globalThis);
/* motion layer 「図面」 — vanilla JS. Functional parts (filter, view buttons, revision counter) run always;
   everything that moves runs only under html.mo (no reduced-motion, IntersectionObserver present). */
(function(){
  'use strict';
  var W=window,d=document,R=d.documentElement,C=R.classList;
  W.__mo=1;
  var mo=C.contains('mo');
  var $=function(s,c){return (c||d).querySelector(s)},$$=function(s,c){return [].slice.call((c||d).querySelectorAll(s))};
  var mq=function(q){return !!(W.matchMedia&&matchMedia(q).matches)};
  var fine=mq('(hover:hover) and (pointer:fine)');
  var NS='http://www.w3.org/2000/svg';
  function el(t,c,h){var e=d.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
  function sv(t,a,c){var e=d.createElementNS(NS,t),k;for(k in a)e.setAttribute(k,a[k]);if(c)e.setAttribute('class',c);return e}
  function run(n,fn){try{fn()}catch(e){if(W.console)console.error('[motion] '+n+': '+(e&&e.message),e)}}
  function clamp(v,a,b){return v<a?a:v>b?b:v}
  function eo(t){return 1-Math.pow(1-t,3)}
  function eio(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
  function tween(ms,fn,done){var t0=null,id,stop=false;function f(t){if(stop)return;if(t0===null)t0=t;var k=clamp((t-t0)/ms,0,1);fn(k);if(k<1)id=requestAnimationFrame(f);else if(done)done()}id=requestAnimationFrame(f);return function(){stop=true;cancelAnimationFrame(id)}}
  /* run fn(now) every frame only while el is on screen and the tab is visible */
  function loop(elm,fn){var vis=false,id=0,on=false;
    function f(t){id=0;if(!on)return;fn(t);id=requestAnimationFrame(f)}
    function set(){var want=vis&&!d.hidden;if(want&&!on){on=true;id=requestAnimationFrame(f)}else if(!want&&on){on=false;if(id)cancelAnimationFrame(id);id=0}elm.classList.toggle('vis',want)}
    new IntersectionObserver(function(en){vis=en[en.length-1].isIntersecting;set()}).observe(elm);
    d.addEventListener('visibilitychange',set);
  }
  function pad(n,l){n=String(n);while(n.length<l)n='0'+n;return n}

  /* ================= reveal engine ================= */
  var RV=[],T0=Date.now(),STEP={type:35,ink:60,rule:45,lay:110,photo:90,brush:50,pop:90,count:0,tb:0,title:0,draft:0,table:0,draw:0};
  var HOOK={};
  function tag(sel,type,root){var out=[];$$(sel,root).forEach(function(e){if(e.__rv||e.closest('.faq .a,.rail,.nomo,[hidden]'))return;e.__rv=type;e.classList.add('rv','rv-'+type);RV.push(e);out.push(e)});return out}
  function show(e,delay){if(e.classList.contains('in'))return;e.style.setProperty('--d',delay+'ms');e.classList.add('in');
    var h=HOOK[e.__rv];if(h)run('hook '+e.__rv,function(){h(e,delay)});
    setTimeout(function(){e.classList.add('done');var k=e.__sk;if(k&&k.parentNode)k.parentNode.removeChild(k)},delay+2400)}
  /* geometry scan (IntersectionObserver ignores targets that clip themselves, so positions are read directly, in one batch per frame) */
  var pend=[],scanId=0;
  function scan(){scanId=0;if(!pend.length)return;var vh=W.innerHeight,lim=vh*.93,hit=[],rest=[],i,e,r;
    for(i=0;i<pend.length;i++){e=pend[i];r=e.getBoundingClientRect();if((r.width||r.height)&&r.top<lim)hit.push([e,r.bottom>0]);else rest.push(e)}
    if(!hit.length)return;pend=rest;
    var n={},base=Date.now()-T0<500?(C.contains('arr')?300:90):0;
    hit.forEach(function(h){var e=h[0],t=e.__rv,k=n[t]||0;if(!h[1]){show(e,0);return}n[t]=k+1;show(e,(t==='draft'?0:base)+Math.min(k*(STEP[t]||0),640))})}
  function reqScan(){if(!scanId)scanId=requestAnimationFrame(scan)}
  function splitTitle(h,horiz){var lines=$$(':scope > span',h),i=0;
    if(!lines.length){var s=el('span');s.textContent=h.textContent;h.textContent='';h.appendChild(s);lines=[s]}
    h.setAttribute('aria-label',h.textContent.replace(/\s+/g,''));
    lines.forEach(function(ln){var m=ln.textContent.match(/[\s\S][、。，．！？）」』]*/g)||[],f=d.createDocumentFragment();ln.textContent='';ln.classList.add('ln');ln.setAttribute('aria-hidden','true');
      m.forEach(function(t){var c=el('span','ch');c.textContent=t;c.style.setProperty('--i',i++);f.appendChild(c)});ln.appendChild(f)});
    h.classList.add('ttl');if(horiz)h.classList.add('ttl--h')}
  function cells(t){var n=0,i;for(i=0;i<t.length;i++)n+=t.charCodeAt(i)>255?2:1;return n}
  function wrapType(e){var t=e.textContent;if(e.children.length||!t.trim()||t.length>40)return false;
    e.innerHTML='<span class="tyo"><span class="tyi"></span></span>';e.firstChild.firstChild.textContent=t;e.style.setProperty('--n',Math.max(2,cells(t)));return true}
  function prepCount(e){var t=e.textContent,m=/^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/.exec(t);if(!m||e.children.length)return false;
    var raw=m[2],num=parseFloat(raw.replace(/,/g,'')),dec=(raw.split('.')[1]||'').length,comma=raw.indexOf(',')>-1;
    if(!num||/[\u3040-\u9fff]/.test(m[1]))return false;
    e.__c={pre:m[1],suf:m[3],num:num,dec:dec,comma:comma,len:raw.length,from:(!comma&&!dec&&num>=1900&&num<=2100)?num-14:0,txt:t};return true}
  function fmt(c,v){var s=v.toFixed(c.dec);if(c.comma)s=s.replace(/\B(?=(\d{3})+(?!\d))/g,',');while(s.length<c.len)s=' '+s;return c.pre+s+c.suf}
  HOOK.count=function(e,delay){var c=e.__c;e.textContent=fmt(c,c.from);setTimeout(function(){tween(950,function(k){e.textContent=k<1?fmt(c,c.from+(c.num-c.from)*eo(k)):c.txt})},delay+120)};
  HOOK.draft=function(e,delay){var b=e.__dm;if(!b)return;var v=b.__v;setTimeout(function(){tween(1000,function(k){b.textContent='W '+Math.round(v*eo(k))+' mm'})},delay+500)};

  function prepDraw(svg){var n=0;$$('path,circle,rect,line,text',svg).forEach(function(x){if(x.id||x.closest('.north,.live'))return;
      var cs=x.getAttribute('class')||'',fd=x.tagName==='text'||/(^|\s)(fill|cfill|solid|ink|ds|acd|beam|sun)(\s|$)/.test(cs);
      x.classList.add(fd?'fd':'dw');if(!fd)x.setAttribute('pathLength','1');x.style.setProperty('--i',n++)});
    svg.style.setProperty('--s',Math.min(55,1500/Math.max(n,1)).toFixed(1)+'ms')}

  function initReveal(){
    /* sheets: border lines + a dimension line */
    $$('.sheet,.band,.foot').forEach(function(s){var b=el('span','bd','<i></i><i></i><i></i><i></i>');b.setAttribute('aria-hidden','true');s.appendChild(b);s.classList.add('dr');
      if(s.classList.contains('sheet')){var m=el('span','dm','<i></i><i></i><b></b>');m.setAttribute('aria-hidden','true');s.appendChild(m);s.__dm=m.lastChild}});
    measure();
    tag('.sheet,.band,.foot','draft');
    $$('.st__h,.hero__h h1').forEach(function(h){splitTitle(h,false)});
    $$('.band h2').forEach(function(h){splitTitle(h,true)});
    tag('.ttl','title');
    tag('.tb','tb');
    $$('.st__no,.plate__no,.tb dd,.crumb .set,.idx__t span,.sub span,.notes__t span,.ph figcaption span,.tz .k span,.band .k,.reads .hd .n,.stage .hd .n,.mat .k,.news time,.h3 .n,.pol h2 .n,.dgfig figcaption,.light figure > figcaption,.wk .kind').forEach(function(e){if(!e.closest('.rail')&&wrapType(e))tag2(e,'type')});
    $$('.plate dd,.wk dd,.spec dd,.tbl td.m,.calc dd').forEach(function(e){if(prepCount(e))tag2(e,'count')});
    tag('.hero__cta,.band__act,.form__end,.wkbar,.axo__ctl','pop');
    tag('.ph','photo').forEach(function(f){var img=$('img',f);if(!img)return;var k=img.cloneNode(false);k.className='sk';k.alt='';k.removeAttribute('id');k.setAttribute('aria-hidden','true');k.style.filter='url(#yh-sk)';f.appendChild(k);f.__sk=k});
    tag('.tscroll','table').forEach(function(t){$$('tr',t).forEach(function(r,i){r.style.setProperty('--r',Math.min(i,10))})});
    tag('svg.dg,svg.dk','draw').forEach(prepDraw);
    tag('.form','rule');
    tag('.plates .plate,.wk > li,.tz > li,.calc,.notes,.reads .dgfig,.axo__stage,.map,.readout,.sunctl','lay');
    tag('.reads h3,.stage h3,.mat h3,.tz h3,.who__name,.plate h3,.wk h3,.pol h2,.h3,.sub,.idx__t,.notes__t,.who__role','brush');
    tag('.idx li,.news li,.dash li,.after li,.contact > div,.spec > div,.plate dl > div,.wk dl > div,.reads dl > div,.calc dl > div,.faq details,.foot > div,.notes li,.form .f,.stage > li .hd .t,.reads .hd .t,.mat .sp,.polc','rule');
    tag('.lede > p,.prose > p,.tx > p,.hero__meta > p,.note:not(.notes .note),.band .t,.plate > p,.wk p.d,.tz > li > p:not(.k),.works__note,.proc__note,.light__tx > p,.pol > p,.stage .tx > p,.body > p,.cols > div > p,.planfig figcaption,.axo figcaption,.chain__sum','ink');
    pend=RV.slice().sort(function(a,b){return a.compareDocumentPosition(b)&2?1:-1});
    W.addEventListener('scroll',reqScan,{passive:true});W.addEventListener('resize',reqScan);W.addEventListener('load',reqScan);
    d.addEventListener('click',function(){setTimeout(reqScan,60)});d.addEventListener('toggle',reqScan,true);
    if(W.ResizeObserver)new ResizeObserver(reqScan).observe(d.body);
    setInterval(function(){if(pend.length&&!d.hidden)reqScan()},700);
    scan();
    /* safety: whatever is on screen and still waiting after 2.5s is shown; focus always reveals */
    setTimeout(function(){var vh=innerHeight;RV.forEach(function(e){if(!e.classList.contains('in')){var r=e.getBoundingClientRect();if(r.top<vh&&r.bottom>0)show(e,0)}})},2500);
    d.addEventListener('focusin',function(ev){var n=ev.target;while(n&&n!==d.body){if(n.__rv)show(n,0);n=n.parentNode}});
    W.addEventListener('beforeprint',function(){C.remove('mo')});
    /* sketch filter for photographs */
    var f=el('div','', '<svg width="0" height="0" aria-hidden="true" focusable="false"><filter id="yh-sk" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feGaussianBlur stdDeviation=".7"/><feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true"/><feColorMatrix type="matrix" values="-3.2 0 0 0 1  0 -3.2 0 0 1  0 0 -3.2 0 1  0 0 0 1 0"/></filter></svg>');
    f.style.cssText='position:absolute;width:0;height:0;overflow:hidden';d.body.appendChild(f);
  }
  function tag2(e,type){if(e.__rv||e.closest('.faq .a,.nomo'))return;e.__rv=type;e.classList.add('rv','rv-'+type);RV.push(e)}
  function measure(){$$('.sheet').forEach(function(s){if(s.__dm){s.__dm.__v=Math.round(s.offsetWidth*.2646);if(s.classList.contains('in'))s.__dm.textContent='W '+s.__dm.__v+' mm'}})}

  /* ================= page transition ================= */
  var NOS={index:'A-00',approach:'B-00',works:'C-00','work-courtyard':'C-10',process:'D-00',office:'E-00',contact:'F-00',privacy:'G-00'};
  function initNav(){
    var xs=el('div','xs','<b></b><small>NEXT SHEET</small>');xs.setAttribute('aria-hidden','true');d.body.appendChild(xs);
    d.addEventListener('click',function(e){
      if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      var a=e.target.closest&&e.target.closest('a[href]');if(!a||a.target||a.hasAttribute('download'))return;
      var u;try{u=new URL(a.getAttribute('href'),location.href)}catch(x){return}
      if(u.protocol!==location.protocol||u.host!==location.host||u.pathname===location.pathname)return;
      var here=location.pathname.replace(/[^\/]*$/,''),f=u.pathname.slice(here.length);
      if(u.pathname.indexOf(here)!==0||!/^[\w-]+\.html$/.test(f))return;
      var no=NOS[f.slice(0,-5)];if(!no)return;
      e.preventDefault();
      var gone=false,go=function(){if(gone)return;gone=true;location.href=u.href};
      try{try{sessionStorage.setItem('yh-x',no+'|'+Date.now())}catch(x){}
        $('b',xs).textContent=no;var m=$('main');m.style.transformOrigin='50% '+Math.round(W.scrollY+W.innerHeight/2-m.offsetTop)+'px';C.add('is-leaving')}catch(x){go();return}
      setTimeout(go,330);
    });
    W.addEventListener('pageshow',function(e){if(e.persisted){C.remove('is-leaving','arr')}});
    setTimeout(function(){C.remove('arr')},1000);
    setTimeout(function(){C.remove('first');C.add('settled')},1700);
  }

  /* ================= ambient: sun window, grid pulse, T-square, crosshair ================= */
  function initAmbient(){
    var back=el('div','fxb','<div class="sunw"></div><div class="gp"><i></i><i></i><i></i><b></b></div>'),front=el('div','fx','<i class="xh xh--v"></i><i class="xh xh--h"></i>');
    back.setAttribute('aria-hidden','true');front.setAttribute('aria-hidden','true');
    d.body.insertBefore(back,d.body.firstChild);d.body.appendChild(front);
    var tsq=el('div','tsq','<i></i><b></b>'),trk=el('div','tsq-t'),hud=el('div','hud','<span>X <b id="hx">0000</b>  Y <b id="hy">0000</b></span><span id="hs">A-00</span><span id="ht">06:00</span>');
    [tsq,trk,hud].forEach(function(e){e.setAttribute('aria-hidden','true');d.body.appendChild(e)});
    if(fine)C.add('fine');
    var sunw=back.firstChild,gp=back.lastChild,xv=front.firstChild,xhh=front.lastChild,tb=tsq.lastChild,hx=$('#hx'),hy=$('#hy'),hs=$('#hs'),ht=$('#ht');
    var sheets=[],docH=1,vh=W.innerHeight,vw=W.innerWidth,sy=W.scrollY,px=-1,py=-1,dirty=true,ptDirty=false,curNo='',curT='',gpT=0;
    function layout(){vh=W.innerHeight;vw=W.innerWidth;docH=Math.max(1,R.scrollHeight-vh);var y=W.scrollY;
      sheets=$$('.sheet').map(function(s){var n=$('.st__no',s);return {top:s.getBoundingClientRect().top+y,no:n?n.textContent.trim():''}});dirty=true;req()}
    var raf=0;function req(){if(!raf)raf=requestAnimationFrame(frame)}
    function frame(){raf=0;
      if(dirty){dirty=false;sy=W.scrollY;var t=clamp(sy/docH,0,1),top=vw>=900?10:60;
        tsq.style.transform='translateY('+(top+t*(vh-top-(vw>=900?30:44))).toFixed(1)+'px)';
        sunw.style.transform='translateX('+(-34+t*118).toFixed(2)+'vw) skewX('+(-34+t*62).toFixed(2)+'deg)';
        var no='',i;for(i=0;i<sheets.length;i++){if(sheets[i].top<=sy+vh*.45)no=sheets[i].no;else break}
        no=no||(sheets[0]&&sheets[0].no)||'';if(no!==curNo){curNo=no;tb.textContent=no;hs.textContent=no}
        var mins=Math.round((360+t*720)/10)*10,ts=pad(Math.floor(mins/60),2)+':'+pad(mins%60,2);if(ts!==curT){curT=ts;ht.textContent=ts}
        if(px>=0)ptDirty=true}
      if(ptDirty){ptDirty=false;
        if(fine){xv.style.transform='translateX('+px+'px)';xhh.style.transform='translateY('+py+'px)';hx.textContent=pad(Math.round(px),4);hy.textContent=pad(Math.round(py+sy),4)}
        var gx=Math.round((px+1)/24)*24-1,gy=Math.round((py+sy+1)/24)*24-1-sy;gp.style.transform='translate('+gx+'px,'+gy+'px)'}
    }
    W.addEventListener('scroll',function(){dirty=true;req()},{passive:true});
    W.addEventListener('resize',layout);W.addEventListener('load',layout);
    if(W.ResizeObserver)new ResizeObserver(layout).observe(d.body);
    function wake(){gp.classList.add('on');if(fine)front.classList.add('on');clearTimeout(gpT);gpT=setTimeout(function(){gp.classList.remove('on')},fine?2600:1500)}
    d.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;px=e.clientX;py=e.clientY;ptDirty=true;wake();req()},{passive:true});
    d.addEventListener('pointerdown',function(e){px=e.clientX;py=e.clientY;ptDirty=true;wake();req()},{passive:true});
    R.addEventListener('mouseleave',function(){front.classList.remove('on');gp.classList.remove('on')});
    layout();
    W.__yhLayout=measureAll;function measureAll(){measure();layout()}
    W.addEventListener('resize',measure);
  }

  /* ================= interaction ================= */
  function initInteract(){
    /* ruled underline on single-line links */
    $$('.crumb a,.foot a,.contact a,.tel,.tbl a').forEach(function(a){if(!a.closest('.rail'))a.classList.add('ul')});
    $$('.wk h3 a,.plate h3 a').forEach(function(a){a.classList.add('ul','ul--i')});
    /* stamp on press */
    d.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.btn,.rail__cta,.menu li.cta a,.tool');if(!b)return;b.classList.remove('stamp');void b.offsetWidth;b.classList.add('stamp');setTimeout(function(){b.classList.remove('stamp')},600)},true);
    /* touch: a short tap state so hover-only flourishes also play */
    d.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse')return;var t=e.target.closest&&e.target.closest('.more,.ul,.ph');if(!t)return;var c=t.classList.contains('ph')?'lift':'tap';t.classList.add(c);setTimeout(function(){t.classList.remove(c)},750)},{passive:true});
    /* prints lift and tilt under the pointer */
    if(fine)$$('.ph').forEach(function(f){var r=null,id=0,x=0,y=0;
      f.addEventListener('pointerenter',function(){r=f.getBoundingClientRect();f.classList.add('lift')});
      f.addEventListener('pointermove',function(e){if(!r)return;x=e.clientX;y=e.clientY;if(!id)id=requestAnimationFrame(function(){id=0;if(!r)return;
        f.style.setProperty('--ry',(((x-r.left)/r.width-.5)*10).toFixed(2)+'deg');f.style.setProperty('--rx',((.5-(y-r.top)/r.height)*10).toFixed(2)+'deg')})});
      f.addEventListener('pointerleave',function(){r=null;f.classList.remove('lift');f.style.removeProperty('--rx');f.style.removeProperty('--ry')})});
    /* rail: a tab slides out with the drawing number */
    var menu=$('#menu');
    if(menu){var tab=el('div','rtab','<b></b><span></span>');tab.setAttribute('aria-hidden','true');d.body.appendChild(tab);
      var onT=function(a){if(!mq('(min-width:900px)'))return;var r=a.getBoundingClientRect(),s=$('.s',a),n=a.textContent.replace(s?s.textContent:'','').replace(/^[A-G]/,'').trim();
        tab.firstChild.textContent=s?s.textContent:'';tab.lastChild.textContent=a.getAttribute('aria-current')?n+'（表示中）':n;tab.style.setProperty('--y',Math.round(r.top+r.height/2-22)+'px');tab.classList.add('on')},offT=function(){tab.classList.remove('on')};
      $$('a',menu).forEach(function(a){a.addEventListener('pointerenter',function(){onT(a)});a.addEventListener('pointerleave',offT);a.addEventListener('focus',function(){onT(a)});a.addEventListener('blur',offT)});
      W.addEventListener('scroll',offT,{passive:true})}
    /* FAQ: fold shut before closing */
    $$('.faq details').forEach(function(dt){var s=$('summary',dt);if(!s)return;s.addEventListener('click',function(e){if(!dt.open||dt.classList.contains('closing'))return;e.preventDefault();dt.classList.add('closing');setTimeout(function(){dt.open=false;dt.classList.remove('closing')},230)})});
  }

  /* ================= showpiece: home — axonometric assembly ================= */
  function initAxo(){
    var fig=$('#axo');if(!fig||!W.YAXO)return;
    var g=$('#axo-g'),stage=$('.axo__stage',fig),steps=$$('.axo__steps li',fig),VIEWS=[[-90,'南西から'],[0,'南東から'],[90,'道路側から']];
    var th=-90,p=mo?0:1,goal=p,want=false,raf=0,lastS=-1;
    function draw(){raf=0;g.innerHTML=W.YAXO.render(th*Math.PI/180,p);
      var s=p>=1?5:p<.18?0:p<.35?1:p<.64?2:p<.83?3:4;if(s!==lastS){lastS=s;steps.forEach(function(li,i){li.classList.toggle('on',i<s||p>=1);li.classList.toggle('cur',i===s&&p<1)})}}
    function req(){if(!raf)raf=requestAnimationFrame(draw)}
    var ctl=el('div','axo__ctl');
    VIEWS.forEach(function(v,i){var b=el('button','tool');b.type='button';b.textContent=v[1];b.setAttribute('aria-pressed',i===0?'true':'false');b.addEventListener('click',function(){turn(v[0])});ctl.appendChild(b)});
    var re=el('button','tool sp','組み立て直す<small>REPLAY</small>');re.type='button';ctl.appendChild(re);
    fig.insertBefore(ctl,$('figcaption',fig));
    var btns=$$('.tool',ctl).slice(0,3),stopT=null;
    function press(a){btns.forEach(function(b,i){b.setAttribute('aria-pressed',VIEWS[i][0]===a?'true':'false')})}
    function turn(a){press(a);if(stopT)stopT();if(!mo){th=a;req();return}var a0=th;stopT=tween(Math.max(350,Math.abs(a-a0)*7),function(k){th=a0+(a-a0)*eio(k);req()})}
    var hint=$('.axo__hint',fig);if(hint)hint.textContent=mo?'画面を送ると組み上がります。図を左右にドラッグすると回せます':'ボタンで見る向きを変えられます';
    /* drag to rotate, snap to the nearest view */
    var dx0=0,th0=0,drag=false,moved=false;fig.classList.add('can-drag');
    stage.addEventListener('pointerdown',function(e){if(e.button)return;drag=true;moved=false;dx0=e.clientX;th0=th;if(stopT)stopT()});
    W.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-dx0;if(!moved&&Math.abs(dx)<6)return;if(!moved){moved=true;fig.classList.add('is-drag');try{stage.setPointerCapture(e.pointerId)}catch(x){}}th=clamp(th0-dx*.45,-135,135);req()},{passive:true});
    var end=function(){if(!drag)return;drag=false;fig.classList.remove('is-drag');if(!moved)return;var best=VIEWS[0][0],i;for(i=1;i<3;i++)if(Math.abs(VIEWS[i][0]-th)<Math.abs(best-th))best=VIEWS[i][0];turn(best)};
    W.addEventListener('pointerup',end);W.addEventListener('pointercancel',end);
    if(!mo){draw();return}
    /* assembly follows the scroll, never un-builds; REPLAY runs it on a clock */
    var vis=false,tick=false,playing=null;
    function upd(){tick=false;if(playing)return;var r=stage.getBoundingClientRect(),vh=W.innerHeight,k=clamp((vh*.92-r.top)/(vh*.62+r.height*.35),0,1);if(k>goal){goal=k;chase()}}
    var chasing=false;function chase(){if(chasing)return;chasing=true;(function f(){p+=(goal-p)*.14;if(goal-p<.002)p=goal;req();if(p<goal)requestAnimationFrame(f);else chasing=false})()}
    new IntersectionObserver(function(en){vis=en[0].isIntersecting;if(vis)upd()},{rootMargin:'20% 0px 20% 0px'}).observe(stage);
    W.addEventListener('scroll',function(){if(vis&&!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
    re.addEventListener('click',function(){if(playing)playing();goal=1;p=0;playing=tween(3600,function(k){p=k;req()},function(){playing=null})});
    draw();upd();
    /* safety: if it is on screen but nobody scrolls, finish the model */
    setTimeout(function(){if(vis&&goal<1&&!playing){var r=stage.getBoundingClientRect();if(r.top<W.innerHeight*.8){goal=1;chase()}}},4000);
  }

  /* ================= showpiece: approach — four readings ================= */
  function initApproach(){
    var s1=$('svg[aria-labelledby="dg1"]'),s2=$('svg[aria-labelledby="dg2"]'),s3=$('svg[aria-labelledby="dg3"]'),s4=$('svg[aria-labelledby="dg4"]');
    if(s1)run('light',function(){
      var sh=$('.cfill',s1),ol=$('.acd',s1),g=sv('g',{},'live');
      g.appendChild(sv('path',{d:'M36.7 85.5A15 15 0 0 1 17.3 85.5'},'ds'));
      var sun=sv('circle',{r:3.6},'lvf'),tx=sv('text',{x:27,y:106},'c mid');g.appendChild(sun);g.appendChild(tx);
      g.appendChild(sv('path',{d:'M27 70v3M25.5 71.5h3'},'fn'));s1.appendChild(g);
      var last='';
      loop(s1,function(now){var k=(now%8000)/8000,t=k<.72?9+6*eio(k/.72):15,a=(t-12)*12.07*Math.PI/180,L=24+40.4*Math.pow(Math.abs(t-12)/3,1.6),dx=L*Math.sin(a),dy=-L*Math.cos(a);
        sh.setAttribute('d','M84 122H176L'+(176+dx).toFixed(1)+' '+(122+dy).toFixed(1)+'H'+(84+dx).toFixed(1)+'z');
        ol.setAttribute('d','M84 122L'+(84+dx).toFixed(1)+' '+(122+dy).toFixed(1)+'H'+(176+dx).toFixed(1)+'L176 122');
        sun.setAttribute('cx',(27-15*Math.sin(a)).toFixed(1));sun.setAttribute('cy',(74+15*Math.cos(a)).toFixed(1));
        var m=Math.round(t*6)*10,s=pad(Math.floor(m/60),2)+':'+pad(m%60,2);if(s!==last){last=s;tx.textContent=s}});
    });
    if(s2)run('wind',function(){
      var w=$$('.ac',s2)[0],wd=$$('.ds',s2)[1],g=sv('g',{},'live');
      g.appendChild(sv('path',{d:w.getAttribute('d')},'wf'));s2.appendChild(g);if(wd)wd.classList.add('wfw');
      var L=w.getTotalLength(),arr=[0,1,2].map(function(){var a=sv('path',{d:'M-5 -3.6L0 0L-5 3.6'},'lv');g.appendChild(a);return a});
      loop(s2,function(now){arr.forEach(function(a,i){var k=((now/4200)+i/3)%1,l=k*L,p=w.getPointAtLength(l),q=w.getPointAtLength(Math.min(L,l+2)),an=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
        a.setAttribute('transform','translate('+p.x.toFixed(1)+' '+p.y.toFixed(1)+') rotate('+an.toFixed(1)+')');a.setAttribute('opacity',Math.min(1,k*8,(1-k)*8).toFixed(2))})});
    });
    if(s3)run('neighbour',function(){
      var g=sv('g',{},'live'),ln=sv('path',{d:'M193 110L120 104',pathLength:1},'sight');g.appendChild(ln);s3.appendChild(g);
      var x=$$('.ac',s3)[0],cut=$('.acd',s3),eye=$('circle',s3);if(x)x.classList.add('xm');if(cut)cut.classList.add('cut');if(eye)eye.classList.add('eye');
      loop(s3,function(){});
    });
    if(s4)run('path',function(){
      var g=sv('g',{},'live'),pth=sv('path',{d:'M64 30L64 45L66 65L62 85L68 105L80 123L102 125L127 124',fill:'none',stroke:'none'}),dot=sv('circle',{r:3.4},'lvf');
      g.appendChild(pth);g.appendChild(dot);s4.appendChild(g);
      var stones=$$('rect[rx]',s4).map(function(r){r.classList.add('stone');return {e:r,x:+r.getAttribute('x')+8,y:+r.getAttribute('y')+5.5,on:false}});
      $$('.acd',s4).forEach(function(e){e.classList.add('look')});
      var L=pth.getTotalLength();
      loop(s4,function(now){var k=(now%6500)/6500,t=clamp((k-.2)/.62,0,1),p=pth.getPointAtLength(L*t);
        dot.setAttribute('cx',p.x.toFixed(1));dot.setAttribute('cy',p.y.toFixed(1));
        stones.forEach(function(s){var on=Math.abs(s.x-p.x)<9&&Math.abs(s.y-p.y)<7;if(on!==s.on){s.on=on;s.e.classList.toggle('on',on)}})});
    });
  }

  /* ================= showpiece: works — filter / sort with a layout animation ================= */
  function initWorks(){
    var list=$('.wk');if(!list)return;
    var items=$$(':scope > li',list).map(function(li,i){var t=li.textContent,dd=$$('dd',li).map(function(x){return x.textContent});
      return {e:li,no:i,flat:/平屋/.test(t),area:parseFloat(dd[1])||0,year:parseInt(dd[3],10)||0}});
    var bar=el('div','wkbar','<p><span>絞り込み</span><button type="button" class="tool" data-f="all" aria-pressed="true">すべて</button><button type="button" class="tool" data-f="flat" aria-pressed="false">平屋</button><button type="button" class="tool" data-f="two" aria-pressed="false">2階建</button></p><p><span>並べ替え</span><button type="button" class="tool" data-s="no" aria-pressed="true">図番順</button><button type="button" class="tool" data-s="year" aria-pressed="false">新しい順</button><button type="button" class="tool" data-s="area" aria-pressed="false">小さい順</button></p><p class="wkbar__n" role="status">5 / 5 件</p>');
    bar.setAttribute('role','group');bar.setAttribute('aria-label','作品の絞り込みと並べ替え');list.parentNode.insertBefore(bar,list);
    var F='all',S='no',cnt=$('.wkbar__n',bar);
    function apply(){
      var keep=function(o){return F==='all'||(F==='flat')===o.flat};
      var order=items.slice().sort(function(a,b){return S==='year'?(b.year-a.year||a.no-b.no):S==='area'?(a.area-b.area):(a.no-b.no)});
      var first={};if(mo)items.forEach(function(o){if(!o.e.hidden)first[o.no]=o.e.getBoundingClientRect()});
      order.forEach(function(o){o.e.hidden=!keep(o);list.appendChild(o.e)});
      cnt.textContent=order.filter(keep).length+' / 5 件';
      if(!mo||!list.animate)return;
      items.forEach(function(o,i){if(o.e.hidden)return;if(o.e.__rv&&!o.e.classList.contains('in'))return;var l=o.e.getBoundingClientRect(),f=first[o.no];
        if(f){var dx=f.left-l.left,dy=f.top-l.top;if(dx||dy)o.e.animate([{transform:'translate('+dx+'px,'+dy+'px) rotate('+(dy>0?-1.2:1.2)+'deg)'},{transform:'none'}],{duration:620,easing:'cubic-bezier(.3,1.25,.4,1)'})}
        else o.e.animate([{transform:'translate(34px,-40px) rotate(3deg)',opacity:0},{transform:'none',opacity:1}],{duration:560,easing:'cubic-bezier(.3,1.3,.5,1)'})});
    }
    bar.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
      if(b.dataset.f)F=b.dataset.f;else S=b.dataset.s;
      $$('button',b.parentNode).forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});apply()});
  }

  /* ================= showpiece: work detail — pencil, hatching, walk-through ================= */
  function initPlan(){
    var plan=$('.plan');if(!plan||!mo)return;
    /* hatching fills the room under the pointer */
    var defs=sv('defs',{});defs.innerHTML='<pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" stroke="#9A5B34" stroke-width="2.2"/></pattern>';plan.insertBefore(defs,plan.firstChild);
    $$('.room',plan).forEach(function(g){var r=$('rect',g),h=r.cloneNode(false);h.setAttribute('class','hx');h.style.fill='url(#hatch)';g.appendChild(h)});
    /* a pencil tip follows the strokes while the plan draws itself */
    var els=$$('.d',plan).map(function(e){return {e:e,t:parseInt(e.style.getPropertyValue('--t'),10)||0}}).sort(function(a,b){return a.t-b.t});
    var pen=sv('g',{},'pencil');pen.innerHTML='<path d="M0 0L5 -17L14 -12Z" fill="#22252A"/><path d="M5 -17L36 -78L45 -73L14 -12Z" fill="#DDA778"/><path d="M36 -78L41 -88L50 -83L45 -73Z" fill="#9A5B34"/>';
    function sketch(){plan.appendChild(pen);var t0=performance.now(),i=0,x=500,y=-150,last=els[els.length-1].t+520;
      (function f(now){var tau=now-t0;while(i<els.length-1&&els[i+1].t<=tau)i++;var o=els[i],k=clamp((tau-o.t)/500,0,1),p;
        try{if(o.L==null)o.L=o.e.getTotalLength();p=o.e.getPointAtLength(o.L*k)}catch(x2){p={x:x,y:y}}
        x+=(p.x-x)*.42;y+=(p.y-y)*.42;pen.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+')');
        if(tau<last)requestAnimationFrame(f);else{pen.style.transition='opacity .4s';pen.style.opacity=0;setTimeout(function(){if(pen.parentNode)pen.parentNode.removeChild(pen)},450)}})(t0)}
    if(plan.classList.contains('is-go')){if(!plan.classList.contains('is-done'))sketch()}else plan.addEventListener('plan:go',sketch);
    /* walk-through: gate → entrance → living → courtyard */
    var fig=plan.closest('figure'),ctl=el('div','planctl','<button type="button" class="tool">門から中庭まで歩く<small>WALK</small></button><span aria-hidden="true">門 → 玄関 → 食堂 → 居間 → 中庭</span>');
    fig.appendChild(ctl);
    var g=sv('g',{'aria-hidden':'true'},'walk'),D='M525 -125L525 55Q525 105 480 105L415 105Q395 105 385 80L378 62L185 58L185 250L200 250L265 260',
      tr=sv('path',{d:D},'walk-t'),ring=sv('circle',{r:15},'walk-r'),dot=sv('circle',{r:9},'walk-d'),busy=false;
    g.appendChild(tr);g.appendChild(ring);g.appendChild(dot);
    var STOPS=[[.2,'genkan'],[.42,'dk'],[.68,'living'],[.96,'court']];
    $('button',ctl).addEventListener('click',function(){if(busy)return;busy=true;plan.classList.add('is-done');plan.appendChild(g);
      var L=tr.getTotalLength(),si=0;tr.style.strokeDasharray=L+' '+L;
      tween(6200,function(k){var e=eio(k),p=tr.getPointAtLength(L*e);tr.style.strokeDashoffset=(L*(1-e)).toFixed(1);
        dot.setAttribute('cx',p.x.toFixed(1));dot.setAttribute('cy',p.y.toFixed(1));ring.setAttribute('cx',p.x.toFixed(1));ring.setAttribute('cy',p.y.toFixed(1));
        while(si<STOPS.length&&e>=STOPS[si][0]){var r=$('.room[data-room="'+STOPS[si][1]+'"]',plan);if(r)r.dispatchEvent(new MouseEvent('click',{bubbles:true}));si++}
      },function(){tr.style.strokeDasharray='';tr.style.strokeDashoffset='';busy=false});
    });
  }

  /* ================= showpiece: process — timeline bar and the small building ================= */
  function initProcess(){
    var bar=$('.procbar');if(!bar||!mo)return;
    var segs=$$('.chain span',bar),bld=$('.bld',bar),cnt=$('.procbar__c b',bar),stages=$$('.stage > li'),CUM=[[0,0],[1,2],[3,5],[7,11],[13,19]],reached=0,want=0,busy=false;
    segs.forEach(function(s){s.appendChild(el('i'))});
    $$('.bld g *',bar).forEach(function(x){x.setAttribute('pathLength','1')});
    bld.setAttribute('class','bld s0');cnt.textContent='00 – 00';
    function step(){if(reached>=want){busy=false;return}busy=true;var a=CUM[reached],b=CUM[++reached];segs[reached-1].classList.add('on');bld.setAttribute('class','bld s'+reached);
      tween(600,function(k){var e=eo(k);cnt.textContent=pad(Math.round(a[0]+(b[0]-a[0])*e),2)+' – '+pad(Math.round(a[1]+(b[1]-a[1])*e),2)});setTimeout(step,430)}
    function reach(n){if(n>want){want=n;if(!busy)step()}}
    new IntersectionObserver(function(en){if(en[0].isIntersecting)reach(1)},{threshold:.6}).observe(bar);
    var o1=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting)reach(stages.indexOf(x.target)+1)})},{rootMargin:'0px 0px -45% 0px'});
    var o2=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){var i=stages.indexOf(x.target);segs.forEach(function(s,j){s.classList.toggle('cur',j===i)})}})},{rootMargin:'-42% 0px -42% 0px'});
    stages.forEach(function(s){o1.observe(s);o2.observe(s)});
  }

  /* ================= showpiece: office — the walk from the station ================= */
  function initOffice(){
    var map=$('.map');if(!map||!mo)return;
    var svg=$('svg',map),route=$('.acd',svg),txt=$$('text.c',svg)[1],g=sv('g',{'aria-hidden':'true'},'live'),D=route.getAttribute('d'),
      rt=sv('path',{d:D,fill:'none'},'rt'),ping=sv('circle',{r:9,cx:384,cy:290},'ping'),dot=sv('circle',{r:6.5},'wd'),busy=false,final=txt?txt.textContent:'';
    g.appendChild(rt);g.appendChild(ping);g.appendChild(dot);
    var ctl=el('div','mapctl','<button type="button" class="tool">駅から歩いてみる<small>6 MIN</small></button><span aria-hidden="true">南口 → 商店街 → 二つ目の角を左</span>');
    map.parentNode.insertBefore(ctl,map.nextSibling);
    var cn=$('span',ctl),lab=cn.textContent;
    function walk(){if(busy)return;busy=true;if(!g.parentNode)svg.appendChild(g);
      if(map.scrollWidth>map.clientWidth+4)map.scrollLeft=Math.max(0,map.scrollWidth*.55-map.clientWidth/2);
      var L=rt.getTotalLength();rt.style.strokeDasharray=L+' '+L;ping.style.visibility='hidden';
      tween(5200,function(k){var e=eio(k),p=rt.getPointAtLength(L*e);rt.style.strokeDashoffset=(L*(1-e)).toFixed(1);dot.setAttribute('cx',p.x.toFixed(1));dot.setAttribute('cy',p.y.toFixed(1));
        cn.textContent=k<1?'徒歩 '+Math.round(6*e)+' 分 ／ '+pad(Math.round(45*e)*10,3)+' m':lab},function(){ping.style.visibility='';busy=false});
    }
    $('button',ctl).addEventListener('click',walk);
    loop(svg,function(){});
    var seen=false;new IntersectionObserver(function(en,o){if(en[0].isIntersecting&&!seen){seen=true;o.disconnect();setTimeout(walk,1300)}},{threshold:.35}).observe(map);
  }

  /* ================= showpiece: contact — the form as a title block ================= */
  function initContact(){
    var form=$('#form');if(!form)return;
    var fields=$$('input,select,textarea',form),rev=el('div','rev','<span>相談票　F-01</span><span>記入 <b>0</b> / '+fields.length+'</span><span>REV. <span class="odo"><i>00</i></span></span><i class="bar"></i>');
    rev.setAttribute('aria-hidden','true');form.insertBefore(rev,form.firstChild);
    var nb=$('b',rev),odo=$('.odo',rev),n=0,state=fields.map(function(){return false}),rolling=0;
    function roll(v){var t=pad(v,2);if(!mo){odo.innerHTML='<i>'+t+'</i>';return}
      clearTimeout(rolling);odo.classList.remove('roll');odo.innerHTML='<i>'+odo.lastChild.textContent+'</i><i>'+t+'</i>';void odo.offsetWidth;odo.classList.add('roll');
      rolling=setTimeout(function(){odo.classList.remove('roll');odo.innerHTML='<i>'+t+'</i>'},480)}
    function check(i){var f=fields[i],ok=!!f.value.trim(),box=f.closest('.f');if(ok===state[i])return;state[i]=ok;box.classList.toggle('filled',ok);
      var s=$('label > span:last-child',box);if(s){if(!s.__t)s.__t=s.textContent;s.textContent=ok?s.__t+' ✓':s.__t;s.classList.toggle('ok',ok)}
      var c=state.filter(Boolean).length;nb.textContent=c;rev.style.setProperty('--p',c/fields.length);roll(++n)}
    fields.forEach(function(f,i){
      var fr=el('i','fr');fr.setAttribute('aria-hidden','true');f.parentNode.insertBefore(fr,f.nextSibling);
      f.addEventListener('change',function(){check(i)});f.addEventListener('blur',function(){check(i)});
      if(mo){var box=f.closest('.f'),lb=$('label',box),tn=lb&&lb.firstChild;
        if(tn&&tn.nodeType===3){var o=el('span','tyo','<span class="tyi"></span>');o.firstChild.textContent=tn.nodeValue;lb.style.setProperty('--n',cells(tn.nodeValue));lb.replaceChild(o,tn)}
        f.addEventListener('focus',function(){box.classList.add('foc')});f.addEventListener('blur',function(){box.classList.remove('foc')})}
    });
    /* the demo message is stamped 「受付」 */
    form.addEventListener('submit',function(){var end=$('.form__end',form),old=$('.seal',end),t=new Date(),s=el('span','seal','受付<small>'+t.getFullYear()+'.'+pad(t.getMonth()+1,2)+'.'+pad(t.getDate(),2)+' DEMO</small>');
      if(old)end.removeChild(old);s.setAttribute('aria-hidden','true');end.appendChild(s);
      if(mo){form.classList.remove('thud');void form.offsetWidth;form.classList.add('thud')}});
  }

  /* ================= showpiece: privacy — each article sealed as it is read ================= */
  function initPrivacy(){
    var pol=$('.pol');if(!pol||!mo)return;
    var hs=$$('h2',pol),c=el('p','polc','閲覧　<b>0</b> / '+hs.length+' 条');c.setAttribute('aria-hidden','true');pol.appendChild(c);
    var b=$('b',c),n=0;
    hs.forEach(function(h){var s=el('span','chk','閲');s.setAttribute('aria-hidden','true');h.appendChild(s)});
    HOOK.brush=function(e,delay){if(e.parentNode===pol&&e.tagName==='H2')setTimeout(function(){b.textContent=++n},delay+800)};
  }

  /* ================= boot ================= */
  run('works',initWorks);
  run('axo',initAxo);
  run('contact',initContact);
  if(mo){
    var ok=true;
    run('privacy',initPrivacy);run('process',initProcess);
    try{initReveal()}catch(e){ok=false;C.remove('mo');if(W.console)console.error('[motion] reveal: '+(e&&e.message),e)}
    if(ok){run('nav',initNav);run('ambient',initAmbient);run('interact',initInteract);run('approach',initApproach);run('plan',initPlan);run('office',initOffice)}
  }
  C.remove('pre');
})();
