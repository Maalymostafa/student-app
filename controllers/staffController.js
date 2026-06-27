const path = require("path");
const {
  createStaffUser,
  getStaffUsers,
  updateUserPasswordByAdmin,
} = require("../models/userModel");

function showStaffPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "staff.html"));
}

async function listStaff(req, res) {
  return res.json({ staff: await getStaffUsers() });
}

async function createStaff(req, res) {
  const requiredFields = ["name", "email", "password", "role"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length) {
    return res.status(400).json({ message: "Missing staff information", missingFields });
  }

  if (req.body.password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const result = await createStaffUser(req.body);

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json(result);
}

async function resetPassword(req, res) {
  const result = await updateUserPasswordByAdmin(req.params.id, req.body.password);

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.json(result);
}

module.exports = {
  createStaff,
  listStaff,
  resetPassword,
  showStaffPage,
};
