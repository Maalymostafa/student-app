const sessionWorkList = document.querySelector("#session-work-list");

async function fetchActiveWork() {
  const response = await fetch("/api/session-work/active");

  if (!response.ok) {
    sessionWorkList.innerHTML = `<p class="empty-state">We could not load session work.</p>`;
    return;
  }

  const { windows } = await response.json();
  renderWindows(windows);
}

function renderWindows(windows) {
  if (!windows.length) {
    sessionWorkList.innerHTML = `<p class="empty-state">No open answer window right now.</p>`;
    return;
  }

  sessionWorkList.innerHTML = windows.map((window) => `
    <article class="student-card">
      <div class="student-main">
        <div>
          <span class="record-id">${window.id} - ${window.schoolGrade}</span>
          <h3>${window.sessionTitle}</h3>
          <p>Closes ${new Date(window.closesAt).toLocaleString()}</p>
        </div>
        <span class="status-badge ${window.isOpenNow ? "active" : "pending"}">
          ${window.isOpenNow ? "Open now" : "Closed"}
        </span>
      </div>
      <dl class="record-details">
        <div>
          <dt>Question 1</dt>
          <dd>${window.q1Prompt}</dd>
        </div>
        <div>
          <dt>Question 2</dt>
          <dd>${window.q2Prompt}</dd>
        </div>
      </dl>
      <div class="toolbar-actions">
        <button class="secondary-button" type="button" data-mark-attendance="${window.id}">
          Mark attendance only
        </button>
      </div>
      <form class="login-form session-work-form" data-window-id="${window.id}" enctype="multipart/form-data">
        <label>
          Q1 handwriting photo
          <input name="q1Image" type="file" accept="image/*" />
        </label>
        <label>
          Q2 handwriting photo
          <input name="q2Image" type="file" accept="image/*" />
        </label>
        <button type="submit">Submit answers and mark present</button>
        <p class="form-message" data-session-message="${window.id}"></p>
      </form>
    </article>
  `).join("");
}

sessionWorkList.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-window-id]");

  if (!form) {
    return;
  }

  event.preventDefault();
  const message = document.querySelector(`[data-session-message="${form.dataset.windowId}"]`);
  message.textContent = "Uploading answers...";

  const response = await fetch(`/api/session-work/${form.dataset.windowId}/submit`, {
    method: "POST",
    body: new FormData(form),
  });
  const result = await response.json();

  message.textContent = response.ok
    ? `Submitted. Your work is now in the assistant correction queue.`
    : result.message || "Could not submit answers.";

  if (response.ok) {
    form.reset();
  }
});

sessionWorkList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-mark-attendance]");

  if (!button) {
    return;
  }

  const message = document.querySelector(`[data-session-message="${button.dataset.markAttendance}"]`);
  message.textContent = "Marking attendance...";

  const response = await fetch(`/api/session-work/${button.dataset.markAttendance}/attendance`, {
    method: "POST",
  });
  const result = await response.json();

  message.textContent = response.ok
    ? `Attendance marked. You can still upload answers before the window closes.`
    : result.message || "Could not mark attendance.";
});

fetchActiveWork();
