const childTabs = document.querySelector("#child-tabs");
const childResults = document.querySelector("#parent-child-results");
const supportForm = document.querySelector("#parent-support-form");
const supportMessage = document.querySelector("#parent-support-message");
const messageArchive = document.querySelector("#parent-message-archive");
const supportFlowSelect = document.querySelector("#supportFlowSelect");
const supportFlowStep = document.querySelector("#support-flow-step");
const supportFlowOptions = document.querySelector("#support-flow-options");
const supportFlowResult = document.querySelector("#support-flow-result");

let portalChildren = [];
let activeStudentCode = "";
let supportFlows = [];
let activeFlow = null;
let activeNodeId = "start";
let supportPath = [];

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

async function fetchSupportFlows() {
  const response = await fetch("/api/support/flows");

  if (!response.ok) {
    supportFlowStep.innerHTML = `<p>Support assistant is not available right now.</p>`;
    return;
  }

  const { flows } = await response.json();
  supportFlows = flows;
  renderFlowSelector();
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

function renderFlowSelector() {
  supportFlowSelect.innerHTML = supportFlows
    .map((flow) => `<option value="${flow.id}">${flow.title}</option>`)
    .join("");
  activeFlow = supportFlows[0] || null;
  activeNodeId = "start";
  supportPath = [];
  renderSupportStep();
}

function renderSupportStep() {
  if (!activeFlow) {
    supportFlowStep.innerHTML = `<p>No support scenarios yet.</p>`;
    supportFlowOptions.innerHTML = "";
    return;
  }

  const node = activeFlow.nodes[activeNodeId];

  if (!node) {
    supportFlowStep.innerHTML = `<p>This path is not configured yet.</p>`;
    supportFlowOptions.innerHTML = `<button type="button" data-open-human-support="1">Send to support</button>`;
    return;
  }

  if (node.resolution) {
    supportFlowStep.innerHTML = `
      <span>Suggested answer</span>
      <p>${node.resolution}</p>
    `;
    supportFlowOptions.innerHTML = `
      <button type="button" data-flow-solved="1">This solved it</button>
      <button type="button" data-open-human-support="1">Still need a person</button>
      <button type="button" data-flow-restart="1">Start again</button>
    `;
    return;
  }

  supportFlowStep.innerHTML = `
    <span>${activeFlow.title}</span>
    <p>${node.text}</p>
  `;
  supportFlowOptions.innerHTML = (node.options || [])
    .map((option) => `<button type="button" data-flow-next="${option.next}" data-flow-label="${option.label}">${option.label}</button>`)
    .join("");
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
          <p>${child.accountStatus || "Linked"} - ${child.paymentStatus || "Payment status not recorded"}</p>
        </div>
        <a class="secondary-link" href="/payments?studentCode=${encodeURIComponent(child.studentCode)}">Open payments</a>
      </div>
      <dl class="record-details">
        <div>
          <dt>Account</dt>
          <dd>${child.accountStatus || "Linked"}</dd>
        </div>
        <div>
          <dt>Reservation</dt>
          <dd>${child.reservationStatus || "Not recorded"}</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>${child.paymentStatus || "Not recorded"}</dd>
        </div>
        <div>
          <dt>Intake</dt>
          <dd>${child.intakeStatus || "Not recorded"}</dd>
        </div>
      </dl>
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

supportFlowSelect.addEventListener("change", () => {
  activeFlow = supportFlows.find((flow) => flow.id === supportFlowSelect.value) || null;
  activeNodeId = "start";
  supportPath = [];
  supportFlowResult.textContent = "";
  renderSupportStep();
});

supportFlowOptions.addEventListener("click", (event) => {
  const nextButton = event.target.closest("[data-flow-next]");
  const solvedButton = event.target.closest("[data-flow-solved]");
  const humanButton = event.target.closest("[data-open-human-support]");
  const restartButton = event.target.closest("[data-flow-restart]");

  if (nextButton) {
    supportPath.push(nextButton.dataset.flowLabel);
    activeNodeId = nextButton.dataset.flowNext;
    renderSupportStep();
    return;
  }

  if (solvedButton) {
    supportFlowResult.textContent = "Great. No support message was sent.";
    return;
  }

  if (restartButton) {
    activeNodeId = "start";
    supportPath = [];
    supportFlowResult.textContent = "";
    renderSupportStep();
    return;
  }

  if (!humanButton) {
    return;
  }

  const activeChild = portalChildren.find((child) => child.studentCode === activeStudentCode);
  supportForm.querySelector("#senderName").value ||= "";
  supportForm.querySelector("#studentName").value = activeChild ? activeChild.studentName : "";
  supportForm.querySelector("#category").value = activeFlow ? activeFlow.category : "Technical support";
  supportForm.querySelector("#message").value = [
    `Support scenario: ${activeFlow ? activeFlow.title : "Unknown"}`,
    `Path: ${supportPath.join(" > ") || "No option selected"}`,
    "Details: ",
  ].join("\n");
  supportMessage.textContent = "Please add any extra details, then send to support.";
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
fetchSupportFlows();
fetchParentMessages();
