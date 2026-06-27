const gradingList = document.querySelector("#grading-list");
const gradingWindowForm = document.querySelector("#grading-window-form");
const gradingWindowMessage = document.querySelector("#grading-window-message");
const sessionScheduleForm = document.querySelector("#session-schedule-form");
const sessionScheduleMessage = document.querySelector("#session-schedule-message");
const archiveForm = document.querySelector("#archive-form");
const archiveMessage = document.querySelector("#archive-message");
const materialForm = document.querySelector("#material-form");
const materialMessage = document.querySelector("#material-message");
const manualAttendanceForm = document.querySelector("#manual-attendance-form");
const manualAttendanceMessage = document.querySelector("#manual-attendance-message");
const attendanceWindowId = document.querySelector("#attendanceWindowId");
const feedbackTemplateList = document.querySelector("#feedback-template-list");
let feedbackTemplates = [];
let gradingWindows = [];

async function fetchSubmissions() {
  const response = await fetch("/api/grading/submissions");

  if (!response.ok) {
    gradingList.innerHTML = `<p class="empty-state">You do not have access to grading.</p>`;
    return;
  }

  const { submissions, templates, windows } = await response.json();
  feedbackTemplates = templates || [];
  gradingWindows = windows || [];
  renderFeedbackTemplates(feedbackTemplates);
  renderAttendanceWindows(gradingWindows);
  renderSubmissions(submissions);
}

function renderFeedbackTemplates(templates) {
  feedbackTemplateList.innerHTML = templates
    .map((template) => `<option value="${template.templateText}"></option>`)
    .join("");
}

function renderAttendanceWindows(windows) {
  attendanceWindowId.innerHTML = windows.length
    ? windows.map((window) => `<option value="${window.id}">${window.sessionTitle} - ${window.schoolGrade}</option>`).join("")
    : `<option value="">No windows yet</option>`;
}

function renderSubmissions(submissions) {
  gradingList.innerHTML = submissions
    .map(
      (submission) => `
        <article class="grading-card">
          <div class="student-main">
            <div>
              <span class="record-id">${submission.id} - ${submission.studentCode}</span>
              <h3>${submission.studentName}</h3>
              <p>${submission.sessionTitle} - ${submission.grade} - ${submission.attendance}</p>
            </div>
            <span class="status-badge ${submission.complete ? "confirmed" : "pending"}">
              ${submission.complete ? `${submission.percentage}%` : "Needs correction"}
            </span>
          </div>

          <div class="question-grid">
            ${renderQuestion(submission, "q1Score", "Question 1", submission.q1Image)}
            ${renderQuestion(submission, "q2Score", "Question 2", submission.q2Image)}
          </div>

          <p class="student-note">
            Total: ${submission.total}/${submission.max}. Assistant teacher: ${submission.assistantTeacher}.
          </p>
        </article>
      `
    )
    .join("");
}

function renderQuestion(submission, question, label, imageText) {
  const questionKey = question.replace("Score", "");
  const feedback = submission[`${questionKey}Feedback`] || "";
  const correctionPhoto = submission[`${questionKey}CorrectionPhoto`] || "";

  return `
    <section class="question-card">
      <div class="answer-photo" aria-label="${label} handwriting photo">
        <span>${label}</span>
        ${renderAnswerImage(imageText)}
      </div>
      <div class="score-buttons" aria-label="${label} score">
        ${[0, 1, 2]
          .map(
            (score) => `
              <button
                type="button"
                class="${submission[question] === score ? "selected" : ""}"
                data-submission-id="${submission.id}"
                data-question="${question}"
                data-score="${score}"
              >
                ${score}
              </button>
            `
          )
          .join("")}
      </div>
      <div class="feedback-panel">
        <label>
          Saved feedback
          <select data-template-picker="${submission.id}-${questionKey}">
            <option value="">Choose a repeated comment</option>
            ${feedbackTemplates.map((template) => `
              <option value="${template.templateText}">${template.templateText}</option>
            `).join("")}
          </select>
        </label>
        <label>
          Feedback if needed
          <textarea
            data-feedback-input="${submission.id}-${questionKey}"
            rows="3"
            placeholder="Write a short note for this answer"
          >${feedback}</textarea>
        </label>
        <label>
          Upload corrected photo
          <input
            data-photo-input="${submission.id}-${questionKey}"
            type="file"
            accept="image/*"
          />
        </label>
        <input
          data-photo-name="${submission.id}-${questionKey}"
          value="${correctionPhoto}"
          placeholder="No corrected photo uploaded"
          readonly
        />
        <button
          class="save-feedback-button"
          type="button"
          data-save-notes="${submission.id}"
          data-question-key="${questionKey}"
        >
          Save feedback
        </button>
      </div>
    </section>
  `;
}

function renderAnswerImage(imageText) {
  if (String(imageText || "").startsWith("/uploads/")) {
    return `<img src="${imageText}" alt="Uploaded answer photo" />`;
  }

  return `<p>${imageText}</p>`;
}

gradingWindowForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  gradingWindowMessage.textContent = "Opening answer window...";

  const response = await fetch("/api/grading/windows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(gradingWindowForm))),
  });
  const result = await response.json();

  if (!response.ok) {
    gradingWindowMessage.textContent = result.message || "Could not open answer window.";
    return;
  }

  gradingWindowForm.reset();
  gradingWindowMessage.textContent = `Window ${result.window.id} is open until ${new Date(result.window.closesAt).toLocaleString()}.`;
  await fetchSubmissions();
});

sessionScheduleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  sessionScheduleMessage.textContent = "Saving Zoom session...";

  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(sessionScheduleForm))),
  });
  const result = await response.json();

  if (!response.ok) {
    sessionScheduleMessage.textContent = result.message || "Could not schedule this session.";
    return;
  }

  sessionScheduleForm.reset();
  sessionScheduleMessage.textContent = `${result.session.title} saved. Link appears ${new Date(result.session.zoomRevealAt).toLocaleString()}.`;
});

archiveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  archiveMessage.textContent = "Saving recording...";

  const response = await fetch("/api/session-archives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(archiveForm))),
  });
  const result = await response.json();

  if (!response.ok) {
    archiveMessage.textContent = result.message || "Could not save recording.";
    return;
  }

  archiveForm.reset();
  archiveMessage.textContent = `${result.archive.title} added to the student archive.`;
});

materialForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  materialMessage.textContent = "Saving material...";

  const response = await fetch("/api/library-materials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(materialForm))),
  });
  const result = await response.json();

  if (!response.ok) {
    materialMessage.textContent = result.message || "Could not save material.";
    return;
  }

  materialForm.reset();
  materialMessage.textContent = `${result.material.title} added to the library.`;
});

manualAttendanceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  manualAttendanceMessage.textContent = "Saving attendance...";

  const response = await fetch("/api/grading/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(manualAttendanceForm))),
  });
  const result = await response.json();

  if (!response.ok) {
    manualAttendanceMessage.textContent = result.message || "Could not mark attendance.";
    return;
  }

  manualAttendanceForm.reset();
  manualAttendanceMessage.textContent = `${result.submission.studentName} marked present.`;
  await fetchSubmissions();
});

gradingList.addEventListener("click", async (event) => {
  const scoreButton = event.target.closest("[data-submission-id]");
  const saveButton = event.target.closest("[data-save-notes]");

  if (scoreButton) {
    await fetch(`/api/grading/submissions/${scoreButton.dataset.submissionId}/score`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: scoreButton.dataset.question,
        score: scoreButton.dataset.score,
      }),
    });

    await fetchSubmissions();
    return;
  }

  if (!saveButton) {
    return;
  }

  const fieldKey = `${saveButton.dataset.saveNotes}-${saveButton.dataset.questionKey}`;
  const feedback = document.querySelector(`[data-feedback-input="${fieldKey}"]`).value;
  const photoInput = document.querySelector(`[data-photo-input="${fieldKey}"]`);

  if (photoInput.files.length) {
    const formData = new FormData();
    formData.append("question", saveButton.dataset.questionKey);
    formData.append("feedback", feedback);
    formData.append("correctionPhoto", photoInput.files[0]);

    await fetch(`/api/grading/submissions/${saveButton.dataset.saveNotes}/correction-photo`, {
      method: "POST",
      body: formData,
    });
  } else {
    const correctionPhoto = document.querySelector(`[data-photo-name="${fieldKey}"]`).value;

    await fetch(`/api/grading/submissions/${saveButton.dataset.saveNotes}/notes`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: saveButton.dataset.questionKey,
        feedback,
        correctionPhoto,
      }),
    });
  }

  await fetchSubmissions();
});

gradingList.addEventListener("change", (event) => {
  const input = event.target.closest("[data-photo-input]");
  const templatePicker = event.target.closest("[data-template-picker]");

  if (templatePicker && templatePicker.value) {
    const feedbackInput = document.querySelector(`[data-feedback-input="${templatePicker.dataset.templatePicker}"]`);
    feedbackInput.value = templatePicker.value;
    return;
  }

  if (!input || !input.files.length) {
    return;
  }

  const photoName = document.querySelector(`[data-photo-name="${input.dataset.photoInput}"]`);
  photoName.value = input.files[0].name;
});

fetchSubmissions();
