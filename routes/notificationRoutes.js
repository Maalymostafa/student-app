const express = require("express");
const notificationController = require("../controllers/notificationController");
const { requireApiAuth, requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/notifications",
  requireAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  notificationController.showNotificationsPage
);
router.get(
  "/api/notifications",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  notificationController.listNotifications
);
router.post(
  "/api/notifications",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  notificationController.sendNotification
);
router.patch(
  "/api/notifications/:id/read",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  notificationController.markRead
);

module.exports = router;
