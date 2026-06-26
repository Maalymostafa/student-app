const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/login", authController.showLogin);
router.post("/login", authController.login);
router.get("/api/demo-accounts", authController.showDemoAccounts);
router.get("/dashboard", authController.showDashboard);
router.get("/account", authController.showAccount);
router.patch("/api/account/password", authController.changePassword);
router.post("/logout", authController.logout);

module.exports = router;
