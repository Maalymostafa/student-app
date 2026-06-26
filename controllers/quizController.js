const path = require("path");
const {
  addQuestion,
  createLateRequest,
  createQuiz,
  getLateRequests,
  getQuiz,
  getQuizResults,
  getQuizzes,
  submitQuiz,
  updateLateRequest,
} = require("../models/quizModel");

function showQuizManager(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "quizzes.html"));
}

function showTakeQuiz(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "take-quiz.html"));
}

function listQuizzes(req, res) {
  return res.json({ quizzes: getQuizzes(), lateRequests: getLateRequests() });
}

function getStudentQuizResults(req, res) {
  return res.json({ quizResults: getQuizResults(req.query.studentCode || "") });
}

function create(req, res) {
  return res.json({ quiz: createQuiz(req.body) });
}

function createQuestion(req, res) {
  const quiz = addQuestion(req.params.id, req.body);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  return res.json({ quiz });
}

function getPublicQuiz(req, res) {
  const quiz = getQuiz(req.params.id);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  return res.json({ quiz });
}

function submit(req, res) {
  const result = submitQuiz(req.params.id, req.body.studentCode, req.body.answers || {});

  if (result.error) {
    return res.status(400).json(result);
  }

  return res.json(result);
}

function requestLateAccess(req, res) {
  const request = createLateRequest(req.params.id, req.body.studentCode, req.body.reason);

  if (!request) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  return res.json({ request });
}

function reviewLateAccess(req, res) {
  const request = updateLateRequest(req.params.id, req.body.status);

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
  requestLateAccess,
  reviewLateAccess,
  showQuizManager,
  showTakeQuiz,
  submit,
};
