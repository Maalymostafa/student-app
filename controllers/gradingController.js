const path = require("path");
const { getSubmissions, updateSubmissionScore } = require("../models/gradingModel");

function showGradingPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "grading.html"));
}

function listSubmissions(req, res) {
  return res.json({ submissions: getSubmissions() });
}

function updateScore(req, res) {
  const submission = updateSubmissionScore(req.params.id, req.body.question, req.body.score);

  if (!submission) {
    return res.status(400).json({ message: "Invalid submission, question, or score" });
  }

  return res.json({ submission });
}

module.exports = {
  showGradingPage,
  listSubmissions,
  updateScore,
};
