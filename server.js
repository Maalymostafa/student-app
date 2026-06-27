const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const path = require("path");
const attendanceRoutes = require("./routes/attendanceRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const gradingRoutes = require("./routes/gradingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const parentRoutes = require("./routes/parentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const staffRoutes = require("./routes/staffRoutes");
const studentRoutes = require("./routes/studentRoutes");
const supportRoutes = require("./routes/supportRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

function buildSessionStore() {
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  return new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  });
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/vendor/three", express.static(path.join(__dirname, "node_modules", "three", "build")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "academy-management-dev-secret",
    store: buildSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 4,
    },
  })
);

app.use("/", attendanceRoutes);
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", feedbackRoutes);
app.use("/", gradingRoutes);
app.use("/", notificationRoutes);
app.use("/", parentRoutes);
app.use("/", paymentRoutes);
app.use("/", quizRoutes);
app.use("/", registrationRoutes);
app.use("/", reportRoutes);
app.use("/", staffRoutes);
app.use("/", studentRoutes);
app.use("/", supportRoutes);

app.get("/", (req, res) => {
  res.redirect("/login");
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Academy Management System is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
