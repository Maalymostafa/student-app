const themeOptions = [
  { value: "bright", label: "Bright" },
  { value: "calm", label: "Calm" },
  { value: "focus", label: "Dark" },
];

const savedTheme = localStorage.getItem("ams-theme") || "bright";
document.documentElement.dataset.theme = savedTheme;

function buildThemeSwitcher() {
  if (document.querySelector("#ams-theme-switcher")) {
    return;
  }

  const switcher = document.createElement("label");
  switcher.className = "theme-switcher";
  switcher.id = "ams-theme-switcher";
  switcher.innerHTML = `
    <span>Style</span>
    <select aria-label="Choose visual style">
      ${themeOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
    </select>
  `;

  const select = switcher.querySelector("select");
  select.value = document.documentElement.dataset.theme;
  select.addEventListener("change", () => {
    document.documentElement.dataset.theme = select.value;
    localStorage.setItem("ams-theme", select.value);
  });

  document.body.appendChild(switcher);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildThemeSwitcher);
} else {
  buildThemeSwitcher();
}
