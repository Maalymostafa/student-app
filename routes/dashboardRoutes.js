const express = require("express");
const path = require("path");
const dashboardController = require("../controllers/dashboardController");
const { requireApiAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/style-preview", (req, res) => {
  return res.sendFile(path.join(__dirname, "..", "views", "style-preview.html"));
});
router.get("/api/dashboard", requireApiAuth, dashboardController.getDashboard);

module.exports = router;
