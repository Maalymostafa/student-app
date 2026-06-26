const express = require("express");
const attendanceController = require("../controllers/attendanceController");
const { requireApiAuth, requireAuth, requireRole } = require("../middleware/authMiddleware");
const textUpload = require("../middleware/textUploadMiddleware");

const router = express.Router();

router.get(
  "/attendance",
  requireAuth,
  requireRole(["Administrator", "Teacher"]),
  attendanceController.showAttendancePage
);
router.get(
  "/api/attendance",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  attendanceController.listAttendanceSetup
);
router.get(
  "/api/attendance/:id",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  attendanceController.getAttendance
);
router.patch(
  "/api/attendance/:id",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  attendanceController.updateAttendance
);
router.delete(
  "/api/attendance/:id",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  attendanceController.removeAttendance
);
router.post(
  "/api/attendance/upload-chat",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  textUpload.single("zoomChat"),
  attendanceController.uploadZoomChat
);

module.exports = router;
