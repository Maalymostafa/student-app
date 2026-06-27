const resultsList = document.querySelector("#kid-results-list");
const studentCodeInput = document.querySelector("#student-code");
const quizResultsList = document.querySelector("#quiz-results-list");
const monthSummaryList = document.querySelector("#month-summary-list");
const accountStatusTitle = document.querySelector("#account-status-title");
const accountStatusMessage = document.querySelector("#account-status-message");
const accountStatusBadge = document.querySelector("#account-status-badge");
const accountStatusDetails = document.querySelector("#account-status-details");
const nextSessionTitle = document.querySelector("#next-session-title");
const nextSessionMessage = document.querySelector("#next-session-message");
const nextSessionBadge = document.querySelector("#next-session-badge");
const nextSessionDetails = document.querySelector("#next-session-details");
const archiveList = document.querySelector("#archive-list");
const libraryList = document.querySelector("#library-list");

async function fetchResults() {
  const params = new URLSearchParams({ studentCode: studentCodeInput.value.trim() });
  const response = await fetch(`/api/my-results?${params.toString()}`);
  const quizResponse = await fetch(`/api/quiz-results?${params.toString()}`);

  if (!response.ok) {
    resultsList.innerHTML = `<p class="empty-state">We could not load your results.</p>`;
    return;
  }

  const { results, monthlySummary, accountOverview, nextSession, resources } = await response.json();
  const { quizResults } = quizResponse.ok ? await quizResponse.json() : { quizResults: [] };
  renderAccountOverview(accountOverview);
  renderNextSession(nextSession);
  renderArchives(resources ? resources.archives : []);
  renderLibrary(resources ? resources.materials : []);
  renderMonthlySummary(monthlySummary || []);
  renderResults(results);
  renderQuizResults(quizResults);
}

function renderArchives(archives) {
  if (!archives.length) {
    archiveList.innerHTML = `<p class="empty-state">No recorded lessons yet.</p>`;
    return;
  }

  archiveList.innerHTML = archives.map((archive) => `
    <article class="kid-question-card">
      <span>${new Date(archive.sessionDate).toLocaleDateString()}</span>
      <strong>${archive.title}</strong>
      <p>${archive.description || "Recorded session"}</p>
      <a class="secondary-link" href="${archive.youtubeUrl}" target="_blank" rel="noreferrer">Open YouTube</a>
    </article>
  `).join("");
}

function renderLibrary(materials) {
  if (!materials.length) {
    libraryList.innerHTML = `<p class="empty-state">No library materials yet.</p>`;
    return;
  }

  libraryList.innerHTML = materials.map((material) => `
    <article class="kid-question-card">
      <span>${material.category}</span>
      <strong>${material.title}</strong>
      <p>${material.description || "Study material"}</p>
      <a class="secondary-link" href="${material.materialUrl}" target="_blank" rel="noreferrer">Open material</a>
    </article>
  `).join("");
}

function renderAccountOverview(account) {
  if (!account) {
    accountStatusTitle.textContent = "No account data";
    accountStatusMessage.textContent = "We could not load the account state.";
    return;
  }

  accountStatusTitle.textContent = account.stopRisk ? "Payment needed" : account.accountStatus || "Account";
  accountStatusMessage.textContent = account.message;
  accountStatusBadge.textContent = account.stopRisk ? "May pause soon" : account.accountStatus || "Active";
  accountStatusBadge.className = `status-badge ${account.stopRisk ? "rejected" : statusClass(account.accountStatus)}`;
  accountStatusDetails.innerHTML = `
    <div>
      <dt>Required</dt>
      <dd>${formatMoney(account.required)}</dd>
    </div>
    <div>
      <dt>Verified paid</dt>
      <dd>${formatMoney(account.verifiedPaid)}</dd>
    </div>
    <div>
      <dt>Pending review</dt>
      <dd>${formatMoney(account.pendingPaid)}</dd>
    </div>
    <div>
      <dt>Remaining</dt>
      <dd>${formatMoney(account.remaining)}</dd>
    </div>
  `;
}

function renderNextSession(session) {
  if (!session) {
    nextSessionTitle.textContent = "No session scheduled";
    nextSessionMessage.textContent = "The academy has not published the next session yet.";
    nextSessionBadge.textContent = "Waiting";
    nextSessionDetails.innerHTML = "";
    return;
  }

  nextSessionTitle.textContent = session.title;
  nextSessionMessage.textContent = session.zoomHiddenMessage;
  nextSessionBadge.textContent = session.zoomVisible ? "Zoom ready" : "Link hidden";
  nextSessionBadge.className = `status-badge ${session.zoomVisible ? "confirmed" : "pending"}`;
  nextSessionDetails.innerHTML = `
    <div>
      <dt>Grade</dt>
      <dd>${session.schoolGrade}</dd>
    </div>
    <div>
      <dt>Time</dt>
      <dd>${new Date(session.startsAt).toLocaleString()}</dd>
    </div>
    <div>
      <dt>Zoom link</dt>
      <dd>${session.zoomVisible ? `<a href="${session.displayZoomLink}" target="_blank" rel="noreferrer">Open Zoom</a>` : "Not visible yet"}</dd>
    </div>
    <div>
      <dt>Shows at</dt>
      <dd>${new Date(session.zoomRevealAt).toLocaleString()}</dd>
    </div>
  `;
}

function renderMonthlySummary(months) {
  if (!months.length) {
    monthSummaryList.innerHTML = `<p class="empty-state">No monthly score yet.</p>`;
    return;
  }

  monthSummaryList.innerHTML = months.map((month) => `
    <article class="student-card">
      <div class="student-main">
        <div>
          <span class="record-id">${month.month}</span>
          <h3>${month.total}/${month.max}</h3>
          <p>Quiz ${month.quizPoints}/80 - Questions ${month.questionPoints}/16 - Attendance ${month.attendancePoints}/4</p>
        </div>
        <span class="status-badge ${month.prizeEligible ? "confirmed" : "pending"}">
          ${month.prizeEligible ? "Prize ready" : "In progress"}
        </span>
      </div>
    </article>
  `).join("");
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

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("active") || normalized.includes("confirmed")) {
    return "confirmed";
  }

  if (normalized.includes("waiting") || normalized.includes("pending") || normalized.includes("required")) {
    return "pending";
  }

  if (normalized.includes("rejected")) {
    return "rejected";
  }

  return "pending";
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString()} EGP`;
}

studentCodeInput.addEventListener("input", fetchResults);
fetchResults();
