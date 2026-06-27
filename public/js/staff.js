const staffForm = document.querySelector("#staff-form");
const staffMessage = document.querySelector("#staff-message");
const staffList = document.querySelector("#staff-list");

async function fetchStaff() {
  const response = await fetch("/api/staff");

  if (!response.ok) {
    staffList.innerHTML = `<p class="empty-state">You do not have access to staff accounts.</p>`;
    return;
  }

  const { staff } = await response.json();
  renderStaff(staff);
}

function renderStaff(staff) {
  if (!staff.length) {
    staffList.innerHTML = `<p class="empty-state">No staff accounts yet.</p>`;
    return;
  }

  staffList.innerHTML = staff.map((user) => `
    <article class="student-card">
      <div class="student-main">
        <div>
          <span class="record-id">${user.id}</span>
          <h3>${user.name}</h3>
          <p>${user.email}</p>
        </div>
        <span class="status-badge active">${user.role}</span>
      </div>
      <div class="toolbar-actions">
        <button class="secondary-button" type="button" data-reset-password="${user.id}">Reset password</button>
      </div>
    </article>
  `).join("");
}

staffForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  staffMessage.textContent = "Creating account...";

  const response = await fetch("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(staffForm))),
  });
  const result = await response.json();

  if (!response.ok) {
    staffMessage.textContent = result.message || "Could not create staff account.";
    return;
  }

  staffForm.reset();
  staffMessage.textContent = `${result.user.name} can now sign in.`;
  await fetchStaff();
});

staffList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-reset-password]");

  if (!button) {
    return;
  }

  const password = window.prompt("New password for this staff account");

  if (!password) {
    return;
  }

  await fetch(`/api/staff/${encodeURIComponent(button.dataset.resetPassword)}/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  await fetchStaff();
});

fetchStaff();
