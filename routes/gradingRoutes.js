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
  "/session-work",
  requireAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  gradingController.showSessionWorkPage
);
router.get(
  "/api/grading/submissions",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.listSubmissions
);
router.post(
  "/api/grading/windows",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.createWindow
);
router.post(
  "/api/sessions",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.createScheduledSession
);
router.post(
  "/api/session-archives",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.createArchive
);
router.post(
  "/api/library-materials",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.createMaterial
);
router.post(
  "/api/grading/comment-templates",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.createCommentTemplate
);
router.post(
  "/api/grading/attendance",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  gradingController.markAttendance
);
router.get(
  "/api/session-work/active",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  gradingController.listActiveWork
);
router.post(
  "/api/session-work/:windowId/submit",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  upload.fields([
    { name: "q1Image", maxCount: 1 },
    { name: "q2Image", maxCount: 1 },
  ]),
  gradingController.submitWork
);
router.post(
  "/api/session-work/:windowId/attendance",
  requireApiAuth,
  requireRole(["Student"]),
  gradingController.markOwnAttendance
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
