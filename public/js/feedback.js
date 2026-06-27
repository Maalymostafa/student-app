const feedbackForm = document.querySelector("#feedback-form");
const feedbackMessage = document.querySelector("#feedback-message");
const feedbackList = document.querySelector("#feedback-list");
const pageUrlInput = document.querySelector("#pageUrl");

pageUrlInput.value = new URLSearchParams(window.location.search).get("from") || document.referrer || window.location.href;

let currentUser = null;

async function fetchFeedback() {
  const response = await fetch("/api/feedback");

  if (!response.ok) {
    feedbackList.innerHTML = `<p class="empty-state">Could not load feedback history.</p>`;
    return;
  }

  const result = await response.json();
  currentUser = result.user;
  renderFeedback(result.feedback || []);
}

function renderFeedback(items) {
  if (!items.length) {
    feedbackList.innerHTML = `<p class="empty-state">No feedback sent yet.</p>`;
    return;
  }

  feedbackList.innerHTML = items.map((item) => `
    <article class="feedback-card">
      <div class="student-main">
        <div>
          <span class="record-id">${item.id} - ${item.type}</span>
          <h3>${item.title}</h3>
          <p>${item.details}</p>
        </div>
        <span class="status-badge ${item.status.toLowerCase().replaceAll(" ", "-")}">${item.status}</span>
      </div>
      <dl class="record-details">
        <div>
          <dt>From</dt>
          <dd>${item.senderName} - ${item.senderRole}</dd>
        </div>
        <div>
          <dt>Page</dt>
          <dd>${item.pageUrl || "Not specified"}</dd>
        </div>
        <div>
          <dt>Sent</dt>
          <dd>${new Date(item.createdAt).toLocaleString()}</dd>
        </div>
      </dl>
      ${item.adminReply ? `
        <div class="ai-reply-panel">
          <span>Academy reply</span>
          <p>${item.adminReply}</p>
        </div>
      ` : ""}
      ${currentUser && ["Administrator", "Teacher"].includes(currentUser.role) ? renderAdminReview(item) : ""}
    </article>
  `).join("");
}

function renderAdminReview(item) {
  return `
    <div class="feedback-review-panel">
      <select data-feedback-status="${item.id}">
        ${["New", "Reviewing", "Planned", "Done", "Closed"].map((status) => `
          <option ${status === item.status ? "selected" : ""}>${status}</option>
        `).join("")}
      </select>
      <textarea data-feedback-reply="${item.id}" rows="2" placeholder="Admin reply">${item.adminReply || ""}</textarea>
      <button class="secondary-button" type="button" data-save-feedback="${item.id}">Save reply</button>
    </div>
  `;
}

feedbackForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  feedbackMessage.textContent = "Sending feedback.";

  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(feedbackForm).entries())),
  });

  const result = await response.json();

  if (!response.ok) {
    feedbackMessage.textContent = result.message || "Could not send feedback.";
    return;
  }

  feedbackForm.reset();
  pageUrlInput.value = window.location.href;
  feedbackMessage.textContent = `Feedback ${result.feedback.id} sent.`;
  await fetchFeedback();
});

feedbackList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-save-feedback]");

  if (!button) {
    return;
  }

  const id = button.dataset.saveFeedback;
  const status = document.querySelector(`[data-feedback-status="${id}"]`).value;
  const adminReply = document.querySelector(`[data-feedback-reply="${id}"]`).value;

  await fetch(`/api/feedback/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, adminReply }),
  });
  await fetchFeedback();
});

fetchFeedback();
