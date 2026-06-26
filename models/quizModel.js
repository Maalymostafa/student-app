const db = require("../database/client");

async function getQuizzes() {
  const rows = await db.all("SELECT * FROM quizzes ORDER BY rowid DESC");
  return Promise.all(rows.map(async (quiz) => addQuizState(await hydrateQuiz(quiz))));
}

async function getQuiz(quizId) {
  const quiz = await db.get("SELECT * FROM quizzes WHERE id = ?", [quizId]);
  return quiz ? addQuizState(await hydrateQuiz(quiz)) : null;
}

async function createQuiz(data) {
  const quiz = {
    id: await getNextId("QUIZ", "quizzes", 5000),
    title: data.title,
    sessionTitle: data.sessionTitle,
    schoolGrade: data.schoolGrade,
    closesAt: data.closesAt,
  };

  await db.run(`
    INSERT INTO quizzes (id, title, sessionTitle, schoolGrade, closesAt)
    VALUES (@id, @title, @sessionTitle, @schoolGrade, @closesAt)
  `, quiz);

  return getQuiz(quiz.id);
}

async function updateQuiz(quizId, updates) {
  const quiz = await getQuiz(quizId);

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

  await db.run(`
    UPDATE quizzes
    SET title = @title, sessionTitle = @sessionTitle, schoolGrade = @schoolGrade, closesAt = @closesAt
    WHERE id = @id
  `, nextQuiz);

  return getQuiz(quizId);
}

async function deleteQuiz(quizId) {
  const quiz = await getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  await db.run("DELETE FROM quiz_submissions WHERE quizId = ?", [quizId]);
  await db.run("DELETE FROM quiz_late_requests WHERE quizId = ?", [quizId]);
  await db.run("DELETE FROM quizzes WHERE id = ?", [quizId]);
  return quiz;
}

async function addQuestion(quizId, data) {
  const quiz = await getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  const question = buildQuestion(data, quiz.questions.length + 1);
  await db.run(`
    INSERT INTO quiz_questions (id, quizId, type, prompt, choicesJson, correctAnswer, modelAnswer, position)
    VALUES (@id, @quizId, @type, @prompt, @choicesJson, @correctAnswer, @modelAnswer, @position)
  `, {
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

async function updateQuestion(quizId, questionId, data) {
  const quiz = await getQuiz(quizId);

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

  await db.run(`
    UPDATE quiz_questions
    SET type = @type, prompt = @prompt, choicesJson = @choicesJson, correctAnswer = @correctAnswer, modelAnswer = @modelAnswer
    WHERE id = @id AND quizId = @quizId
  `, {
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

async function deleteQuestion(quizId, questionId) {
  const quiz = await getQuiz(quizId);

  if (!quiz || !quiz.questions.some((question) => question.id === questionId)) {
    return null;
  }

  await db.run("DELETE FROM quiz_questions WHERE quizId = ? AND id = ?", [quizId, questionId]);
  return getQuiz(quizId);
}

async function submitQuiz(quizId, studentCode, answers) {
  const quiz = await getQuiz(quizId);

  if (!quiz) {
    return { error: "Quiz not found" };
  }

  if (quiz.closed && !(await hasApprovedLateRequest(quizId, studentCode))) {
    return { error: "Quiz is closed. Send a late permission request first." };
  }

  const gradedAnswers = quiz.questions.map((question) => gradeAnswer(question, answers[question.id]));
  const score = gradedAnswers.reduce((sum, answer) => sum + answer.score, 0);
  const maxScore = quiz.questions.length;
  const submission = {
    id: await getNextId("QSUB", "quiz_submissions", 0, 4),
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

  await db.run(`
    INSERT INTO quiz_submissions (
      id, quizId, quizTitle, sessionTitle, schoolGrade, studentCode, submittedAt, score, maxScore, percentage, answersJson
    )
    VALUES (
      @id, @quizId, @quizTitle, @sessionTitle, @schoolGrade, @studentCode, @submittedAt, @score, @maxScore, @percentage, @answersJson
    )
  `, submission);

  return { submission: mapSubmission(submission) };
}

async function createLateRequest(quizId, studentCode, reason) {
  const quiz = await getQuiz(quizId);

  if (!quiz) {
    return null;
  }

  const request = {
    id: await getNextId("LATE", "quiz_late_requests", 0, 4),
    quizId,
    quizTitle: quiz.title,
    studentCode,
    reason,
    status: "Pending",
    requestedAt: new Date().toISOString(),
  };

  await db.run(`
    INSERT INTO quiz_late_requests (id, quizId, quizTitle, studentCode, reason, status, requestedAt)
    VALUES (@id, @quizId, @quizTitle, @studentCode, @reason, @status, @requestedAt)
  `, request);

  return request;
}

async function updateLateRequest(requestId, status) {
  const request = await db.get("SELECT * FROM quiz_late_requests WHERE id = ?", [requestId]);
  const allowedStatuses = ["Approved", "Rejected"];

  if (!request || !allowedStatuses.includes(status)) {
    return null;
  }

  await db.run("UPDATE quiz_late_requests SET status = ? WHERE id = ?", [status, requestId]);
  return db.get("SELECT * FROM quiz_late_requests WHERE id = ?", [requestId]);
}

async function getLateRequests() {
  return db.all("SELECT * FROM quiz_late_requests ORDER BY requestedAt DESC, rowid DESC");
}

async function getQuizResults(studentCode) {
  const rows = await db.all("SELECT * FROM quiz_submissions WHERE studentCode = ? ORDER BY submittedAt DESC, rowid DESC", [studentCode]);
  return rows.map(mapSubmission);
}

async function hydrateQuiz(quiz) {
  const rows = await db.all("SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY position, rowid", [quiz.id]);
  const questions = rows.map(mapQuestion);

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

async function hasApprovedLateRequest(quizId, studentCode) {
  return Boolean(
    await db.get(`
      SELECT id FROM quiz_late_requests
      WHERE quizId = ? AND studentCode = ? AND status = 'Approved'
    `, [quizId, studentCode])
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

async function getNextId(prefix, tableName, startNumber, padLength = 0) {
  const rows = await db.all(`SELECT id FROM ${tableName} WHERE id LIKE ?`, [`${prefix}-%`]);
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
