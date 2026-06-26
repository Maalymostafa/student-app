const path = require("path");
const { findUserByCredentials, getPublicUser, getDemoAccounts } = require("../models/userModel");
const { requireAuth } = require("../middleware/authMiddleware");

function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  return res.sendFile(path.join(__dirname, "..", "views", "login.html"));
}

function login(req, res) {
  const { email, password } = req.body;
  const user = findUserByCredentials(email, password);

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

function showDemoAccounts(req, res) {
  return res.json(getDemoAccounts());
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/login");
  });
}

module.exports = {
  showLogin,
  login,
  showDashboard,
  showDemoAccounts,
  logout,
};
