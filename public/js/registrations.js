const registrationList = document.querySelector("#registration-list");

async function fetchRegistrations() {
  const response = await fetch("/api/registrations");

  if (!response.ok) {
    registrationList.innerHTML = `<p class="empty-state">You do not have access to registrations.</p>`;
    return;
  }

  const { registrations } = await response.json();
  renderRegistrations(registrations);
}

function renderRegistrations(registrations) {
  registrationList.innerHTML = registrations
    .map(
      (registration) => `
        <article class="student-card">
          <div class="student-main">
            <div>
              <span class="record-id">${registration.id} - ${registration.submittedAt}</span>
              <h3>${registration.studentName}</h3>
              <p>${registration.course} - Parent: ${registration.parentName}</p>
            </div>
            <span class="status-badge ${registration.reservationStatus.toLowerCase()}">
              ${registration.reservationStatus}
            </span>
          </div>
          <dl class="record-details">
            <div>
              <dt>WhatsApp</dt>
              <dd>${registration.whatsapp}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>${registration.paymentMethod}</dd>
            </div>
            <div>
              <dt>Proof</dt>
              <dd>${registration.paymentProof}</dd>
            </div>
            <div>
              <dt>Student code</dt>
              <dd>${registration.studentCode || "Not generated"}</dd>
            </div>
          </dl>
          <p class="student-note">
            ${registration.confirmationMessage || "Confirm this registration to generate the student code and message."}
          </p>
          <button
            class="archive-button confirm-button"
            type="button"
            data-registration-id="${registration.id}"
            ${registration.reservationStatus === "Confirmed" ? "disabled" : ""}
          >
            Confirm reservation
          </button>
        </article>
      `
    )
    .join("");
}

registrationList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-registration-id]");

  if (!button) {
    return;
  }

  await fetch(`/api/registrations/${button.dataset.registrationId}/confirm`, {
    method: "PATCH",
  });
  await fetchRegistrations();
});

fetchRegistrations();
