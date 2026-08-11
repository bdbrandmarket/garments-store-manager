const KEY='bd_brand_market_v1';
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
const monthNow=()=>new Date().toISOString().slice(0,7);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let db;
try{db=JSON.parse(localStorage.getItem(KEY))||null}catch(e){db=null}
if(!db)db={employees:[],attendance:{},stock:[],movements:[]};
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function toast(m){const t=$('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2200)}

const titles={dashboard:'Dashboard',employees:'Employees',attendance:'Attendance',salary:'Salary Report',stock:'Store / Stock',reports:'Reports'};
function go(page){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===page));if($('title'))$('title').textContent=titles[page]||'Dashboard';document.querySelector('.sidebar')?.classList.remove('open');renderAll()}
document.querySelectorAll('.nav').forEach(x=>x.addEventListener('click',()=>go(x.dataset.page)));
document.querySelectorAll('[data-go]').forEach(x=>x.addEventListener('click',()=>go(x.dataset.go)));
$('menu')?.addEventListener('click',()=>document.querySelector('.sidebar')?.classList.toggle('open'));

function renderDashboard(){
 const a=db.attendance[today()]||{};
 const present=db.employees.filter(e=>a[e.id]==='present').length;
 const absent=db.employees.filter(e=>a[e.id]==='absent').length;
 const low=db.stock.filter(x=>Number(x.qty)<=Number(x.limit||0));
 $('ec').textContent=db.employees.length;$('pc').textContent=present;$('ac').textContent=absent;$('sc').textContent=db.stock.length;
 $('rate').textContent=db.employees.length?Math.round(present/db.employees.length*100)+'% attendance':'0% attendance';$('lc').textContent=low.length+' low stock';$('rp').textContent=present;$('ra').textContent=absent;$('rm').textContent=present+absent;
 $('low').innerHTML=low.length?low.map(x=>`<div class="stock-row"><span><b>${esc(x.name)}</b><small>${esc(x.unit||'pcs')}</small></span><strong class="red">${x.qty} ${esc(x.unit||'')}</strong></div>`).join(''):'<div class="empty-table">সব stock ঠিক আছে ✓</div>';
 const sec={};db.employees.forEach(e=>{const s=e.section||'Other';sec[s]??=0;if(a[e.id]==='present')sec[s]++});
 $('sections').innerHTML=Object.keys(sec).length?Object.entries(sec).map(([s,n])=>`<div class="section-row"><span>${esc(s)}</span><b>${n} Present</b></div>`).join(''):'<div class="empty-table">কোনো employee data নেই</div>';
}

function clearEmpForm(){['en','ei','ed','es','ej','em'].forEach(id=>$(id).value='');delete $('empForm').dataset.edit;$('empFormTitle').textContent='নতুন কর্মীর তথ্য';$('saveEmp').textContent='Save Employee';$('empForm').classList.add('hidden')}
function renderEmployees(){
 const q=($('eq').value||'').toLowerCase();const list=db.employees.filter(e=>[e.name,e.id,e.designation,e.section].join(' ').toLowerCase().includes(q));$('count').textContent=db.employees.length;
 $('empTable').innerHTML=list.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Section</th><th>Joining</th><th>Salary</th><th>Action</th></tr></thead><tbody>${list.map(e=>`<tr><td>${esc(e.id)}</td><td><b>${esc(e.name)}</b></td><td>${esc(e.designation||'-')}</td><td>${esc(e.section||'-')}</td><td>${esc(e.joining||'-')}</td><td>৳${Number(e.salary||0).toLocaleString()}</td><td><button class="btn blue" data-edit="${esc(e.id)}">Edit</button> <button class="btn redbtn" data-del="${esc(e.id)}">Delete</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-table">কোনো employee পাওয়া যায়নি</div>';
}
$('openEmp').addEventListener('click',()=>{$('empForm').classList.remove('hidden');$('en').focus()});$('cancelEmp').addEventListener('click',clearEmpForm);$('eq').addEventListener('input',renderEmployees);
$('saveEmp').addEventListener('click',()=>{const name=$('en').value.trim(),id=$('ei').value.trim(),old=$('empForm').dataset.edit||'';if(!name||!id)return toast('নাম ও Employee ID দিন');if(db.employees.some(e=>e.id===id&&e.id!==old))return toast('এই Employee ID আগে থেকেই আছে');const data={id,name,designation:$('ed').value.trim(),section:$('es').value.trim()||'Other',joining:$('ej').value,salary:Number($('em').value||0)};if(old){const e=db.employees.find(x=>x.id===old);Object.assign(e,data);if(old!==id)Object.keys(db.attendance).forEach(d=>{if(db.attendance[d]?.[old]){db.attendance[d][id]=db.attendance[d][old];delete db.attendance[d][old]}});toast('Employee updated ✓')}else{db.employees.push(data);toast('Employee added ✓')}save();clearEmpForm();renderAll()});
$('empTable').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-del]');if(edit){const x=db.employees.find(y=>y.id===edit.dataset.edit);if(!x)return;$('empForm').classList.remove('hidden');$('empForm').dataset.edit=x.id;$('empFormTitle').textContent='Employee Edit';$('saveEmp').textContent='Update Employee';$('en').value=x.name||'';$('ei').value=x.id||'';$('ed').value=x.designation||'';$('es').value=x.section||'';$('ej').value=x.joining||'';$('em').value=x.salary||''}if(del){const x=db.employees.find(y=>y.id===del.dataset.del);if(x&&confirm(`"${x.name}" কে delete করবেন?`)){db.employees=db.employees.filter(y=>y.id!==x.id);Object.keys(db.attendance).forEach(d=>delete db.attendance[d][x.id]);save();renderAll();toast('Employee deleted')}}});

$('ad').value=today();
function renderAttendance(){const d=$('ad').value||today(),a=db.attendance[d]||{},q=($('aq').value||'').toLowerCase();const list=db.employees.filter(e=>[e.name,e.id,e.designation,e.section].join(' ').toLowerCase().includes(q));$('attTable').innerHTML=list.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Section</th><th>Status</th></tr></thead><tbody>${list.map(e=>`<tr><td>${esc(e.id)}</td><td><b>${esc(e.name)}</b></td><td>${esc(e.designation||'-')}</td><td>${esc(e.section||'-')}</td><td><select class="status-select" data-att="${esc(e.id)}"><option value="" ${!a[e.id]?'selected':''}>Not Marked</option><option value="present" ${a[e.id]==='present'?'selected':''}>✓ Present</option><option value="absent" ${a[e.id]==='absent'?'selected':''}>× Absent</option></select></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-table">কোনো employee নেই</div>'}
$('ad').addEventListener('change',renderAttendance);$('aq').addEventListener('input',renderAttendance);
function markAll(s){const d=$('ad').value||today();db.attendance[d]??={};db.employees.forEach(e=>db.attendance[d][e.id]=s);save();renderAll();toast(s==='present'?'সবাই Present করা হয়েছে ✓':'সবাই Absent করা হয়েছে')}
$('allP').addEventListener('click',()=>markAll('present'));$('allA').addEventListener('click',()=>markAll('absent'));$('saveA').addEventListener('click',()=>{const d=$('ad').value||today();db.attendance[d]??={};document.querySelectorAll('[data-att]').forEach(x=>{if(x.value)db.attendance[d][x.dataset.att]=x.value;else delete db.attendance[d][x.dataset.att]});save();renderAll();toast('Attendance saved ✓')});

$('sm').value=monthNow();
function renderSalary(){const m=$('sm').value||monthNow(),c={};db.employees.forEach(e=>c[e.id]={present:0,absent:0});Object.entries(db.attendance).forEach(([d,r])=>{if(!d.startsWith(m))return;Object.entries(r).forEach(([id,s])=>{if(c[id]){if(s==='present')c[id].present++;if(s==='absent')c[id].absent++}})});$('salTable').innerHTML=db.employees.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Section</th><th>Basic Salary</th><th>Present</th><th>Absent</th></tr></thead><tbody>${db.employees.map(e=>`<tr><td>${esc(e.id)}</td><td><b>${esc(e.name)}</b></td><td>${esc(e.section||'-')}</td><td>৳${Number(e.salary||0).toLocaleString()}</td><td>${c[e.id].present}</td><td>${c[e.id].absent}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-table">কোনো employee নেই</div>'}
$('sm').addEventListener('change',renderSalary);

$('openStock').addEventListener('click',()=>$('stockForm').classList.remove('hidden'));$('cancelStock').addEventListener('click',()=>$('stockForm').classList.add('hidden'));
$('saveStock').addEventListener('click',()=>{const name=$('sn').value.trim(),qty=Number($('sq').value||0),unit=$('su').value.trim()||'pcs',limit=Number($('sl').value||0);if(!name)return toast('মালের নাম দিন');if(qty<0||limit<0)return toast('Quantity ঠিকভাবে দিন');if(db.stock.some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast('এই item আগে থেকেই আছে');db.stock.push({id:Date.now().toString(),name,qty,unit,limit});save();['sn','sq','su','sl'].forEach(id=>$(id).value='');$('stockForm').classList.add('hidden');renderAll();toast('Stock item saved ✓')});
function renderStock(){const q=($('sqry').value||'').toLowerCase(),list=db.stock.filter(x=>x.name.toLowerCase().includes(q));$('stockTable').innerHTML=list.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Low Limit</th><th>Status</th></tr></thead><tbody>${list.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${x.qty}</td><td>${esc(x.unit)}</td><td>${x.limit}</td><td>${Number(x.qty)<=Number(x.limit)?'<span class="red">Low stock</span>':'<span class="green">OK</span>'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-table">কোনো stock item নেই</div>';const r=db.movements.slice(-10).reverse();$('moves').innerHTML=r.length?r.map(x=>`<div class="section-row"><span>${esc(x.date)} — ${esc(x.name)}</span><b>${x.type==='in'?'+':'-'}${x.qty}</b></div>`).join(''):'<div class="empty-table">কোনো movement নেই</div>'}
$('sqry').addEventListener('input',renderStock);
function moveStock(type){if(!db.stock.length)return toast('আগে একটি stock item যোগ করুন');const list=db.stock.map((x,i)=>`${i+1}. ${x.name} (${x.qty} ${x.unit})`).join('\n');const n=prompt(`কোন item?\n\n${list}\n\nItem number:`);if(n===null)return;const i=Number(n)-1;if(!db.stock[i])return toast('ভুল item number');const q=Number(prompt('Quantity:')||0);if(q<=0)return toast('সঠিক quantity দিন');if(type==='out'&&q>db.stock[i].qty)return toast('এত stock নেই');db.stock[i].qty+=type==='in'?q:-q;db.movements.push({date:today(),name:db.stock[i].name,type,qty:q});save();renderAll();toast(type==='in'?'Stock In saved ✓':'Stock Out saved ✓')}
$('stockIn').addEventListener('click',()=>moveStock('in'));$('stockOut').addEventListener('click',()=>moveStock('out'));
$('backupBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bd-brand-market-backup.json';a.click();URL.revokeObjectURL(url);toast('Backup downloaded ✓')});
function renderAll(){renderDashboard();renderEmployees();renderAttendance();renderSalary();renderStock()}
renderAll();
