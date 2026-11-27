(()=>{
/* الأسعار أمثلة للعرض. السعر هنا للوزن الأول، والأوزان التانية بتتحسب بالمعامل */
const CATS=[['all','كل المنتجات'],['salmon','السالمون'],['shrimp','الجمبري'],['fish','السمك الطازة'],['crab','الكابوريا واللوبستر'],['shell','فواكه البحر'],['boxes','البوكسات']];
const W1=[['½ كجم',1],['1 كجم',2],['2 كجم',4]], W2=[['4 قطع',1],['6 قطع',1.5],['جنب كامل',3]], W3=[['200 جم',1],['500 جم',2.5]], WB=[['يكفي 2',1],['يكفي 4',1.8]];
const P=[
 {id:'s1',cat:'salmon',name:'فيليه سالمون نرويجي',desc:'قطع فاخرة على التلج',img:'p-fillet',price:600,off:12,tag:'الأكثر طلباً',w:W1,pop:10},
 {id:'s2',cat:'salmon',name:'ستيك سالمون',desc:'قطع سميكة 3 سم',img:'p-steak',price:240,off:17,w:W2,pop:8},
 {id:'s3',cat:'salmon',name:'شرايح سالمون سوشي',desc:'جودة سوشي، متقطعة رفيع',img:'p-sashimi',price:480,off:19,tag:'جودة سوشي',w:W3,pop:7},
 {id:'s4',cat:'salmon',name:'سالمون مدخن',desc:'تدخين بارد، شرايح رقيقة',img:'c-salmon',price:420,w:W3,pop:6},
 {id:'h1',cat:'shrimp',name:'جمبري جامبو',desc:'مقاس 16/20، بقشره',img:'p-shrimp',price:550,off:15,tag:'الأكثر طلباً',w:W1,pop:9},
 {id:'h2',cat:'shrimp',name:'جمبري مقشر ومنظف',desc:'جاهز للطبخ على طول',img:'c-shrimp',price:620,w:W1,pop:7},
 {id:'h3',cat:'shrimp',name:'جمبري بلدي',desc:'صيد اليوم من البحر المتوسط',img:'c-shrimp',price:380,tag:'صيد اليوم',w:W1,pop:5},
 {id:'f1',cat:'fish',name:'دنيس',desc:'متشق للشوي أو فيليه',img:'c-fish',price:190,tag:'صيد اليوم',w:W1,pop:8},
 {id:'f2',cat:'fish',name:'قاروص',desc:'طازة، ينظف على طلبك',img:'c-fish',price:230,w:W1,pop:6},
 {id:'f3',cat:'fish',name:'بوري',desc:'للشوي بالردة',img:'c-fish',price:120,off:10,w:W1,pop:7},
 {id:'c1',cat:'crab',name:'ذيل لوبستر',desc:'3 قطع، مجمد بعناية',img:'c-crab',price:1400,w:[['3 قطع',1],['6 قطع',2]],pop:4},
 {id:'c2',cat:'crab',name:'أرجل كابوريا ملكي',desc:'مسلوقة ومجمدة',img:'c-crab',price:1100,off:10,w:W1,pop:5},
 {id:'c3',cat:'crab',name:'كابوريا بلدي',desc:'حية، تتنظف على طلبك',img:'c-crab',price:160,w:W1,pop:6},
 {id:'m1',cat:'shell',name:'كاليماري حلقات',desc:'منظف وجاهز للقلي',img:'c-shell',price:240,w:W1,pop:7},
 {id:'m2',cat:'shell',name:'بلح البحر',desc:'منظف، بالقشر',img:'c-shell',price:180,w:W1,pop:4},
 {id:'m3',cat:'shell',name:'جمبري بحري',desc:'لانجوستين كامل',img:'c-shell',price:700,tag:'جديد',w:W1,pop:5},
 {id:'b1',cat:'boxes',name:'بوكس الشيف',desc:'سالمون وجمبري جامبو وكاليماري وصوص',img:'gift',price:1500,off:12,tag:'عرض الموسم',w:WB,pop:9},
 {id:'b2',cat:'boxes',name:'بوكس الشوي',desc:'دنيس وجمبري وتتبيلة الشوي',img:'gift',price:1100,w:WB,pop:6},
 {id:'b3',cat:'boxes',name:'بوكس الهدية',desc:'تغليف فاخر وكارت بإسمك',img:'gift',price:1900,tag:'هدية',w:WB,pop:5}
];
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
  grid.innerHTML=list.length?list.map(card).join(''):`<div class="empty"><strong>مفيش منتجات بالاسم ده</strong><span>جرّب كلمة تانية، أو اطلب اللي عايزه على واتساب.</span></div>`;
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
  if(e.target.closest('.pc-add')){const k=sel[p.id]||0;mowgaAdd({id:p.id,name:p.name,w:p.w[k][0],price:price(p)},card.querySelector('img'));
    const b=e.target.closest('.pc-add');b.textContent='اتضاف ✓';b.classList.add('ok');setTimeout(()=>{b.textContent='أضف للسلة';b.classList.remove('ok')},1500)}
});
fromHash();
})();