const express = require("express");
const supportController = require("../controllers/supportController");
const { requireApiAuth, requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/support-inbox",
  requireAuth,
  requireRole(["Administrator", "Teacher"]),
  supportController.showSupportInbox
);
router.get(
  "/support",
  requireAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  supportController.showSupportPage
);
router.get(
  "/api/support/messages",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  supportController.listMessages
);
router.get(
  "/api/support/my-messages",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  supportController.listMyMessages
);
router.get(
  "/api/support/flows",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  supportController.listFlows
);
router.post(
  "/api/support/flows",
  requireApiAuth,
  requireRole(["Administrator"]),
  supportController.createFlow
);
router.post(
  "/api/support/messages",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  supportController.createMessage
);
router.patch(
  "/api/support/messages/:id",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  supportController.updateMessage
);
router.patch(
  "/api/support/messages/:id/approve",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  supportController.approveReply
);

module.exports = router;
