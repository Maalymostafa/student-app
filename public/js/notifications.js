const notificationCount = document.querySelector("#notification-count");
const notificationUnreadBadge = document.querySelector("#notification-unread-badge");
const notificationList = document.querySelector("#notification-list");
const notificationComposePanel = document.querySelector("#notification-compose-panel");
const notificationForm = document.querySelector("#notification-form");
const notificationMessage = document.querySelector("#notification-message");
const audienceInput = document.querySelector("#audience");
const gradeTargetFields = document.querySelector("#gradeTargetFields");
const roleTargetFields = document.querySelector("#roleTargetFields");
const accountTargetFields = document.querySelector("#accountTargetFields");

let currentUser = null;

async function fetchNotifications() {
  const response = await fetch("/api/notifications");

  if (!response.ok) {
    notificationList.innerHTML = `<p class="empty-state">You do not have access to notifications.</p>`;
    return;
  }

  const result = await response.json();
  currentUser = result.user;
  notificationComposePanel.hidden = !["Administrator", "Teacher"].includes(currentUser.role);
  notificationCount.textContent = `${result.notifications.length} saved messages`;
  notificationUnreadBadge.textContent = `${result.unreadCount} unread`;
  notificationUnreadBadge.className = `status-badge ${result.unreadCount ? "pending" : "active"}`;
  renderNotifications(result.notifications);
}

function syncAudienceFields() {
  const audience = audienceInput.value;
  gradeTargetFields.hidden = audience !== "grade";
  roleTargetFields.hidden = audience !== "role" && audience !== "account";
  accountTargetFields.hidden = audience !== "account";
}

function renderNotifications(notifications) {
  if (!notifications.length) {
    notificationList.innerHTML = `<p class="empty-state">No messages yet.</p>`;
    return;
  }

  notificationList.innerHTML = notifications.map((notification) => `
    <article class="notification-card ${notification.status === "Unread" ? "unread" : "read"}">
      <div class="student-main">
        <div>
          <span class="record-id">${notification.id} - ${notification.category}</span>
          <h3>${notification.title}</h3>
          <p>${notification.body}</p>
        </div>
        <span class="status-badge ${notification.status === "Unread" ? "pending" : "active"}">${notification.status}</span>
      </div>
      <dl class="record-details">
        <div>
          <dt>To</dt>
          <dd>${notification.recipientUserId || notification.recipientRole}</dd>
        </div>
        <div>
          <dt>Student</dt>
          <dd>${notification.studentCode || "Not linked"}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>${notification.priority}</dd>
        </div>
        <div>
          <dt>Channel</dt>
          <dd>${notification.deliveryChannel}</dd>
        </div>
        <div>
          <dt>Sent</dt>
          <dd>${formatDateTime(notification.createdAt)}</dd>
        </div>
      </dl>
      ${notification.status === "Unread" ? `
        <div class="toolbar-actions">
          <button class="secondary-button" type="button" data-read-notification="${notification.id}">Mark read</button>
        </div>
      ` : ""}
    </article>
  `).join("");
}

function formatDateTime(value) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString();
}

notificationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  notificationMessage.textContent = "Sending notification.";

  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(notificationForm).entries())),
  });

  const result = await response.json();

  if (!response.ok) {
    notificationMessage.textContent = result.message || "Could not send notification.";
    return;
  }

  notificationForm.reset();
  syncAudienceFields();
  notificationMessage.textContent = `${result.count || 0} notification${result.count === 1 ? "" : "s"} sent.`;
  await fetchNotifications();
});

audienceInput.addEventListener("change", syncAudienceFields);

notificationList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-read-notification]");

  if (!button) {
    return;
  }

  await fetch(`/api/notifications/${button.dataset.readNotification}/read`, { method: "PATCH" });
  await fetchNotifications();
});

fetchNotifications();
syncAudienceFields();
