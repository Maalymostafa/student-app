const gradingList = document.querySelector("#grading-list");

async function fetchSubmissions() {
  const response = await fetch("/api/grading/submissions");

  if (!response.ok) {
    gradingList.innerHTML = `<p class="empty-state">You do not have access to grading.</p>`;
    return;
  }

  const { submissions } = await response.json();
  renderSubmissions(submissions);
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
        <p>${imageText}</p>
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

  await fetchSubmissions();
});

gradingList.addEventListener("change", (event) => {
  const input = event.target.closest("[data-photo-input]");

  if (!input || !input.files.length) {
    return;
  }

  const photoName = document.querySelector(`[data-photo-name="${input.dataset.photoInput}"]`);
  photoName.value = input.files[0].name;
});

fetchSubmissions();
