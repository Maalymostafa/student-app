const path = require("path");
const {
  analyzeZoomChatAttendance,
  deleteAttendanceRun,
  getAttendanceRun,
  getAttendanceRuns,
  getGradeOptions,
  updateAttendanceRun,
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

function getAttendance(req, res) {
  const run = getAttendanceRun(req.params.id);

  if (!run) {
    return res.status(404).json({ message: "Attendance run not found" });
  }

  return res.json({ run });
}

function updateAttendance(req, res) {
  const run = updateAttendanceRun(req.params.id, req.body);

  if (!run) {
    return res.status(404).json({ message: "Attendance run not found" });
  }

  return res.json({ run });
}

function removeAttendance(req, res) {
  const run = deleteAttendanceRun(req.params.id);

  if (!run) {
    return res.status(404).json({ message: "Attendance run not found" });
  }

  return res.json({ run });
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
  getAttendance,
  listAttendanceSetup,
  removeAttendance,
  showAttendancePage,
  updateAttendance,
  uploadZoomChat,
};
