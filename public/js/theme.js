const themeOptions = [
  { value: "bright", label: "Bright" },
  { value: "calm", label: "Calm" },
  { value: "focus", label: "Dark" },
  { value: "girly", label: "Girly" },
];

const savedTheme = localStorage.getItem("ams-theme") || "bright";
document.documentElement.dataset.theme = savedTheme;

function buildBrandLogo() {
  if (document.querySelector(".brand-logo-mark")) {
    return;
  }

  const authIntro = document.querySelector(".auth-panel > div:first-child");

  if (authIntro) {
    const logo = createBrandLogo();
    logo.classList.add("auth-logo-mark");
    authIntro.prepend(logo);
    return;
  }

  if (document.querySelector(".topbar")) {
    buildAppNavbar();
  }
}

function createBrandLogo() {
  const logo = document.createElement("a");
  logo.className = "brand-logo-mark";
  logo.href = "/dashboard";
  logo.setAttribute("aria-label", "Hoda Ismail Math home");
  logo.innerHTML = `
    <span class="brand-logo-shine"></span>
    <img src="/images/hoda-ismail-math-logo.jpeg" alt="Hoda Ismail Math" />
  `;

  return logo;
}

function buildAppNavbar() {
  if (document.querySelector("#ams-app-navbar")) {
    return;
  }

  const nav = document.createElement("nav");
  nav.className = "app-navbar";
  nav.id = "ams-app-navbar";
  nav.setAttribute("aria-label", "Main navigation");
  nav.innerHTML = `
    <div class="app-navbar-inner">
      <a class="app-navbar-brand" href="/dashboard" aria-label="Hoda Ismail Math dashboard">
        <span class="brand-logo-shine"></span>
        <img src="/images/hoda-ismail-math-logo.jpeg" alt="Hoda Ismail Math" />
      </a>
      <details class="app-navbar-menu">
        <summary>Menu</summary>
        <div class="app-navbar-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/notifications">Notifications</a>
          <a href="/support">Support</a>
          <a href="/feedback">Feedback</a>
          <a href="/payments">Payments</a>
          <a href="/my-results">Results</a>
        </div>
      </details>
      <div class="app-navbar-actions">
        <a href="/account">Account</a>
        <form action="/logout" method="post">
          <button type="submit">Logout</button>
        </form>
      </div>
    </div>
  `;

  document.body.prepend(nav);
  placeFloatingTools();

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      const menu = nav.querySelector(".app-navbar-menu");
      if (menu) {
        menu.open = false;
      }
    }
  });
}

function buildThemeSwitcher() {
  const tools = getFloatingTools();

  if (!document.querySelector("#ams-theme-switcher")) {
    tools.insertAdjacentHTML("beforeend", `
      <details class="floating-tool" id="ams-theme-switcher">
      <summary aria-label="Style"><span class="tool-icon">S</span><span class="tool-label">Style</span></summary>
      <select aria-label="Choose visual style">
        ${themeOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
      </select>
      </details>
    `);
  }

  if (!document.querySelector("#ams-help-launcher")) {
    tools.insertAdjacentHTML("beforeend", `
      <details class="floating-tool" id="ams-help-launcher">
      <summary aria-label="Help"><span class="tool-icon">?</span><span class="tool-label">Help</span></summary>
      <div class="help-launcher-menu">
        <a href="/support">Help</a>
        <a href="/feedback?from=${encodeURIComponent(window.location.pathname)}">Feedback</a>
        <a href="/notifications">Messages</a>
      </div>
      </details>
    `);
  }

  const select = tools.querySelector("#ams-theme-switcher select");
  select.value = document.documentElement.dataset.theme;
  select.addEventListener("change", () => {
    document.documentElement.dataset.theme = select.value;
    localStorage.setItem("ams-theme", select.value);
  });

  document.addEventListener("click", (event) => {
    if (!tools.contains(event.target)) {
      tools.querySelectorAll("details").forEach((details) => {
        details.open = false;
      });
    }
  });

  tools.querySelectorAll("details").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) {
        return;
      }

      tools.querySelectorAll("details").forEach((otherDetails) => {
        if (otherDetails !== details) {
          otherDetails.open = false;
        }
      });
    });
  });

  placeFloatingTools();
}

function getFloatingTools() {
  let tools = document.querySelector("#ams-floating-tools");

  if (!tools) {
    tools = document.createElement("div");
    tools.className = "floating-tools";
    tools.id = "ams-floating-tools";
    document.body.appendChild(tools);
  }

  return tools;
}

function placeFloatingTools() {
  const tools = document.querySelector("#ams-floating-tools");
  const navbarActions = document.querySelector(".app-navbar-actions");

  if (tools && navbarActions && tools.parentElement !== navbarActions) {
    navbarActions.prepend(tools);
  }
}

function buildIdleFieldHints() {
  if (document.querySelector("#ams-field-hint")) {
    return;
  }

  const hint = document.createElement("div");
  hint.className = "field-hint";
  hint.id = "ams-field-hint";
  hint.hidden = true;
  document.body.appendChild(hint);

  let hintTimer = null;
  let activeElement = null;

  const clearHint = () => {
    window.clearTimeout(hintTimer);
    hintTimer = null;
    hint.hidden = true;
    activeElement = null;
  };

  const scheduleHint = (element) => {
    clearHint();

    if (!isHintable(element)) {
      return;
    }

    activeElement = element;
    hintTimer = window.setTimeout(() => {
      if (document.activeElement !== activeElement && !activeElement.matches(":hover")) {
        return;
      }

      const text = getHintText(activeElement);
      const box = activeElement.getBoundingClientRect();
      hint.textContent = text;
      hint.style.left = `${Math.min(window.innerWidth - 280, Math.max(12, box.left))}px`;
      hint.style.top = `${Math.min(window.innerHeight - 90, Math.max(12, box.bottom + 8))}px`;
      hint.hidden = false;
    }, 10000);
  };

  document.addEventListener("focusin", (event) => scheduleHint(event.target));
  document.addEventListener("mouseover", (event) => scheduleHint(event.target));
  document.addEventListener("input", clearHint);
  document.addEventListener("keydown", clearHint);
  document.addEventListener("click", (event) => {
    if (!event.target.closest("input, textarea, select")) {
      clearHint();
    }
  });
  document.addEventListener("scroll", clearHint, true);
}

function isHintable(element) {
  return element && element.matches && element.matches("input, textarea, select");
}

function getHintText(element) {
  if (element.dataset.help) {
    return element.dataset.help;
  }

  const label = document.querySelector(`label[for="${element.id}"]`);
  const labelText = label ? label.textContent.trim() : "this field";
  const lowerName = `${element.name || ""} ${element.id || ""} ${labelText}`.toLowerCase();

  if (lowerName.includes("password")) {
    return "Use the password chosen for this account. If it does not work, open Help and choose sign-in problem.";
  }

  if (lowerName.includes("payment") || lowerName.includes("transfer")) {
    return "Use the same details shown in the transaction photo. If you are unsure, open Help or send Feedback from the ? button.";
  }

  if (lowerName.includes("student") || lowerName.includes("code")) {
    return "Use the student code exactly as sent by the academy. Letters and numbers matter.";
  }

  if (lowerName.includes("message") || lowerName.includes("details")) {
    return "Write what happened, where it happened, and what you expected to happen.";
  }

  return `Need help with ${labelText}? Use the ? button for Help or Feedback.`;
}

function buildScrollReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const revealTargets = document.querySelectorAll([
    ".topbar",
    ".metric-card",
    ".action-panel",
    ".module-card",
    ".records-panel",
    ".student-card",
    ".grading-card",
    ".kid-result-card",
    ".parent-child-card",
    ".support-card",
    ".quiz-card",
    ".quiz-attempt",
    ".data-form",
    ".auth-panel",
  ].join(","));

  revealTargets.forEach((element, index) => {
    element.classList.add("scroll-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        entry.target.classList.remove("is-visible");
      }
    });
  }, {
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.12,
  });

  revealTargets.forEach((element) => observer.observe(element));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    buildThemeSwitcher();
    buildBrandLogo();
    buildIdleFieldHints();
    buildScrollReveal();
  });
} else {
  buildThemeSwitcher();
  buildBrandLogo();
  buildIdleFieldHints();
  buildScrollReveal();
}
