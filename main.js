(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=n=>Math.round(n).toLocaleString('en-US');

/* القايمة على الموبايل */
const btn=document.querySelector('.menu-btn');
if(btn){
  const close=()=>{document.body.classList.remove('menu-open');btn.setAttribute('aria-expanded','false')};
  btn.addEventListener('click',()=>{const o=document.body.classList.toggle('menu-open');btn.setAttribute('aria-expanded',String(o))});
  document.querySelectorAll('.main-nav a').forEach(a=>a.addEventListener('click',close));
  addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}

/* الأقسام: الشريحة بتتفتح بالماوس أو بالضغط */
const acc=document.querySelectorAll('.acc-item');
acc.forEach(it=>{
  const open=()=>acc.forEach(x=>x.classList.toggle('on',x===it));
  it.addEventListener('mouseenter',()=>{if(matchMedia('(hover:hover)').matches)open()});
  it.addEventListener('focus',open);
  it.addEventListener('click',e=>{if(!it.classList.contains('on')){e.preventDefault();open()}});
});

/* الأطباق والعداد لما القسم يظهر */
const plates=document.querySelector('.plates');
function count(){document.querySelectorAll('.num').forEach((el,i)=>{const T=+el.dataset.target,d=reduce?0:900+i*180,dur=reduce?1:1200;setTimeout(()=>{const t0=performance.now();const step=now=>{const k=Math.min(1,(now-t0)/dur);el.textContent=fmt(T*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)},d)})}
if(plates){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();plates.classList.add('go');count()}},{threshold:.2});io.observe(plates)}

/* أضف للسلة: الليمونة بتطير للسلة الظاهرة */
const tpl=document.getElementById('lemon');let n=0,b=0;
const visibleCart=()=>[...document.querySelectorAll('[data-cart]')].find(c=>{const r=c.getBoundingClientRect();return r.width>0&&getComputedStyle(c).display!=='none'&&getComputedStyle(c.closest('.mbar')||c).display!=='none'});
document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{
  const cart=visibleCart();
  const img=btn.closest('[data-plate]').querySelector('img').getBoundingClientRect();
  const done=()=>{n++;document.querySelectorAll('.cart-count').forEach(e=>e.textContent=n);if(cart){cart.style.animation='none';void cart.offsetWidth;cart.style.animation=((++b)%2?'bumpA':'bumpB')+' .45s cubic-bezier(.34,1.56,.64,1)'}};
  if(reduce||!cart){done();return}
  const c=cart.getBoundingClientRect();
  const fx=document.createElement('div');fx.className='fx';
  fx.style.cssText='--sx:'+(img.left+img.width/2)+'px;--sy:'+(img.top+img.height/2)+'px;--ex:'+(c.left+c.width/2)+'px;--ey:'+Math.max(c.top+c.height/2,10)+'px';
  fx.innerHTML='<div class="fy"><div class="spin"></div></div>';fx.querySelector('.spin').appendChild(tpl.content.cloneNode(true));document.body.appendChild(fx);
  setTimeout(()=>{fx.remove();done()},900);
}));
})();
