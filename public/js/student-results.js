const resultsList = document.querySelector("#kid-results-list");
const studentCodeInput = document.querySelector("#student-code");

async function fetchResults() {
  const params = new URLSearchParams({ studentCode: studentCodeInput.value.trim() });
  const response = await fetch(`/api/my-results?${params.toString()}`);

  if (!response.ok) {
    resultsList.innerHTML = `<p class="empty-state">We could not load your results.</p>`;
    return;
  }

  const { results } = await response.json();
  renderResults(results);
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

studentCodeInput.addEventListener("input", fetchResults);
fetchResults();
