const defaultEmployees = [["1", "জয়নগরী", "Operator", "2"], ["2", "তাহিনা", "Operator", "63"], ["3", "পারভীন", "Operator", "96"], ["4", "আমেনা - ২", "Operator", "202"], ["5", "দিনমনি", "Operator", "209"], ["6", "নিলি", "Operator", "226"], ["7", "বিনামিত্ত", "Operator", "680"], ["8", "রাশানাজ", "Operator", "685"], ["9", "চম্পা রানী", "Operator", "650"], ["10", "সুমি ইসলাম", "Operator", "681"], ["11", "ফেরদৌসী - ২", "Operator", "2025"], ["12", "শিমন", "Operator", "2062"], ["13", "অঞ্জলি", "Operator", "2089"], ["14", "রাধেয়া", "Operator", "2016"], ["15", "রাজিব", "Operator", "2092"], ["16", "রহিমা - ২", "Operator", "2226"], ["17", "বিউটি", "Operator", "2019"], ["18", "জয়নগরী - ২", "Operator", "2209"], ["19", "দিবাকর কুমার", "Operator", "2228"], ["20", "রাজিয়া", "Operator", "2220"], ["21", "তাসরিয়া - ১", "Operator", "2266"], ["22", "তাহমিনা", "Operator", "2269"], ["23", "ফারজানা আক্তার", "Operator", "2265"], ["24", "তাসকান", "Operator", "2290"], ["25", "আয়না", "Operator", "2296"], ["26", "বিউটি রানী", "Operator", "2298"], ["27", "ফারজানা", "Operator", "2609"], ["28", "চন্দনা", "Operator", "2689"], ["29", "বুশরা ইসলাম", "Operator", "2685"], ["30", "সুমি আক্তার", "Operator", "2065"], ["31", "মুক্তিতা", "Operator", "2068"], ["32", "আফরোজি", "Operator", "2055"], ["33", "তানজুর", "Operator", "2056"], ["34", "জ্যোৎস্না", "Operator", "2057"]];
let employees = JSON.parse(localStorage.getItem("attendance-employees") || "null");
const validEmployees = arr => Array.isArray(arr) && arr.length && arr.every(e => e && typeof e === "object" && e.name && e.card && e.section);
if(!validEmployees(employees)) employees = defaultEmployees.map(e=>({serial:e[0],name:e[1],section:e[2],card:e[3]})); else employees = employees.map((e,i)=>({serial:String(i+1),name:String(e.name),section:e.section==="Helper"?"Helper":"Operator",card:String(e.card)}));

// Add helpers here later. For now the app is ready for both sections.
const helperSeed = [];

let currentSection = "Operator";
let date = localStorage.getItem("attendance-date") || new Date().toISOString().slice(0,10);
let records = JSON.parse(localStorage.getItem("attendance-records") || "{}");

const $ = id => document.getElementById(id);
$("dateInput").value = date;

function key(card){ return `${date}__${card}`; }
function isPresent(card){ return records[key(card)] === true; }

function save(){
  localStorage.setItem("attendance-records", JSON.stringify(records));
  localStorage.setItem("attendance-date", date);
  localStorage.setItem("attendance-employees", JSON.stringify(employees));
}
function filtered(){
  const q = $("search").value.trim().toLowerCase();
  return employees.filter(e => (currentSection==="All" || e.section===currentSection) &&
    (!q || e.name.toLowerCase().includes(q) || e.card.toLowerCase().includes(q)));
}
function render(){
  const list = filtered();
  $("shown").textContent = `${list.length} জন দেখানো হচ্ছে`;
  $("employeeList").innerHTML = list.length ? list.map(e=>{
    const p=isPresent(e.card);
    return `<div class="employee">
      <div class="serial">${e.serial}</div>
      <div><div class="name">${e.name}</div><div class="meta">Card No: ${e.card}</div></div>
      <div class="section">${e.section}</div>
      <div class="actions">
        <button class="att present ${p?'active':''}" data-card="${e.card}" data-value="1">✓ Present</button>
        <button class="att absent ${!p?'active':''}" data-card="${e.card}" data-value="0">× Absent</button>
        <button class="edit" data-edit="${employees.indexOf(e)}">✏ Edit</button>
        <button class="del" data-del="${employees.indexOf(e)}">Delete</button>
      </div>
    </div>`;
  }).join("") : `<div class="empty">এই section-এ কোনো কর্মী পাওয়া যায়নি।</div>`;
  updateStats();
}
function updateStats(){
  const total=employees.length;
  const present=employees.filter(e=>isPresent(e.card)).length;
  $("total").textContent=total;
  $("present").textContent=present;
  $("absent").textContent=total-present;
  $("percent").textContent=total?Math.round(present/total*100)+"%":"0%";
  $("opCount").textContent=employees.filter(e=>e.section==="Operator").length;
  $("hpCount").textContent=employees.filter(e=>e.section==="Helper").length;
  $("allCount").textContent=employees.length;
}
$("employeeList").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b)return;
  if(b.classList.contains("att")){records[key(b.dataset.card)] = b.dataset.value==="1"; save(); render(); return;}
  if(b.dataset.edit!==undefined){openEdit(Number(b.dataset.edit)); return;}
  if(b.dataset.del!==undefined){const i=Number(b.dataset.del);if(confirm("এই কর্মী মুছে ফেলবেন?")){employees.splice(i,1);employees.forEach((x,n)=>x.serial=String(n+1));save();render();}}
});
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  t.classList.add("active"); currentSection=t.dataset.section; render();
}));
$("search").addEventListener("input",render);
$("dateInput").addEventListener("change",()=>{date=$("dateInput").value;save();render();});
$("allPresent").onclick=()=>{filtered().forEach(e=>records[key(e.card)]=true);save();render();};
$("allAbsent").onclick=()=>{filtered().forEach(e=>records[key(e.card)]=false);save();render();};
$("clearDay").onclick=()=>{if(confirm("আজকের সব attendance মুছে ফেলবেন?")){employees.forEach(e=>delete records[key(e.card)]);save();render();}};
$("pdfBtn").onclick=()=>window.print();
render();

const modal=$("employeeModal");
function openModal(){$("modalTitle").textContent="নতুন কর্মী যোগ করুন";$("editIndex").value="";modal.classList.remove("hidden");$("newName").focus();}
function closeModal(){modal.classList.add("hidden");$("editIndex").value="";$("newName").value="";$("newCard").value="";$("newSection").value="Operator";}
$("addEmployee").onclick=openModal;
$("closeModal").onclick=closeModal;
$("cancelAdd").onclick=closeModal;
modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});
$("saveEmployee").onclick=()=>{
  const name=$("newName").value.trim(), card=$("newCard").value.trim(), section=$("newSection").value;
  const editIndex=$("editIndex").value;
  if(!name || !card){alert("নাম ও Card No. দিতে হবে।");return;}
  if(editIndex!=="" && editIndex!==undefined){
    const i=Number(editIndex), oldCard=employees[i].card;
    if(employees.some((e,j)=>j!==i && e.card===card)){alert("এই Card No. আগে থেকেই আছে।");return;}
    if(oldCard!==card && records[key(oldCard)]!==undefined){records[key(card)]=records[key(oldCard)];delete records[key(oldCard)];}
    employees[i]={...employees[i],name,card,section};
  }else{
    if(employees.some(e=>e.card===card)){alert("এই Card No. আগে থেকেই আছে।");return;}
    employees.push({serial:String(employees.length+1),name,section,card});
  }
  employees.forEach((e,i)=>e.serial=String(i+1)); save(); closeModal(); render();
};

function openEdit(i){$("modalTitle").textContent="কর্মী Edit করুন";$("editIndex").value=i;$("newName").value=employees[i].name;$("newCard").value=employees[i].card;$("newSection").value=employees[i].section;$("employeeModal").classList.remove("hidden")}
const scanModal=document.getElementById("scanModal");
document.getElementById("scanBtn").onclick=()=>scanModal.classList.remove("hidden");
document.getElementById("closeScan").onclick=()=>scanModal.classList.add("hidden");
let scanFile=null;document.getElementById("scanFile").onchange=e=>scanFile=e.target.files[0]||null;
async function loadOCR(){if(window.Tesseract)return;await new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function scanCandidates(text){return text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const nums=line.match(/\d{1,4}/g);if(!nums)return null;const card=nums[nums.length-1];const name=line.replace(/\d{1,4}/g," ").replace(/[|:;,_]+/g," ").replace(/\s+/g," ").trim()||"নাম যাচাই করুন";return {name,card,section:"Operator"}}).filter(Boolean).slice(0,80)}
document.getElementById("scanRun").onclick=async()=>{
 if(!scanFile){alert("আগে register-এর ছবি দিন");return}
 const prog=document.getElementById("scanProgress"),bar=document.getElementById("scanBar"),st=document.getElementById("scanStatus");prog.classList.remove("hidden");
 try{await loadOCR();const worker=await Tesseract.createWorker("ben+eng",1,{logger:m=>{if(m.progress){bar.style.width=Math.round(m.progress*100)+"%";st.textContent="OCR চলছে "+Math.round(m.progress*100)+"%"}}});
 const r=await worker.recognize(scanFile);await worker.terminate();document.getElementById("ocrText").textContent=r.data.text;document.getElementById("ocrText").classList.remove("hidden");
 const rows=scanCandidates(r.data.text);document.getElementById("scanRows").innerHTML=rows.map((x,i)=>`<div class="scan-row"><div class="scan-row-grid"><div><small>নাম</small><input data-sname="${i}" value="${x.name.replace(/"/g,"&quot;")}"></div><div><small>Card</small><input data-scard="${i}" value="${x.card}"></div><div><small>Section</small><select data-ssec="${i}"><option>Operator</option><option>Helper</option></select></div><button class="del" data-rm="${i}">×</button></div></div>`).join("");
 document.getElementById("saveScanned").classList.remove("hidden");st.textContent="OCR শেষ";bar.style.width="100%";
 }catch(e){alert("OCR চালু হয়নি। Internet connection দেখে আবার চেষ্টা করো.");console.error(e)}
};
document.getElementById("saveScanned").onclick=()=>{
 let added=0;document.querySelectorAll(".scan-row").forEach(r=>{const n=r.querySelector("[data-sname]").value.trim(),c=r.querySelector("[data-scard]").value.trim(),s=r.querySelector("[data-ssec]").value;if(n&&c&&!employees.some(e=>e.card===c)){employees.push({serial:String(employees.length+1),name:n,card:c,section:s});added++}});save();render();scanModal.classList.add("hidden");alert(added+" জন যোগ হয়েছে");
};
document.getElementById("scanRows").onclick=e=>{const b=e.target.closest("[data-rm]");if(b)b.closest(".scan-row").remove()};
