const express = require("express");
const reportController = require("../controllers/reportController");
const { requireApiAuth, requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/reports",
  requireAuth,
  requireRole(["Administrator"]),
  reportController.showReportsPage
);
router.get(
  "/api/reports",
  requireApiAuth,
  requireRole(["Administrator"]),
  reportController.getReportData
);
router.post(
  "/api/reports/expenses",
  requireApiAuth,
  requireRole(["Administrator"]),
  reportController.addExpense
);

module.exports = router;
