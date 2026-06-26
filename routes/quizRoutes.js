const express = require("express");
const quizController = require("../controllers/quizController");
const { requireApiAuth, requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/quizzes", requireAuth, requireRole(["Administrator", "Teacher"]), quizController.showQuizManager);
router.get("/take-quiz", requireAuth, requireRole(["Administrator", "Teacher", "Parent", "Student"]), quizController.showTakeQuiz);
router.get("/api/quizzes", requireApiAuth, requireRole(["Administrator", "Teacher"]), quizController.listQuizzes);
router.get("/api/quizzes/:id", requireApiAuth, requireRole(["Administrator", "Teacher", "Parent", "Student"]), quizController.getPublicQuiz);
router.post("/api/quizzes", requireApiAuth, requireRole(["Administrator", "Teacher"]), quizController.create);
router.post("/api/quizzes/:id/questions", requireApiAuth, requireRole(["Administrator", "Teacher"]), quizController.createQuestion);
router.post("/api/quizzes/:id/submit", requireApiAuth, requireRole(["Administrator", "Teacher", "Parent", "Student"]), quizController.submit);
router.post("/api/quizzes/:id/late-requests", requireApiAuth, requireRole(["Administrator", "Teacher", "Parent", "Student"]), quizController.requestLateAccess);
router.patch("/api/quiz-late-requests/:id", requireApiAuth, requireRole(["Administrator", "Teacher"]), quizController.reviewLateAccess);
router.get("/api/quiz-results", requireApiAuth, requireRole(["Administrator", "Teacher", "Parent", "Student"]), quizController.getStudentQuizResults);

module.exports = router;
