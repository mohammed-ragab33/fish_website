(()=>{
const KEY='mowga_cart';
const $=s=>document.querySelector(s), fmt=n=>Math.round(n).toLocaleString('en-US');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}};
const save=c=>{try{localStorage.setItem(KEY,JSON.stringify(c.map(({id,wi,qty,name,w,price,img})=>({id,wi,qty,name,w,price,img}))))}catch(e){}};
const list=$('#items'), form=$('#checkout');
let cart=load(), S={fees:{},areas:{},slots:[],pay:[]};
const dayName=d=>d.toLocaleDateString('ar-EG-u-nu-latn',{weekday:'long',day:'numeric',month:'long'});
function days(area){const out=[],d=new Date();d.setHours(12);
  if(area==='alex'){while(out.length<2){d.setDate(d.getDate()+1);if(d.getDay()===5)out.push(new Date(d))}}
  else{while(out.length<4){d.setDate(d.getDate()+1);if(d.getDay()!==5)out.push(new Date(d))}}
  return out}
const sub=()=>cart.reduce((s,i)=>s+i.price*i.qty,0);
const fee=()=>{const a=form.area.value;if(!a)return null;return sub()>=(S.freeOver||1e12)?0:(S.fees[a]||0)};
function paintCount(){const n=cart.reduce((s,i)=>s+i.qty,0);document.querySelectorAll('.cart-count').forEach(e=>e.textContent=n);$('#ccount').textContent=n?n+' منتج':''}
function renderItems(){
  if(!cart.length){document.body.classList.add('empty-cart');paintCount();return}
  list.innerHTML=cart.map((it,i)=>`<li class="ci" data-i="${i}" style="--i:${i}">
   <img src="${esc(it.img)}" alt="">
   <div class="ci-txt"><strong>${esc(it.name)}</strong><small>${esc(it.w)} · ${fmt(it.price)} ج.م</small></div>
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
  const left=(S.freeOver||0)-s; $('#s-free').textContent=S.freeOver&&left>0?'فاضل '+fmt(left)+' ج.م وتاخد التوصيل مجاناً':'';
}
list.addEventListener('click',e=>{
  const li=e.target.closest('.ci');if(!li)return;const i=+li.dataset.i;
  const q=e.target.closest('[data-q]');
  if(q){cart[i].qty=Math.max(1,Math.min(50,cart[i].qty+(+q.dataset.q)));save(cart);li.querySelector('.qty span').textContent=cart[i].qty;li.querySelector('.ci-tot').textContent=fmt(cart[i].price*cart[i].qty)+' ج.م';paintCount();renderSum();return}
  if(e.target.closest('.ci-x')){li.classList.add('out');setTimeout(()=>{cart.splice(i,1);save(cart);renderItems()},350)}
});
function fillDays(){const a=form.area.value, box=$('#days');
  if(!a){box.innerHTML='<span class="hint">اختار المنطقة الأول</span>';renderSum();return}
  box.innerHTML=days(a).map((d,k)=>`<label class="pill"><input type="radio" name="day" value="${dayName(d)}" ${k===0?'checked':''}><span>${dayName(d)}</span></label>`).join('');
  $('#alex-note').hidden=a!=='alex'; renderSum()}
const pills=(name,arr,on)=>arr.map((v,k)=>`<label class="pill"><input type="radio" name="${name}" value="${esc(v)}" ${k===on?'checked':''}><span>${esc(v)}</span></label>`).join('');
const rules={name:v=>v.trim().length>=2||'اكتب اسمك',phone:v=>/^01[0125][0-9]{8}$/.test(v.replace(/\s/g,''))||'رقم موبايل مصري صحيح من 11 رقم، يبدأ بـ 010 أو 011 أو 012 أو 015',area:v=>!!v||'اختار المنطقة',address:v=>v.trim().length>=8||'اكتب العنوان بالتفصيل: الشارع ورقم العمارة والشقة'};
function setErr(f,m){const el=form[f]&&form[f].closest('.fld');if(!el)return;el.classList.toggle('bad',!!m);el.querySelector('.err').textContent=m||''}
function check(f){const v=rules[f](form[f].value);setErr(f,v===true?'':v);return v===true}
Object.keys(rules).forEach(f=>form[f].addEventListener('blur',()=>check(f)));
const btn=form.querySelector('.send'), ferr=$('#form-err');
form.addEventListener('submit',async e=>{
  e.preventDefault(); ferr.textContent='';
  const ok=Object.keys(rules).map(check).every(Boolean);
  if(!ok){form.querySelector('.bad input,.bad select,.bad textarea').focus();return}
  if(!cart.length)return;
  const v=n=>(form.querySelector(`[name=${n}]:checked`)||{}).value||'';
  const payload={name:form.name.value,phone:form.phone.value,area:form.area.value,address:form.address.value,notes:form.notes.value,day:v('day'),slot:v('slot'),pay:v('pay'),items:cart.map(i=>({id:i.id,wi:i.wi,qty:i.qty}))};
  btn.disabled=true;btn.classList.add('loading');btn.textContent='بنبعت طلبك...';
  try{
    const r=await fetch('api/order.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok){ if(d.fields)Object.entries(d.fields).forEach(([k,m])=>setErr(k,m)); throw new Error(d.error||'') }
    $('#done-code').textContent=d.code;
    $('#done-sum').textContent=fmt(d.total)+' ج.م · '+v('day')+'، '+v('slot')+' · '+v('pay');
    cart=[];save(cart);paintCount();
    document.body.classList.add('sent');scrollTo({top:0,behavior:'smooth'});
  }catch(err){
    ferr.textContent=err.message&&err.message!=='Failed to fetch'?err.message:'الطلب ما اتبعتش. اتأكد من النت وجرّب تاني. (استقبال الطلبات بيشتغل بعد رفع الموقع على Hostinger)';
  }finally{btn.disabled=false;btn.classList.remove('loading');btn.textContent='تأكيد الطلب'}
});
fetch('data/catalog.json').then(r=>r.json()).then(D=>{
  S=D.settings; const by={}; D.products.forEach(p=>by[p.id]=p);
  cart=cart.filter(i=>by[i.id]&&by[i.id].w[i.wi]).map(i=>{const p=by[i.id];return{id:i.id,wi:i.wi,qty:i.qty,name:p.name,w:p.w[i.wi][0],price:Math.round(p.price*p.w[i.wi][1]),img:'images/'+p.img+'.jpg'}});
  save(cart);
  $('#slots').innerHTML=pills('slot',S.slots,1); $('#pays').innerHTML=pills('pay',S.pay,0);
  form.area.innerHTML='<option value="">اختار</option>'+Object.entries(S.areas).map(([k,n])=>`<option value="${k}">${esc(n)}</option>`).join('');
  form.area.addEventListener('change',fillDays); fillDays(); renderItems();
}).catch(()=>{renderItems()});
})();