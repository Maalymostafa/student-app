const path = require("path");
const {
  getRegistrations,
  confirmRegistration,
  buildConfirmationMessage,
  updatePaymentReview,
  updatePaymentProof,
} = require("../models/registrationModel");

function showRegistrationsPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "registrations.html"));
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

function reviewPayment(req, res) {
  const registration = updatePaymentReview(req.params.id, req.body);

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
  showRegistrationsPage,
  listRegistrations,
  confirm,
  reviewPayment,
  uploadPaymentProof,
};
