const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { requireApiAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/api/dashboard", requireApiAuth, dashboardController.getDashboard);

module.exports = router;
