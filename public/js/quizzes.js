const quizForm = document.querySelector("#quiz-form");
const quizMessage = document.querySelector("#quiz-message");
const quizList = document.querySelector("#quiz-list");
const lateRequestList = document.querySelector("#late-request-list");

async function fetchQuizzes() {
  const response = await fetch("/api/quizzes");

  if (!response.ok) {
    quizList.innerHTML = `<p class="empty-state">You do not have access to quizzes.</p>`;
    return;
  }

  const { quizzes, lateRequests } = await response.json();
  renderQuizzes(quizzes);
  renderLateRequests(lateRequests);
}

function renderQuizzes(quizzes) {
  quizList.innerHTML = quizzes.map(renderQuiz).join("");
}

function renderQuiz(quiz) {
  return `
    <article class="quiz-card">
      <div class="student-main">
        <div>
          <span class="record-id">${quiz.id} - ${quiz.schoolGrade}</span>
          <h3>${quiz.title}</h3>
          <p>${quiz.sessionTitle} - closes ${formatDate(quiz.closesAt)}</p>
        </div>
        <span class="status-badge ${quiz.status.toLowerCase()}">${quiz.status}</span>
      </div>
      <div class="quiz-question-list">
        ${
          quiz.questions.length
            ? quiz.questions.map((question) => `<p>${question.type}: ${question.prompt}</p>`).join("")
            : `<p>No questions yet.</p>`
        }
      </div>
      <form class="question-form" data-question-form="${quiz.id}">
        <label>
          Question type
          <select name="type" data-question-type="${quiz.id}">
            <option value="multiple_choice">Multiple choice</option>
            <option value="essay">Essay</option>
            <option value="completion">Complete sentence</option>
          </select>
        </label>
        <label>
          Question / sentence
          <textarea name="prompt" rows="2" placeholder="Write the question, or the sentence with ____" required></textarea>
        </label>
        <div class="choice-fields" data-choice-fields="${quiz.id}">
          <input name="choice1" placeholder="Choice 1" />
          <input name="choice2" placeholder="Choice 2" />
          <input name="choice3" placeholder="Choice 3" />
          <input name="choice4" placeholder="Choice 4" />
          <input name="correctAnswer" placeholder="Correct choice" />
        </div>
        <div class="model-answer-field hidden" data-model-answer-field="${quiz.id}">
          <input name="modelAnswer" placeholder="Model answer" />
        </div>
        <div class="completion-field hidden" data-completion-field="${quiz.id}">
          <input name="completionAnswer" placeholder="Missing word / correct answer" />
        </div>
        <button type="submit">Add question</button>
      </form>
    </article>
  `;
}

function renderLateRequests(requests) {
  lateRequestList.innerHTML = requests.length
    ? requests.map(renderLateRequest).join("")
    : `<p class="empty-state">No late requests yet.</p>`;
}

function renderLateRequest(request) {
  return `
    <article class="quiz-card">
      <div class="student-main">
        <div>
          <span class="record-id">${request.id} - ${request.studentCode}</span>
          <h3>${request.quizTitle}</h3>
          <p>${request.reason}</p>
        </div>
        <span class="status-badge ${request.status.toLowerCase()}">${request.status}</span>
      </div>
      <div class="support-actions">
        <button type="button" data-late-request="${request.id}" data-status="Approved">Approve</button>
        <button type="button" data-late-request="${request.id}" data-status="Rejected">Reject</button>
      </div>
    </article>
  `;
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

quizForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await fetch("/api/quizzes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(quizForm))),
  });
  quizForm.reset();
  quizMessage.textContent = "Quiz created.";
  await fetchQuizzes();
});

quizList.addEventListener("change", (event) => {
  const select = event.target.closest("[data-question-type]");

  if (!select) {
    return;
  }

  const quizId = select.dataset.questionType;
  document.querySelector(`[data-choice-fields="${quizId}"]`).classList.toggle("hidden", select.value !== "multiple_choice");
  document.querySelector(`[data-model-answer-field="${quizId}"]`).classList.toggle("hidden", select.value !== "essay");
  document.querySelector(`[data-completion-field="${quizId}"]`).classList.toggle("hidden", select.value !== "completion");
});

quizList.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-question-form]");

  if (!form) {
    return;
  }

  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  if (data.type === "completion") {
    data.correctAnswer = data.completionAnswer;
  }

  await fetch(`/api/quizzes/${form.dataset.questionForm}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await fetchQuizzes();
});

lateRequestList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-late-request]");

  if (!button) {
    return;
  }

  await fetch(`/api/quiz-late-requests/${button.dataset.lateRequest}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: button.dataset.status }),
  });
  await fetchQuizzes();
});

fetchQuizzes();
