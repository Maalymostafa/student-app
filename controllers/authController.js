const path = require("path");
const {
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
  const { email, password } = req.body;
  const user = await findUserByCredentials(email, password);

  if (!user) {
    return res.redirect("/login?error=invalid");
  }

  req.session.user = getPublicUser(user);

  return res.redirect("/dashboard");
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
