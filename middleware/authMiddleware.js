function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  return next();
}

function requireApiAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireApiAuth,
};
