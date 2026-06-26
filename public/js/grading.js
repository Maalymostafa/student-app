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
    </section>
  `;
}

gradingList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-submission-id]");

  if (!button) {
    return;
  }

  await fetch(`/api/grading/submissions/${button.dataset.submissionId}/score`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: button.dataset.question,
      score: button.dataset.score,
    }),
  });

  await fetchSubmissions();
});

fetchSubmissions();
