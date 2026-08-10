const KEY = "bd_brand_market_v3";

const today = () => new Date().toISOString().slice(0, 10);
const monthNow = () => new Date().toISOString().slice(0, 7);

const $ = id => document.getElementById(id);

let db = JSON.parse(localStorage.getItem(KEY) || "null") || {
  employees: [],
  attendance: {},
  stock: [],
  movements: []
};

function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function toast(message) {
  const t = $("toast");
  if (!t) return;

  t.textContent = message;
  t.classList.add("show");

  clearTimeout(window._toastTimer);

  window._toastTimer = setTimeout(() => {
    t.classList.remove("show");
  }, 2200);
}

/* =========================
   NAVIGATION
========================= */

const titles = {
  dashboard: "Dashboard",
  employees: "Employees",
  attendance: "Attendance",
  salary: "Salary Report",
  stock: "Store / Stock",
  reports: "Reports"
};

function go(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === page
    );
  });

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  const title = $("title");

  if (title) {
    title.textContent =
      titles[page] || "Dashboard";
  }

  document
    .querySelector(".sidebar")
    ?.classList.remove("open");

  renderAll();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.addEventListener("click", e => {

  const nav = e.target.closest("[data-page]");

  if (nav) {
    go(nav.dataset.page);
    return;
  }

  const target = e.target.closest("[data-go]");

  if (target) {
    go(target.dataset.go);
  }
});

/* =========================
   MOBILE MENU
========================= */

$("menu")?.addEventListener("click", () => {
  document
    .querySelector(".sidebar")
    ?.classList.toggle("open");
});

/* =========================
   DASHBOARD
========================= */

function renderDashboard() {

  const date = today();

  const attendance =
    db.attendance[date] || {};

  const employees =
    db.employees;

  const present =
    employees.filter(
      e => attendance[e.id] === "present"
    ).length;

  const absent =
    employees.filter(
      e => attendance[e.id] === "absent"
    ).length;

  const marked =
    present + absent;

  const lowStock =
    db.stock.filter(
      s => Number(s.qty) <= Number(s.limit || 0)
    );

  $("ec").textContent =
    employees.length;

  $("pc").textContent =
    present;

  $("ac").textContent =
    absent;

  $("sc").textContent =
    db.stock.length;

  $("rate").textContent =
    employees.length
      ? `${Math.round((present / employees.length) * 100)}% attendance`
      : "0% attendance";

  $("lc").textContent =
    `${lowStock.length} low stock`;

  $("rp").textContent =
    present;

  $("ra").textContent =
    absent;

  $("rm").textContent =
    marked;

  const lowBox = $("low");

  if (lowBox) {

    lowBox.innerHTML =
      lowStock.length

        ? lowStock.map(item => `
            <div class="section-row">
              <b>${esc(item.name)}</b>

              <div class="bar">
                <i style="width:${Math.min(
                  100,
                  Math.max(
                    8,
                    Number(item.qty) /
                    (Number(item.limit) || 1) *
                    100
                  )
                )}%"></i>
              </div>

              <strong>
                ${Number(item.qty)}
                ${esc(item.unit || "pcs")}
              </strong>
            </div>
          `).join("")

        : `<div class="empty">
             সব stock ঠিক আছে ✓
           </div>`;
  }

  const sections = {};

  employees.forEach(employee => {

    const section =
      employee.section || "Other";

    if (!sections[section]) {
      sections[section] = {
        total: 0,
        present: 0
      };
    }

    sections[section].total++;

    if (
      attendance[employee.id] ===
      "present"
    ) {
      sections[section].present++;
    }
  });

  const sectionBox =
    $("sections");

  if (sectionBox) {

    sectionBox.innerHTML =
      Object.keys(sections).length

        ? Object.entries(sections)
            .map(([name, data]) => `
              <div class="section-row">

                <span>
                  ${esc(name)}
                </span>

                <div class="bar">
                  <i style="width:${
                    data.total
                      ? Math.round(
                          data.present /
                          data.total *
                          100
                        )
                      : 0
                  }%"></i>
                </div>

                <b>
                  ${data.present} Present
                </b>

              </div>
            `)
            .join("")

        : `<div class="empty">
             কোনো employee data নেই
           </div>`;
  }
}

/* =========================
   EMPLOYEES
========================= */

function renderEmployees() {

  const search =
    ($("eq")?.value || "")
      .trim()
      .toLowerCase();

  const list =
    db.employees.filter(employee => {

      const text = [
        employee.name,
        employee.id,
        employee.designation,
        employee.section
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });

  $("count").textContent =
    db.employees.length;

  const table =
    $("empTable");

  if (!table) return;

  if (!list.length) {

    table.innerHTML =
      `<div class="empty-table">
         কোনো employee পাওয়া যায়নি।
       </div>`;

    return;
  }

  table.innerHTML = `
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

          ${list.map(employee => `
            <tr>

              <td>
                ${esc(employee.id)}
              </td>

              <td>
                <b>
                  ${esc(employee.name)}
                </b>
              </td>

              <td>
                ${esc(employee.designation || "-")}
              </td>

              <td>
                ${esc(employee.section || "-")}
              </td>

              <td>
                ${esc(employee.joining || "-")}
              </td>

              <td>
                ৳${Number(
                  employee.salary || 0
                ).toLocaleString()}
              </td>

            </tr>
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}

/* =========================
   EMPLOYEE FORM
========================= */

$("openEmp")?.addEventListener(
  "click",
  () => {
    $("empForm")?.classList.remove("hidden");

    $("en")?.focus();
  }
);

$("cancelEmp")?.addEventListener(
  "click",
  () => {
    $("empForm")?.classList.add("hidden");
  }
);

$("saveEmp")?.addEventListener(
  "click",
  () => {

    const name =
      $("en").value.trim();

    const id =
      $("ei").value.trim();

    const designation =
      $("ed").value.trim();

    const section =
      $("es").value.trim();

    const joining =
      $("ej").value;

    const salary =
      Number($("em").value || 0);

    if (!name || !id) {
      toast("নাম ও Employee ID দিন");
      return;
    }

    if (
      db.employees.some(
        employee => employee.id === id
      )
    ) {
      toast(
        "এই Employee ID আগে থেকেই আছে"
      );
      return;
    }

    db.employees.push({
      id,
      name,
      designation:
        designation || "-",
      section:
        section || "Other",
      joining,
      salary
    });

    save();

    [
      "en",
      "ei",
      "ed",
      "es",
      "ej",
      "em"
    ].forEach(id => {
      if ($(id)) {
        $(id).value = "";
      }
    });

    $("empForm")
      ?.classList.add("hidden");

    renderAll();

    toast(
      "Employee যোগ হয়েছে ✓"
    );
  }
);

$("eq")?.addEventListener(
  "input",
  renderEmployees
);

/* =========================
   ATTENDANCE
========================= */

if ($("ad")) {
  $("ad").value = today();
}

function renderAttendance() {

  const date =
    $("ad")?.value || today();

  const attendance =
    db.attendance[date] || {};

  const search =
    ($("aq")?.value || "")
      .trim()
      .toLowerCase();

  const list =
    db.employees.filter(employee => {

      const text = [
        employee.name,
        employee.id,
        employee.designation,
        employee.section
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });

  const table =
    $("attTable");

  if (!table) return;

  if (!list.length) {

    table.innerHTML =
      `<div class="empty-table">
         কোনো employee নেই।
         আগে Employees থেকে কর্মী যোগ করুন।
       </div>`;

    return;
  }

  table.innerHTML = `
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

          ${list.map(employee => {

            const status =
              attendance[employee.id] || "";

            return `
              <tr>

                <td>
                  ${esc(employee.id)}
                </td>

                <td>
                  <b>
                    ${esc(employee.name)}
                  </b>
                </td>

                <td>
                  ${esc(
                    employee.designation || "-"
                  )}
                </td>

                <td>
                  ${esc(
                    employee.section || "-"
                  )}
                </td>

                <td>

                  <select
                    class="status-select"
                    data-att-id="${esc(employee.id)}">

                    <option
                      value=""
                      ${status === ""
                        ? "selected"
                        : ""}>
                      Not Marked
                    </option>

                    <option
                      value="present"
                      ${status === "present"
                        ? "selected"
                        : ""}>
                      ✓ Present
                    </option>

                    <option
                      value="absent"
                      ${status === "absent"
                        ? "selected"
                        : ""}>
                      × Absent
                    </option>

                  </select>

                </td>

              </tr>
            `;
          }).join("")}

        </tbody>

      </table>

    </div>
  `;
}

$("ad")?.addEventListener(
  "change",
  renderAttendance
);

$("aq")?.addEventListener(
  "input",
  renderAttendance
);

function setAllAttendance(status) {

  const date =
    $("ad")?.value || today();

  if (!db.attendance[date]) {
    db.attendance[date] = {};
  }

  db.employees.forEach(employee => {
    db.attendance[date][employee.id] =
      status;
  });

  save();

  renderAll();

  toast(
    status === "present"
      ? "সবাই Present করা হয়েছে ✓"
      : "সবাই Absent করা হয়েছে"
  );
}

$("allP")?.addEventListener(
  "click",
  () => setAllAttendance("present")
);

$("allA")?.addEventListener(
  "click",
  () => setAllAttendance("absent")
);

$("saveA")?.addEventListener(
  "click",
  () => {

    const date =
      $("ad")?.value || today();

    if (!db.attendance[date]) {
      db.attendance[date] = {};
    }

    document
      .querySelectorAll("[data-att-id]")
      .forEach(select => {

        const id =
          select.dataset.attId;

        if (select.value) {
          db.attendance[date][id] =
            select.value;
        } else {
          delete db.attendance[date][id];
        }

      });

    save();

    renderAll();

    toast(
      "Attendance saved ✓"
    );
  }
);

/* =========================
   SALARY
========================= */

if ($("sm")) {
  $("sm").value = monthNow();
}

function renderSalary() {

  const month =
    $("sm")?.value || monthNow();

  const count = {};

  db.employees.forEach(employee => {
    count[employee.id] = {
      present: 0,
      absent: 0
    };
  });

  Object.entries(
    db.attendance
  ).forEach(([date, records]) => {

    if (!date.startsWith(month)) {
      return;
    }

    Object.entries(records)
      .forEach(([id, status]) => {

        if (!count[id]) return;

        if (status === "present") {
          count[id].present++;
        }

        if (status === "absent") {
          count[id].absent++;
        }

      });
  });

  const table =
    $("salTable");

  if (!table) return;

  if (!db.employees.length) {

    table.innerHTML =
      `<div class="empty-table">
         কোনো employee নেই।
       </div>`;

    return;
  }

  table.innerHTML = `
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

          ${db.employees.map(employee => `
            <tr>

              <td>
                ${esc(employee.id)}
              </td>

              <td>
                <b>
                  ${esc(employee.name)}
                </b>
              </td>

              <td>
                ${esc(employee.section || "-")}
              </td>

              <td>
                ৳${Number(
                  employee.salary || 0
                ).toLocaleString()}
              </td>

              <td>
                ${count[employee.id].present}
              </td>

              <td>
                ${count[employee.id].absent}
              </td>

            </tr>
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}

$("sm")?.addEventListener(
  "change",
  renderSalary
);

/* =========================
   STOCK
========================= */

$("openStock")?.addEventListener(
  "click",
  () => {
    $("stockForm")
      ?.classList.remove("hidden");
  }
);

$("cancelStock")?.addEventListener(
  "click",
  () => {
    $("stockForm")
      ?.classList.add("hidden");
  }
);

$("saveStock")?.addEventListener(
  "click",
  () => {

    const name =
      $("sn").value.trim();

    const qty =
      Number($("sq").value || 0);

    const unit =
      $("su").value.trim() || "pcs";

    const limit =
      Number($("sl").value || 0);

    if (!name) {
      toast("মালের নাম দিন");
      return;
    }

    if (qty < 0 || limit < 0) {
      toast("Quantity ঠিকভাবে দিন");
      return;
    }

    if (
      db.stock.some(
        item =>
          item.name.toLowerCase() ===
          name.toLowerCase()
      )
    ) {
      toast(
        "এই stock item আগে থেকেই আছে"
      );
      return;
    }

    db.stock.push({
      id: Date.now(),
      name,
      qty,
      unit,
      limit
    });

    save();

    [
      "sn",
      "sq",
      "su",
      "sl"
    ].forEach(id => {
      if ($(id)) {
        $(id).value = "";
      }
    });

    $("stockForm")
      ?.classList.add("hidden");

    renderAll();

    toast(
      "Stock item যোগ হয়েছে ✓"
    );
  }
);

function renderStock() {

  const search =
    ($("sqry")?.value || "")
      .trim()
      .toLowerCase();

  const list =
    db.stock.filter(item =>
      item.name
        .toLowerCase()
        .includes(search)
    );

  const table =
    $("stockTable");

  if (!table) return;

  if (!list.length) {

    table.innerHTML =
      `<div class="empty-table">
         কোনো stock item নেই।
       </div>`;

  } else {

    table.innerHTML = `
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

            ${list.map(item => {

              const low =
                Number(item.qty) <=
                Number(item.limit || 0);

              return `
                <tr>

                  <td>
                    <b>
                      ${esc(item.name)}
                    </b>
                  </td>

                  <td>
                    ${Number(item.qty)}
                  </td>

                  <td>
                    ${esc(
                      item.unit || "pcs"
                    )}
                  </td>

                  <td>
                    ${Number(
                      item.limit || 0
                    )}
                  </td>

                  <td>
                    ${
                      low
                        ? '<span class="red">Low stock</span>'
                        : '<span class="green">OK</span>'
                    }
                  </td>

                </tr>
              `;

            }).join("")}

          </tbody>

        </table>

      </div>
    `;
  }

  const moves =
    $("moves");

  if (!moves) return;

  const recent =
    db.movements
      .slice(-10)
      .reverse();

  moves.innerHTML =
    recent.length

      ? `
        <div class="table-wrap">

          <table class="data-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Qty</th>
              </tr>
            </thead>

            <tbody>

              ${recent.map(move => `
                <tr>

                  <td>
                    ${esc(move.date)}
                  </td>

                  <td>
                    ${esc(move.name)}
                  </td>

                  <td>
                    ${
                      move.type === "in"
                        ? '<span class="green">Stock In</span>'
                        : '<span class="red">Stock Out</span>'
                    }
                  </td>

                  <td>
                    ${Number(move.qty)}
                  </td>

                </tr>
              `).join("")}

            </tbody>

          </table>

        </div>
      `

      : `<div class="empty">
           কোনো movement নেই।
         </div>`;
}

$("sqry")?.addEventListener(
  "input",
  renderStock
);

function moveStock(type) {

  if (!db.stock.length) {
    toast(
      "আগে একটি stock item যোগ করুন"
    );
    return;
  }

  const items =
    db.stock
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} (${item.qty} ${item.unit})`
      )
      .join("\n");

  const choice =
    prompt(
      `কোন item?\n\n${items}\n\nItem number লিখুন:`
    );

  if (choice === null) {
    return;
  }

  const index =
    Number(choice) - 1;

  if (!db.stock[index]) {
    toast("ভুল item number");
    return;
  }

  const quantity =
    Number(
      prompt("Quantity লিখুন:") || 0
    );

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    toast("সঠিক quantity দিন");
    return;
  }

  const item =
    db.stock[index];

  if (
    type === "out" &&
    quantity > Number(item.qty)
  ) {
    toast("এত stock নেই");
    return;
  }

  item.qty =
    Number(item.qty) +
    (
      type === "in"
        ? quantity
        : -quantity
    );

  db.movements.push({
    date: today(),
  
