const express = require("express");
const studentController = require("../controllers/studentController");
const { requireAuth, requireApiAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/students", requireAuth, requireRole(["Administrator"]), studentController.showStudentsPage);
router.get("/api/students", requireApiAuth, requireRole(["Administrator"]), studentController.listStudents);
router.post("/api/students", requireApiAuth, requireRole(["Administrator"]), studentController.addStudent);
router.patch("/api/students/:id/archive", requireApiAuth, requireRole(["Administrator"]), studentController.archive);

module.exports = router;
