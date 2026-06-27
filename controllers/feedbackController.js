const path = require("path");
const {
  createFeedback,
  getFeedbackForUser,
  updateFeedback,
} = require("../models/feedbackModel");

function showFeedbackPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "feedback.html"));
}

async function listFeedback(req, res) {
  const feedback = await getFeedbackForUser(req.session.user);

  return res.json({ feedback, user: req.session.user });
}

async function submitFeedback(req, res) {
  if (!req.body.title || !req.body.details) {
    return res.status(400).json({ message: "Title and details are required" });
  }

  const feedback = await createFeedback(req.session.user, req.body);

  return res.status(201).json({ feedback });
}

async function reviewFeedback(req, res) {
  const feedback = await updateFeedback(req.params.id, req.body);

  if (!feedback) {
    return res.status(404).json({ message: "Feedback not found" });
  }

  return res.json({ feedback });
}

module.exports = {
  listFeedback,
  reviewFeedback,
  showFeedbackPage,
  submitFeedback,
};
