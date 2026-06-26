const supportList = document.querySelector("#support-list");

async function fetchMessages() {
  const response = await fetch("/api/support/messages");

  if (!response.ok) {
    supportList.innerHTML = `<p class="empty-state">You do not have access to the support inbox.</p>`;
    return;
  }

  const { messages } = await response.json();
  renderMessages(messages);
}

function renderMessages(messages) {
  supportList.innerHTML = messages.map(renderMessage).join("");
}

function renderMessage(message) {
  return `
    <article class="support-card">
      <div class="student-main">
        <div>
          <span class="record-id">${message.id} - ${message.senderRole}</span>
          <h3>${message.senderName}</h3>
          <p>${message.category} - Student: ${message.studentName}</p>
        </div>
        <span class="status-badge ${message.status.toLowerCase().replaceAll(" ", "-")}">${message.status}</span>
      </div>

      <div class="support-message-box">
        <span>Message</span>
        <p>${message.message}</p>
      </div>

      <div class="support-routing-grid">
        <label>
          Assigned to
          <select data-assigned-to="${message.id}">
            ${["Technical Support", "Assistant Teacher", "Miss Hoda / Assistant Teacher", "Manager"].map(
              (person) => `<option ${person === message.assignedTo ? "selected" : ""}>${person}</option>`
            ).join("")}
          </select>
        </label>
        <label>
          Status
          <select data-status="${message.id}">
            ${["New", "In progress", "Answered"].map(
              (status) => `<option ${status === message.status ? "selected" : ""}>${status}</option>`
            ).join("")}
          </select>
        </label>
        <label>
          AI confidence
          <input value="${message.aiConfidence}" readonly />
        </label>
      </div>

      <div class="ai-reply-panel">
        <span>AI suggested reply</span>
        <p>${message.aiSuggestedReply}</p>
      </div>

      <label class="final-reply-box">
        Final reply
        <textarea data-final-reply="${message.id}" rows="3" placeholder="Write or approve the final reply">${message.finalReply}</textarea>
      </label>

      <div class="support-actions">
        <button type="button" data-approve-reply="${message.id}">Approve AI reply</button>
        <button type="button" data-save-message="${message.id}">Save human reply</button>
      </div>
    </article>
  `;
}

supportList.addEventListener("click", async (event) => {
  const approveButton = event.target.closest("[data-approve-reply]");
  const saveButton = event.target.closest("[data-save-message]");

  if (approveButton) {
    await fetch(`/api/support/messages/${approveButton.dataset.approveReply}/approve`, {
      method: "PATCH",
    });
    await fetchMessages();
    return;
  }

  if (!saveButton) {
    return;
  }

  const id = saveButton.dataset.saveMessage;

  await fetch(`/api/support/messages/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assignedTo: document.querySelector(`[data-assigned-to="${id}"]`).value,
      status: document.querySelector(`[data-status="${id}"]`).value,
      finalReply: document.querySelector(`[data-final-reply="${id}"]`).value,
    }),
  });
  await fetchMessages();
});

fetchMessages();
