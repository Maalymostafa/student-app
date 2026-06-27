const path = require("path");
const {
  findParentAccessByStudentCredentials,
  findUserByCredentials,
  getPublicUser,
  getDemoAccounts,
  updateUserPassword,
} = require("../models/userModel");
const { requireAuth } = require("../middleware/authMiddleware");

function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  return res.sendFile(path.join(__dirname, "..", "views", "login.html"));
}

async function login(req, res) {
  const { email, password, loginRole } = req.body;
  const user = await findUserForLogin(email, password, loginRole || "Staff");

  if (!user) {
    return res.redirect("/login?error=invalid");
  }

  req.session.user = getPublicUser(user);

  if (loginRole === "Parent") {
    return res.redirect("/parent-portal");
  }

  return res.redirect("/dashboard");
}

async function findUserForLogin(identifier, password, loginRole) {
  if (loginRole === "Parent") {
    const parentUser = await findUserByCredentials(identifier, password);

    if (parentUser && parentUser.role === "Parent") {
      return parentUser;
    }

    return findParentAccessByStudentCredentials(identifier, password);
  }

  const user = await findUserByCredentials(identifier, password);

  if (!user) {
    return null;
  }

  if (loginRole === "Student" && user.role !== "Student") {
    return null;
  }

  if (loginRole === "Staff" && !["Administrator", "Teacher"].includes(user.role)) {
    return null;
  }

  return user;
}

const showDashboard = [
  requireAuth,
  (req, res) => {
  return res.sendFile(path.join(__dirname, "..", "views", "dashboard.html"));
  },
];

const showAccount = [
  requireAuth,
  (req, res) => {
    return res.sendFile(path.join(__dirname, "..", "views", "account.html"));
  },
];

async function showDemoAccounts(req, res) {
  return res.json(await getDemoAccounts());
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/login");
  });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "New password confirmation does not match" });
  }

  const result = await updateUserPassword(req.session.user.id, currentPassword, newPassword);

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.json({ user: result.user, message: "Password updated" });
}

module.exports = {
  changePassword,
  showLogin,
  login,
  showAccount,
  showDashboard,
  showDemoAccounts,
  logout,
};
