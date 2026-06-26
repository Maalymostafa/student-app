const db = require("../database/db");

function getQuizzes() {
  return db.prepare("SELECT * FROM quizzes ORDER BY rowid DESC").all().map(hydrateQuiz).map(addQuizState);
}

function getQuiz(quizId) {
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId);
  return quiz ? addQuizState(hydrateQuiz(quiz)) : null;
}

function createQuiz(data) {
  const quiz = {
    id: getNextId("QUIZ", "quizzes", 5000),
    title: data.title,
    sessionTitle: data.sessionTitle,
    schoolGrade: data.schoolGrade,
    closesAt: data.closesAt,
  };

  db.prepare(`
    INSERT INTO quizzes (id, title, sessionTitle, schoolGrade, closesAt)
    VALUES (@id, @title, @sessionTitle, @schoolGrade, @closesAt)
  `).run(quiz);

  return getQuiz(quiz.id);
}

function updateQuiz(quizId, updates) {
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  const nextQuiz = {
    ...quiz,
    title: updates.title !== undefined ? updates.title : quiz.title,
    sessionTitle: updates.sessionTitle !== undefined ? updates.sessionTitle : quiz.sessionTitle,
    schoolGrade: updates.schoolGrade !== undefined ? updates.schoolGrade : quiz.schoolGrade,
    closesAt: updates.closesAt !== undefined ? updates.closesAt : quiz.closesAt,
  };

  db.prepare(`
    UPDATE quizzes
    SET title = @title, sessionTitle = @sessionTitle, schoolGrade = @schoolGrade, closesAt = @closesAt
    WHERE id = @id
  `).run(nextQuiz);

  return getQuiz(quizId);
}

function deleteQuiz(quizId) {
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  db.prepare("DELETE FROM quiz_submissions WHERE quizId = ?").run(quizId);
  db.prepare("DELETE FROM quiz_late_requests WHERE quizId = ?").run(quizId);
  db.prepare("DELETE FROM quizzes WHERE id = ?").run(quizId);
  return quiz;
}

function addQuestion(quizId, data) {
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  const question = buildQuestion(data, quiz.questions.length + 1);
  db.prepare(`
    INSERT INTO quiz_questions (id, quizId, type, prompt, choicesJson, correctAnswer, modelAnswer, position)
    VALUES (@id, @quizId, @type, @prompt, @choicesJson, @correctAnswer, @modelAnswer, @position)
  `).run({
    id: question.id,
    quizId,
    type: question.type,
    prompt: question.prompt,
    choicesJson: JSON.stringify(question.choices || []),
    correctAnswer: question.correctAnswer || "",
    modelAnswer: question.modelAnswer || "",
    position: quiz.questions.length + 1,
  });

  return getQuiz(quizId);
}

function updateQuestion(quizId, questionId, data) {
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  const existingQuestion = quiz.questions.find((question) => question.id === questionId);

  if (!existingQuestion) {
    return null;
  }

  const position = quiz.questions.findIndex((question) => question.id === questionId) + 1;
  const question = {
    ...buildQuestion({ ...existingQuestion, ...data }, position),
    id: questionId,
  };

  db.prepare(`
    UPDATE quiz_questions
    SET type = @type, prompt = @prompt, choicesJson = @choicesJson, correctAnswer = @correctAnswer, modelAnswer = @modelAnswer
    WHERE id = @id AND quizId = @quizId
  `).run({
    id: questionId,
    quizId,
    type: question.type,
    prompt: question.prompt,
    choicesJson: JSON.stringify(question.choices || []),
    correctAnswer: question.correctAnswer || "",
    modelAnswer: question.modelAnswer || "",
  });

  return getQuiz(quizId);
}

function deleteQuestion(quizId, questionId) {
  const quiz = getQuiz(quizId);

  if (!quiz || !quiz.questions.some((question) => question.id === questionId)) {
    return null;
  }

  db.prepare("DELETE FROM quiz_questions WHERE quizId = ? AND id = ?").run(quizId, questionId);
  return getQuiz(quizId);
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
    id: getNextId("QSUB", "quiz_submissions", 0, 4),
    quizId,
    quizTitle: quiz.title,
    sessionTitle: quiz.sessionTitle,
    schoolGrade: quiz.schoolGrade,
    studentCode,
    submittedAt: new Date().toISOString(),
    score,
    maxScore,
    percentage: maxScore ? Math.round((score / maxScore) * 100) : 0,
    answersJson: JSON.stringify(gradedAnswers),
  };

  db.prepare(`
    INSERT INTO quiz_submissions (
      id, quizId, quizTitle, sessionTitle, schoolGrade, studentCode, submittedAt, score, maxScore, percentage, answersJson
    )
    VALUES (
      @id, @quizId, @quizTitle, @sessionTitle, @schoolGrade, @studentCode, @submittedAt, @score, @maxScore, @percentage, @answersJson
    )
  `).run(submission);

  return { submission: mapSubmission(submission) };
}

function createLateRequest(quizId, studentCode, reason) {
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  const request = {
    id: getNextId("LATE", "quiz_late_requests", 0, 4),
    quizId,
    quizTitle: quiz.title,
    studentCode,
    reason,
    status: "Pending",
    requestedAt: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO quiz_late_requests (id, quizId, quizTitle, studentCode, reason, status, requestedAt)
    VALUES (@id, @quizId, @quizTitle, @studentCode, @reason, @status, @requestedAt)
  `).run(request);

  return request;
}

function updateLateRequest(requestId, status) {
  const request = db.prepare("SELECT * FROM quiz_late_requests WHERE id = ?").get(requestId);
  const allowedStatuses = ["Approved", "Rejected"];

  if (!request || !allowedStatuses.includes(status)) {
    return null;
  }

  db.prepare("UPDATE quiz_late_requests SET status = ? WHERE id = ?").run(status, requestId);
  return db.prepare("SELECT * FROM quiz_late_requests WHERE id = ?").get(requestId);
}

function getLateRequests() {
  return db.prepare("SELECT * FROM quiz_late_requests ORDER BY requestedAt DESC, rowid DESC").all();
}

function getQuizResults(studentCode) {
  return db.prepare("SELECT * FROM quiz_submissions WHERE studentCode = ? ORDER BY submittedAt DESC, rowid DESC").all(studentCode).map(mapSubmission);
}

function hydrateQuiz(quiz) {
  const questions = db.prepare("SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY position, rowid").all(quiz.id).map(mapQuestion);

  return {
    ...quiz,
    questions,
  };
}

function mapQuestion(question) {
  const mapped = {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
  };

  const choices = JSON.parse(question.choicesJson || "[]");

  if (choices.length) {
    mapped.choices = choices;
  }

  if (question.correctAnswer) {
    mapped.correctAnswer = question.correctAnswer;
  }

  if (question.modelAnswer) {
    mapped.modelAnswer = question.modelAnswer;
  }

  return mapped;
}

function mapSubmission(submission) {
  return {
    id: submission.id,
    quizId: submission.quizId,
    quizTitle: submission.quizTitle,
    sessionTitle: submission.sessionTitle,
    schoolGrade: submission.schoolGrade,
    studentCode: submission.studentCode,
    submittedAt: submission.submittedAt,
    score: submission.score,
    maxScore: submission.maxScore,
    percentage: submission.percentage,
    answers: JSON.parse(submission.answersJson || "[]"),
  };
}

function buildQuestion(data, number) {
  const base = {
    id: data.id || `Q-${Date.now()}-${number}`,
    type: data.type,
    prompt: data.prompt,
  };

  if (data.type === "multiple_choice") {
    return {
      ...base,
      choices: [data.choice1, data.choice2, data.choice3, data.choice4].filter(Boolean).length
        ? [data.choice1, data.choice2, data.choice3, data.choice4].filter(Boolean)
        : data.choices || [],
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
  return choices.filter(Boolean).slice(0, 4);
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
  return Boolean(
    db.prepare(`
      SELECT id FROM quiz_late_requests
      WHERE quizId = ? AND studentCode = ? AND status = 'Approved'
    `).get(quizId, studentCode)
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

function getNextId(prefix, tableName, startNumber, padLength = 0) {
  const rows = db.prepare(`SELECT id FROM ${tableName} WHERE id LIKE ?`).all(`${prefix}-%`);
  const highestNumber = rows.reduce((highest, row) => {
    const number = Number(String(row.id).replace(`${prefix}-`, ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, startNumber);
  const nextNumber = highestNumber + 1;

  return `${prefix}-${padLength ? String(nextNumber).padStart(padLength, "0") : nextNumber}`;
}

module.exports = {
  addQuestion,
  createLateRequest,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  getLateRequests,
  getQuiz,
  getQuizResults,
  getQuizzes,
  submitQuiz,
  updateQuestion,
  updateLateRequest,
  updateQuiz,
};
