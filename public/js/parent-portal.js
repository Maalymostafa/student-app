const childTabs = document.querySelector("#child-tabs");
const childResults = document.querySelector("#parent-child-results");
const supportForm = document.querySelector("#parent-support-form");
const supportMessage = document.querySelector("#parent-support-message");
const messageArchive = document.querySelector("#parent-message-archive");

let portalChildren = [];
let activeStudentCode = "";

async function fetchParentOverview() {
  const response = await fetch("/api/parent/overview");

  if (!response.ok) {
    childResults.innerHTML = `<p class="empty-state">You do not have access to this parent portal.</p>`;
    return;
  }

  const { children } = await response.json();
  portalChildren = children;
  activeStudentCode = children[0] ? children[0].studentCode : "";
  renderPortal();
}

async function fetchParentMessages() {
  const response = await fetch("/api/parent/messages");

  if (!response.ok) {
    messageArchive.innerHTML = `<p class="empty-state">We could not load old messages.</p>`;
    return;
  }

  const { messages } = await response.json();
  renderMessageArchive(messages);
}

function renderPortal() {
  if (portalChildren.length === 0) {
    childTabs.innerHTML = "";
    childResults.innerHTML = `<p class="empty-state">No children linked to this parent account yet.</p>`;
    return;
  }

  childTabs.innerHTML = portalChildren
    .map(
      (child) => `
        <button
          type="button"
          class="${child.studentCode === activeStudentCode ? "selected" : ""}"
          data-child-code="${child.studentCode}"
        >
          ${child.studentName}
        </button>
      `
    )
    .join("");

  const activeChild = portalChildren.find((child) => child.studentCode === activeStudentCode);
  childResults.innerHTML = renderChild(activeChild);
}

function renderChild(child) {
  const results = child.results.length
    ? child.results.map(renderResult).join("")
    : `<p class="empty-state">No results available yet for ${child.studentName}.</p>`;

  return `
    <article class="parent-child-card">
      <div class="student-main">
        <div>
          <span class="record-id">${child.studentCode} - ${child.grade}</span>
          <h3>${child.studentName}</h3>
          <p>Corrected answers and teacher feedback.</p>
        </div>
      </div>
      <div class="kid-results-list">${results}</div>
    </article>
  `;
}

function renderResult(result) {
  return `
    <section class="kid-result-card">
      <div class="kid-result-hero">
        <div>
          <span class="record-id">${result.sessionTitle}</span>
          <h2>${result.kidHeadline}</h2>
          <p>${result.kidMessage}</p>
        </div>
        <strong>${result.total}/${result.max}</strong>
      </div>
      <div class="kid-question-grid">
        ${renderQuestion("Question 1", result.q1Score, result.q1CorrectionPhoto, result.q1Feedback)}
        ${renderQuestion("Question 2", result.q2Score, result.q2CorrectionPhoto, result.q2Feedback)}
      </div>
    </section>
  `;
}

function renderQuestion(label, score, correctionPhoto, feedback) {
  return `
    <section class="kid-question-card">
      <span>${label}</span>
      <strong>${score === null ? "Checking" : `${score}/2`}</strong>
      <p class="correction-photo-label">${correctionPhoto || "No corrected photo yet"}</p>
      <p>${feedback || "No extra feedback yet."}</p>
    </section>
  `;
}

function renderMessageArchive(messages) {
  if (!messages.length) {
    messageArchive.innerHTML = `<p class="empty-state">No previous messages yet.</p>`;
    return;
  }

  messageArchive.innerHTML = messages
    .map(
      (message) => `
        <article class="support-card">
          <div class="student-main">
            <div>
              <span class="record-id">${message.id} - ${formatDate(message.createdAt)}</span>
              <h3>${message.category}</h3>
              <p>${message.studentName || "General academy message"}</p>
            </div>
            <span class="status-badge ${message.status.toLowerCase().replaceAll(" ", "-")}">${message.status}</span>
          </div>
          <div class="support-message-box">
            <span>Your message</span>
            <p>${message.message}</p>
          </div>
          <div class="ai-reply-panel">
            <span>Academy reply</span>
            <p>${message.finalReply || "The academy team has not replied yet."}</p>
          </div>
          <p class="student-note">Assigned to: ${message.assignedTo}. Last update: ${formatDate(message.updatedAt)}</p>
        </article>
      `
    )
    .join("");
}

function formatDate(value) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString();
}

childTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-child-code]");

  if (!button) {
    return;
  }

  activeStudentCode = button.dataset.childCode;
  renderPortal();
});

supportForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const body = {
    ...Object.fromEntries(new FormData(supportForm)),
    senderRole: "Parent",
  };

  const response = await fetch("/api/parent/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  supportMessage.textContent = response.ok
    ? "Message sent. The academy team will review it."
    : "Could not send this message.";

  if (response.ok) {
    supportForm.reset();
    await fetchParentMessages();
  }
});

fetchParentOverview();
fetchParentMessages();
