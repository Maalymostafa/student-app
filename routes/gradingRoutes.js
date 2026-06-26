const express = require("express");
const gradingController = require("../controllers/gradingController");
const { requireAuth, requireApiAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/grading",
  requireAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.showGradingPage
);
router.get(
  "/api/grading/submissions",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.listSubmissions
);
router.patch(
  "/api/grading/submissions/:id/score",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.updateScore
);
router.patch(
  "/api/grading/submissions/:id/notes",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.updateNotes
);

module.exports = router;
