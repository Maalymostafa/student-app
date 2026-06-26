const express = require("express");
const session = require("express-session");
const path = require("path");
const attendanceRoutes = require("./routes/attendanceRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const gradingRoutes = require("./routes/gradingRoutes");
const parentRoutes = require("./routes/parentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const studentRoutes = require("./routes/studentRoutes");
const supportRoutes = require("./routes/supportRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "academy-management-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4,
    },
  })
);

app.use("/", attendanceRoutes);
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", gradingRoutes);
app.use("/", parentRoutes);
app.use("/", quizRoutes);
app.use("/", registrationRoutes);
app.use("/", studentRoutes);
app.use("/", supportRoutes);

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Academy Management System is running at http://localhost:${PORT}`);
});
