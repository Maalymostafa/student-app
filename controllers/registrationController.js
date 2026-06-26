const path = require("path");
const {
  getRegistrations,
  confirmRegistration,
  buildConfirmationMessage,
  createPublicRegistration,
  getRegistrationWindowStatus,
  rejectRegistration,
  updateRegistrationWindowSettings,
  updatePaymentReview,
  updatePaymentProof,
} = require("../models/registrationModel");

function showRegistrationsPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "registrations.html"));
}

function showPublicRegistrationPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "register.html"));
}

async function getPublicRegistrationStatus(req, res) {
  return res.json({ windowStatus: await getRegistrationWindowStatus() });
}

async function getManagedRegistrationWindow(req, res) {
  return res.json({ windowStatus: await getRegistrationWindowStatus() });
}

async function updateManagedRegistrationWindow(req, res) {
  const result = await updateRegistrationWindowSettings(req.body, req.session.user.name);

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.json(result);
}

async function listRegistrations(req, res) {
  const registrations = (await getRegistrations()).map((registration) => ({
    ...registration,
    confirmationMessage: registration.studentCode
      ? buildConfirmationMessage(registration)
      : "",
  }));

  return res.json({ registrations, user: req.session.user });
}

async function confirm(req, res) {
  const result = await confirmRegistration(req.params.id);

  if (!result) {
    return res.status(404).json({ message: "Registration not found" });
  }

  if (result.error) {
    return res.status(400).json(result);
  }

  return res.json(result);
}

async function createPublic(req, res) {
  const requiredFields = [
    "studentName",
    "parentName",
    "phone",
    "email",
    "schoolGrade",
  ];
  const windowStatus = await getRegistrationWindowStatus();
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

  return res.status(201).json(await createPublicRegistration(req.body));
}

async function reviewPayment(req, res) {
  const registration = await updatePaymentReview(req.params.id, req.body);

  if (!registration) {
    return res.status(404).json({ message: "Registration not found" });
  }

  return res.json({ registration });
}

async function reject(req, res) {
  const registration = await rejectRegistration(req.params.id, req.body.reason || "");

  if (!registration) {
    return res.status(404).json({ message: "Registration not found" });
  }

  return res.json({ registration });
}

async function uploadPaymentProof(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Payment photo is required" });
  }

  const registration = await updatePaymentProof(
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
  getManagedRegistrationWindow,
  getPublicRegistrationStatus,
  listRegistrations,
  reject,
  reviewPayment,
  showPublicRegistrationPage,
  showRegistrationsPage,
  updateManagedRegistrationWindow,
  uploadPaymentProof,
};
