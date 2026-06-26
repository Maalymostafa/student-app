const quizzes = [
  {
    id: "QUIZ-5001",
    title: "Session 1 Quick Quiz",
    sessionTitle: "Zoom Webinar - Session 1",
    schoolGrade: "Grade 4",
    closesAt: "2099-12-31T16:00",
    status: "Open",
    questions: [
      {
        id: "Q-1",
        type: "multiple_choice",
        prompt: "Choose the correct past form of go.",
        choices: ["goed", "went", "goes", "going"],
        correctAnswer: "went",
      },
      {
        id: "Q-2",
        type: "completion",
        prompt: "I ____ my homework yesterday.",
        choices: ["do", "did", "does", "doing"],
        correctAnswer: "did",
      },
      {
        id: "Q-3",
        type: "essay",
        prompt: "Write one sentence about your last weekend.",
        modelAnswer: "I visited my family last weekend.",
      },
    ],
  },
];

let submissions = [];
let lateRequests = [];

function getQuizzes() {
  return quizzes.map(addQuizState);
}

function getQuiz(quizId) {
  const quiz = quizzes.find((item) => item.id === quizId);
  return quiz ? addQuizState(quiz) : null;
}

function createQuiz(data) {
  const quiz = {
    id: `QUIZ-${5000 + quizzes.length + 1}`,
    title: data.title,
    sessionTitle: data.sessionTitle,
    schoolGrade: data.schoolGrade,
    closesAt: data.closesAt,
    status: "Open",
    questions: [],
  };

  quizzes.unshift(quiz);
  return addQuizState(quiz);
}

function addQuestion(quizId, data) {
  const quiz = quizzes.find((item) => item.id === quizId);

  if (!quiz) {
    return null;
  }

  const question = buildQuestion(data, quiz.questions.length + 1);
  quiz.questions.push(question);
  return addQuizState(quiz);
}

function submitQuiz(quizId, studentCode, answers) {
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return { error: "Quiz not found" };
  }

  if (quiz.closed && !hasApprovedLateRequest(quizId, studentCode)) {
    return { error: "Quiz is closed. Send a late permission request first." };
  }

  const gradedAnswers = quiz.questions.map((question) => gradeAnswer(question, answers[question.id]));
  const score = gradedAnswers.reduce((sum, answer) => sum + answer.score, 0);
  const maxScore = quiz.questions.length;
  const submission = {
    id: `QSUB-${String(submissions.length + 1).padStart(4, "0")}`,
    quizId,
    quizTitle: quiz.title,
    sessionTitle: quiz.sessionTitle,
    schoolGrade: quiz.schoolGrade,
    studentCode,
    submittedAt: new Date().toISOString(),
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    answers: gradedAnswers,
  };

  submissions.unshift(submission);
  return { submission };
}

function createLateRequest(quizId, studentCode, reason) {
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  const request = {
    id: `LATE-${String(lateRequests.length + 1).padStart(4, "0")}`,
    quizId,
    quizTitle: quiz.title,
    studentCode,
    reason,
    status: "Pending",
    requestedAt: new Date().toISOString(),
  };

  lateRequests.unshift(request);
  return request;
}

function updateLateRequest(requestId, status) {
  const request = lateRequests.find((item) => item.id === requestId);
  const allowedStatuses = ["Approved", "Rejected"];

  if (!request || !allowedStatuses.includes(status)) {
    return null;
  }

  request.status = status;
  return request;
}

function getLateRequests() {
  return lateRequests;
}

function getQuizResults(studentCode) {
  return submissions.filter((submission) => submission.studentCode === studentCode);
}

function buildQuestion(data, number) {
  const base = {
    id: `Q-${Date.now()}-${number}`,
    type: data.type,
    prompt: data.prompt,
  };

  if (data.type === "multiple_choice") {
    return {
      ...base,
      choices: [data.choice1, data.choice2, data.choice3, data.choice4].filter(Boolean),
      correctAnswer: data.correctAnswer,
    };
  }

  if (data.type === "completion") {
    return {
      ...base,
      choices: buildCompletionChoices(data.correctAnswer),
      correctAnswer: data.correctAnswer,
    };
  }

  return {
    ...base,
    modelAnswer: data.modelAnswer,
  };
}

function buildCompletionChoices(correctAnswer) {
  const fillerChoices = ["is", "are", "was", "were", "do", "does", "did", "have", "has"];
  const choices = [correctAnswer, ...fillerChoices.filter((choice) => choice !== correctAnswer)];
  return choices.slice(0, 4);
}

function gradeAnswer(question, rawAnswer) {
  const answer = (rawAnswer || "").trim();

  if (question.type === "essay") {
    const modelAnswer = (question.modelAnswer || "").toLowerCase();
    const normalized = answer.toLowerCase();
    const score = normalized && normalized === modelAnswer ? 1 : 0;

    return {
      questionId: question.id,
      prompt: question.prompt,
      answer,
      correctAnswer: question.modelAnswer,
      score,
      feedback: score ? "Matches the model answer." : "Teacher should review this written answer.",
    };
  }

  const correctAnswer = question.correctAnswer || "";
  const score = answer.toLowerCase() === correctAnswer.toLowerCase() ? 1 : 0;

  return {
    questionId: question.id,
    prompt: question.prompt,
    answer,
    correctAnswer,
    score,
    feedback: score ? "Correct" : "Review the correct answer.",
  };
}

function hasApprovedLateRequest(quizId, studentCode) {
  return lateRequests.some(
    (request) =>
      request.quizId === quizId &&
      request.studentCode === studentCode &&
      request.status === "Approved"
  );
}

function addQuizState(quiz) {
  const closed = new Date(quiz.closesAt).getTime() < Date.now();

  return {
    ...quiz,
    closed,
    status: closed ? "Closed" : "Open",
  };
}

module.exports = {
  addQuestion,
  createLateRequest,
  createQuiz,
  getLateRequests,
  getQuiz,
  getQuizResults,
  getQuizzes,
  submitQuiz,
  updateLateRequest,
};
