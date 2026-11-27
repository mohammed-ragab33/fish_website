(()=>{
const KEY='mowga_cart', C=window.MOWGA||{fees:{}};
const $=s=>document.querySelector(s), fmt=n=>Math.round(n).toLocaleString('en-US');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}};
const save=c=>{try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}};
let cart=load();
const list=$('#items'), form=$('#checkout');
const AREAS={cairo:'القاهرة',giza:'الجيزة',alex:'الإسكندرية'};
const SLOTS=['12 – 3 الضهر','3 – 6 العصر','6 – 9 بالليل'];
const dayName=d=>d.toLocaleDateString('ar-EG-u-nu-latn',{weekday:'long',day:'numeric',month:'long'});
function days(area){const out=[],d=new Date();d.setHours(12);
  if(area==='alex'){while(out.length<2){d.setDate(d.getDate()+1);if(d.getDay()===5)out.push(new Date(d))}}
  else{while(out.length<4){d.setDate(d.getDate()+1);if(d.getDay()!==5)out.push(new Date(d))}}
  return out}
const sub=()=>cart.reduce((s,i)=>s+i.price*i.qty,0);
const fee=()=>{const a=form.area.value;if(!a)return null;return sub()>=(C.freeOver||1e12)?0:(C.fees[a]||0)};
function paintCount(){const n=cart.reduce((s,i)=>s+i.qty,0);document.querySelectorAll('.cart-count').forEach(e=>e.textContent=n);$('#ccount').textContent=n?n+' منتج':''}
function renderItems(){
  if(!cart.length){document.body.classList.add('empty-cart');paintCount();return}
  list.innerHTML=cart.map((it,i)=>`<li class="ci" data-i="${i}" style="--i:${i}">
   ${it.img?`<img src="${esc(it.img)}" alt="">`:'<span class="ci-ph"></span>'}
   <div class="ci-txt"><strong>${esc(it.name)}</strong><small>${esc(it.w||'')}${it.w?' · ':''}${fmt(it.price)} ج.م</small></div>
   <div class="qty" role="group" aria-label="الكمية"><button type="button" data-q="1" aria-label="زوّد">+</button><span>${it.qty}</span><button type="button" data-q="-1" aria-label="قلّل">−</button></div>
   <b class="ci-tot">${fmt(it.price*it.qty)} ج.م</b>
   <button type="button" class="ci-x" aria-label="امسح ${esc(it.name)}">×</button></li>`).join('');
  paintCount();renderSum();
}
function renderSum(){
  const s=sub(),f=fee();
  $('#s-sub').textContent=fmt(s)+' ج.م';
  $('#s-fee').textContent=f===null?'اختار المنطقة':(f===0?'مجاناً':fmt(f)+' ج.م');
  $('#s-tot').textContent=fmt(s+(f||0))+' ج.م';
  const left=(C.freeOver||0)-s; $('#s-free').textContent=C.freeOver&&left>0?'فاضل '+fmt(left)+' ج.م وتاخد التوصيل مجاناً':'';
}
list.addEventListener('click',e=>{
  const li=e.target.closest('.ci');if(!li)return;const i=+li.dataset.i;
  const q=e.target.closest('[data-q]');
  if(q){cart[i].qty=Math.max(1,cart[i].qty+(+q.dataset.q));save(cart);li.querySelector('.qty span').textContent=cart[i].qty;li.querySelector('.ci-tot').textContent=fmt(cart[i].price*cart[i].qty)+' ج.م';paintCount();renderSum();return}
  if(e.target.closest('.ci-x')){li.classList.add('out');setTimeout(()=>{cart.splice(i,1);save(cart);renderItems()},350)}
});
/* المنطقة بتحدد أيام التوصيل */
function fillDays(){const a=form.area.value, box=$('#days');
  if(!a){box.innerHTML='<span class="hint">اختار المنطقة الأول</span>';renderSum();return}
  box.innerHTML=days(a).map((d,k)=>`<label class="pill"><input type="radio" name="day" value="${dayName(d)}" ${k===0?'checked':''}><span>${dayName(d)}</span></label>`).join('');
  $('#alex-note').hidden=a!=='alex'; renderSum()}
form.area.addEventListener('change',fillDays);
$('#slots').innerHTML=SLOTS.map((s,k)=>`<label class="pill"><input type="radio" name="slot" value="${s}" ${k===1?'checked':''}><span>${s}</span></label>`).join('');
fillDays();
/* التحقق وإرسال الطلب على واتساب */
const rules={name:v=>v.trim().length>=2||'اكتب اسمك',phone:v=>/^01[0125][0-9]{8}$/.test(v.replace(/\s/g,''))||'رقم موبايل مصري صحيح من 11 رقم، يبدأ بـ 010 أو 011 أو 012 أو 015',area:v=>!!v||'اختار المنطقة',address:v=>v.trim().length>=8||'اكتب العنوان بالتفصيل: الشارع ورقم العمارة والشقة'};
function check(f){const v=rules[f](form[f].value),el=form[f].closest('.fld');el.classList.toggle('bad',v!==true);el.querySelector('.err').textContent=v===true?'':v;return v===true}
Object.keys(rules).forEach(f=>form[f].addEventListener('blur',()=>check(f)));
form.addEventListener('submit',e=>{
  e.preventDefault();
  const ok=Object.keys(rules).map(check).every(Boolean);
  if(!ok){form.querySelector('.bad input,.bad select,.bad textarea').focus();return}
  if(!cart.length)return;
  const f=fee()||0, d=form.querySelector('[name=day]:checked'), sl=form.querySelector('[name=slot]:checked'), pay=form.querySelector('[name=pay]:checked');
  const lines=cart.map(i=>`• ${i.name}${i.w?' ('+i.w+')':''} × ${i.qty} = ${fmt(i.price*i.qty)} ج.م`);
  const msg=['طلب جديد من موقع موجة','',
    'الاسم: '+form.name.value.trim(),'الموبايل: '+form.phone.value.trim(),'المنطقة: '+AREAS[form.area.value],'العنوان: '+form.address.value.trim(),
    'ميعاد التوصيل: '+(d?d.value:'')+'، '+(sl?sl.value:''),'الدفع: '+(pay?pay.value:''),'',
    'الطلب:',...lines,'',
    'المجموع: '+fmt(sub())+' ج.م','التوصيل: '+(f?fmt(f)+' ج.م':'مجاناً'),'الإجمالي: '+fmt(sub()+f)+' ج.م',
    ...(form.notes.value.trim()?['','ملاحظات: '+form.notes.value.trim()]:[])].join('\n');
  $('#msg').textContent=msg;
  const num=(C.whatsapp||'').replace(/\D/g,'');
  document.body.classList.add('sent');
  scrollTo({top:0,behavior:'smooth'});
  if(num){$('#wa-link').href='https://wa.me/'+num+'?text='+encodeURIComponent(msg);$('#wa-link').hidden=false;window.open($('#wa-link').href,'_blank','noopener')}
  else{$('#no-wa').hidden=false}
  cart=[];save(cart);paintCount();
});
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#msg').textContent);$('#copy').textContent='اتنسخ ✓'}catch(e){$('#copy').textContent='حدد الرسالة وانسخها'}});
renderItems();
})();