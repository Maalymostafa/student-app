const express = require("express");
const parentController = require("../controllers/parentController");
const { requireApiAuth, requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/parent-portal",
  requireAuth,
  requireRole(["Administrator", "Parent"]),
  parentController.showParentPortal
);
router.get(
  "/api/parent/overview",
  requireApiAuth,
  requireRole(["Administrator", "Parent"]),
  parentController.getParentOverview
);

module.exports = router;
