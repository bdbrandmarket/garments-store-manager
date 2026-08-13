const SUPABASE_URL="https://oxhogwcyqlyumolcaruf.supabase.co";
const SUPABASE_KEY="sb_publishable_16lbNyvOdGCiP7b7jJDxJA_VL2ZNLzg";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let employees=[], attendance=[], stock=[], currentPage="dashboard";

function toast(msg){const e=$("#toast");e.textContent=msg;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)}
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function statusBadge(s){return `<span class="badge ${s}">${esc(s)}</span>`}
function openModal(html){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modalX").onclick=closeModal;$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
$("#menuBtn").onclick=()=>$(".shell").classList.toggle("menu-open");

async function loadData(){
  const [e,a,s]=await Promise.all([
    sb.from("employees").select("*").order("id"),
    sb.from("attendance").select("*").order("work_date",{ascending:false}),
    sb.from("stock_items").select("*").order("name")
  ]);
  if(e.error||a.error||s.error){toast("Database load error");console.error(e.error,a.error,s.error);return}
  employees=e.data||[];attendance=a.data||[];stock=s.data||[];
}
async function sessionGuard(){
  const {data}=await sb.auth.getSession();
  if(data.session){$("#loginView").classList.add("hidden");$("#appView").classList.remove("hidden");await loadData();render("dashboard")}
  else{$("#loginView").classList.remove("hidden");$("#appView").classList.add("hidden")}
}
$("#loginForm").onsubmit=async e=>{
 e.preventDefault();$("#loginError").textContent="";$("#loginBtn").disabled=true;
 const {error}=await sb.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
 if(error)$("#loginError").textContent="Login failed. Email/password check করো।";else await sessionGuard();
 $("#loginBtn").disabled=false;
};
$("#logoutBtn").onclick=async()=>{await sb.auth.signOut();location.reload()};
$("#userBtn").onclick=async()=>{const {data}=await sb.auth.getUser();toast(data.user?.email||"Logged in")};
sb.auth.onAuthStateChange((_e)=>{if(_e==="SIGNED_OUT")sessionGuard()});

$$(".nav[data-page]").forEach(b=>b.onclick=()=>{currentPage=b.dataset.page;$$(".nav[data-page]").forEach(x=>x.classList.toggle("active",x===b));$(".shell").classList.remove("menu-open");history.pushState({page:currentPage},"","#"+currentPage);render(currentPage)});
window.onpopstate=()=>{const p=location.hash.slice(1)||"dashboard";currentPage=p;$$(".nav[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p));render(p)};

async function saveEmployee(data){
 const {error}=await sb.from("employees").upsert(data,{onConflict:"employee_code"});if(error)toast(error.message);else{toast("Employee saved");await loadData();render("employees")}
}
function employeeForm(emp={}){
 openModal(`<h2>${emp.id?"Edit":"Add"} Employee</h2><form id="empForm" class="form-grid">
<label>Employee ID<input id="f_code" class="input" required value="${esc(emp.employee_code||"")}"></label>
<label>Name<input id="f_name" class="input" required value="${esc(emp.name||"")}"></label>
<label>Designation<input id="f_des" class="input" value="${esc(emp.designation||"")}"></label>
<label>Section<input id="f_sec" class="input" value="${esc(emp.section||"")}"></label>
<label>Joining<input id="f_join" class="input" type="date" value="${esc(emp.joining||"")}"></label>
<label>Salary<input id="f_sal" class="input" type="number" value="${emp.salary||0}"></label>
<div><button class="primary">Save</button></div></form>`);
 $("#empForm").onsubmit=async e=>{e.preventDefault();await saveEmployee({...(emp.id?{id:emp.id}:{}),employee_code:$("#f_code").value.trim(),name:$("#f_name").value.trim(),designation:$("#f_des").value,section:$("#f_sec").value,joining:$("#f_join").value||null,salary:Number($("#f_sal").value||0)});closeModal()}
}
async function deleteEmployee(id){if(!confirm("Employee delete করবে?"))return;const {error}=await sb.from("employees").delete().eq("id",id);if(error)toast(error.message);else{await loadData();render("employees")}}

function renderEmployees(){
 $("#main").innerHTML=`<div class="page-head"><div><h2>Employees</h2><div class="muted">${employees.length} employees</div></div><button class="primary" id="addEmp">＋ Add Employee</button></div>
 <div class="toolbar"><input id="empSearch" class="input" placeholder="Search name / ID / section"></div>
 <div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Section</th><th>Joining</th><th>Salary</th><th></th></tr></thead><tbody id="empRows"></tbody></table></div>`;
 const draw=()=>{const q=$("#empSearch").value.toLowerCase();$("#empRows").innerHTML=employees.filter(e=>(`${e.employee_code} ${e.name} ${e.section}`).toLowerCase().includes(q)).map(e=>`<tr><td>${esc(e.employee_code)}</td><td><button class="click-name" data-history="${e.employee_code}">${esc(e.name)}</button></td><td>${esc(e.designation)}</td><td>${esc(e.section)}</td><td>${esc(e.joining||"")}</td><td>৳${Number(e.salary||0).toLocaleString()}</td><td><button class="secondary" data-edit="${e.id}">Edit</button> <button class="danger" data-del="${e.id}">Delete</button></td></tr>`).join("")||`<tr><td colspan="7" class="empty">No employee</td></tr>`};
 draw();$("#empSearch").oninput=draw;$("#addEmp").onclick=()=>employeeForm();
 $("#empRows").onclick=e=>{const h=e.target.closest("[data-history]"),ed=e.target.closest("[data-edit]"),d=e.target.closest("[data-del]");if(h)showHistory(h.dataset.history);if(ed)employeeForm(employees.find(x=>x.id==ed.dataset.edit));if(d)deleteEmployee(d.dataset.del)}
}
function showHistory(code){
 const emp=employees.find(e=>e.employee_code===code), rows=attendance.filter(a=>a.employee_code===code);
 openModal(`<h2>${esc(emp?.name||code)} — Attendance History</h2><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th><th>Hours</th><th>OT</th><th>Advance</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${a.work_date}</td><td>${statusBadge(a.status)}</td><td>${a.in_time||"-"}</td><td>${a.out_time||"-"}</td><td>${a.hours||0}</td><td>${a.overtime||0}</td><td>৳${a.advance||0}</td></tr>`).join("")||`<tr><td colspan="7" class="empty">No attendance yet</td></tr>`}</tbody></table></div>`)
}

async function saveAttendance(data){const {error}=await sb.from("attendance").upsert(data,{onConflict:"employee_code,work_date"});if(error)toast(error.message);else{toast("Attendance saved");await loadData();render("attendance")}}
function attendanceForm(a={}){
 openModal(`<h2>Attendance Entry</h2><form id="attForm" class="form-grid">
<label>Employee<select id="a_emp" class="select" required>${employees.map(e=>`<option value="${esc(e.employee_code)}" ${a.employee_code===e.employee_code?"selected":""}>${esc(e.employee_code)} — ${esc(e.name)}</option>`).join("")}</select></label>
<label>Date<input id="a_date" class="input" type="date" required value="${a.work_date||new Date().toISOString().slice(0,10)}"></label>
<label>Status<select id="a_status" class="select"><option>present</option><option>absent</option><option>leave</option></select></label>
<label>In time<input id="a_in" class="input" type="time" value="${a.in_time||""}"></label>
<label>Out time<input id="a_out" class="input" type="time" value="${a.out_time||""}"></label>
<label>Hours<input id="a_hours" class="input" type="number" step=".25" value="${a.hours||0}"></label>
<label>Overtime<input id="a_ot" class="input" type="number" step=".25" value="${a.overtime||0}"></label>
<label>Advance<input id="a_adv" class="input" type="number" step=".01" value="${a.advance||0}"></label>
<label>Note<textarea id="a_note" class="textarea">${esc(a.note||"")}</textarea></label>
<div><button class="primary">Save</button></div></form>`);
 $("#a_status").value=a.status||"present";
 $("#attForm").onsubmit=async e=>{e.preventDefault();await saveAttendance({...(a.id?{id:a.id}:{}),employee_code:$("#a_emp").value,work_date:$("#a_date").value,status:$("#a_status").value,in_time:$("#a_in").value||null,out_time:$("#a_out").value||null,hours:Number($("#a_hours").value||0),overtime:Number($("#a_ot").value||0),advance:Number($("#a_adv").value||0),note:$("#a_note").value});closeModal()}
}
function renderAttendance(){
 $("#main").innerHTML=`<div class="page-head"><div><h2>Attendance</h2><div class="muted">In / Out / Hours / Overtime / Advance</div></div><button class="primary" id="addAtt">＋ Manual Entry</button></div>
 <div class="toolbar"><input id="dateFilter" class="input" type="date"><input id="attSearch" class="input" placeholder="Search employee"></div>
 <div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Employee</th><th>Status</th><th>In</th><th>Out</th><th>Hours</th><th>OT</th><th>Advance</th><th></th></tr></thead><tbody id="attRows"></tbody></table></div>`;
 const draw=()=>{const q=$("#attSearch").value.toLowerCase(),d=$("#dateFilter").value;$("#attRows").innerHTML=attendance.filter(a=>(!d||a.work_date===d)&&(`${a.employee_code} ${employees.find(e=>e.employee_code===a.employee_code)?.name||""}`).toLowerCase().includes(q)).map(a=>`<tr><td>${a.work_date}</td><td>${esc(employees.find(e=>e.employee_code===a.employee_code)?.name||a.employee_code)}</td><td>${statusBadge(a.status)}</td><td>${a.in_time||"-"}</td><td>${a.out_time||"-"}</td><td>${a.hours||0}</td><td>${a.overtime||0}</td><td>৳${a.advance||0}</td><td><button class="secondary" data-att="${a.id}">Edit</button></td></tr>`).join("")||`<tr><td colspan="9" class="empty">No attendance</td></tr>`};
 draw();$("#attSearch").oninput=draw;$("#dateFilter").oninput=draw;$("#addAtt").onclick=()=>attendanceForm();
 $("#attRows").onclick=e=>{const b=e.target.closest("[data-att]");if(b)attendanceForm(attendance.find(a=>a.id==b.dataset.att))}
}

function renderDashboard(){
 const today=new Date().toISOString().slice(0,10), todayRows=attendance.filter(a=>a.work_date===today), present=todayRows.filter(a=>a.status==="present").length, absent=todayRows.filter(a=>a.status==="absent").length;
 $("#main").innerHTML=`<div class="page-head"><div><h2>Dashboard</h2><div class="muted">${today}</div></div><button class="primary" onclick="location.hash='attendance';window.onpopstate()">Open Attendance</button></div>
 <div class="grid"><div class="card stat"><span class="muted">Employees</span><b>${employees.length}</b></div><div class="card stat"><span class="muted">Present Today</span><b>${present}</b></div><div class="card stat"><span class="muted">Absent Today</span><b>${absent}</b></div><div class="card stat"><span class="muted">Stock Items</span><b>${stock.length}</b></div></div>
 <div class="grid" style="margin-top:14px"><div class="card" style="grid-column:span 2"><h3>Quick Actions</h3><div class="toolbar"><button class="primary" id="qaEmp">Add Employee</button><button class="secondary" id="qaAtt">Manual Attendance</button><button class="secondary" id="qaScan">Scan Register</button></div></div><div class="card" style="grid-column:span 2"><h3>Today</h3><p class="muted">${todayRows.length} attendance records saved.</p></div></div>`;
 $("#qaEmp").onclick=()=>employeeForm();$("#qaAtt").onclick=()=>attendanceForm();$("#qaScan").onclick=()=>{location.hash="scanner";render("scanner")}
}
async function renderScanner(){
 $("#main").innerHTML=`<div class="page-head"><div><h2>Attendance Scanner</h2><div class="muted">Register photo → editable rows → add attendance</div></div></div>
 <div class="card scanner"><input id="scanFile" type="file" accept="image/*"><div id="scanMsg" class="muted">ছবি নির্বাচন করো</div><img id="scanPreview" class="preview hidden"><div id="scanResults" class="result-list"></div></div>`;
 $("#scanFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;$("#scanPreview").src=URL.createObjectURL(f);$("#scanPreview").classList.remove("hidden");$("#scanMsg").textContent="OCR চলছে…";try{const r=await Tesseract.recognize(f,"eng",{logger:m=>{if(m.status==="recognizing text")$("#scanMsg").textContent=`OCR ${Math.round((m.progress||0)*100)}%`}});const lines=r.data.text.split(/\n+/).map(x=>x.trim()).filter(Boolean);const guesses=lines.map(line=>{const id=(line.match(/\b\d{1,6}\b/)||[""])[0];const name=line.replace(id,"").replace(/[|:;,]+/g," ").trim();return {id,name}}).filter(x=>x.id&&x.name);$("#scanResults").innerHTML=guesses.length?guesses.map((x,i)=>`<div class="result-row"><input class="input" data-sn="${i}" value="${esc(x.name)}"><input class="input" data-si="${i}" value="${esc(x.id)}"><button class="primary" data-addscan="${i}">Add Employee</button></div>`).join(""):`<div class="empty">OCR থেকে usable ID পাওয়া যায়নি। নিচের Manual Entry ব্যবহার করো।</div>`;$("#scanMsg").textContent="OCR complete — result verify করে Add করো";$("#scanResults").onclick=async ev=>{const b=ev.target.closest("[data-addscan]");if(!b)return;const i=b.dataset.addscan,n=$(`[data-sn="${i}"]`).value.trim(),id=$(`[data-si="${i}"]`).value.trim();if(!id||!n)return toast("Name ও ID দরকার");await saveEmployee({employee_code:id,name:n});closeModal();render("scanner")}}catch(err){console.error(err);$("#scanMsg").textContent="OCR failed — manual entry ব্যবহার করো"}}
}


async function renderStock(){
 $("#main").innerHTML=`<div class="page-head"><div><h2>Store / Stock</h2><div class="muted">Simple stock register</div></div><button class="primary" id="addStock">＋ Add Item</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Item</th><th>Unit</th><th>Quantity</th><th>Reorder</th><th></th></tr></thead><tbody id="stockRows"></tbody></table></div>`;
 $("#stockRows").innerHTML=stock.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.unit)}</td><td>${s.quantity}</td><td>${s.reorder_level}</td><td><button class="secondary" data-stock="${s.id}">Edit</button></td></tr>`).join("")||`<tr><td colspan="5" class="empty">No stock item</td></tr>`;
 $("#addStock").onclick=()=>stockForm();
 $("#stockRows").onclick=e=>{const b=e.target.closest("[data-stock]");if(b)stockForm(stock.find(x=>x.id==b.dataset.stock))}
}
async function stockForm(s={}){
 openModal(`<h2>${s.id?"Edit":"Add"} Stock Item</h2><form id="stockForm" class="form-grid">
<label>Name<input id="s_name" class="input" required value="${esc(s.name||"")}"></label><label>Unit<input id="s_unit" class="input" value="${esc(s.unit||"pcs")}"></label><label>Quantity<input id="s_qty" class="input" type="number" step=".01" value="${s.quantity||0}"></label><label>Reorder level<input id="s_re" class="input" type="number" step=".01" value="${s.reorder_level||0}"></label><div><button class="primary">Save</button></div></form>`);
 $("#stockForm").onsubmit=async e=>{e.preventDefault();const {error}=await sb.from("stock_items").upsert({...(s.id ? {id:s.id} : {}),name:$("#s_name").value,unit:$("#s_unit").value,quantity:Number($("#s_qty").value||0),reorder_level:Number($("#s_re").value||0)});if(error)toast(error.message);else{closeModal();await loadData();render("stock")}}
}
function renderReports(){const totalAdv=attendance.reduce((n,a)=>n+Number(a.advance||0),0),ot=attendance.reduce((n,a)=>n+Number(a.overtime||0),0);$("#main").innerHTML=`<div class="page-head"><div><h2>Reports</h2><div class="muted">Current database summary</div></div><button class="primary" id="csvBtn">Export Attendance CSV</button></div><div class="grid"><div class="card stat"><span class="muted">Attendance Records</span><b>${attendance.length}</b></div><div class="card stat"><span class="muted">Overtime Hours</span><b>${ot}</b></div><div class="card stat"><span class="muted">Advances</span><b>৳${totalAdv.toLocaleString()}</b></div><div class="card stat"><span class="muted">Employees</span><b>${employees.length}</b></div></div>`;$("#csvBtn").onclick=()=>{const rows=[["Date","Employee ID","Name","Status","In","Out","Hours","OT","Advance"],...attendance.map(a=>[a.work_date,a.employee_code,employees.find(e=>e.employee_code===a.employee_code)?.name||"",a.status,a.in_time||"",a.out_time||"",a.hours||0,a.overtime||0,a.advance||0])];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="attendance-report.csv";a.click()}}
function render(p){if(p==="employees")renderEmployees();else if(p==="attendance")renderAttendance();else if(p==="scanner")renderScanner();else if(p==="stock")renderStock();else if(p==="reports")renderReports();else renderDashboard()}
window.addEventListener("DOMContentLoaded",()=>sessionGuard());
