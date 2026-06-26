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

async function listAttendanceSetup(req, res) {
  return res.json({
    grades: getGradeOptions(),
    runs: await getAttendanceRuns(),
  });
}

async function listAttendanceRecords(req, res) {
  return res.json({ records: await getAttendanceRuns() });
}

async function getAttendance(req, res) {
  const run = await getAttendanceRun(req.params.id);

  if (!run) {
    return res.status(404).json({ message: "Attendance run not found" });
  }

  return res.json({ run });
}

async function updateAttendance(req, res) {
  const run = await updateAttendanceRun(req.params.id, req.body);

  if (!run) {
    return res.status(404).json({ message: "Attendance run not found" });
  }

  return res.json({ run });
}

async function removeAttendance(req, res) {
  const run = await deleteAttendanceRun(req.params.id);

  if (!run) {
    return res.status(404).json({ message: "Attendance run not found" });
  }

  return res.json({ run });
}

async function uploadZoomChat(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Zoom chat text file is required" });
  }

  const chatText = req.file.buffer.toString("utf8");
  const result = await analyzeZoomChatAttendance({
    schoolGrade: req.body.schoolGrade,
    sessionTitle: req.body.sessionTitle,
    chatText,
  });

  return res.json({ result });
}

module.exports = {
  getAttendance,
  listAttendanceRecords,
  listAttendanceSetup,
  removeAttendance,
  showAttendancePage,
  updateAttendance,
  uploadZoomChat,
};
