const passwordForm = document.querySelector("#password-form");
const passwordMessage = document.querySelector("#password-message");

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  passwordMessage.textContent = "Updating password.";

  const response = await fetch("/api/account/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(passwordForm))),
  });
  const result = await response.json();

  if (!response.ok) {
    passwordMessage.textContent = result.message || "Could not update password.";
    return;
  }

  passwordForm.reset();
  passwordMessage.textContent = "Password updated. Use it next time you sign in.";
});
