const path = require("path");

const demoUser = {
  email: "admin@academy.test",
  password: "password123",
  name: "Academy Admin",
  role: "Administrator",
};

function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  return res.sendFile(path.join(__dirname, "..", "views", "login.html"));
}

function login(req, res) {
  const { email, password } = req.body;
  const isValidUser = email === demoUser.email && password === demoUser.password;

  if (!isValidUser) {
    return res.redirect("/login?error=invalid");
  }

  req.session.user = {
    name: demoUser.name,
    email: demoUser.email,
    role: demoUser.role,
  };

  return res.redirect("/dashboard");
}

function showDashboard(req, res) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  return res.sendFile(path.join(__dirname, "..", "views", "dashboard.html"));
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
  logout,
};
