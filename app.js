const employees = [
  ["১","জয়নগরী","Operator","2"],["২","তাহিনা","Operator","63"],["৩","পারভীন","Operator","96"],
  ["৪","আমেনা - ২","Operator","202"],["৫","দিনমনি","Operator","229"],["৬","নিপি","Operator","226"],
  ["৭","বিনামিত্ত","Operator","680"],["৮","রাশানাজ","Operator","685"],["৯","চম্পা রানী","Operator","650"],
  ["১০","সুমী ইসলাম","Operator","681"],["১১","ফেরদৌসী - ২","Operator","2025"],["১২","শিমন","Operator","2002"],
  ["১৩","অঞ্জলি","Operator","2089"],["১৪","রাধেয়া","Operator","2016"],["১৫","রাজি","Operator","2002"],
  ["১৬","রহিমা - ২","Operator","2226"],["১৭","বিউটি","Operator","2019"],["১৮","জয়নগরী - ২","Operator","2209"],
  ["১৯","দিবাকর কুমার","Operator","2228"],["২০","রাজিয়া","Operator","2220"],["২১","তাসরিয়া - ১","Operator","2266"],
  ["২২","তাহমিনা","Operator","2269"],["২৩","ফারজানা আক্তার","Operator","2265"],["২৪","তাসকান","Operator","2290"],
  ["২৫","আয়না","Operator","2296"],["২৬","বিউটি রানী","Operator","2298"],["২৭","ফারজানা","Operator","2609"],
  ["২৮","চন্দনা","Operator","2689"],["২৯","বুশরা ইসলাম","Operator","2685"],["৩০","সুমী আক্তার","Operator","2065"],
  ["৩১","মুক্তি","Operator","2068"],["৩২","আফরোজি","Operator","2055"],["৩৩","তানজুর","Operator","2056"],
  ["৩৪","জ্যোৎস্না","Operator","2057"]
].map(x=>({serial:x[0],name:x[1],section:x[2],card:x[3]}));

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
  const b=e.target.closest(".att"); if(!b)return;
  records[key(b.dataset.card)] = b.dataset.value==="1";
  save(); render();
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
