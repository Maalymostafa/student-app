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
      "Register a student",
      "Create a session",
      "Send payment reminders",
      "Review attendance",
    ],
  },
  Teacher: {
    headline: "Teacher Workspace",
    intro: "Focus on assigned classes, attendance, homework, grades, and student notes.",
    metrics: [
      { label: "Classes today", value: "3" },
      { label: "Attendance pending", value: "2" },
      { label: "Homework to review", value: "11" },
      { label: "Grades to enter", value: "6" },
    ],
    actions: [
      "Take attendance",
      "Upload homework",
      "Enter grades",
      "Add class notes",
    ],
  },
  Parent: {
    headline: "Parent Portal",
    intro: "Follow attendance, grades, homework, balances, and academy messages for your child.",
    metrics: [
      { label: "Children", value: "2" },
      { label: "Upcoming sessions", value: "4" },
      { label: "Homework items", value: "3" },
      { label: "Remaining balance", value: "$120" },
    ],
    actions: [
      "View attendance",
      "Check homework",
      "Review grades",
      "View balance",
    ],
  },
  Student: {
    headline: "Student Portal",
    intro: "See lessons, homework, grades, attendance, and study materials.",
    metrics: [
      { label: "Lessons this week", value: "4" },
      { label: "Homework due", value: "2" },
      { label: "Average grade", value: "88%" },
      { label: "Attendance rate", value: "96%" },
    ],
    actions: [
      "View homework",
      "Open study materials",
      "Check grades",
      "Review attendance",
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
