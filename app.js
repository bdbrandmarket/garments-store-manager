(() => {
"use strict";

const KEY = "bd_brand_market_v4";
const today = () => new Date().toISOString().slice(0,10);
const monthNow = () => new Date().toISOString().slice(0,7);

let db = JSON.parse(localStorage.getItem(KEY) || "null") || {
  employees: [],
  attendance: {},
  stock: [],
  movements: []
};

function save(){ localStorage.setItem(KEY, JSON.stringify(db)); }
function esc(v){ return String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function toast(msg){ const t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove("show"),2200); }
function money(n){ return Number(n||0).toLocaleString("en-BD"); }
function getStatuses(date=today()){ return db.attendance[date] || {}; }

const pages = ["dashboard","employees","attendance","salary","stock","reports"];
const titles = {dashboard:"Dashboard",employees:"Employees",attendance:"Attendance",salary:"Salary Report",stock:"Store / Stock",reports:"Reports"};

function go(page){
  if(!pages.includes(page)) page="dashboard";
  document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active-page",x.id===page));
  document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  document.getElementById("pageTitle").textContent=titles[page];
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("backdrop").classList.remove("show");
  renderAll();
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderDashboard(){
  const emps=db.employees, st=getStatuses();
  const present=emps.filter(e=>st[e.id]==="present").length;
  const absent=emps.filter(e=>st[e.id]==="absent").length;
  const marked=present+absent;
  const low=db.stock.filter(s=>Number(s.qty)<=Number(s.limit));
  document.getElementById("sEmployees").textContent=emps.length;
  document.getElementById("sPresent").textContent=present;
  document.getElementById("sAbsent").textContent=absent;
  document.getElementById("sStock").textContent=db.stock.length;
  document.getElementById("sLow").textContent=`${low.length} low stock`;
  document.getElementById("sAttendanceRate").textContent=emps.length?`${Math.round(present/emps.length*100)}% attendance`:"0% attendance";
  document.getElementById("dPresent").textContent=present;
  document.getElementById("dAbsent").textContent=absent;
  document.getElementById("dMarked").textContent=marked;

  const lowBox=document.getElementById("lowStockBox");
  lowBox.className=low.length?"":"empty";
  lowBox.innerHTML=low.length ? low.map(s=>`<div class="low-row"><span>${esc(s.name)}</span><b>${s.qty} ${esc(s.unit)}</b></div>`).join("") : "সব stock ঠিক আছে ✓";

  const recent=db.movements.slice(-8).reverse();
  const act=document.getElementById("recentActivity");
  act.className=recent.length?"activity-list":"activity-list empty";
  act.innerHTML=recent.length ? recent.map(m=>`<div class="activity"><span>${m.type==="in"?"＋ Stock In":"－ Stock Out"} — <b>${esc(m.name)}</b></span><small>${m.qty} ${esc(m.unit)} • ${esc(m.date)}</small></div>`).join("") : "কোনো activity নেই";
}

function renderEmployees(){
  const q=(document.getElementById("employeeSearch").value||"").toLowerCase();
  const list=db.employees.filter(e=>[e.id,e.name,e.designation,e.section].join(" ").toLowerCase().includes(q));
  document.getElementById("employeeCount").textContent=`মোট ${db.employees.length} জন`;
  document.getElementById("employeeTable").innerHTML=list.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Section</th><th>Joining</th><th>Salary</th><th>Action</th></tr></thead><tbody>${list.map(e=>`<tr><td>${esc(e.id)}</td><td><b>${esc(e.name)}</b></td><td>${esc(e.designation)}</td><td>${esc(e.section)}</td><td>${esc(e.joining)}</td><td>৳${money(e.salary)}</td><td><div class="actions"><button class="mini edit" data-edit="${esc(e.id)}">Edit</button><button class="mini delete" data-delete="${esc(e.id)}">Delete</button></div></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">কোনো employee নেই। “নতুন কর্মী” দিয়ে যোগ করো।</div>`;
}

function renderAttendance(){
  const date=document.getElementById("attendanceDate").value||today();
  const st=getStatuses(date);
  document.getElementById("attendanceTable").innerHTML=db.employees.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Status</th></tr></thead><tbody>${db.employees.map(e=>`<tr><td>${esc(e.id)}</td><td><b>${esc(e.name)}</b></td><td>${esc(e.designation)}</td><td><select class="status-select attendance-select" data-id="${esc(e.id)}"><option value="">Not Marked</option><option value="present" ${st[e.id]==="present"?"selected":""}>Present</option><option value="absent" ${st[e.id]==="absent"?"selected":""}>Absent</option></select></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">আগে Employees থেকে কর্মী যোগ করো।</div>`;
}

function renderSalary(){
  const month=document.getElementById("salaryMonth").value||monthNow();
  const days={};
  db.employees.forEach(e=>days[e.id]={p:0,a:0});
  Object.entries(db.attendance).forEach(([date,vals])=>{if(date.startsWith(month)) Object.entries(vals).forEach(([id,v])=>{if(days[id]) v==="present"?days[id].p++:v==="absent"&&(days[id].a++);});});
  document.getElementById("salaryTable").innerHTML=db.employees.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Section</th><th>Basic Salary</th><th>Present</th><th>Absent</th></tr></thead><tbody>${db.employees.map(e=>`<tr><td>${esc(e.id)}</td><td>${esc(e.name)}</td><td>${esc(e.section)}</td><td>৳${money(e.salary)}</td><td class="green-text">${days[e.id].p}</td><td class="red-text">${days[e.id].a}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">কোনো employee নেই।</div>`;
}

function renderStock(){
  document.getElementById("stockTable").innerHTML=db.stock.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Low Stock</th><th>Action</th></tr></thead><tbody>${db.stock.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${s.qty}</td><td>${esc(s.unit)}</td><td>${Number(s.qty)<=Number(s.limit)?'<span class="red-text">Low stock</span>':'OK'}</td><td><div class="actions"><button class="mini" data-stockin="${esc(s.id)}">＋ In</button><button class="mini" data-stockout="${esc(s.id)}">－ Out</button><button class="mini delete" data-stockdelete="${esc(s.id)}">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">কোনো stock item নেই।</div>`;
  document.getElementById("stockMoves").innerHTML=db.movements.length?`<div class="activity-list">${db.movements.slice(-15).reverse().map(m=>`<div class="activity"><span>${m.type==="in"?"＋":"－"} <b>${esc(m.name)}</b></span><small>${m.qty} ${esc(m.unit)} • ${esc(m.date)}</small></div>`).join("")}</div>`:`<div class="empty">কোনো movement নেই।</div>`;
}

function renderAll(){ renderDashboard(); renderEmployees(); renderAttendance(); renderSalary(); renderStock(); }

document.addEventListener("click", e=>{
  const nav=e.target.closest(".nav"); if(nav){go(nav.dataset.page);return;}
  const goBtn=e.target.closest("[data-go]"); if(goBtn){go(goBtn.dataset.go);return;}
  if(e.target.closest("#menuBtn")){document.getElementById("sidebar").classList.add("open");document.getElementById("backdrop").classList.add("show");return;}
  if(e.target.id==="backdrop"){document.getElementById("sidebar").classList.remove("open");e.target.classList.remove("show");return;}
  if(e.target.closest("#quickAttendance")){go("attendance");return;}
  if(e.target.closest("#addEmployeeBtn")){document.getElementById("employeeFormWrap").classList.remove("hidden");document.getElementById("employeeForm").reset();document.getElementById("empEditId").value="";document.getElementById("empFormTitle").textContent="নতুন কর্মী তথ্য";return;}
  if(e.target.closest("#cancelEmp")){document.getElementById("employeeFormWrap").classList.add("hidden");return;}
  if(e.target.closest("#addStockBtn")){document.getElementById("stockFormWrap").classList.remove("hidden");document.getElementById("stockForm").reset();document.getElementById("stockLimit").value=5;return;}
  if(e.target.closest("#cancelStock")){document.getElementById("stockFormWrap").classList.add("hidden");return;}
  const edit=e.target.closest("[data-edit]"); if(edit){const x=db.employees.find(v=>v.id===edit.dataset.edit);if(x){document.getElementById("employeeFormWrap").classList.remove("hidden");document.getElementById("empFormTitle").textContent="কর্মীর তথ্য Edit";document.getElementById("empEditId").value=x.id;document.getElementById("empName").value=x.name;document.getElementById("empId").value=x.id;document.getElementById("empDesignation").value=x.designation;document.getElementById("empSection").value=x.section;document.getElementById("empJoining").value=x.joining;document.getElementById("empSalary").value=x.salary;window.scrollTo({top:0,behavior:"smooth"});}return;}
  const del=e.target.closest("[data-delete]"); if(del){if(confirm("এই employee delete করবে?")){const id=del.dataset.delete;db.employees=db.employees.filter(x=>x.id!==id);Object.values(db.attendance).forEach(x=>delete x[id]);save();renderAll();toast("Employee deleted");}return;}
  const si=e.target.closest("[data-stockin]"); if(si){stockMove(si.dataset.stockin,"in");return;}
  const so=e.target.closest("[data-stockout]"); if(so){stockMove(so.dataset.stockout,"out");return;}
  const sd=e.target.closest("[data-stockdelete]"); if(sd){if(confirm("এই stock item delete করবে?")){db.stock=db.stock.filter(x=>x.id!==sd.dataset.stockdelete);save();renderAll();toast("Stock item deleted");}return;}
  const report=e.target.closest("[data-report]"); if(report){go(report.dataset.report==="attendance"?"attendance":report.dataset.report==="salary"?"salary":"stock");return;}
  if(e.target.id==="backupBtn"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));a.download=`bd-brand-market-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup downloaded");}
});

document.getElementById("employeeForm").addEventListener("submit", e=>{
  e.preventDefault();
  const oldId=document.getElementById("empEditId").value.trim();
  const x={id:document.getElementById("empId").value.trim(),name:document.getElementById("empName").value.trim(),designation:document.getElementById("empDesignation").value.trim(),section:document.getElementById("empSection").value.trim(),joining:document.getElementById("empJoining").value,salary:Number(document.getElementById("empSalary").value)||0};
  if(!x.id||!x.name||!x.designation)return toast("নাম, ID এবং Designation লাগবে");
  if(db.employees.some(e=>e.id===x.id&&e.id!==oldId))return toast("এই Employee ID আগে থেকেই আছে");
  if(oldId){const i=db.employees.findIndex(e=>e.id===oldId);if(i>=0)db.employees[i]=x; if(oldId!==x.id)Object.values(db.attendance).forEach(v=>{if(v[oldId]!==undefined){v[x.id]=v[oldId];delete v[oldId];}});toast("Employee updated ✓");}
  else{db.employees.push(x);toast("Employee added ✓");}
  save();e.target.reset();document.getElementById("employeeFormWrap").classList.add("hidden");renderAll();
});

document.getElementById("attendanceTable").addEventListener("change", e=>{
  if(!e.target.classList.contains("attendance-select"))return;
  const date=document.getElementById("attendanceDate").value||today();db.attendance[date] ||= {};
  if(e.target.value)db.attendance[date][e.target.dataset.id]=e.target.value;else delete db.attendance[date][e.target.dataset.id];
  save();renderAll();toast("Attendance saved ✓");
});

document.getElementById("attendanceDate").addEventListener("change",renderAttendance);
document.getElementById("salaryMonth").addEventListener("change",renderSalary);
document.getElementById("employeeSearch").addEventListener("input",renderEmployees);

document.getElementById("allPresent").addEventListener("click",()=>setAllAttendance("present"));
document.getElementById("allAbsent").addEventListener("click",()=>setAllAttendance("absent"));
document.getElementById("clearAttendance").addEventListener("click",()=>{const d=document.getElementById("attendanceDate").value||today();delete db.attendance[d];save();renderAll();toast("Attendance cleared");});
function setAllAttendance(v){const d=document.getElementById("attendanceDate").value||today();db.attendance[d]={};db.employees.forEach(e=>db.attendance[d][e.id]=v);save();renderAll();toast(`সবাই ${v==="present"?"Present":"Absent"} করা হয়েছে`);}

document.getElementById("stockForm").addEventListener("submit",e=>{
  e.preventDefault();const name=document.getElementById("stockName").value.trim(),qty=Number(document.getElementById("stockQty").value)||0,unit=document.getElementById("stockUnit").value,limit=Number(document.getElementById("stockLimit").value)||0;
  if(!name)return toast("মালের নাম দাও"); if(db.stock.some(s=>s.name.toLowerCase()===name.toLowerCase()))return toast("এই item আগে থেকেই আছে");
  db.stock.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,qty,unit,limit});save();e.target.reset();document.getElementById("stockLimit").value=5;document.getElementById("stockFormWrap").classList.add("hidden");renderAll();toast("Stock item added ✓");
});
function stockMove(id,type){const s=db.stock.find(x=>x.id===id);if(!s)return;const n=Number(prompt(`${s.name} — কত ${type==="in"?"যোগ":"কমাবে"}?`,"1"));if(!Number.isFinite(n)||n<=0)return;if(type==="out"&&n>s.qty)return toast("এত stock নেই");s.qty=type==="in"?s.qty+n:s.qty-n;db.movements.push({date:today(),name:s.name,qty:n,unit:s.unit,type});save();renderAll();toast(type==="in"?"Stock In saved ✓":"Stock Out saved ✓");}

document.getElementById("restoreFile").addEventListener("change",async e=>{
  const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x||!Array.isArray(x.employees)||!Array.isArray(x.stock)||typeof x.attendance!=="object")throw Error();db=x;save();renderAll();toast("Backup restored ✓");}catch{toast("Invalid backup file");}e.target.value="";
});

document.getElementById("attendanceDate").value=today();
document.getElementById("salaryMonth").value=monthNow();
renderAll();
})();