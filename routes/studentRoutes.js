const express = require("express");
const studentController = require("../controllers/studentController");
const { requireAuth, requireApiAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/students", requireAuth, requireRole(["Administrator"]), studentController.showStudentsPage);
router.get("/api/students", requireApiAuth, requireRole(["Administrator"]), studentController.listStudents);
router.get("/api/students/:id", requireApiAuth, requireRole(["Administrator"]), studentController.getOneStudent);
router.post("/api/students", requireApiAuth, requireRole(["Administrator"]), studentController.addStudent);
router.patch("/api/students/:id", requireApiAuth, requireRole(["Administrator"]), studentController.update);
router.patch("/api/students/:id/archive", requireApiAuth, requireRole(["Administrator"]), studentController.archive);
router.delete("/api/students/:id", requireApiAuth, requireRole(["Administrator"]), studentController.remove);

module.exports = router;
