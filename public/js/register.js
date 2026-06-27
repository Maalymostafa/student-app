const registrationForm = document.querySelector("#public-registration-form");
const registrationMessage = document.querySelector("#public-registration-message");
const registrationAlert = document.querySelector("#public-registration-alert");
const windowMessage = document.querySelector("#registration-window-message");

let registrationWindow = null;

async function loadRegistrationWindow() {
  const response = await fetch("/api/public/registration-window");
  const { windowStatus } = await response.json();
  registrationWindow = windowStatus;
  windowMessage.textContent = windowStatus.message;
}

registrationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  registrationAlert.hidden = true;
  registrationMessage.textContent = "Sending registration.";
  const formData = new FormData(registrationForm);

  if (formData.get("accountPassword") !== formData.get("confirmPassword")) {
    registrationAlert.hidden = false;
    registrationAlert.textContent = "Password confirmation does not match.";
    registrationMessage.textContent = "";
    return;
  }

  const response = await fetch("/api/public/registrations", {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  if (!response.ok) {
    registrationAlert.hidden = false;
    registrationAlert.textContent = result.message || "Registration could not be sent.";
    registrationMessage.textContent = "";
    return;
  }

  const statusText = result.registration.reservationStatus === "Waiting List"
    ? `Your account was created and is on the waiting list. Your student code is ${result.registration.studentCode}. Use it with your password to follow payments and updates.`
    : `Your account was created. Your student code is ${result.registration.studentCode}. Use it with your password to log in and register payments.`;

  registrationForm.reset();
  registrationMessage.textContent = statusText;
});

loadRegistrationWindow();
