const path = require("path");
const {
  getRegistrations,
  confirmRegistration,
  buildConfirmationMessage,
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

  return res.json(result);
}

module.exports = {
  showRegistrationsPage,
  listRegistrations,
  confirm,
};
