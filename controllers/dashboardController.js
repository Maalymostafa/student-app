const { getAttendanceRuns } = require("../models/attendanceModel");
const { getSubmissions } = require("../models/gradingModel");
const { getQuizzes, getLateRequests } = require("../models/quizModel");
const { getRegistrations } = require("../models/registrationModel");
const { getStudents } = require("../models/studentModel");
const { getSupportMessages } = require("../models/supportModel");

const roleDashboards = {
  Administrator: {
    headline: "Academy Dashboard",
    intro: "Run the academy from one place: students, sessions, payments, reports, and automation.",
    metrics: [
      { label: "Today's sessions", value: "8" },
      { label: "Payments due", value: "14" },
      { label: "Absent students", value: "5" },
      { label: "Pending reminders", value: "9" },
    ],
    actions: [
      { label: "Register a student", href: "/students" },
      { label: "Review registrations", href: "/registrations" },
      { label: "Review payments", href: "/payments" },
      { label: "Notifications", href: "/notifications" },
      { label: "Support assistant", href: "/support" },
      { label: "Feedback", href: "/feedback" },
      { label: "Build session quiz", href: "/quizzes" },
      { label: "Review attendance", href: "/attendance" },
      { label: "Staff accounts", href: "/staff" },
      { label: "Reports", href: "/reports" },
    ],
  },
  Teacher: {
    headline: "Teacher Workspace",
    intro: "Focus on assigned classes, Zoom attendance, session quizzes, grading, and student feedback.",
    metrics: [
      { label: "Classes today", value: "3" },
      { label: "Attendance pending", value: "2" },
      { label: "Quiz requests", value: "11" },
      { label: "Grades to enter", value: "6" },
    ],
    actions: [
      { label: "Take attendance", href: "/attendance" },
      { label: "Set booking window", href: "/registrations" },
      { label: "Notifications", href: "/notifications" },
      { label: "Support assistant", href: "/support" },
      { label: "Feedback", href: "/feedback" },
      { label: "Build session quiz", href: "/quizzes" },
      { label: "Enter grades", href: "/grading" },
      { label: "Review support notes", href: "/support-inbox" },
    ],
  },
  Parent: {
    headline: "Parent Portal",
    intro: "Follow attendance, grades, quizzes, balances, and academy messages for your child.",
    metrics: [
      { label: "Children", value: "2" },
      { label: "Upcoming sessions", value: "4" },
      { label: "Quiz grades", value: "3" },
      { label: "Remaining balance", value: "$120" },
    ],
    actions: [
      { label: "Open parent portal", href: "/parent-portal" },
      { label: "Payments", href: "/payments" },
      { label: "Notifications", href: "/notifications" },
      { label: "Support assistant", href: "/support" },
      { label: "Feedback", href: "/feedback" },
      { label: "Review grades", href: "/my-results" },
      { label: "Take quiz", href: "/take-quiz" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  Student: {
    headline: "Student Portal",
    intro: "See session quizzes, grades, attendance, and study materials.",
    metrics: [
      { label: "Lessons this week", value: "4" },
      { label: "Quizzes due", value: "2" },
      { label: "Average grade", value: "88%" },
      { label: "Attendance rate", value: "96%" },
    ],
    actions: [
      { label: "Take quiz", href: "/take-quiz" },
      { label: "Payments", href: "/payments" },
      { label: "Notifications", href: "/notifications" },
      { label: "Support assistant", href: "/support" },
      { label: "Feedback", href: "/feedback" },
      { label: "Check grades", href: "/my-results" },
      { label: "Review attendance", href: "/my-results" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
};

async function getDashboard(req, res) {
  const user = req.session.user;
  const dashboard = {
    ...(roleDashboards[user.role] || roleDashboards.Student),
    metrics: await buildMetrics(user.role),
  };

  return res.json({
    user,
    dashboard,
  });
}

async function buildMetrics(role) {
  const students = await getStudents();
  const registrations = await getRegistrations();
  const attendanceRuns = await getAttendanceRuns();
  const submissions = await getSubmissions();
  const quizzes = await getQuizzes();
  const lateRequests = await getLateRequests();
  const supportMessages = await getSupportMessages();

  if (role === "Administrator") {
    return [
      { label: "Active students", value: String(students.filter((student) => student.status === "Active").length) },
      { label: "Pending registrations", value: String(registrations.filter((registration) => registration.reservationStatus === "Pending").length) },
      { label: "Attendance uploads", value: String(attendanceRuns.length) },
      { label: "Open support", value: String(supportMessages.filter((message) => message.status !== "Answered").length) },
    ];
  }

  if (role === "Teacher") {
    return [
      { label: "Open quizzes", value: String(quizzes.filter((quiz) => quiz.status === "Open").length) },
      { label: "Late requests", value: String(lateRequests.filter((request) => request.status === "Pending").length) },
      { label: "Grades to enter", value: String(submissions.filter((submission) => !submission.complete).length) },
      { label: "Attendance uploads", value: String(attendanceRuns.length) },
    ];
  }

  if (role === "Parent") {
    return [
      { label: "Children", value: "2" },
      { label: "Open quizzes", value: String(quizzes.filter((quiz) => quiz.status === "Open").length) },
      { label: "Latest results", value: String(submissions.length) },
      { label: "Support replies", value: String(supportMessages.filter((message) => message.status === "Answered").length) },
    ];
  }

  return [
    { label: "Open quizzes", value: String(quizzes.filter((quiz) => quiz.status === "Open").length) },
    { label: "Results posted", value: String(submissions.length) },
    { label: "Attendance uploads", value: String(attendanceRuns.length) },
    { label: "Average grade", value: "88%" },
  ];
}

module.exports = {
  getDashboard,
};
