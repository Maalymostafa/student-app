const path = require("path");
const {
  getRegistrations,
  confirmRegistration,
  buildConfirmationMessage,
  createPublicRegistration,
  getRegistrationWindowStatus,
  rejectRegistration,
  updatePaymentReview,
  updatePaymentProof,
} = require("../models/registrationModel");

function showRegistrationsPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "registrations.html"));
}

function showPublicRegistrationPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "register.html"));
}

function getPublicRegistrationStatus(req, res) {
  return res.json({ windowStatus: getRegistrationWindowStatus() });
}

function listRegistrations(req, res) {
  const registrations = getRegistrations().map((registration) => ({
    ...registration,
    confirmationMessage: registration.studentCode
      ? buildConfirmationMessage(registration)
      : "",
  }));

  return res.json({ registrations });
}

function confirm(req, res) {
  const result = confirmRegistration(req.params.id);

  if (!result) {
    return res.status(404).json({ message: "Registration not found" });
  }

  if (result.error) {
    return res.status(400).json(result);
  }

  return res.json(result);
}

function createPublic(req, res) {
  const requiredFields = [
    "studentName",
    "parentName",
    "phone",
    "email",
    "schoolGrade",
  ];
  const windowStatus = getRegistrationWindowStatus();
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (!windowStatus.isOpen && !req.body.refundPhone) {
    missingFields.push("refundPhone");
  }

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Missing required registration information",
      missingFields,
      windowStatus,
    });
  }

  return res.status(201).json(createPublicRegistration(req.body));
}

function reviewPayment(req, res) {
  const registration = updatePaymentReview(req.params.id, req.body);

  if (!registration) {
    return res.status(404).json({ message: "Registration not found" });
  }

  return res.json({ registration });
}

function reject(req, res) {
  const registration = rejectRegistration(req.params.id, req.body.reason || "");

  if (!registration) {
    return res.status(404).json({ message: "Registration not found" });
  }

  return res.json({ registration });
}

function uploadPaymentProof(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Payment photo is required" });
  }

  const registration = updatePaymentProof(
    req.params.id,
    req.file.originalname,
    `/uploads/${req.file.filename}`
  );

  if (!registration) {
    return res.status(404).json({ message: "Registration not found" });
  }

  return res.json({ registration });
}

module.exports = {
  confirm,
  createPublic,
  getPublicRegistrationStatus,
  listRegistrations,
  reject,
  reviewPayment,
  showPublicRegistrationPage,
  showRegistrationsPage,
  uploadPaymentProof,
};
