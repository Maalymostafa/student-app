const params = new URLSearchParams(window.location.search);
const error = document.querySelector("#login-error");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const demoButtons = document.querySelectorAll("[data-demo-email]");

if (params.get("error") === "invalid" && error) {
  error.hidden = false;
}

demoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    email.value = button.dataset.demoEmail;
    password.value = "password123";
    email.focus();
  });
});
