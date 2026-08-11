const KEY="bd_brand_market_v4";
const today=()=>new Date().toISOString().slice(0,10);
let db=JSON.parse(localStorage.getItem(KEY)||'null')||{
 employees:[], attendance:{}, stock:[], movements:[]
};
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function openModal(html){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modalClose").onclick=closeModal;$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()}
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");

function goPage(page, push=true){
  document.querySelectorAll(".nav[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  render(page);
  $("#sidebar").classList.remove("open");
  if(push) history.pushState({page}, "", "#"+page);
}
document.querySelectorAll(".nav[data-page]").forEach(b=>b.onclick=()=>goPage(b.dataset.page));
window.addEventListener("popstate",e=>{
  const page=e.state?.page || location.hash.replace("#","") || "dashboard";
  document.querySelectorAll(".nav[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  render(["dashboard","employees","attendance","salary","stock","reports","register"].includes(page)?page:"dashboard");
});

function layout(title,body){$("#main").innerHTML=`<div class="section-title"><h2>${title}</h2></div>${body}`}

function renderDashboard(){
const n=db.employees.length;
const a=db.attendance[today()]||{};
const vals=Object.values(a), present=vals.filter(x=>x.status==="Present").length, absent=vals.filter(x=>x.status==="Absent").length;
$("#main").innerHTML=`
<section class="hero"><div class="eyebrow">FACTORY OVERVIEW</div><h1>Good day 👋</h1><p>আজকের কাজের গুরুত্বপূর্ণ হিসাব এক নজরে দেখো।</p><button class="primary" onclick="openAttendanceModal()">+ আজকের হাজিরা</button></section>
<div class="grid">
<div class="card stat"><div class="muted">👤 মোট কর্মী</div><div class="num">${n}</div><div class="muted">Employee records</div></div>
<div class="card stat"><div class="muted">✓ আজ Present</div><div class="num green">${present}</div><div class="muted">${n?Math.round(present/n*100):0}% attendance</div></div>
<div class="card stat"><div class="muted">× আজ Absent</div><div class="num red">${absent}</div><div class="muted">আজকের হিসাব</div></div>
<div class="card stat"><div class="muted">▣ Stock Items</div><div class="num gold">${db.stock.length}</div><div class="muted">${db.stock.filter(x=>+x.qty<=+x.limit).length} low stock</div></div>
</div>
<div class="card" style="margin-top:22px"><div class="section-title"><h2>আজকের Attendance</h2><button class="small-btn" onclick="goPage('attendance')">View all →</button></div>
<div class="pills"><span class="pill">Present ${present}</span><span class="pill">Absent ${absent}</span><span class="pill">Marked ${vals.length}</span></div></div>
<div class="card" style="margin-top:18px"><div class="section-title"><h2>Low Stock</h2><button class="small-btn" onclick="goPage('stock')">View stock →</button></div>
${db.stock.filter(x=>+x.qty<=+x.limit).map(x=>`<div>${esc(x.name)} — <b>${x.qty} ${esc(x.unit)}</b></div>`).join("")||'<span class="muted">সব stock ঠিক আছে ✓</span>'}</div>`;
}

function employeeForm(e={}){
return `<form id="empForm" class="form">
<label>Employee ID<input name="id" required value="${esc(e.id||'')}"></label>
<label>নাম<input name="name" required value="${esc(e.name||'')}"></label>
<label>Designation<input name="designation" value="${esc(e.designation||'')}"></label>
<label>Joining date<input type="date" name="joining" value="${esc(e.joining||'')}"></label>
<label>Monthly salary<input type="number" name="salary" min="0" value="${esc(e.salary||'')}"></label>
<div class="full actions"><button class="primary">${e.id?'Update':'Add'} Employee</button></div></form>`
}
function renderEmployees(){
layout("Employees",`<div class="toolbar"><input id="empSearch" placeholder="নাম / ID / designation খুঁজুন"><button class="primary" onclick="openEmployeeModal()">+ Employee</button><button class="small-btn" onclick="goPage('register')">📷 Register থেকে add</button></div><div id="empTable"></div>`);
$("#empSearch").oninput=renderEmployeeTable;renderEmployeeTable()
}
function renderEmployeeTable(){
const q=($("#empSearch")?.value||"").toLowerCase();
const list=db.employees.filter(e=>`${e.id} ${e.name} ${e.designation}`.toLowerCase().includes(q));
$("#empTable").innerHTML=`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Joining</th><th>Salary</th><th>Actions</th></tr></thead><tbody>${list.map(e=>`<tr><td>${esc(e.id)}</td><td><button class="name-link" onclick='showEmployeeHistory("${esc(e.id)}")'>${esc(e.name)}</button></td><td>${esc(e.designation)}</td><td>${esc(e.joining)}</td><td>${Number(e.salary||0).toLocaleString()}</td><td class="actions"><button class="small-btn" onclick='openEmployeeModal(${JSON.stringify(e)})'>Edit</button><button class="small-btn danger" onclick='deleteEmployee("${esc(e.id)}")'>Delete</button></td></tr>`).join("")||'<tr><td colspan="6">কোনো employee নেই</td></tr>'}</tbody></table></div>`
}
function openEmployeeModal(e={}){openModal(`<h2>${e.id?'Edit':'Add'} Employee</h2>${employeeForm(e)}`);$("#empForm").onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.target),o=Object.fromEntries(f);o.salary=+o.salary||0;const i=db.employees.findIndex(x=>x.id===o.id);if(i>=0)db.employees[i]=o;else db.employees.push(o);save();closeModal();render('employees');toast("Employee saved ✓")}}
function showEmployeeHistory(id){
 const e=db.employees.find(x=>x.id===id);
 if(!e)return;
 const rows=[];
 for(const [date,day] of Object.entries(db.attendance||{})){
   const x=day?.[id];
   if(x) rows.push({date,...x});
 }
 rows.sort((a,b)=>b.date.localeCompare(a.date));
 const present=rows.filter(x=>x.status==="Present").length;
 const absent=rows.filter(x=>x.status==="Absent").length;
 const hours=rows.reduce((n,x)=>n+(+x.hours||0),0);
 const ot=rows.reduce((n,x)=>n+(+x.ot||0),0);
 const adv=rows.reduce((n,x)=>n+(+x.advance||0),0);
 openModal(`<h2>${esc(e.name)}</h2>
 <div class="pills" style="margin:12px 0 18px">
 <span class="pill">ID: ${esc(e.id)}</span><span class="pill">Present: ${present}</span>
 <span class="pill">Absent: ${absent}</span><span class="pill">Hours: ${hours}</span>
 <span class="pill">OT: ${ot}</span><span class="pill">Advance: ${adv.toLocaleString()}</span>
 </div>
 <div class="table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th><th>Hour</th><th>OT</th><th>Advance</th></tr></thead>
 <tbody>${rows.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.status||"")}</td><td>${esc(x.in||"")}</td><td>${esc(x.out||"")}</td><td>${x.hours||0}</td><td>${x.ot||0}</td><td>${x.advance||0}</td></tr>`).join("")||'<tr><td colspan="7">এখনও কোনো হাজিরা নেই</td></tr>'}</tbody></table></div>`);
}
function deleteEmployee(id){if(!confirm("Employee delete করবেন?"))return;db.employees=db.employees.filter(e=>e.id!==id);Object.values(db.attendance).forEach(x=>delete x[id]);save();render('employees');toast("Employee deleted")}

function attendanceForm(){
const opts=db.employees.map(e=>`<option value="${esc(e.id)}">${esc(e.id)} — ${esc(e.name)}</option>`).join("");
return `<form id="attForm" class="form">
<label>Date<input type="date" name="date" value="${today()}"></label>
<label>Employee<select name="id" required>${opts}</select></label>
<label>Status<select name="status"><option>Present</option><option>Absent</option><option>Leave</option></select></label>
<label>In time<input type="time" name="in"></label>
<label>Out time<input type="time" name="out"></label>
<label>Overtime (hour)<input type="number" step=".25" min="0" name="ot" value="0"></label>
<label>Total hour<input type="number" step=".25" min="0" name="hours" value="0"></label>
<label>Advance<input type="number" min="0" name="advance" value="0"></label>
<div class="full actions"><button class="primary">Save Attendance</button></div></form>`
}
function openAttendanceModal(){if(!db.employees.length){toast("আগে Employee add করো");return}openModal(`<h2>Manual Attendance</h2>${attendanceForm()}`);$("#attForm").onsubmit=ev=>{ev.preventDefault();const o=Object.fromEntries(new FormData(ev.target));o.ot=+o.ot||0;o.hours=+o.hours||0;o.advance=+o.advance||0;db.attendance[o.date]??={};db.attendance[o.date][o.id]=o;save();closeModal();render('attendance');toast("Attendance saved ✓")}}
function renderAttendance(){
layout("Attendance",`<div class="toolbar"><input id="attDate" type="date" value="${today()}"><button class="primary" onclick="openAttendanceModal()">+ Manual input</button><button class="small-btn" onclick="goPage('register')">📷 Scan register</button></div><div id="attTable"></div>`);
$("#attDate").onchange=renderAttendanceTable;renderAttendanceTable()
}
function renderAttendanceTable(){
const d=$("#attDate").value,a=db.attendance[d]||{};
$("#attTable").innerHTML=`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Status</th><th>In</th><th>Out</th><th>Hour</th><th>OT</th><th>Advance</th><th>Action</th></tr></thead><tbody>${db.employees.map(e=>{const x=a[e.id]||{};return `<tr><td>${esc(e.id)}</td><td>${esc(e.name)}</td><td>${esc(x.status||"Not marked")}</td><td>${esc(x.in||"")}</td><td>${esc(x.out||"")}</td><td>${x.hours||0}</td><td>${x.ot||0}</td><td>${x.advance||0}</td><td><button class="small-btn" onclick='openAttendanceFor("${esc(d)}","${esc(e.id)}")'>${x.status?'Edit':'Mark'}</button></td></tr>`}).join("")}</tbody></table></div>`
}
function openAttendanceFor(date,id){openModal(`<h2>${esc(id)} — Attendance</h2>${attendanceForm()}`);const f=$("#attForm");f.date.value=date;f.id.value=id;const x=db.attendance[date]?.[id];if(x){for(const k of ["status","in","out","ot","hours","advance"])if(f[k])f[k].value=x[k]??""}f.onsubmit=ev=>{ev.preventDefault();const o=Object.fromEntries(new FormData(f));o.ot=+o.ot||0;o.hours=+o.hours||0;o.advance=+o.advance||0;db.attendance[o.date]??={};db.attendance[o.date][o.id]=o;save();closeModal();render('attendance');toast("Attendance saved ✓")}}

function renderSalary(){
const month=new Date().toISOString().slice(0,7);layout("Salary Report",`<div class="toolbar"><input id="salMonth" type="month" value="${month}"></div><div id="salTable"></div>`);renderSalaryTable();$("#salMonth").onchange=renderSalaryTable
}
function renderSalaryTable(){
const m=$("#salMonth").value;
$("#salTable").innerHTML=`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Salary</th><th>Present</th><th>Absent</th><th>Advance</th><th>Estimated payable</th></tr></thead><tbody>${db.employees.map(e=>{let p=0,a=0,adv=0;for(const [d,v] of Object.entries(db.attendance))if(d.startsWith(m)&&v[e.id]){if(v[e.id].status==="Present")p++;if(v[e.id].status==="Absent")a++;adv+=+v[e.id].advance||0}const pay=Math.max(0,(+e.salary||0)-adv);return `<tr><td>${esc(e.id)}</td><td>${esc(e.name)}</td><td>${(+e.salary||0).toLocaleString()}</td><td>${p}</td><td>${a}</td><td>${adv.toLocaleString()}</td><td>${pay.toLocaleString()}</td></tr>`}).join("")}</tbody></table></div>`
}

function renderStock(){
layout("Store / Stock",`<div class="toolbar"><button class="primary" onclick="openStockModal()">+ Stock item</button></div><div class="table-wrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Low limit</th><th>Status</th><th>Action</th></tr></thead><tbody>${db.stock.map(s=>`<tr><td>${esc(s.name)}</td><td>${s.qty}</td><td>${esc(s.unit)}</td><td>${s.limit}</td><td>${+s.qty<=+s.limit?'<span class="red">Low stock</span>':'<span class="green">OK</span>'}</td><td><button class="small-btn" onclick='stockMove("${esc(s.id)}","in")'>Stock In</button><button class="small-btn" onclick='stockMove("${esc(s.id)}","out")'>Stock Out</button></td></tr>`).join("")||'<tr><td colspan="6">কোনো stock item নেই</td></tr>'}</tbody></table></div>`)
}
function openStockModal(){openModal(`<h2>Add Stock</h2><form id="stockForm" class="form"><label>Item<input name="name" required></label><label>Quantity<input type="number" name="qty" min="0" value="0"></label><label>Unit<input name="unit" value="pcs"></label><label>Low-stock limit<input type="number" name="limit" min="0" value="10"></label><div class="full"><button class="primary">Save</button></div></form>`);$("#stockForm").onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));o.id=crypto.randomUUID();o.qty=+o.qty;o.limit=+o.limit;db.stock.push(o);save();closeModal();render('stock');toast("Stock saved ✓")}}
function stockMove(id,type){const s=db.stock.find(x=>x.id===id);const q=prompt(`${type==="in"?"কত যোগ":"কত কম"} করবেন?`,"1");if(q===null)return;const n=+q;if(!Number.isFinite(n)||n<0)return toast("সঠিক সংখ্যা দাও");if(type==="out"&&n>s.qty)return toast("Stock পর্যাপ্ত নেই");s.qty+=type==="in"?n:-n;db.movements.push({date:today(),id,type,qty:n});save();render('stock');toast("Stock updated ✓")}

function renderReports(){
const dates=Object.keys(db.attendance).sort().reverse();layout("Reports",`<div class="card"><h3>Attendance dates</h3>${dates.map(d=>`<div class="section-title"><b>${d}</b><span>${Object.keys(db.attendance[d]).length} marked</span></div>`).join("")||'<span class="muted">কোনো report নেই</span>'}</div><div class="card" style="margin-top:18px"><h3>Stock movements</h3>${db.movements.slice(-30).reverse().map(x=>`<div class="section-title"><span>${x.date} — ${esc(x.id)}</span><span>${x.type} ${x.qty}</span></div>`).join("")||'<span class="muted">কোনো movement নেই</span>'}</div>`)
}

function renderRegister(){
layout("📷 Attendance Register Scanner",`<div class="scanner"><div class="card"><div class="drop"><input id="registerFile" type="file" accept="image/*"><p>হাজিরা বইয়ের ছবি দাও</p><img id="preview" class="preview" alt="Preview"></div><div class="actions" style="margin-top:12px"><button id="scanBtn" class="primary">🔎 Scan name + ID</button></div><div class="hint" style="margin-top:12px">নোট: হাতে লেখা বাংলা নাম/হাজিরার চিহ্ন OCR দিয়ে ১০০% নির্ভুলভাবে পড়া সম্ভব নয়। Scan-এর পর প্রতিটি row যাচাই/সংশোধন করে Save করবে।</div></div><div class="card"><h3>OCR result</h3><div id="ocrStatus" class="muted">ছবি নির্বাচন করো</div><pre id="ocrText" class="ocr-text">—</pre><div id="detectedRows"></div></div></div>`);
$("#registerFile").onchange=e=>{const f=e.target.files[0];if(f){$("#preview").src=URL.createObjectURL(f);$("#ocrStatus").textContent="ছবি ready — Scan চাপো";}}
$("#scanBtn").onclick=scanRegister
}
async function scanRegister(){
const f=$("#registerFile").files[0];if(!f)return toast("আগে ছবি দাও");
$("#ocrStatus").textContent="OCR চলছে… একটু সময় লাগতে পারে";
$("#scanBtn").disabled=true;
try{
const result=await Tesseract.recognize(f,"ben+eng",{logger:m=>{if(m.status)$("#ocrStatus").textContent=`${m.status} ${Math.round((m.progress||0)*100)}%`;}});
const text=result.data.text||"";$("#ocrText").textContent=text||"কিছু পড়া যায়নি";
$("#ocrStatus").textContent="Scan complete";
buildDetectedRows(text);
}catch(e){$("#ocrStatus").textContent="OCR failed";toast("ছবিটি পড়া যায়নি")}
finally{$("#scanBtn").disabled=false}
}
function buildDetectedRows(text){
const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
const candidates=[];
for(const line of lines){
const nums=line.match(/\b\d{1,6}\b/g);
if(nums?.length){
const id=nums[nums.length-1];
const name=line.replace(id,"").replace(/^\d+[\s.)-]*/,"").trim();
if(name.length>=2)candidates.push({id,name})
}}
const unique=[...new Map(candidates.map(x=>[x.id+"|"+x.name,x])).values()].slice(0,100);
$("#detectedRows").innerHTML=unique.length?`<h3 style="margin-top:18px">Detected rows</h3><div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Save</th></tr></thead><tbody>${unique.map((x,i)=>`<tr><td><input id="rid${i}" value="${esc(x.id)}"></td><td><input id="rname${i}" value="${esc(x.name)}"></td><td><button class="small-btn" onclick="saveDetected(${i})">Add</button></td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Automatic row পাওয়া যায়নি। OCR text দেখে Employee page-এ manual add করো।`
window._detected=unique
}
function saveDetected(i){
const x=window._detected[i],id=$(`#rid${i}`).value.trim(),name=$(`#rname${i}`).value.trim();if(!id||!name)return toast("ID ও নাম লাগবে");
if(db.employees.some(e=>e.id===id))return toast("এই ID আগে থেকেই আছে");
db.employees.push({id,name,designation:"",joining:"",salary:0});save();toast(`${name} added ✓`)
}

function render(page="dashboard"){if(page==="dashboard")renderDashboard();else if(page==="employees")renderEmployees();else if(page==="attendance")renderAttendance();else if(page==="salary")renderSalary();else if(page==="stock")renderStock();else if(page==="reports")renderReports();else if(page==="register")renderRegister()}
$("#backupBtn").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));a.download=`bd-brand-market-backup-${today()}.json`;a.click();toast("Backup downloaded ✓")}
$("#restoreFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();render();toast("Backup restored ✓")}catch{toast("Invalid backup")}};r.readAsText(f)}
const initialPage=(location.hash||"#dashboard").slice(1);
history.replaceState({page:initialPage}, "", location.hash||"#dashboard");
render(["dashboard","employees","attendance","salary","stock","reports","register"].includes(initialPage)?initialPage:"dashboard");
