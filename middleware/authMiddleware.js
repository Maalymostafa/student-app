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

function requireRole(allowedRoles) {
  return function roleMiddleware(req, res, next) {
    const userRole = req.session.user && req.session.user.role;

    if (!allowedRoles.includes(userRole)) {
      if (req.path.startsWith("/api/")) {
        return res.status(403).json({ message: "You do not have access to this resource" });
      }

      return res.redirect("/dashboard");
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireApiAuth,
  requireRole,
};
