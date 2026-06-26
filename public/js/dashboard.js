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
  applyRoleVisibility(user.role);
  configureSupportLinks(user.role);

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
    .map((action) => `<a href="${action.href}">${action.label}</a>`)
    .join("");

  if (window.amsI18n) {
    window.amsI18n.apply();
  }
}

function applyRoleVisibility(role) {
  document.querySelectorAll("[data-roles]").forEach((element) => {
    const allowedRoles = element.dataset.roles.split(",").map((allowedRole) => allowedRole.trim());
    element.hidden = !allowedRoles.includes(role);
  });
}

function configureSupportLinks(role) {
  const supportPanel = document.querySelector("#support-workflow-panel");
  const supportTitle = document.querySelector("#support-workflow-title");
  const supportLink = document.querySelector("#support-workflow-link");
  const supportModule = document.querySelector("#support-module-card");
  const supportModuleLink = document.querySelector("#support-module-link");

  if (["Administrator", "Teacher"].includes(role)) {
    supportPanel.hidden = false;
    return;
  }

  if (role === "Parent") {
    supportPanel.hidden = false;
    supportTitle.textContent = "Message archive and support";
    supportLink.textContent = "Open parent messages";
    supportLink.href = "/parent-portal";
    supportModuleLink.textContent = "Open messages";
    supportModuleLink.href = "/parent-portal";
    return;
  }

  supportPanel.hidden = true;
  supportModule.hidden = true;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadDashboard);
} else {
  loadDashboard();
}
