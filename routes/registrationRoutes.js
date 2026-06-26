const express = require("express");
const registrationController = require("../controllers/registrationController");
const { requireAuth, requireApiAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/registrations",
  requireAuth,
  requireRole(["Administrator"]),
  registrationController.showRegistrationsPage
);
router.get(
  "/api/registrations",
  requireApiAuth,
  requireRole(["Administrator"]),
  registrationController.listRegistrations
);
router.patch(
  "/api/registrations/:id/confirm",
  requireApiAuth,
  requireRole(["Administrator"]),
  registrationController.confirm
);
router.patch(
  "/api/registrations/:id/payment-review",
  requireApiAuth,
  requireRole(["Administrator"]),
  registrationController.reviewPayment
);

module.exports = router;
