const childTabs = document.querySelector("#child-tabs");
const childResults = document.querySelector("#parent-child-results");

let portalChildren = [];
let activeStudentCode = "";

async function fetchParentOverview() {
  const response = await fetch("/api/parent/overview");

  if (!response.ok) {
    childResults.innerHTML = `<p class="empty-state">You do not have access to this parent portal.</p>`;
    return;
  }

  const { children } = await response.json();
  portalChildren = children;
  activeStudentCode = children[0] ? children[0].studentCode : "";
  renderPortal();
}

function renderPortal() {
  if (portalChildren.length === 0) {
    childTabs.innerHTML = "";
    childResults.innerHTML = `<p class="empty-state">No children linked to this parent account yet.</p>`;
    return;
  }

  childTabs.innerHTML = portalChildren
    .map(
      (child) => `
        <button
          type="button"
          class="${child.studentCode === activeStudentCode ? "selected" : ""}"
          data-child-code="${child.studentCode}"
        >
          ${child.studentName}
        </button>
      `
    )
    .join("");

  const activeChild = portalChildren.find((child) => child.studentCode === activeStudentCode);
  childResults.innerHTML = renderChild(activeChild);
}

function renderChild(child) {
  const results = child.results.length
    ? child.results.map(renderResult).join("")
    : `<p class="empty-state">No results available yet for ${child.studentName}.</p>`;

  return `
    <article class="parent-child-card">
      <div class="student-main">
        <div>
          <span class="record-id">${child.studentCode} - ${child.grade}</span>
          <h3>${child.studentName}</h3>
          <p>Corrected answers and teacher feedback.</p>
        </div>
      </div>
      <div class="kid-results-list">${results}</div>
    </article>
  `;
}

function renderResult(result) {
  return `
    <section class="kid-result-card">
      <div class="kid-result-hero">
        <div>
          <span class="record-id">${result.sessionTitle}</span>
          <h2>${result.kidHeadline}</h2>
          <p>${result.kidMessage}</p>
        </div>
        <strong>${result.total}/${result.max}</strong>
      </div>
      <div class="kid-question-grid">
        ${renderQuestion("Question 1", result.q1Score, result.q1CorrectionPhoto, result.q1Feedback)}
        ${renderQuestion("Question 2", result.q2Score, result.q2CorrectionPhoto, result.q2Feedback)}
      </div>
    </section>
  `;
}

function renderQuestion(label, score, correctionPhoto, feedback) {
  return `
    <section class="kid-question-card">
      <span>${label}</span>
      <strong>${score === null ? "Checking" : `${score}/2`}</strong>
      <p class="correction-photo-label">${correctionPhoto || "No corrected photo yet"}</p>
      <p>${feedback || "No extra feedback yet."}</p>
    </section>
  `;
}

childTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-child-code]");

  if (!button) {
    return;
  }

  activeStudentCode = button.dataset.childCode;
  renderPortal();
});

fetchParentOverview();
