const KEY="bd_brand_market_v3";

const today=()=>new Date().toISOString().slice(0,10);
const monthNow=()=>new Date().toISOString().slice(0,7);
const $=id=>document.getElementById(id);

let db=JSON.parse(localStorage.getItem(KEY)||"null")||{
  employees:[],attendance:{},stock:[],movements:[]
};

function save(){
  localStorage.setItem(KEY,JSON.stringify(db));
}

function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function toast(msg){
  const t=$("toast");
  if(!t)return;
  t.textContent=msg;
  t.classList.add("show");
  clearTimeout(window._toast);
  window._toast=setTimeout(()=>t.classList.remove("show"),2200);
}

const titles={
  dashboard:"Dashboard",
  employees:"Employees",
  attendance:"Attendance",
  salary:"Salary Report",
  stock:"Store / Stock",
  reports:"Reports"
};

function go(page){
  document.querySelectorAll(".page").forEach(x=>{
    x.classList.toggle("active",x.id===page);
  });

  document.querySelectorAll(".nav").forEach(x=>{
    x.classList.toggle("active",x.dataset.page===page);
  });

  if($("title"))$("title").textContent=titles[page]||"Dashboard";

  document.querySelector(".sidebar")?.classList.remove("open");

  renderAll();
}

document.querySelectorAll(".nav").forEach(x=>{
  x.addEventListener("click",()=>go(x.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(x=>{
  x.addEventListener("click",()=>go(x.dataset.go));
});

$("menu")?.addEventListener("click",()=>{
  document.querySelector(".sidebar")?.classList.toggle("open");
});


/* DASHBOARD */

function renderDashboard(){
  const date=today();
  const att=db.attendance[date]||[];

  const present=db.employees.filter(e=>att[e.id]==="present").length;
  const absent=db.employees.filter(e=>att[e.id]==="absent").length;
  const marked=present+absent;

  const low=db.stock.filter(
    x=>Number(x.qty)<=Number(x.limit||0)
  );

  if($("ec"))$("ec").textContent=db.employees.length;
  if($("pc"))$("pc").textContent=present;
  if($("ac"))$("ac").textContent=absent;
  if($("sc"))$("sc").textContent=db.stock.length;

  if($("rate")){
    $("rate").textContent=db.employees.length
      ?Math.round(present/db.employees.length*100)+"% attendance"
      :"0% attendance";
  }

  if($("lc"))$("lc").textContent=low.length+" low stock";
  if($("rp"))$("rp").textContent=present;
  if($("ra"))$("ra").textContent=absent;
  if($("rm"))$("rm").textContent=marked;

  if($("low")){
    $("low").innerHTML=low.length
      ?low.map(x=>`
        <div class="section-row">
          <span><b>${esc(x.name)}</b></span>
          <strong class="red">
            ${x.qty} ${esc(x.unit||"")}
          </strong>
        </div>
      `).join("")
      :`<div class="empty-table">সব stock ঠিক আছে ✓</div>`;
  }

  const sections={};

  db.employees.forEach(e=>{
    const s=e.section||"Other";
    if(!sections[s])sections[s]=0;
    if(att[e.id]==="present")sections[s]++;
  });

  if($("sections")){
    $("sections").innerHTML=Object.keys(sections).length
      ?Object.entries(sections).map(([s,n])=>`
        <div class="section-row">
          <span>${esc(s)}</span>
          <b>${n} Present</b>
        </div>
      `).join("")
      :`<div class="empty-table">কোনো employee data নেই</div>`;
  }
}


/* EMPLOYEES */

function renderEmployees(){
  const q=($("eq")?.value||"").toLowerCase();

  const list=db.employees.filter(e=>
    [e.name,e.id,e.designation,e.section]
    .join(" ")
    .toLowerCase()
    .includes(q)
  );

  if($("count"))$("count").textContent=db.employees.length;

  if(!$("empTable"))return;

  $("empTable").innerHTML=list.length
    ?`
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Section</th>
              <th>Joining</th>
              <th>Salary</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(e=>`
              <tr>
                <td>${esc(e.id)}</td>
                <td><b>${esc(e.name)}</b></td>
                <td>${esc(e.designation||"-")}</td>
                <td>${esc(e.section||"-")}</td>
                <td>${esc(e.joining||"-")}</td>
                <td>৳${Number(e.salary||0).toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    :`<div class="empty-table">কোনো employee পাওয়া যায়নি</div>`;
}

$("openEmp")?.addEventListener("click",()=>{
  $("empForm")?.classList.remove("hidden");
});

$("cancelEmp")?.addEventListener("click",()=>{
  $("empForm")?.classList.add("hidden");
});

$("saveEmp")?.addEventListener("click",()=>{
  const name=$("en").value.trim();
  const id=$("ei").value.trim();

  if(!name||!id){
    toast("নাম ও Employee ID দিন");
    return;
  }

  if(db.employees.some(e=>e.id===id)){
    toast("এই Employee ID আগে থেকেই আছে");
    return;
  }

  db.employees.push({
    id:id,
    name:name,
    designation:$("ed").value.trim(),
    section:$("es").value.trim(),
    joining:$("ej").value,
    salary:Number($("em").value||0)
  });

  save();

  ["en","ei","ed","es","ej","em"].forEach(id=>{
    if($(id))$(id).value="";
  });

  $("empForm")?.classList.add("hidden");

  renderAll();
  toast("Employee added ✓");
});

$("eq")?.addEventListener("input",renderEmployees);


/* ATTENDANCE */

if($("ad"))$("ad").value=today();

function renderAttendance(){
  const date=$("ad")?.value||today();
  const att=db.attendance[date]||{};
  const q=($("aq")?.value||"").toLowerCase();

  const list=db.employees.filter(e=>
    [e.name,e.id,e.designation,e.section]
    .join(" ")
    .toLowerCase()
    .includes(q)
  );

  if(!$("attTable"))return;

  $("attTable").innerHTML=list.length
    ?`
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Section</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(e=>`
              <tr>
                <td>${esc(e.id)}</td>
                <td><b>${esc(e.name)}</b></td>
                <td>${esc(e.designation||"-")}</td>
                <td>${esc(e.section||"-")}</td>
                <td>
                  <select class="status-select" data-att-id="${esc(e.id)}">
                    <option value="" ${!att[e.id]?"selected":""}>Not Marked</option>
                    <option value="present" ${att[e.id]==="present"?"selected":""}>✓ Present</option>
                    <option value="absent" ${att[e.id]==="absent"?"selected":""}>× Absent</option>
                  </select>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    :`<div class="empty-table">কোনো employee নেই</div>`;
}

$("ad")?.addEventListener("change",renderAttendance);
$("aq")?.addEventListener("input",renderAttendance);

function allAttendance(status){
  const date=$("ad")?.value||today();

  if(!db.attendance[date])db.attendance[date]={};

  db.employees.forEach(e=>{
    db.attendance[date][e.id]=status;
  });

  save();
  renderAll();

  toast(
    status==="present"
      ?"সবাই Present করা হয়েছে ✓"
      :"সবাই Absent করা হয়েছে"
  );
}

$("allP")?.addEventListener(
  "click",()=>allAttendance("present")
);

$("allA")?.addEventListener(
  "click",()=>allAttendance("absent")
);

$("saveA")?.addEventListener("click",()=>{
  const date=$("ad")?.value||today();

  if(!db.attendance[date])
    db.attendance[date]={};

  document.querySelectorAll("[data-att-id]").forEach(x=>{
    const id=x.dataset.attId;

    if(x.value)
      db.attendance[date][id]=x.value;
    else
      delete db.attendance[date][id];
  });

  save();
  renderAll();
  toast("Attendance saved ✓");
});


/* SALARY */

if($("sm"))$("sm").value=monthNow();

function renderSalary(){
  const month=$("sm")?.value||monthNow();

  const count={};

  db.employees.forEach(e=>{
    count[e.id]={present:0,absent:0};
  });

  Object.entries(db.attendance).forEach(([date,data])=>{
    if(!date.startsWith(month))return;

    Object.entries(data).forEach(([id,status])=>{
      if(!count[id])return;

      if(status==="present")
        count[id].present++;

      if(status==="absent")
        count[id].absent++;
    });
  });

  if(!$("salTable"))return;

  $("salTable").innerHTML=db.employees.length
    ?`
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Section</th>
              <th>Basic Salary</th>
              <th>Present</th>
              <th>Absent</th>
            </tr>
          </thead>
          <tbody>
            ${db.employees.map(e=>`
              <tr>
                <td>${esc(e.id)}</td>
                <td><b>${esc(e.name)}</b></td>
                <td>${esc(e.section||"-")}</td>
                <td>৳${Number(e.salary||0).toLocaleString()}</td>
                <td>${count[e.id].present}</td>
                <td>${count[e.id].absent}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    :`<div class="empty-table">কোনো employee নেই</div>`;
}

$("sm")?.addEventListener("change",renderSalary);


/* STOCK */

$("openStock")?.addEventListener("click",()=>{
  $("stockForm")?.classList.remove("hidden");
});

$("cancelStock")?.addEventListener("click",()=>{
  $("stockForm")?.classList.add("hidden");
});

$("saveStock")?.addEventListener("click",()=>{
  const name=$("sn").value.trim();

  if(!name){
    toast("মালের নাম দিন");
    return;
  }

  if(db.stock.some(
    x=>x.name.toLowerCase()===name.toLowerCase()
  )){
    toast("এই item আগে থেকেই আছে");
    return;
  }

  db.stock.push({
    id:Date.now(),
    name:name,
    qty:Number($("sq").value||0),
    unit:$("su").value.trim()||"pcs",
    limit:Number($("sl").value||0)
  });

  save();

  ["sn","sq","su","sl"].forEach(id=>{
    if($(id))$(id).value="";
  });

  $("stockForm")?.classList.add("hidden");

  renderAll();
  toast("Stock item saved ✓");
});

function renderStock(){
  const q=($("sqry")?.value||"").toLowerCase();

  const list=db.stock.filter(x=>
    x.name.toLowerCase().includes(q)
  );

  if(!$("stockTable"))return;

  $("stockTable").innerHTML=list.length
    ?`
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Low Limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(x=>`
              <tr>
                <td><b>${esc(x.name)}</b></td>
                <td>${Number(x.qty)}</td>
                <td>${esc(x.unit||"pcs")}</td>
                <td>${Number(x.limit||0)}</td>
                <td>
                  ${
                    Number(x.qty)<=Number(x.limit||0)
                    ?'<span class="red">Low stock</span>'
                    :'<span class="green">OK</span>'
                  }
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    :`<div class="empty-table">কোনো stock item নেই</div>`;

  if($("moves")){
    const moves=db.movements.slice(-10).reverse();

    $("moves").innerHTML=moves.length
      ?moves.map(x=>`
        <div class="section-row">
          <span>${esc(x.date)} — ${esc(x.name)}</span>
          <b>${x.type==="in"?"+":"-"}${x.qty}</b>
        </div>
      `).join("")
      :`<div class="empty-table">কোনো movement নেই</div>`;
  }
}

$("sqry")?.addEventListener("input",renderStock);

function stockMove(type){
  if(!db.stock.length){
    toast("আগে একটি stock item যোগ করুন");
    return;
  }

  const list=db.stock
    .map((x,i)=>`${i+1}. ${x.name} (${x.qty} ${x.unit})`)
    .join("\n");

  const choice=prompt(
    "কোন item?\n\n"+list+"\n\nItem number:"
  );

  if(choice===null)return;

  const index=Number(choice)-1;

  if(!db.stock[index]){
    toast("ভুল item number");
    return;
  }

  const qty=Number(prompt("Quantity:")||0);

  if(qty<=0){
    toast("সঠিক quantity দিন");
    return;
  }

  const item=db.stock[index];

  if(type==="out"&&qty>Number(item.qty)){
    toast("এত stock নেই");
    return;
  }

  item.qty=
    Number(item.qty)+
    (type==="in"?qty:-qty);

  db.movements.push({
    date:today(),
    name:item.name,
    type:type,
    qty:qty
  });

  save();
  renderAll();

  toast(
    type==="in"
      ?"Stock In saved ✓"
      :"Stock Out saved ✓"
  );
}

$("stockIn")?.addEventListener(
  "click",()=>stockMove("in")
);

$("stockOut")?.addEventListener(
  "click",()=>stockMove("out")
);


/* START */

function renderAll(){
  renderDashboard();
  renderEmployees();
  renderAttendance();
  renderSalary();
  renderStock();
}

renderAll();
