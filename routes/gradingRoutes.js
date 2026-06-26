const express = require("express");
const gradingController = require("../controllers/gradingController");
const { requireAuth, requireApiAuth, requireRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get(
  "/grading",
  requireAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.showGradingPage
);
router.get(
  "/my-results",
  requireAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  gradingController.showStudentResultsPage
);
router.get(
  "/api/grading/submissions",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.listSubmissions
);
router.get(
  "/api/my-results",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  gradingController.listStudentResults
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
router.post(
  "/api/grading/submissions/:id/correction-photo",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  upload.single("correctionPhoto"),
  gradingController.uploadCorrectionPhoto
);

module.exports = router;
