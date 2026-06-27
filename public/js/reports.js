const reportMonth = document.querySelector("#report-month");
const reportMetrics = document.querySelector("#report-metrics");
const paymentBars = document.querySelector("#payment-bars");
const paymentTypes = document.querySelector("#payment-types");
const attendanceBars = document.querySelector("#attendance-bars");
const gradeBars = document.querySelector("#grade-bars");
const rewardList = document.querySelector("#reward-list");
const assistantList = document.querySelector("#assistant-list");
const supportBars = document.querySelector("#support-bars");
const supportAssignees = document.querySelector("#support-assignees");
const expenseForm = document.querySelector("#expense-form");
const expenseMessage = document.querySelector("#expense-message");
const expenseList = document.querySelector("#expense-list");

reportMonth.value = new Date().toISOString().slice(0, 7);

async function fetchReports() {
  const response = await fetch(`/api/reports?${new URLSearchParams({ month: reportMonth.value }).toString()}`);

  if (!response.ok) {
    reportMetrics.innerHTML = `<p class="empty-state">You do not have access to reports.</p>`;
    return;
  }

  const { reports } = await response.json();
  renderReports(reports);
}

function renderReports(reports) {
  reportMetrics.innerHTML = [
    ["Gross income", formatMoney(reports.overview.grossIncome)],
    ["Net after wages/expenses", formatMoney(reports.overview.netIncome)],
    ["Renewed this month", reports.overview.renewedCount],
    ["Did not renew", reports.overview.notRenewedCount],
    ["Open support", reports.overview.supportOpen],
    ["Prize candidates", reports.overview.prizeEligible],
  ].map(([label, value]) => `
    <article class="metric-card">
      <span>${label}</span>
      <strong data-count-up="${String(value).replace(/[^0-9.-]/g, "") || 0}" data-count-suffix="${String(value).replace(/[0-9,.-]/g, "")}">0</strong>
    </article>
  `).join("");
  animateCounters();

  renderBars(paymentBars, reports.payments.statusBars);
  renderBars(attendanceBars, reports.attendance.bars);
  renderBars(gradeBars, reports.grades.buckets);
  renderBars(supportBars, reports.support.byCategory);
  renderSmallList(paymentTypes, reports.payments.byType, "No payment types this month.");
  renderRewards(rewardList, reports.grades.rewards);
  renderAssistants(assistantList, reports.assistants);
  renderSmallList(supportAssignees, reports.support.byAssignee, "No support assignments yet.");
  renderExpenses(reports.expenses);
}

function renderBars(container, rows) {
  const max = Math.max(...rows.map((row) => Number(row.value || 0)), 1);
  container.innerHTML = rows.map((row) => `
    <div class="report-bar-row">
      <span>${row.label}</span>
      <div class="report-bar-track">
        <div class="report-bar-fill" data-bar-width="${(Number(row.value || 0) / max) * 100}"></div>
      </div>
      <strong>${row.value}</strong>
    </div>
  `).join("");
  requestAnimationFrame(() => {
    container.querySelectorAll("[data-bar-width]").forEach((bar) => {
      bar.style.width = `${bar.dataset.barWidth}%`;
    });
  });
}

function renderSmallList(container, rows, emptyText) {
  if (!rows.length) {
    container.innerHTML = `<p class="empty-state">${emptyText}</p>`;
    return;
  }

  container.innerHTML = rows.map((row) => `
    <article class="kid-question-card">
      <span>${row.label}</span>
      <strong>${row.value}</strong>
    </article>
  `).join("");
}

function renderRewards(container, rewards) {
  if (!rewards.length) {
    container.innerHTML = `<p class="empty-state">No students at 97-100 yet.</p>`;
    return;
  }

  container.innerHTML = rewards.map((reward) => `
    <article class="kid-question-card">
      <span>${reward.studentCode} - ${reward.schoolGrade}</span>
      <strong>${reward.total}/100</strong>
      <p>${reward.studentName}</p>
      <p>Prize phone: ${reward.prizePhone || "Not recorded"}</p>
    </article>
  `).join("");
}

function renderAssistants(container, assistants) {
  if (!assistants.length) {
    container.innerHTML = `<p class="empty-state">No assistant correction data yet.</p>`;
    return;
  }

  container.innerHTML = assistants.map((assistant) => `
    <article class="kid-question-card">
      <span>${assistant.name}</span>
      <strong>${assistant.corrected} corrected / ${assistant.pending} pending</strong>
      <p>Average question score: ${assistant.averageQuestionScore}</p>
    </article>
  `).join("");
}

function renderExpenses(expenses) {
  if (!expenses.length) {
    expenseList.innerHTML = `<p class="empty-state">No wages or expenses recorded this month.</p>`;
    return;
  }

  expenseList.innerHTML = expenses.map((expense) => `
    <article class="kid-question-card">
      <span>${expense.category} - ${expense.expenseDate}</span>
      <strong>${formatMoney(expense.amount)}</strong>
      <p>${expense.title}</p>
      <p>${expense.notes || ""}</p>
    </article>
  `).join("");
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString()} EGP`;
}

function animateCounters() {
  const counters = document.querySelectorAll("[data-count-up]");

  counters.forEach((counter) => {
    const target = Number(counter.dataset.countUp || 0);
    const suffix = counter.dataset.countSuffix || "";
    const duration = 800;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      counter.textContent = `${Math.round(value).toLocaleString()}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  });
}

expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  expenseMessage.textContent = "Saving expense...";

  const response = await fetch("/api/reports/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(expenseForm))),
  });
  const result = await response.json();

  if (!response.ok) {
    expenseMessage.textContent = result.message || "Could not save expense.";
    return;
  }

  expenseForm.reset();
  expenseMessage.textContent = `${result.expense.title} saved.`;
  await fetchReports();
});

reportMonth.addEventListener("change", fetchReports);
fetchReports();
