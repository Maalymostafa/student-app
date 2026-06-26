const registrationForm = document.querySelector("#public-registration-form");
const registrationMessage = document.querySelector("#public-registration-message");
const registrationAlert = document.querySelector("#public-registration-alert");
const windowMessage = document.querySelector("#registration-window-message");
const refundFields = document.querySelectorAll(".refund-field");

let registrationWindow = null;

async function loadRegistrationWindow() {
  const response = await fetch("/api/public/registration-window");
  const { windowStatus } = await response.json();
  registrationWindow = windowStatus;
  windowMessage.textContent = windowStatus.message;

  refundFields.forEach((field) => {
    field.hidden = windowStatus.isOpen;
  });
}

registrationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  registrationAlert.hidden = true;
  registrationMessage.textContent = "Sending registration.";

  const response = await fetch("/api/public/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(registrationForm))),
  });
  const result = await response.json();

  if (!response.ok) {
    registrationAlert.hidden = false;
    registrationAlert.textContent = result.message || "Registration could not be sent.";
    registrationMessage.textContent = "";
    return;
  }

  const statusText = result.registration.reservationStatus === "Waiting List"
    ? "You are now on the waiting list. If Miss Hoda approves your request, we will send your student code. If not, we will use your refund phone."
    : "Your registration was received. We will review payment proof and send your student code after approval.";

  registrationForm.reset();
  registrationMessage.textContent = `${statusText} Reference: ${result.registration.id}`;
  refundFields.forEach((field) => {
    field.hidden = registrationWindow ? registrationWindow.isOpen : true;
  });
});

loadRegistrationWindow();
