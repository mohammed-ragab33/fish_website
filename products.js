(()=>{
fetch('data/catalog.json').then(r=>r.json()).then(DATA=>{
const CATS=[['all','كل المنتجات'],...DATA.categories];
const P=DATA.products;
const $=s=>document.querySelector(s), fmt=n=>Math.round(n).toLocaleString('en-US');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const grid=$('#grid'), chips=$('#chips'), title=$('#ptitle'), count=$('#pcount'), q=$('#q'), sort=$('#sort');
const sel={};
let cat='all';
chips.innerHTML=CATS.map(([id,n])=>`<button type="button" class="chip" data-cat="${id}">${n}</button><span hidden></span>`).join('');
function price(p){const m=p.w[sel[p.id]||0][1];return p.price*m}
function card(p,i){
  const pr=price(p), old=p.off?pr/(1-p.off/100):0;
  return `<article class="pc" style="--i:${i}" data-id="${p.id}">
  <div class="pc-plate"><span class="pc-ring"></span><img src="images/${p.img}.jpg" alt="${esc(p.name)}" loading="lazy">${p.off?`<span class="pc-off">-${p.off}%</span>`:''}</div>
  ${p.tag?`<span class="pc-tag">${esc(p.tag)}</span>`:'<span class="pc-tag" aria-hidden="true">&nbsp;</span>'}
  <h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
  <div class="pc-w" role="group" aria-label="الوزن">${p.w.map((w,k)=>`<button type="button" class="${(sel[p.id]||0)===k?'on':''}" data-w="${k}">${w[0]}</button>`).join('')}</div>
  <div class="pc-price"><strong>${fmt(pr)} ج.م</strong>${old?`<s>${fmt(Math.round(old/10)*10)} ج.م</s>`:''}</div>
  <button type="button" class="pc-add">أضف للسلة</button></article>`;
}
function render(){
  const term=q.value.trim();
  let list=P.filter(p=>(cat==='all'||p.cat===cat)&&(!term||p.name.includes(term)||p.desc.includes(term)));
  if(sort.value==='low')list.sort((a,b)=>price(a)-price(b));else if(sort.value==='high')list.sort((a,b)=>price(b)-price(a));else list.sort((a,b)=>b.pop-a.pop);
  grid.innerHTML=list.length?list.map(card).join(''):`<div class="empty"><strong>مفيش منتجات بالاسم ده</strong><span>جرّب كلمة تانية، أو اختار قسم تاني.</span></div>`;
  const n=CATS.find(c=>c[0]===cat)[1]; title.textContent=n; count.textContent=list.length+' منتج';
  chips.querySelectorAll('.chip').forEach(c=>{const on=c.dataset.cat===cat;c.classList.toggle('on',on);c.setAttribute('aria-pressed',on)});
}
function fromHash(){const h=location.hash.slice(1);cat=CATS.some(c=>c[0]===h)?h:'all';render()}
chips.addEventListener('click',e=>{const c=e.target.closest('.chip');if(!c)return;cat=c.dataset.cat;history.replaceState(null,'',cat==='all'?location.pathname:'#'+cat);render();c.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'})});
q.addEventListener('input',render); sort.addEventListener('change',render);
addEventListener('hashchange',fromHash);
grid.addEventListener('click',e=>{
  const card=e.target.closest('.pc'); if(!card)return; const p=P.find(x=>x.id===card.dataset.id);
  const wb=e.target.closest('[data-w]');
  if(wb){sel[p.id]=+wb.dataset.w;card.querySelectorAll('.pc-w button').forEach(b=>b.classList.toggle('on',b===wb));
    const pr=price(p),old=p.off?pr/(1-p.off/100):0;card.querySelector('.pc-price').innerHTML=`<strong class="pop">${fmt(pr)} ج.م</strong>${old?`<s>${fmt(Math.round(old/10)*10)} ج.م</s>`:''}`;return}
  if(e.target.closest('.pc-add')){const k=sel[p.id]||0;mowgaAdd({id:p.id,wi:k,name:p.name,w:p.w[k][0],price:price(p),img:'images/'+p.img+'.jpg'},card.querySelector('img'));
    const b=e.target.closest('.pc-add');b.textContent='اتضاف ✓';b.classList.add('ok');setTimeout(()=>{b.textContent='أضف للسلة';b.classList.remove('ok')},1500)}
});
fromHash();
}).catch(()=>{document.getElementById('grid').innerHTML='<div class="empty"><strong>حصلت مشكلة في تحميل المنتجات</strong><span>اعمل Refresh للصفحة.</span></div>'});
})();