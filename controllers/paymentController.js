const path = require("path");
const {
  createPayment,
  archivePaymentOcrRule,
  getActivePaymentOcrRule,
  getPaymentById,
  getPaymentOcrRules,
  getStudentPaymentSummary,
  savePaymentOcrReview,
  savePaymentOcrRule,
  updatePaymentStatus,
} = require("../models/paymentModel");
const { createNotificationsForStudent } = require("../models/notificationModel");
const { analyzePaymentProof } = require("../services/paymentOcrService");

function showPaymentsPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "payments.html"));
}

async function listPayments(req, res) {
  const result = await getStudentPaymentSummary(req.session.user, req.query.studentCode || "");
  return res.json({ ...result, user: req.session.user });
}

async function submitPayment(req, res) {
  const requiredFields = [
    "paymentType",
    "paidAmount",
    "transferDate",
    "transferTime",
    "transferPhone",
    "refundPhone",
  ];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (!req.file) {
    missingFields.push("paymentProof");
  }

  if (missingFields.length) {
    return res.status(400).json({
      message: "Missing required payment information",
      missingFields,
    });
  }

  const result = await createPayment(req.session.user, {
    ...req.body,
    paymentProof: req.file.originalname,
    paymentProofUrl: `/uploads/${req.file.filename}`,
  });

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json(result);
}

async function reviewPayment(req, res) {
  const payment = await updatePaymentStatus(req.params.id, req.body);

  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  if (["Verified", "Rejected"].includes(payment.status)) {
    await createNotificationsForStudent(payment.studentCode, buildPaymentNotification(payment, req.session.user));
  }

  return res.json({ payment });
}

function buildPaymentNotification(payment, user) {
  if (payment.status === "Verified") {
    return {
      title: "Payment confirmed",
      body: `Your ${payment.paymentType} payment of ${payment.paidAmount} EGP has been confirmed. Your student code is ${payment.studentCode}. Please keep it with you and follow updates inside your account.`,
      category: "Payment",
      priority: "Important",
      deliveryChannel: "In-app",
      createdByUserId: user.id,
    };
  }

  return {
    title: "Payment needs review",
    body: `Your ${payment.paymentType} payment could not be confirmed yet. Please check the payment page or contact support. ${payment.adminNotes || ""}`.trim(),
    category: "Payment",
    priority: "Important",
    deliveryChannel: "In-app",
    createdByUserId: user.id,
  };
}

async function analyzePayment(req, res) {
  const payment = await getPaymentById(req.params.id);

  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  try {
    const activeRule = await getActivePaymentOcrRule();
    const criteria = Object.keys(req.body || {}).length ? req.body : activeRule || {};
    const review = await analyzePaymentProof(payment, criteria);
    const updatedPayment = await savePaymentOcrReview(payment.id, review);

    return res.json({ review, payment: updatedPayment });
  } catch (error) {
    return res.status(500).json({
      message: "Could not read this payment image. Please review it manually.",
    });
  }
}

async function listPaymentOcrRules(req, res) {
  const rules = await getPaymentOcrRules();
  const activeRule = rules.find((rule) => rule.status === "Active") || null;

  return res.json({ rules, activeRule });
}

async function saveOcrRule(req, res) {
  const rule = await savePaymentOcrRule(req.body || {});
  const rules = await getPaymentOcrRules();

  return res.status(201).json({ rule, rules });
}

async function archiveOcrRule(req, res) {
  const rule = await archivePaymentOcrRule(req.params.id);

  if (!rule) {
    return res.status(404).json({ message: "Payment checking rule not found" });
  }

  return res.json({ rule });
}

module.exports = {
  analyzePayment,
  archiveOcrRule,
  listPayments,
  listPaymentOcrRules,
  reviewPayment,
  saveOcrRule,
  showPaymentsPage,
  submitPayment,
};
