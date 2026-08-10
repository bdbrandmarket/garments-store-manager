const KEY = "bd_brand_market_v3";

const today = () => new Date().toISOString().slice(0, 10);
const monthNow = () => new Date().toISOString().slice(0, 7);

const blankDB = {
  employees: [],
  attendance: {},
  stock: [],
  movements: []
};

let db = loadDB();

function loadDB() {
  try {
    const old = localStorage.getItem("bd_brand_market_v2");
    const current = localStorage.getItem(KEY);
    const data = JSON.parse(current || old || "null");

    if (!data) return structuredClone(blankDB);

    return {
      employees: Array.isArray(data.employees) ? data.employees : [],
      attendance: data.attendance || {},
      stock: Array.isArray(data.stock) ? data.stock : [],
      movements: Array.isArray(data.movements) ? data.movements : []
    };
  } catch {
    return structuredClone(blankDB);
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2200);
}

const titles = {
  dashboard: "Dashboard",
  employees: "Employees",
  attendance: "Attendance",
  salary: "Salary Report",
  stock: "Store / Stock",
  reports: "Reports"
};

function go(page) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.toggle("active", p.id === page);
  });

  document.querySelectorAll(".nav").forEach(n => {
    n.classList.toggle("active", n.dataset.page === page);
  });

  const title = document.getElementById("title");
  if (title) title.textContent = titles[page] || "Dashboard";

  document.querySelector(".sidebar")?.classList.remove("open");
  document.getElementById("backdrop")?.classList.remove("show");

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

  const button = e.target.closest("[data-go]");
  if (button) {
    go(button.dataset.go);
  }
});

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getAttendance(date) {
  if (!db.attendance[date]) {
    db.attendance[date] = {};
  }

  return db.attendance[date];
}

/* =========================
   DASHBOARD
========================= */

function renderDashboard() {
  const date = today();
  const att = db.attendance[date] || {};

  const total = db.employees.length;

  const present = db.employees.filter(
    e => att[e.id] === "present"
  ).length;

  const absent = db.employees.filter(
    e => att[e.id] === "absent"
  ).length;

  const marked = present + absent;

  const rate = total
    ? Math.round((present / total) * 100)
    : 0;

  const low = db.stock.filter(
    s => Number(s.qty) <= Number(s.limit || 0)
  );

  setText("ec", total);
  setText("pc", present);
  setText("ac", absent);
  setText("sc", db.stock.length);

  setText("rate", `${rate}% attendance`);
  setText("lc", `${low.length} low stock`);

  setText("rp", present);
  setText("ra", absent);
  setText("rm", marked);

  const lowBox = document.getElementById("low");

  if (lowBox) {
    lowBox.innerHTML = low.length
      ? low.map(item => `
        <div class="stock-row">
          <span>
            <b>${esc(item.name)}</b>
            <small>${esc(item.unit || "pcs")}</small>
          </span>

          <strong class="red">
            ${Number(item.qty).toLocaleString()}
            ${esc(item.unit || "")}
          </strong>
        </div>
      `).join("")
      : `<div class="empty-table">সব stock ঠিক আছে ✓</div>`;
  }

  const sections = {};

  db.employees.forEach(employee => {
    const section = employee.section || "Other";

    if (!sections[section]) {
      sections[section] = 0;
    }

    if (att[employee.id] === "present") {
      sections[section]++;
    }
  });

  const sectionBox = document.getElementById("sections");

  if (sectionBox) {
    const names = Object.keys(sections);

    sectionBox.innerHTML = names.length
      ? names.map(name => `
        <div class="section-row">
          <span>${esc(name)}</span>
          <b>${sections[name]} Present</b>
        </div>
      `).join("")
      : `<div class="empty-table">কোনো employee data নেই</div>`;
  }
}

/* =========================
   EMPLOYEES
========================= */

function renderEmployees() {
  const search =
    document.getElementById("eq")?.value
      ?.trim()
      .toLowerCase() || "";

  const list = db.employees.filter(employee => {
    const text = [
      employee.name,
      employee.id,
      employee.designation,
      employee.section
    ].join(" ").toLowerCase();

    return text.includes(search);
  });

  setText("count", db.employees.length);

  const box = document.getElementById("empTable");

  if (!box) return;

  if (!list.length) {
    box.innerHTML =
      `<div class="empty-table">কোনো employee পাওয়া যায়নি</div>`;
    return;
  }

  box.innerHTML = `
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
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          ${list.map(employee => `
            <tr>

              <td>${esc(employee.id)}</td>

              <td>
                <b>${esc(employee.name)}</b>
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
                ৳${Number(employee.salary || 0).toLocaleString()}
              </td>

              <td>

                <button
                  class="btn blue"
                  style="padding:7px 10px;font-size:11px"
                  onclick="editEmployee('${esc(employee.id)}')">
                  Edit
                </button>

                <button
                  class="btn redbtn"
                  style="padding:7px 10px;font-size:11px"
                  onclick="deleteEmployee('${esc(employee.id)}')">
                  Delete
                </button>

              </td>

            </tr>
          `).join("")}

        </tbody>

      </table>
    </div>
  `;
}

function clearEmployeeForm() {
  [
    "en",
    "ei",
    "ed",
    "es",
    "ej",
    "em"
  ].forEach(id => {
    const element = document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });

  const form = document.getElementById("empForm");

  if (form) {
    form.classList.add("hidden");
    delete form.dataset.editId;
  }

  const button = document.getElementById("saveEmp");

  if (button) {
    button.textContent = "Save Employee";
  }
}

function editEmployee(id) {
  const employee =
    db.employees.find(e => e.id === id);

  if (!employee) return;

  const form =
    document.getElementById("empForm");

  if (!form) return;

  form.classList.remove("hidden");

  form.dataset.editId = id;

  document.getElementById("en").value =
    employee.name || "";

  document.getElementById("ei").value =
    employee.id || "";

  document.getElementById("ed").value =
    employee.designation || "";

  document.getElementById("es").value =
    employee.section || "";

  document.getElementById("ej").value =
    employee.joining || "";

  document.getElementById("em").value =
    employee.salary || "";

  document.querySelector("#empForm h2").textContent =
    "Employee তথ্য Edit";

  document.getElementById("saveEmp").textContent =
    "Update Employee";

  form.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function deleteEmployee(id) {
  const employee =
    db.employees.find(e => e.id === id);

  if (!employee) return;

  const confirmed = confirm(
    `"${employee.name}" কে Employee List থেকে delete করবেন?`
  );

  if (!confirmed) return;

  db.employees =
    db.employees.filter(e => e.id !== id);

  Object.keys(db.attendance).forEach(date => {
    if (db.attendance[date]) {
      delete db.attendance[date][id];
    }
  });

  save();

  renderAll();

  toast("Employee deleted");
}

function saveEmployee() {
  const name =
    document.getElementById("en").value.trim();

  const id =
    document.getElementById("ei").value.trim();

  const designation =
    document.getElementById("ed").value.trim();

  const section =
    document.getElementById("es").value.trim();

  const joining =
    document.getElementById("ej").value;

  const salary =
    Number(document.getElementById("em").value || 0);

  if (!name || !id) {
    toast("নাম ও Employee ID দিন");
    return;
  }

  const form =
    document.getElementById("empForm");

  const editingId =
    form.dataset.editId || "";

  /* EDIT */

  if (editingId) {
    const employee =
      db.employees.find(e => e.id === editingId);

    if (!employee) return;

    const duplicate =
      db.employees.some(
        e => e.id === id && e.id !== editingId
      );

    if (duplicate) {
      toast("এই Employee ID আগে থেকেই আছে");
      return;
    }

    const oldId = employee.id;

    employee.id = id;
    employee.name = name;
    employee.designation = designation;
    employee.section = section;
    employee.joining = joining;
    employee.salary = salary;

    if (oldId !== id) {
      Object.keys(db.attendance).forEach(date => {

        if (
          db.attendance[date] &&
          db.attendance[date][oldId] !== undefined
        ) {
          db.attendance[date][id] =
            db.attendance[date][oldId];

          delete db.attendance[date][oldId];
        }

      });
    }

    save();

    clearEmployeeForm();

    renderAll();

    toast("Employee updated ✓");

    return;
  }

  /* ADD */

  const duplicate =
    db.employees.some(e => e.id === id);

  if (duplicate) {
    toast("এই Employee ID আগে থেকেই আছে");
    return;
  }

  db.employees.push({
    id,
    name,
    designation,
    section,
    joining,
    salary
  });

  save();

  clearEmployeeForm();

  renderAll();

  toast("Employee added ✓");
}

/* =========================
   ATTENDANCE
========================= */

function renderAttendance() {
  const dateInput =
    document.getElementById("ad");

  if (!dateInput) return;

  if (!dateInput.value) {
    dateInput.value = today();
  }

  const date = dateInput.value;

  const att =
    db.attendance[date] || {};

  const search =
    document.getElementById("aq")
      ?.value
      ?.trim()
      .toLowerCase() || "";

  const list =
    db.employees.filter(employee => {

      const text = [
        employee.name,
        employee.id,
        employee.designation,
        employee.section
      ].join(" ").toLowerCase();

      return text.includes(search);
    });

  const box =
    document.getElementById("attTable");

  if (!box) return;

  if (!list.length) {
    box.innerHTML =
      `<div class="empty-table">কোনো employee নেই</div>`;
    return;
  }

  box.innerHTML = `
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
              att[employee.id] || "";

            return `
              <tr>

                <td>
                  ${esc(employee.id)}
                </td>

                <td>
                  <b>${esc(employee.name)}</b>
                </td>

                <td>
                  ${esc(employee.designation || "-")}
                </td>

                <td>
                  ${esc(employee.section || "-")}
                </td>

                <td>

                  <select
                    class="status-select"
                    data-att-id="${esc(employee.id)}">

                    <option
                      value=""
                      ${status === "" ? "selected" : ""}>
                      Not Marked
                    </option>

                    <option
                      value="present"
                      ${status === "present" ? "selected" : ""}>
                      ✓ Present
                    </option>

                    <option
                      value="absent"
                      ${status === "absent" ? "selected" : ""}>
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

function saveAttendance() {
  const date =
    document.getElementById("ad")?.value ||
    today();

  const att =
    getAttendance(date);

  document.querySelectorAll(
    "[data-att-id]"
  ).forEach(select => {

    const id =
      select.dataset.attId;

    if (select.value) {
      att[id] = select.value;
    } else {
      delete att[id];
    }

  });

  save();

  renderAttendance();
  renderDashboard();

  toast("Attendance saved ✓");
}

function setAllAttendance(status) {
  const date =
    document.getElementById("ad")?.value ||
    today();

  const att =
    getAttendance(date);

  db.employees.forEach(employee => {
    att[employee.id] = status;
  });

  save();

  renderAttendance();
  renderDashboard();

  toast(
    status === "present"
      ? "সবাই Present করা হয়েছে ✓"
      : "সবাই Absent করা হয়েছে"
  );
}

/* =========================
   SALARY
========================= */

function renderSalary() {
  const month =
    document.getElementById("sm")?.value ||
    monthNow();

  const count = {};

  db.employees.forEach(employee => {
    count[employee.id] = {
      present: 0,
      absent: 0
    };
  });

  Object.entries(db.attendance)
    .forEach(([date, records]) => {

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

  const box =
    document.getElementById("salTable");

  if (!box) return;

  if (!db.employees.length) {
    box.innerHTML =
      `<div class="empty-table">কোনো employee নেই</div>`;
    return;
  }

  box.innerHTML = `
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
                <b>${esc(employee.name)}</b>
              </td>

              <td>
                ${esc(employee.section || "-")}
              </td>

              <td>
                ৳${Number(employee.salary || 0).toLocaleString()}
              </td>

              <td class="green">
                ${count[employee.id]?.present || 0}
              </td>

              <td class="red">
                ${count[employee.id]?.absent || 0}
              </td>

            </tr>
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}

/* =========================
   STOCK
========================= */

function renderStock() {
  const search =
    document.getElementById("sqry")
      ?.value
      ?.trim()
      .toLowerCase() || "";

  const list =
    db.stock.filter(item =>
      String(item.name)
        .toLowerCase()
        .includes(search)
    );

  const box =
    document.getElementById("stockTable");

  if (!box) return;

  if (!list.length) {
    box.innerHTML =
      `<div class="empty-table">কোনো stock item নেই</div>`;
  } else {

    box.innerHTML = `
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
                    <b>${esc(item.name)}</b>
                  </td>

                  <td>
                    ${Number(item.qty).toLocaleString()}
                  </td>

                  <td>
                    ${esc(item.unit || "pcs")}
                  </td>

                  <td>
                    ${Number(item.limit || 0).toLocaleString()}
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
    document.getElementById("moves");

  if (!moves) return;

  const recent =
    db.movements.slice(-10).reverse();

  moves.innerHTML = recent.length
    ? `
      <div class="table-wrap">

        <table class="data-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Type</th>
              <th>Quantity</th>
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
                  ${Number(move.qty).toLocaleString()}
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>
    `
    : `<div class="empty-table">কোনো movement নেই</div>`;
}

function saveStock() {
  const name =
    document.getElementById("sn")
      ?.value
      ?.trim();

  const qty =
    Number(document.getElementById("sq")?.value || 0);

  const unit =
    document.getElementById("su")
      ?.value
      ?.trim() || "pcs";

  const limit =
    Number(document.getElementById("sl")?.value || 0);

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
    toast("এই item আগে থেকেই আছে");
    return;
  }

  db.stock.push({
    id: Date.now().toString(),
    name,
    qty,
    unit,
    limit
  });

  save();

  ["sn", "sq", "su", "sl"]
    .forEach(id => {
      const el =
        document.getElementById(id);

      if (el) el.value = "";
    });

  document
    .getElementById("stockForm")
    ?.classList.add("hidden");

  renderStock();
  renderDashboard();

  toast("Stock item saved ✓
