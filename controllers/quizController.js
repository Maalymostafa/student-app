const path = require("path");
const {
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
} = require("../models/quizModel");

function showQuizManager(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "quizzes.html"));
}

function showTakeQuiz(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "take-quiz.html"));
}

async function listQuizzes(req, res) {
  return res.json({ quizzes: await getQuizzes(), lateRequests: await getLateRequests() });
}

async function getStudentQuizResults(req, res) {
  return res.json({ quizResults: await getQuizResults(req.query.studentCode || "") });
}

async function create(req, res) {
  return res.json({ quiz: await createQuiz(req.body) });
}

async function update(req, res) {
  const quiz = await updateQuiz(req.params.id, req.body);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  return res.json({ quiz });
}

async function remove(req, res) {
  const quiz = await deleteQuiz(req.params.id);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  return res.json({ quiz });
}

async function createQuestion(req, res) {
  const quiz = await addQuestion(req.params.id, req.body);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  return res.json({ quiz });
}

async function updateExistingQuestion(req, res) {
  const quiz = await updateQuestion(req.params.id, req.params.questionId, req.body);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz or question not found" });
  }

  return res.json({ quiz });
}

async function removeQuestion(req, res) {
  const quiz = await deleteQuestion(req.params.id, req.params.questionId);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz or question not found" });
  }

  return res.json({ quiz });
}

async function getPublicQuiz(req, res) {
  const quiz = await getQuiz(req.params.id);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  return res.json({ quiz });
}

async function submit(req, res) {
  const result = await submitQuiz(req.params.id, req.body.studentCode, req.body.answers || {});

  if (result.error) {
    return res.status(400).json(result);
  }

  return res.json(result);
}

async function requestLateAccess(req, res) {
  const request = await createLateRequest(req.params.id, req.body.studentCode, req.body.reason);

  if (!request) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  return res.json({ request });
}

async function reviewLateAccess(req, res) {
  const request = await updateLateRequest(req.params.id, req.body.status);

  if (!request) {
    return res.status(400).json({ message: "Invalid late request or status" });
  }

  return res.json({ request });
}

module.exports = {
  create,
  createQuestion,
  getPublicQuiz,
  getStudentQuizResults,
  listQuizzes,
  remove,
  removeQuestion,
  requestLateAccess,
  reviewLateAccess,
  showQuizManager,
  showTakeQuiz,
  submit,
  update,
  updateExistingQuestion,
};
