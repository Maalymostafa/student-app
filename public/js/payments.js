const paymentSummary = document.querySelector("#payment-summary");
const paymentList = document.querySelector("#payment-list");
const paymentForm = document.querySelector("#payment-form");
const paymentAlert = document.querySelector("#payment-alert");
const paymentMessage = document.querySelector("#payment-message");
const paymentStudentCode = document.querySelector("#payment-student-code");
const paymentStatusCode = document.querySelector("#payment-status-code");
const paymentStatusTitle = document.querySelector("#payment-status-title");
const paymentStatusMessage = document.querySelector("#payment-status-message");
const paymentStatusBadge = document.querySelector("#payment-status-badge");
const paymentStatusDetails = document.querySelector("#payment-status-details");
const studentCodeInput = document.querySelector("#studentCode");
const paymentStudentPicker = document.querySelector("#payment-student-picker");
const paymentOcrPanel = document.querySelector("#payment-ocr-panel");
const paymentOcrForm = document.querySelector("#payment-ocr-form");
const paymentOcrMessage = document.querySelector("#payment-ocr-message");
const paymentOcrRulesList = document.querySelector("#payment-ocr-rules-list");
const archiveOcrRuleButton = document.querySelector("#archive-ocr-rule");
const newOcrRuleButton = document.querySelector("#new-ocr-rule");
let currentUser = null;
let linkedChildren = [];
let paymentOcrRules = [];

async function fetchPayments() {
  const params = new URLSearchParams(window.location.search);
  const studentCode = params.get("studentCode") || "";
  studentCodeInput.value = studentCode;
  const query = studentCode ? `?${new URLSearchParams({ studentCode }).toString()}` : "";
  const response = await fetch(`/api/payments${query}`);

  if (!response.ok) {
    paymentList.innerHTML = `<p class="empty-state">You do not have access to payments.</p>`;
    return;
  }

  const { payments, summary, studentStatus, children, user } = await response.json();
  currentUser = user;
  linkedChildren = children || [];
  paymentOcrPanel.hidden = !currentUser || currentUser.role !== "Administrator";
  if (currentUser && currentUser.role === "Administrator") {
    await fetchOcrRules();
  }
  renderStudentPicker(linkedChildren, studentStatus);
  renderStudentStatus(studentStatus);
  renderSummary(summary, payments, user, studentStatus);
  renderPayments(payments);
}

function renderStudentPicker(children, studentStatus) {
  if (!children.length) {
    paymentStudentPicker.hidden = true;
    return;
  }

  paymentStudentPicker.hidden = false;
  studentCodeInput.innerHTML = children
    .map((child) => `
      <option value="${child.studentCode}" ${child.studentCode === studentStatus.studentCode ? "selected" : ""}>
        ${child.studentName} - ${child.studentCode}
      </option>
    `)
    .join("");
}

function renderStudentStatus(status) {
  paymentStatusCode.textContent = status.studentCode || "Student account";
  paymentStatusTitle.textContent = status.studentName || "Student status";
  paymentStatusMessage.textContent = status.message || "";
  paymentStatusBadge.textContent = status.accountStatus || "Unknown";
  paymentStatusBadge.className = `status-badge ${statusClass(status.accountStatus)}`;
  paymentStatusDetails.innerHTML = `
    <div>
      <dt>Current state</dt>
      <dd>${status.accountStatus || "Unknown"}</dd>
    </div>
    <div>
      <dt>Reservation</dt>
      <dd>${status.reservationStatus || "Not recorded"}</dd>
    </div>
    <div>
      <dt>Payment review</dt>
      <dd>${status.paymentStatus || "Not recorded"}</dd>
    </div>
    <div>
      <dt>Grade</dt>
      <dd>${status.schoolGrade || "Not set"}</dd>
    </div>
  `;
}

function renderSummary(summary, payments, user, studentStatus) {
  const code = studentStatus && studentStatus.studentCode
    ? studentStatus.studentCode
    : payments[0] ? payments[0].studentCode : user.id;
  paymentStudentCode.textContent = code;
  paymentSummary.innerHTML = `
    <div>
      <dt>Required</dt>
      <dd>${formatMoney(summary.required)}</dd>
    </div>
    <div>
      <dt>Verified paid</dt>
      <dd>${formatMoney(summary.verifiedPaid)}</dd>
    </div>
    <div>
      <dt>Pending review</dt>
      <dd>${formatMoney(summary.pendingPaid)}</dd>
    </div>
    <div>
      <dt>Remaining</dt>
      <dd>${formatMoney(summary.remaining)}</dd>
    </div>
  `;
}

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "active") {
    return "active";
  }

  if (normalized.includes("required") || normalized.includes("pending")) {
    return "pending";
  }

  if (normalized.includes("waiting")) {
    return "in-progress";
  }

  if (normalized.includes("rejected")) {
    return "rejected";
  }

  return "pending";
}

function renderPayments(payments) {
  if (!payments.length) {
    paymentList.innerHTML = `<p class="empty-state">No payment submissions yet.</p>`;
    return;
  }

  paymentList.innerHTML = payments.map((payment) => `
    <article class="student-card">
      <div class="student-main">
        <div>
          <span class="record-id">${payment.id} - ${payment.studentCode}</span>
          <h3>${payment.paymentType}</h3>
          <p>${payment.studentName} - ${payment.schoolGrade || "Grade not set"}</p>
        </div>
        <span class="status-badge ${payment.status.toLowerCase().replaceAll(" ", "-")}">${payment.status}</span>
      </div>
      <dl class="record-details">
        <div>
          <dt>Required</dt>
          <dd>${formatMoney(payment.requiredAmount)}</dd>
        </div>
        <div>
          <dt>Paid</dt>
          <dd>${formatMoney(payment.paidAmount)}</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>${formatMoney(payment.remainingAmount)}</dd>
        </div>
        <div>
          <dt>Transfer date</dt>
          <dd>${payment.transferDate}</dd>
        </div>
        <div>
          <dt>Transfer time</dt>
          <dd>${payment.transferTime}</dd>
        </div>
        <div>
          <dt>Sent from</dt>
          <dd>${payment.transferPhone}</dd>
        </div>
        <div>
          <dt>Refund phone</dt>
          <dd>${payment.refundPhone}</dd>
        </div>
      </dl>
      <div class="payment-proof-viewer">
        <img src="${payment.paymentProofUrl}" alt="Payment proof for ${payment.studentName}" />
      </div>
      ${payment.adminNotes ? `<p class="student-note">${payment.adminNotes}</p>` : ""}
      ${renderOcrReview(payment)}
      ${currentUser && currentUser.role === "Administrator" ? `
        <div class="toolbar-actions">
          <button class="secondary-button" type="button" data-analyze-payment="${payment.id}">Analyze photo</button>
          <button class="secondary-button" type="button" data-review-payment="${payment.id}" data-status="Verified">Verify</button>
          <button class="secondary-button" type="button" data-review-payment="${payment.id}" data-status="Rejected">Reject</button>
        </div>
      ` : ""}
    </article>
  `).join("");
}

function renderOcrReview(payment) {
  if (!payment.ocrReviewJson) {
    return currentUser && currentUser.role === "Administrator"
      ? `<div class="ocr-review empty">No automatic image check yet.</div>`
      : "";
  }

  let review = null;

  try {
    review = JSON.parse(payment.ocrReviewJson);
  } catch (error) {
    review = null;
  }

  if (!review || !Array.isArray(review.checks)) {
    return `<div class="ocr-review empty">Automatic image check could not be displayed.</div>`;
  }

  return `
    <div class="ocr-review ${review.passed ? "passed" : "needs-review"}">
      <div class="student-main">
        <div>
          <span class="record-id">Auto image check</span>
          <h3>${review.passed ? "Looks ready to verify" : "Needs human review"}</h3>
        </div>
        <span class="status-badge ${review.passed ? "active" : "pending"}">${review.passed ? "Matched" : "Check"}</span>
      </div>
      <ul class="ocr-check-list">
        ${review.checks.map((check) => `
          <li class="${check.passed ? "passed" : "failed"}">
            <span>${check.passed ? "✓" : "!"}</span>
            <div>
              <strong>${check.label}</strong>
              <small>${check.details || ""}</small>
            </div>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString()} EGP`;
}

function getOcrCriteria() {
  return Object.fromEntries(new FormData(paymentOcrForm).entries());
}

function fillOcrForm(criteria) {
  if (!paymentOcrForm) {
    return;
  }

  Object.entries(criteria).forEach(([key, value]) => {
    const field = paymentOcrForm.elements[key];

    if (field) {
      field.value = value;
    }
  });
}

paymentOcrForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveOcrRule();
});

async function saveOcrRule() {
  paymentOcrMessage.textContent = "Saving month rules.";

  const response = await fetch("/api/payment-ocr-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getOcrCriteria()),
  });

  if (!response.ok) {
    paymentOcrMessage.textContent = "Could not save these rules.";
    return;
  }

  const result = await response.json();
  paymentOcrRules = result.rules || [];
  fillOcrForm(result.rule);
  renderOcrRules(paymentOcrRules);
  paymentOcrMessage.textContent = result.rule.status === "Active"
    ? "Saved as the active rules for current payments."
    : "Saved in the archive.";
}

async function fetchOcrRules() {
  const response = await fetch("/api/payment-ocr-rules");

  if (!response.ok) {
    paymentOcrRulesList.innerHTML = `<p class="empty-state">Could not load payment checking rules.</p>`;
    return;
  }

  const result = await response.json();
  paymentOcrRules = result.rules || [];
  renderOcrRules(paymentOcrRules);

  if (result.activeRule) {
    fillOcrForm(result.activeRule);
    return;
  }

  if (!paymentOcrForm.elements.title.value) {
    resetOcrForm();
  }
}

function renderOcrRules(rules) {
  if (!rules.length) {
    paymentOcrRulesList.innerHTML = `<p class="empty-state">No saved month rules yet.</p>`;
    return;
  }

  paymentOcrRulesList.innerHTML = rules.map((rule) => `
    <article class="ocr-rule-card ${rule.status === "Active" ? "active" : "archived"}">
      <div>
        <span class="record-id">${rule.id}</span>
        <h3>${rule.title}</h3>
        <p>${rule.dateFrom || "No start date"} to ${rule.dateTo || "No end date"}</p>
      </div>
      <div class="toolbar-actions">
        <span class="status-badge ${rule.status === "Active" ? "active" : "pending"}">${rule.status}</span>
        <button class="secondary-button" type="button" data-load-ocr-rule="${rule.id}">Open</button>
      </div>
    </article>
  `).join("");
}

function resetOcrForm() {
  paymentOcrForm.reset();
  paymentOcrForm.elements.id.value = "";
  paymentOcrForm.elements.createdAt.value = "";
  paymentOcrForm.elements.status.value = "Active";
  paymentOcrForm.elements.title.value = `${new Date().toLocaleString("en", { month: "long", year: "numeric" })} payment rules`;
  paymentOcrMessage.textContent = "";
}

archiveOcrRuleButton.addEventListener("click", async () => {
  const ruleId = paymentOcrForm.elements.id.value;

  if (!ruleId) {
    paymentOcrMessage.textContent = "Choose a saved rule first.";
    return;
  }

  await fetch(`/api/payment-ocr-rules/${ruleId}/archive`, { method: "PATCH" });
  paymentOcrMessage.textContent = "Rule archived.";
  await fetchOcrRules();
});

newOcrRuleButton.addEventListener("click", resetOcrForm);

paymentOcrRulesList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-load-ocr-rule]");

  if (!button) {
    return;
  }

  const rule = paymentOcrRules.find((item) => item.id === button.dataset.loadOcrRule);

  if (!rule) {
    return;
  }

  fillOcrForm(rule);
  paymentOcrMessage.textContent = rule.status === "Active"
    ? "This is the current active rule."
    : "This is archived. Change status to Active and save if you want to use it again.";
});

paymentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  paymentAlert.hidden = true;
  paymentMessage.textContent = "Submitting payment.";

  const response = await fetch("/api/payments", {
    method: "POST",
    body: new FormData(paymentForm),
  });
  const result = await response.json();

  if (!response.ok) {
    paymentAlert.hidden = false;
    paymentAlert.textContent = result.message || "Payment could not be submitted.";
    paymentMessage.textContent = "";
    return;
  }

  paymentForm.reset();
  paymentMessage.textContent = `Payment ${result.payment.id} submitted for review.`;
  await fetchPayments();
});

studentCodeInput.addEventListener("change", () => {
  if (!studentCodeInput.value) {
    return;
  }

  window.location.href = `/payments?${new URLSearchParams({ studentCode: studentCodeInput.value }).toString()}`;
});

paymentList.addEventListener("click", async (event) => {
  const analyzeButton = event.target.closest("[data-analyze-payment]");

  if (analyzeButton) {
    analyzeButton.disabled = true;
    analyzeButton.textContent = "Reading image...";

    const response = await fetch(`/api/payments/${analyzeButton.dataset.analyzePayment}/analyze-proof`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getOcrCriteria()),
    });

    if (!response.ok) {
      analyzeButton.disabled = false;
      analyzeButton.textContent = "Analyze photo";
      window.alert("Could not read this image. Please review it manually.");
      return;
    }

    await fetchPayments();
    return;
  }

  const button = event.target.closest("[data-review-payment]");

  if (!button) {
    return;
  }

  const adminNotes = window.prompt("Review note") || "";
  await fetch(`/api/payments/${button.dataset.reviewPayment}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: button.dataset.status,
      adminNotes,
    }),
  });
  await fetchPayments();
});

fetchPayments();
