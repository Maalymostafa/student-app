const express = require("express");
const paymentController = require("../controllers/paymentController");
const { requireApiAuth, requireAuth, requireRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get(
  "/payments",
  requireAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  paymentController.showPaymentsPage
);
router.get(
  "/api/payments",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  paymentController.listPayments
);
router.get(
  "/api/payment-ocr-rules",
  requireApiAuth,
  requireRole(["Administrator"]),
  paymentController.listPaymentOcrRules
);
router.post(
  "/api/payment-ocr-rules",
  requireApiAuth,
  requireRole(["Administrator"]),
  paymentController.saveOcrRule
);
router.patch(
  "/api/payment-ocr-rules/:id/archive",
  requireApiAuth,
  requireRole(["Administrator"]),
  paymentController.archiveOcrRule
);
router.post(
  "/api/payments",
  requireApiAuth,
  requireRole(["Administrator", "Teacher", "Parent", "Student"]),
  upload.single("paymentProof"),
  paymentController.submitPayment
);
router.patch(
  "/api/payments/:id/review",
  requireApiAuth,
  requireRole(["Administrator"]),
  paymentController.reviewPayment
);
router.post(
  "/api/payments/:id/analyze-proof",
  requireApiAuth,
  requireRole(["Administrator"]),
  paymentController.analyzePayment
);

module.exports = router;
