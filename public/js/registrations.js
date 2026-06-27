const registrationList = document.querySelector("#registration-list");
const bookingWindowForm = document.querySelector("#booking-window-form");
const bookingWindowState = document.querySelector("#booking-window-state");
const bookingWindowSummary = document.querySelector("#booking-window-summary");
const bookingWindowMessage = document.querySelector("#booking-window-message");
const opensDayInput = document.querySelector("#opensDay");
const closesDayInput = document.querySelector("#closesDay");
const studentsLink = document.querySelector("#students-link");

let canManageReservations = false;

async function fetchRegistrations() {
  const response = await fetch("/api/registrations");

  if (!response.ok) {
    registrationList.innerHTML = `<p class="empty-state">You do not have access to registrations.</p>`;
    return;
  }

  const { registrations, user } = await response.json();
  canManageReservations = user && user.role === "Administrator";
  if (studentsLink) {
    studentsLink.hidden = !canManageReservations;
  }
  renderRegistrations(registrations);
}

async function fetchBookingWindow() {
  const response = await fetch("/api/registration-window");

  if (!response.ok) {
    bookingWindowForm.hidden = true;
    return;
  }

  const { windowStatus } = await response.json();
  renderBookingWindow(windowStatus);
}

function renderBookingWindow(windowStatus) {
  opensDayInput.value = windowStatus.opensDay;
  closesDayInput.value = windowStatus.closesDay;
  bookingWindowState.textContent = windowStatus.isOpen ? "Open now" : "Waiting list now";
  bookingWindowState.className = `status-badge ${windowStatus.isOpen ? "confirmed" : "waiting"}`;
  bookingWindowSummary.textContent = `${windowStatus.message}${
    windowStatus.updatedBy ? ` Last changed by ${windowStatus.updatedBy}.` : ""
  }`;
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
              <dt>Parent WhatsApp</dt>
              <dd>${registration.parentWhatsapp || registration.whatsapp}</dd>
            </div>
            <div>
              <dt>Student WhatsApp</dt>
              <dd>${registration.studentWhatsapp || "Not provided"}</dd>
            </div>
            <div>
              <dt>Prize phone</dt>
              <dd>${registration.prizePhone || "Not provided"}</dd>
            </div>
            <div>
              <dt>Transfer number</dt>
              <dd>${registration.transferPhone || "Not provided"}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>${registration.paymentMethod}</dd>
            </div>
            <div>
              <dt>Grade</dt>
              <dd>${registration.schoolGrade || "Not set"}</dd>
            </div>
            <div>
              <dt>Proof</dt>
              <dd>${registration.paymentProof}</dd>
            </div>
            <div>
              <dt>Student code</dt>
              <dd>${registration.studentCode || "Not generated"}</dd>
            </div>
            <div>
              <dt>Intake</dt>
              <dd>${registration.intakeStatus || "Open window"}</dd>
            </div>
            <div>
              <dt>Refund phone</dt>
              <dd>${registration.refundPhone || "Not needed"}</dd>
            </div>
          </dl>
          <div class="payment-proof-viewer">
            ${
              registration.paymentProofUrl
                ? `<img src="${registration.paymentProofUrl}" alt="Payment proof for ${registration.studentName}" />`
                : `<div class="payment-proof-placeholder">No payment photo uploaded in AMS yet</div>`
            }
            ${
              registration.studentPhotoUrl
                ? `<img src="${registration.studentPhotoUrl}" alt="Student photo for ${registration.studentName}" />`
                : `<div class="payment-proof-placeholder">No student photo</div>`
            }
            <label>
              Upload transaction photo
              <input type="file" accept="image/*" data-payment-proof="${registration.id}" ${canManageReservations ? "" : "disabled"} />
            </label>
          </div>
          <p class="student-note">
            ${renderRegistrationNote(registration)}
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
              ${canManageReservations ? "" : "disabled"}
            >
              Save payment review
            </button>
          </div>
          <button
            class="archive-button confirm-button"
            type="button"
            data-registration-id="${registration.id}"
            ${!canManageReservations || ["Confirmed", "Rejected"].includes(registration.reservationStatus) || !isPaymentReady(registration) ? "disabled" : ""}
          >
            Confirm payment and reservation
          </button>
          <button
            class="archive-button"
            type="button"
            data-reject-registration="${registration.id}"
            ${!canManageReservations || ["Confirmed", "Rejected"].includes(registration.reservationStatus) ? "disabled" : ""}
          >
            Reject and prepare refund
          </button>
          ${canManageReservations ? "" : `<p class="student-note">Teachers can manage the booking window here. Final reservation decisions are admin-only.</p>`}
        </article>
      `
    )
    .join("");
}

function renderRegistrationNote(registration) {
  if (registration.rejectionReason) {
    return `Rejected: ${registration.rejectionReason}. Refund phone: ${registration.refundPhone || "not provided"}.`;
  }

  if (registration.confirmationMessage) {
    return registration.confirmationMessage;
  }

  if (registration.reservationStatus === "Waiting List") {
    return "This registration is outside the booking window. Approve only as an exception. If rejected, use the refund phone.";
  }

  return "Confirm this registration to generate the student code and message.";
}

function renderPaymentCheck(registration, key, label) {
  const checked = registration.paymentReview && registration.paymentReview[key] ? "checked" : "";

  return `
    <label class="payment-check">
      <input
        type="checkbox"
        data-payment-check="${registration.id}-${key}"
        ${checked}
        ${canManageReservations ? "" : "disabled"}
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

bookingWindowForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  bookingWindowMessage.textContent = "Saving booking window...";

  const response = await fetch("/api/registration-window", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      opensDay: opensDayInput.value,
      closesDay: closesDayInput.value,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    bookingWindowMessage.textContent = result.message || "Could not update booking window.";
    return;
  }

  renderBookingWindow(result.windowStatus);
  bookingWindowMessage.textContent = "Booking window saved.";
});

registrationList.addEventListener("click", async (event) => {
  const confirmButton = event.target.closest("[data-registration-id]");
  const reviewButton = event.target.closest("[data-save-payment-review]");
  const rejectButton = event.target.closest("[data-reject-registration]");

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
    if (!rejectButton) {
      return;
    }

    const reason = window.prompt("Reason for rejection/refund note") || "Registration rejected by academy";
    await fetch(`/api/registrations/${rejectButton.dataset.rejectRegistration}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });
    await fetchRegistrations();
    return;
  }

  await fetch(`/api/registrations/${confirmButton.dataset.registrationId}/confirm`, {
    method: "PATCH",
  });
  await fetchRegistrations();
});

registrationList.addEventListener("change", async (event) => {
  const input = event.target.closest("[data-payment-proof]");

  if (!input || !input.files.length) {
    return;
  }

  const formData = new FormData();
  formData.append("paymentProof", input.files[0]);

  await fetch(`/api/registrations/${input.dataset.paymentProof}/payment-proof`, {
    method: "POST",
    body: formData,
  });

  await fetchRegistrations();
});

fetchBookingWindow();
fetchRegistrations();
