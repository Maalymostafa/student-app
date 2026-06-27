const express = require("express");
const staffController = require("../controllers/staffController");
const { requireApiAuth, requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/staff",
  requireAuth,
  requireRole(["Administrator"]),
  staffController.showStaffPage
);
router.get(
  "/api/staff",
  requireApiAuth,
  requireRole(["Administrator"]),
  staffController.listStaff
);
router.post(
  "/api/staff",
  requireApiAuth,
  requireRole(["Administrator"]),
  staffController.createStaff
);
router.patch(
  "/api/staff/:id/password",
  requireApiAuth,
  requireRole(["Administrator"]),
  staffController.resetPassword
);

module.exports = router;
