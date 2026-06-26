const path = require("path");
const {
  analyzeZoomChatAttendance,
  getAttendanceRuns,
  getGradeOptions,
} = require("../models/attendanceModel");

function showAttendancePage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "attendance.html"));
}

function listAttendanceSetup(req, res) {
  return res.json({
    grades: getGradeOptions(),
    runs: getAttendanceRuns(),
  });
}

function uploadZoomChat(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Zoom chat text file is required" });
  }

  const chatText = req.file.buffer.toString("utf8");
  const result = analyzeZoomChatAttendance({
    schoolGrade: req.body.schoolGrade,
    sessionTitle: req.body.sessionTitle,
    chatText,
  });

  return res.json({ result });
}

module.exports = {
  listAttendanceSetup,
  showAttendancePage,
  uploadZoomChat,
};
