const resultsList = document.querySelector("#kid-results-list");
const studentCodeInput = document.querySelector("#student-code");
const quizResultsList = document.querySelector("#quiz-results-list");

async function fetchResults() {
  const params = new URLSearchParams({ studentCode: studentCodeInput.value.trim() });
  const response = await fetch(`/api/my-results?${params.toString()}`);
  const quizResponse = await fetch(`/api/quiz-results?${params.toString()}`);

  if (!response.ok) {
    resultsList.innerHTML = `<p class="empty-state">We could not load your results.</p>`;
    return;
  }

  const { results } = await response.json();
  const { quizResults } = quizResponse.ok ? await quizResponse.json() : { quizResults: [] };
  renderResults(results);
  renderQuizResults(quizResults);
}

function renderResults(results) {
  if (results.length === 0) {
    resultsList.innerHTML = `<p class="empty-state">No corrected answers found for this code yet.</p>`;
    return;
  }

  resultsList.innerHTML = results.map(renderResultCard).join("");
}

function renderResultCard(result) {
  return `
    <article class="kid-result-card">
      <div class="kid-result-hero">
        <div>
          <span class="record-id">${result.studentCode} - ${result.sessionTitle}</span>
          <h2>${result.kidHeadline}</h2>
          <p>${result.kidMessage}</p>
        </div>
        <strong>${result.total}/${result.max}</strong>
      </div>
      <div class="kid-question-grid">
        ${renderQuestionResult("Question 1", result.q1Score, result.q1CorrectionPhoto, result.q1Feedback)}
        ${renderQuestionResult("Question 2", result.q2Score, result.q2CorrectionPhoto, result.q2Feedback)}
      </div>
    </article>
  `;
}

function renderQuestionResult(label, score, correctionPhoto, feedback) {
  const displayScore = score === null ? "Checking" : `${score}/2`;
  const correction = correctionPhoto || "No corrected photo yet";
  const note = feedback || "No extra feedback yet.";

  return `
    <section class="kid-question-card">
      <span>${label}</span>
      <strong>${displayScore}</strong>
      <p class="correction-photo-label">${correction}</p>
      <p>${note}</p>
    </section>
  `;
}

function renderQuizResults(quizResults) {
  if (!quizResults.length) {
    quizResultsList.innerHTML = `<p class="empty-state">No quiz grades found for this code yet.</p>`;
    return;
  }

  quizResultsList.innerHTML = quizResults
    .map(
      (result) => `
        <article class="kid-result-card">
          <div class="kid-result-hero">
            <div>
              <span class="record-id">${result.studentCode} - ${result.sessionTitle}</span>
              <h2>${result.quizTitle}</h2>
              <p>Submitted ${new Date(result.submittedAt).toLocaleString()}</p>
            </div>
            <strong>${result.score}/${result.maxScore}</strong>
          </div>
          <div class="kid-question-grid">
            ${result.answers.map((answer) => `
              <section class="kid-question-card">
                <span>Quiz question</span>
                <p>${answer.prompt}</p>
                <strong>${answer.score}/1</strong>
                <p>Your answer: ${answer.answer || "No answer"}</p>
                <p>${answer.feedback}</p>
              </section>
            `).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

studentCodeInput.addEventListener("input", fetchResults);
fetchResults();
