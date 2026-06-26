  const response = await fetch("/api/dashboard");

  if (!response.ok) {
    window.location.href = "/login";
    return;
  }

  const { user, dashboard } = await response.json();

  document.querySelector("#user-role").textContent = `${user.role} - ${user.name}`;
  document.querySelector("#dashboard-title").textContent = dashboard.headline;
  document.querySelector("#dashboard-intro").textContent = dashboard.intro;
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

  if (i18n && typeof i18n.applyLanguage === 'function') {
    i18n.applyLanguage();
  }
}

function configureSupportLinks(role) {
  const supportPanel = document.querySelector("#support-workflow-panel");
  const supportTitle = document.querySelector("#support-workflow-title");
  const supportLink = document.querySelector("#support-workflow-link");
  const supportModule = document.querySelector("#support-module-card");
  const supportModuleLink = document.querySelector("#support-module-link");

  if (["Administrator", "Teacher"].includes(role)) {
    return;
  }

  if (role === "Parent") {
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

// Initialize i18n first
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  // Initialize language system
  i18n.init();
  
  const currentLang = localStorage.getItem('language') || 'en';
  
  // Set active button
  const langButtons = document.querySelectorAll('.lang-btn');
  if (langButtons.length > 0) {
    langButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.lang === currentLang) {
        btn.classList.add('active');
      }
    });

    // Add click handlers
    langButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = btn.dataset.lang;
        
        // Update buttons
        langButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Set language
        i18n.currentLang = lang;
        localStorage.setItem('language', lang);
        i18n.applyLanguage();
      });
    });
  }
  
  // Continue with dashboard loading
  loadDashboard();
}

async function loadDashboard() {
