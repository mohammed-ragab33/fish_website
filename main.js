(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=n=>Math.round(n).toLocaleString('en-US');

/* السلة: بتتحفظ في المتصفح وبتظهر في كل الصفحات */
const KEY='mowga_cart';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}};
const save=c=>{try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}};
let cart=load();
const total=()=>cart.reduce((s,i)=>s+(i.qty||1),0);
const paint=()=>document.querySelectorAll('.cart-count').forEach(e=>e.textContent=total());
paint();
let b=0;
const visibleCart=()=>[...document.querySelectorAll('[data-cart]')].find(c=>{const r=c.getBoundingClientRect();return r.width>0&&getComputedStyle(c).display!=='none'&&getComputedStyle(c.closest('.mbar')||c).display!=='none'});
const tpl=document.getElementById('lemon');
function bump(el){if(!el)return;el.style.animation='none';void el.offsetWidth;el.style.animation=((++b)%2?'bumpA':'bumpB')+' .45s cubic-bezier(.34,1.56,.64,1)'}
/* الليمونة بتطير من صورة المنتج للسلة، وبعدين المنتج يتضاف */
window.mowgaAdd=function(item,imgEl){
  const target=visibleCart();
  const done=()=>{const f=cart.find(x=>x.id===item.id&&x.w===item.w);if(f)f.qty++;else cart.push({...item,qty:1});save(cart);paint();bump(target)};
  if(reduce||!target||!imgEl||!tpl){done();return}
  const a=imgEl.getBoundingClientRect(),c=target.getBoundingClientRect();
  const fx=document.createElement('div');fx.className='fx';
  fx.style.cssText='--sx:'+(a.left+a.width/2)+'px;--sy:'+(a.top+a.height/2)+'px;--ex:'+(c.left+c.width/2)+'px;--ey:'+Math.max(c.top+c.height/2,10)+'px';
  fx.innerHTML='<div class="fy"><div class="spin"></div></div>';fx.querySelector('.spin').appendChild(tpl.content.cloneNode(true));document.body.appendChild(fx);
  setTimeout(()=>{fx.remove();done()},900);
};

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
const NAMES=['فيليه سالمون نرويجي','ستيك سالمون','شرايح سالمون سوشي','جمبري طازة'];
document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{
  const i=+btn.dataset.add, pl=btn.closest('[data-plate]');
  mowgaAdd({id:'home-'+i,name:NAMES[i],w:'',price:+pl.querySelector('.num').dataset.target,img:pl.querySelector('img').getAttribute('src')},pl.querySelector('img'));
}));
})();
