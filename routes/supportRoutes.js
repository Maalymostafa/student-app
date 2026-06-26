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
  "/api/support/messages",
  requireApiAuth,
  requireRole(["Administrator", "Teacher"]),
  supportController.listMessages
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
