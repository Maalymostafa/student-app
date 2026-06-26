const path = require("path");
const {
  getStudentResults,
  getSubmissions,
  updateQuestionNotes,
  updateSubmissionScore,
} = require("../models/gradingModel");

function showGradingPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "grading.html"));
}

function showStudentResultsPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "student-results.html"));
}

async function listSubmissions(req, res) {
  return res.json({ submissions: await getSubmissions() });
}

async function listStudentResults(req, res) {
  const studentCode = req.query.studentCode || "STU-2026-001";
  return res.json({ results: await getStudentResults(studentCode), studentCode });
}

async function updateScore(req, res) {
  const submission = await updateSubmissionScore(req.params.id, req.body.question, req.body.score);

  if (!submission) {
    return res.status(400).json({ message: "Invalid submission, question, or score" });
  }

  return res.json({ submission });
}

async function updateNotes(req, res) {
  const submission = await updateQuestionNotes(
    req.params.id,
    req.body.question,
    req.body.feedback,
    req.body.correctionPhoto
  );

  if (!submission) {
    return res.status(400).json({ message: "Invalid submission or question" });
  }

  return res.json({ submission });
}

async function uploadCorrectionPhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Correction photo is required" });
  }

  const submission = await updateQuestionNotes(
    req.params.id,
    req.body.question,
    req.body.feedback,
    `/uploads/${req.file.filename}`
  );

  if (!submission) {
    return res.status(400).json({ message: "Invalid submission or question" });
  }

  return res.json({ submission });
}

module.exports = {
  showGradingPage,
  showStudentResultsPage,
  listSubmissions,
  listStudentResults,
  updateScore,
  updateNotes,
  uploadCorrectionPhoto,
};
