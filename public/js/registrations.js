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
          <div class="payment-review-panel">
            <p>Payment photo criteria</p>
            ${renderPaymentCheck(registration, "recipientMatches", "Recipient is Hoda Bahr @ Instapay")}
            ${renderPaymentCheck(registration, "dateWithinRange", "Transaction date is within 7 days")}
            ${renderPaymentCheck(registration, "timePresent", "Transaction time is visible")}
            <button
              class="save-feedback-button"
              type="button"
              data-save-payment-review="${registration.id}"
            >
              Save payment review
            </button>
          </div>
          <button
            class="archive-button confirm-button"
            type="button"
            data-registration-id="${registration.id}"
            ${registration.reservationStatus === "Confirmed" || !isPaymentReady(registration) ? "disabled" : ""}
          >
            Confirm payment and reservation
          </button>
        </article>
      `
    )
    .join("");
}

function renderPaymentCheck(registration, key, label) {
  const checked = registration.paymentReview && registration.paymentReview[key] ? "checked" : "";

  return `
    <label class="payment-check">
      <input
        type="checkbox"
        data-payment-check="${registration.id}-${key}"
        ${checked}
      />
      <span>${label}</span>
    </label>
  `;
}

function isPaymentReady(registration) {
  return Boolean(
    registration.paymentReview &&
      registration.paymentReview.recipientMatches &&
      registration.paymentReview.dateWithinRange &&
      registration.paymentReview.timePresent
  );
}

registrationList.addEventListener("click", async (event) => {
  const confirmButton = event.target.closest("[data-registration-id]");
  const reviewButton = event.target.closest("[data-save-payment-review]");

  if (reviewButton) {
    const registrationId = reviewButton.dataset.savePaymentReview;

    await fetch(`/api/registrations/${registrationId}/payment-review`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipientMatches: document.querySelector(`[data-payment-check="${registrationId}-recipientMatches"]`).checked,
        dateWithinRange: document.querySelector(`[data-payment-check="${registrationId}-dateWithinRange"]`).checked,
        timePresent: document.querySelector(`[data-payment-check="${registrationId}-timePresent"]`).checked,
      }),
    });

    await fetchRegistrations();
    return;
  }

  if (!confirmButton) {
    return;
  }

  await fetch(`/api/registrations/${confirmButton.dataset.registrationId}/confirm`, {
    method: "PATCH",
  });
  await fetchRegistrations();
});

fetchRegistrations();
