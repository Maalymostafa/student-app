const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/login", authController.showLogin);
router.post("/login", authController.login);
router.get("/dashboard", authController.showDashboard);
router.post("/logout", authController.logout);

module.exports = router;
