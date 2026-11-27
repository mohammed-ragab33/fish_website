(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const plates=document.querySelector('.plates');
const fmt=n=>Math.round(n).toLocaleString('en-US');
function count(){document.querySelectorAll('.num').forEach((el,i)=>{const T=+el.dataset.target,d=reduce?0:900+i*180,dur=reduce?1:1200;setTimeout(()=>{const t0=performance.now();const step=now=>{const k=Math.min(1,(now-t0)/dur);el.textContent=fmt(T*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)},d)})}
if(plates){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();plates.classList.add('go');count()}},{threshold:.25});io.observe(plates)}
const cart=document.querySelector('[data-cart]'),cc=document.getElementById('cart-count'),tpl=document.getElementById('lemon');let n=0,b=0;
document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{
  const pl=btn.closest('[data-plate]').getBoundingClientRect(),c=cart.getBoundingClientRect();
  const done=()=>{cc.textContent=++n;cart.style.animation='none';void cart.offsetWidth;cart.style.animation=((++b)%2?'bumpA':'bumpB')+' .45s cubic-bezier(.34,1.56,.64,1)'};
  if(reduce){done();return}
  const fx=document.createElement('div');fx.className='fx';fx.style.cssText='--sx:'+(pl.left+pl.width/2)+'px;--sy:'+(pl.top+135)+'px;--ex:'+(c.left+c.width/2)+'px;--ey:'+Math.max(c.top+c.height/2,10)+'px';
  fx.innerHTML='<div class="fy"><div class="spin"></div></div>';fx.querySelector('.spin').appendChild(tpl.content.cloneNode(true));document.body.appendChild(fx);
  setTimeout(()=>{fx.remove();done()},900);
}));
})();