const supportFlowSelect = document.querySelector("#supportFlowSelect");
const supportFlowStep = document.querySelector("#support-flow-step");
const supportFlowOptions = document.querySelector("#support-flow-options");
const supportFlowResult = document.querySelector("#support-flow-result");
const supportForm = document.querySelector("#support-form");
const supportMessage = document.querySelector("#support-message");
const supportArchive = document.querySelector("#support-archive");

let supportFlows = [];
let activeFlow = null;
let activeNodeId = "start";
let supportPath = [];

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

async function fetchMyMessages() {
  const response = await fetch("/api/support/my-messages");

  if (!response.ok) {
    supportArchive.innerHTML = `<p class="empty-state">Could not load your old messages.</p>`;
    return;
  }

  const { messages } = await response.json();
  renderArchive(messages);
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

function renderArchive(messages) {
  if (!messages.length) {
    supportArchive.innerHTML = `<p class="empty-state">No previous support messages yet.</p>`;
    return;
  }

  supportArchive.innerHTML = messages.map((message) => `
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
  `).join("");
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

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

  supportForm.querySelector("#category").value = activeFlow ? activeFlow.category : "Technical support";
  supportForm.querySelector("#message").value = [
    `Support scenario: ${activeFlow ? activeFlow.title : "Unknown"}`,
    `Path: ${supportPath.join(" > ") || "No option selected"}`,
    "Details: ",
  ].join("\n");
  supportFlowResult.textContent = "Add your name and any extra details, then send to support.";
  supportForm.scrollIntoView({ behavior: "smooth", block: "start" });
});

supportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  supportMessage.textContent = "Sending message.";

  const response = await fetch("/api/support/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(supportForm))),
  });

  const result = await response.json();

  if (!response.ok) {
    supportMessage.textContent = result.message || "Could not send this message.";
    return;
  }

  supportForm.reset();
  supportMessage.textContent = `Message ${result.message.id} sent.`;
  await fetchMyMessages();
});

fetchSupportFlows();
fetchMyMessages();
