async function loadDashboard() {
  const response = await fetch("/api/dashboard");

  if (!response.ok) {
    window.location.href = "/login";
    return;
  }

  const { user, dashboard } = await response.json();

  document.querySelector("#user-role").textContent = `${user.role} - ${user.name}`;
  document.querySelector("#dashboard-title").textContent = dashboard.headline;
  document.querySelector("#dashboard-intro").textContent = dashboard.intro;

  const metricGrid = document.querySelector("#metric-grid");
  metricGrid.innerHTML = dashboard.metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <span>${metric.label}</span>
          <strong>${metric.value}</strong>
        </article>
      `
    )
    .join("");

  const actionList = document.querySelector("#action-list");
  actionList.innerHTML = dashboard.actions
    .map((action) => `<button type="button">${action}</button>`)
    .join("");
}

loadDashboard();
