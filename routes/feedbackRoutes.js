const express = require("express");
const feedbackController = require("../controllers/feedbackController");
const { requireApiAuth, requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/feedback",
  requireAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  feedbackController.showFeedbackPage
);
router.get(
  "/api/feedback",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  feedbackController.listFeedback
);
router.post(
  "/api/feedback",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  feedbackController.submitFeedback
);
router.patch(
  "/api/feedback/:id",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  feedbackController.reviewFeedback
);

module.exports = router;
