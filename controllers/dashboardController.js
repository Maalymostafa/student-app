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
      { label: "Build session quiz", href: "/quizzes" },
      { label: "Review attendance", href: "/attendance" },
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
      { label: "Check grades", href: "/my-results" },
      { label: "Review attendance", href: "/my-results" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
};

function getDashboard(req, res) {
  const user = req.session.user;
  const dashboard = roleDashboards[user.role] || roleDashboards.Student;

  return res.json({
    user,
    dashboard,
  });
}

module.exports = {
  getDashboard,
};
