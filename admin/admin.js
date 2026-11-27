(()=>{
const API='../api/admin.php';
const ST={new:'جديد',confirmed:'اتأكد',preparing:'بيتجهز',out:'في الطريق',delivered:'اتسلم',cancelled:'اتلغى'};
const NEXT={new:['confirmed','أكّد الطلب'],confirmed:['preparing','ابدأ التجهيز'],preparing:['out','اطلع للتوصيل'],out:['delivered','اتسلم']};
const AREAS={cairo:'القاهرة',giza:'الجيزة',alex:'الإسكندرية'};
const $=s=>document.querySelector(s), fmt=n=>Number(n).toLocaleString('en-US');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let csrf=null, status='', lastId=0, timer=null, soundOn=true, openId=null, firstLoad=true;
try{soundOn=localStorage.getItem('mw_sound')!=='0'}catch(e){}

async function api(a,{method='GET',body,params={}}={}){
  const u=new URL(API,location.href); u.searchParams.set('a',a); Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
  const r=await fetch(u,{method,credentials:'same-origin',headers:{'Content-Type':'application/json',...(csrf?{'X-CSRF':csrf}:{})},body:body?JSON.stringify(body):undefined});
  const d=await r.json().catch(()=>({error:'السيرفر ما ردش'}));
  if(r.status===401&&a!=='login'){showLogin();throw new Error('401')}
  if(!r.ok)throw new Error(d.error||'حصلت مشكلة');
  return d;
}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),3500)}
function beep(){if(!soundOn)return;try{const c=new (window.AudioContext||window.webkitAudioContext)();[0,.18].forEach((d,i)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=i?1046:784;g.gain.setValueAtTime(.0001,c.currentTime+d);g.gain.exponentialRampToValueAtTime(.25,c.currentTime+d+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d+.3);o.connect(g).connect(c.destination);o.start(c.currentTime+d);o.stop(c.currentTime+d+.32)})}catch(e){}}
const badge=s=>`<span class="badge b-${s}">${ST[s]||s}</span>`;
const time=t=>{const d=new Date(t.replace(' ','T'));const today=new Date().toDateString()===d.toDateString();return (today?'':d.toLocaleDateString('ar-EG-u-nu-latn',{day:'numeric',month:'short'})+' · ')+d.toLocaleTimeString('ar-EG-u-nu-latn',{hour:'numeric',minute:'2-digit'})};

/* الدخول */
function showLogin(){$('#app').hidden=true;$('#login').hidden=false;clearInterval(timer);setTimeout(()=>$('#lf').user.focus(),50)}
$('#lf').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,er=f.querySelector('.lerr');er.textContent='';f.querySelector('button').disabled=true;
  try{const d=await api('login',{method:'POST',body:{user:f.user.value,pass:f.pass.value}});csrf=d.csrf;f.reset();start()}catch(x){er.textContent=x.message}finally{f.querySelector('button').disabled=false}});
$('#logout').addEventListener('click',async()=>{try{await api('logout',{method:'POST',body:{}})}catch(e){}csrf=null;showLogin()});
$('#sound').addEventListener('click',()=>{soundOn=!soundOn;try{localStorage.setItem('mw_sound',soundOn?'1':'0')}catch(e){}paintSound();if(soundOn)beep()});
function paintSound(){const b=$('#sound');b.textContent=soundOn?'الصوت: شغال':'الصوت: مقفول';b.setAttribute('aria-pressed',soundOn)}

/* الإحصائيات والتابات */
async function loadStats(){const d=await api('stats');
  $('#st-today').textContent=fmt(d.today_orders);$('#st-rev').textContent=fmt(d.today_revenue)+' ج.م';
  $('#st-new').textContent=fmt(d.counts.new||0);$('#st-out').textContent=fmt(d.counts.out||0);
  const all=Object.values(d.counts).reduce((a,b)=>a+b,0);
  $('#tabs').innerHTML=[['','الكل',all],...Object.keys(ST).map(k=>[k,ST[k],d.counts[k]||0])].map(([k,n,c])=>`<button type="button" role="tab" class="tab ${k===status?'on':''}" data-s="${k}" aria-selected="${k===status}">${n}<i>${c}</i></button>`).join('');
  document.title=(d.counts.new?`(${d.counts.new}) `:'')+'لوحة التحكم | موجة';
}
$('#tabs').addEventListener('click',e=>{const t=e.target.closest('.tab');if(!t)return;status=t.dataset.s;loadStats();loadList()});
$('#range').addEventListener('change',()=>loadList());
let qt;$('#q').addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(loadList,250)});

/* قايمة الطلبات */
async function loadList(fresh){
  const d=await api('list',{params:{status,q:$('#q').value.trim(),range:$('#range').value}});
  const isNew=o=>fresh&&o.id>lastId;
  $('#rows').innerHTML=d.orders.map(o=>`<tr data-id="${o.id}" class="${o.status==='new'?'is-new':''} ${isNew(o)?'flash':''}" tabindex="0">
    <td data-l="الطلب"><b class="code">${esc(o.code)}</b></td><td data-l="الوقت">${time(o.created_at)}</td>
    <td data-l="العميل"><b>${esc(o.name)}</b><small dir="ltr">${esc(o.phone)}</small></td>
    <td data-l="المنطقة">${AREAS[o.area]||esc(o.area)}</td><td data-l="التوصيل">${esc(o.day)}<small>${esc(o.slot)}</small></td>
    <td data-l="الدفع">${esc(o.pay)}</td><td data-l="الإجمالي" class="num">${fmt(o.total)} ج.م</td><td data-l="الحالة">${badge(o.status)}</td></tr>`).join('');
  $('#empty').hidden=d.orders.length>0;$('#tbl').hidden=!d.orders.length;
  if(!firstLoad&&d.lastId>lastId){const n=d.lastId-lastId;toast(n>1?`وصل ${n} طلبات جديدة`:'وصل طلب جديد');beep()}
  lastId=Math.max(lastId,d.lastId);firstLoad=false;
}
$('#rows').addEventListener('click',e=>{const tr=e.target.closest('tr');if(tr)openOrder(+tr.dataset.id)});
$('#rows').addEventListener('keydown',e=>{if(e.key==='Enter'){const tr=e.target.closest('tr');if(tr)openOrder(+tr.dataset.id)}});

/* تفاصيل الطلب */
async function openOrder(id){openId=id;const {order:o}=await api('get',{params:{id}});
  const nx=NEXT[o.status];
  $('#drawer').innerHTML=`<div class="dh"><div><small>طلب</small><h2>${esc(o.code)}</h2>${badge(o.status)}</div><button type="button" class="x" id="dclose" aria-label="قفل">×</button></div>
  <div class="actions">${nx?`<button type="button" class="gold" data-st="${nx[0]}">${nx[1]}</button>`:''}
    ${!['delivered','cancelled'].includes(o.status)?'<button type="button" class="danger" data-st="cancelled">إلغاء الطلب</button>':''}
    <button type="button" class="ghost" id="print">طباعة</button></div>
  <div class="steps">${['new','confirmed','preparing','out','delivered'].map(s=>{const h=o.history.find(x=>x.s===s);return `<div class="step ${h?'done':''} ${o.status===s?'cur':''}"><i></i><b>${ST[s]}</b><small>${h?time(h.at):''}</small></div>`}).join('')}</div>
  ${o.status==='cancelled'?'<p class="cancel-note">الطلب ده اتلغى</p>':''}
  <section class="sec"><h3>العميل</h3><p><b>${esc(o.name)}</b></p><p><a class="call" href="tel:${esc(o.phone)}" dir="ltr">${esc(o.phone)}</a></p><p>${AREAS[o.area]||''}: ${esc(o.address)}</p></section>
  <section class="sec"><h3>التوصيل والدفع</h3><p>${esc(o.day)}، ${esc(o.slot)}</p><p>${esc(o.pay)}</p></section>
  <section class="sec"><h3>المنتجات</h3><table class="it">${o.items.map(i=>`<tr><td>${esc(i.name)}<small>${esc(i.w)}</small></td><td>× ${i.qty}</td><td class="num">${fmt(i.line)} ج.م</td></tr>`).join('')}
   <tr class="sumr"><td>المجموع</td><td></td><td class="num">${fmt(o.subtotal)} ج.م</td></tr><tr class="sumr"><td>التوصيل</td><td></td><td class="num">${o.fee?fmt(o.fee)+' ج.م':'مجاناً'}</td></tr><tr class="tot"><td>الإجمالي</td><td></td><td class="num">${fmt(o.total)} ج.م</td></tr></table></section>
  ${o.notes?`<section class="sec"><h3>ملاحظات العميل</h3><p class="cnote">${esc(o.notes)}</p></section>`:''}
  <section class="sec"><h3>ملاحظة داخلية</h3><textarea id="anote" placeholder="مثلاً: العميل طلب يتصل قبل ما يوصل">${esc(o.admin_note||'')}</textarea><button type="button" class="ghost" id="savenote">حفظ الملاحظة</button></section>
  <p class="meta">وصل ${time(o.created_at)}</p>`;
  const dr=$('#drawer');dr.classList.add('on');dr.setAttribute('aria-hidden','false');$('#scrim').hidden=false;document.body.classList.add('lock');dr.focus();
}
function closeOrder(){const dr=$('#drawer');dr.classList.remove('on');dr.setAttribute('aria-hidden','true');$('#scrim').hidden=true;document.body.classList.remove('lock');openId=null}
$('#scrim').addEventListener('click',closeOrder);
addEventListener('keydown',e=>{if(e.key==='Escape'&&openId)closeOrder()});
$('#drawer').addEventListener('click',async e=>{
  if(e.target.id==='dclose')return closeOrder();
  if(e.target.id==='print')return window.print();
  const sb=e.target.closest('[data-st]');
  if(sb){const s=sb.dataset.st;if(s==='cancelled'&&!confirmBox())return;sb.disabled=true;
    try{await api('status',{method:'POST',body:{id:openId,status:s}});toast('الحالة بقت: '+ST[s]);await openOrder(openId);loadStats();loadList()}catch(x){toast(x.message);sb.disabled=false}}
  if(e.target.id==='savenote'){try{await api('note',{method:'POST',body:{id:openId,note:$('#anote').value}});toast('الملاحظة اتحفظت')}catch(x){toast(x.message)}}
});
/* تأكيد الإلغاء من غير نافذة المتصفح */
let armed=0;function confirmBox(){const b=document.querySelector('.danger');if(Date.now()-armed<4000){armed=0;return true}armed=Date.now();b.textContent='دوس تاني للتأكيد';setTimeout(()=>{if(b.isConnected)b.textContent='إلغاء الطلب'},4000);return false}

async function refresh(){try{await Promise.all([loadStats(),loadList(true)]);$('#live-txt').textContent='آخر تحديث '+new Date().toLocaleTimeString('ar-EG-u-nu-latn',{hour:'numeric',minute:'2-digit'})}catch(e){if(e.message!=='401')$('#live-txt').textContent='مفيش اتصال، بيحاول تاني'}}
async function start(){$('#login').hidden=true;$('#app').hidden=false;paintSound();firstLoad=true;lastId=0;await refresh();clearInterval(timer);timer=setInterval(refresh,20000)}
api('me').then(d=>{if(d.authed){csrf=d.csrf;start()}else showLogin()}).catch(()=>{showLogin();document.querySelector('.lerr').textContent='لوحة التحكم بتشتغل على Hostinger بس (محتاجة PHP)'});
})();