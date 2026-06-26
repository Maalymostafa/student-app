const attemptForm = document.querySelector("#quiz-attempt");
const studentCodeInput = document.querySelector("#student-code");
let activeQuiz = null;

async function fetchQuiz() {
  const setupResponse = await fetch("/api/quizzes/QUIZ-5001");

  if (!setupResponse.ok) {
    attemptForm.innerHTML = `<p class="empty-state">No quiz is available now.</p>`;
    return;
  }

  const { quiz } = await setupResponse.json();
  activeQuiz = quiz;
  renderQuiz(quiz);
}

function renderQuiz(quiz) {
  attemptForm.innerHTML = `
    <div class="quiz-attempt-header">
      <div>
        <p class="eyebrow">${quiz.schoolGrade}</p>
        <h2>${quiz.title}</h2>
        <p>${quiz.sessionTitle} - closes ${new Date(quiz.closesAt).toLocaleString()}</p>
      </div>
      <span class="status-badge ${quiz.status.toLowerCase()}">${quiz.status}</span>
    </div>
    ${
      quiz.questions.length
        ? quiz.questions.map(renderQuestion).join("")
        : `<p class="empty-state">This quiz has no questions yet.</p>`
    }
    <button type="submit">Submit quiz</button>
    <div class="late-request-box">
      <label>
        Late reason
        <textarea id="late-reason" rows="3" placeholder="Explain why you need permission after the close time"></textarea>
      </label>
      <button type="button" id="late-request-button">Ask Miss Hoda for permission</button>
    </div>
    <p class="form-message" id="quiz-result-message"></p>
  `;
}

function renderQuestion(question, index) {
  if (question.type === "essay") {
    return `
      <label class="quiz-question">
        <span>${index + 1}. ${question.prompt}</span>
        <textarea name="${question.id}" rows="3"></textarea>
      </label>
    `;
  }

  return `
    <fieldset class="quiz-question">
      <legend>${index + 1}. ${question.prompt}</legend>
      ${question.choices.map((choice) => `
        <label class="payment-check">
          <input type="radio" name="${question.id}" value="${choice}" />
          <span>${choice}</span>
        </label>
      `).join("")}
    </fieldset>
  `;
}

attemptForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(attemptForm);
  const answers = {};
  activeQuiz.questions.forEach((question) => {
    answers[question.id] = formData.get(question.id) || "";
  });

  const response = await fetch(`/api/quizzes/${activeQuiz.id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentCode: studentCodeInput.value.trim(), answers }),
  });
  const result = await response.json();
  const message = document.querySelector("#quiz-result-message");

  if (!response.ok) {
    message.textContent = result.error || "Could not submit quiz.";
    return;
  }

  message.textContent = `Submitted. Score: ${result.submission.score}/${result.submission.maxScore}`;
});

attemptForm.addEventListener("click", async (event) => {
  const button = event.target.closest("#late-request-button");

  if (!button) {
    return;
  }

  const reason = document.querySelector("#late-reason").value.trim();
  const response = await fetch(`/api/quizzes/${activeQuiz.id}/late-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentCode: studentCodeInput.value.trim(), reason }),
  });
  const message = document.querySelector("#quiz-result-message");
  message.textContent = response.ok ? "Late request sent to the teacher." : "Could not send late request.";
});

fetchQuiz();
