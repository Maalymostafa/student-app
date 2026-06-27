const params = new URLSearchParams(window.location.search);
const error = document.querySelector("#login-error");
const email = document.querySelector("#identifier");
const password = document.querySelector("#password");
const loginRole = document.querySelector("#loginRole");
const demoButtons = document.querySelectorAll("[data-demo-email]");

if (params.get("error") === "invalid" && error) {
  error.hidden = false;
}

demoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    email.value = button.dataset.demoEmail;
    loginRole.value = button.dataset.demoRole || "Staff";
    password.value = "password123";
    email.focus();
  });
});
