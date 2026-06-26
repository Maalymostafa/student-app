const db = require("../database/db");

const gradeOptions = ["Grade 4", "Grade 5", "Grade 6", "Prep 1", "Prep 2"];

function getGradeOptions() {
  return gradeOptions;
}

function getRoster() {
  return db.prepare("SELECT studentName, schoolGrade, studentCode FROM attendance_roster ORDER BY schoolGrade, studentName").all();
}

function analyzeZoomChatAttendance({ schoolGrade, sessionTitle, chatText }) {
  const roster = getRoster();
  const selectedRoster = roster.filter((student) => student.schoolGrade === schoolGrade);
  const chatCodes = extractCodes(chatText);
  const chatCodeSet = new Set(chatCodes);
  const students = selectedRoster.map((student) => ({
    ...student,
    attendance: chatCodeSet.has(student.studentCode.toLowerCase()) ? "Present" : "Absent",
  }));
  const otherGradeCodes = roster
    .filter(
      (student) =>
        student.schoolGrade !== schoolGrade &&
        chatCodeSet.has(student.studentCode.toLowerCase())
    )
    .map((student) => ({
      studentName: student.studentName,
      schoolGrade: student.schoolGrade,
      studentCode: student.studentCode,
      note: "Ignored because this code belongs to another grade",
    }));
  const unknownCodes = chatCodes.filter(
    (code) => !roster.some((student) => student.studentCode.toLowerCase() === code)
  );
  const run = {
    id: getNextAttendanceId(),
    sessionTitle: sessionTitle || "Zoom Webinar",
    schoolGrade,
    uploadedAt: new Date().toISOString(),
    presentCount: students.filter((student) => student.attendance === "Present").length,
    absentCount: students.filter((student) => student.attendance === "Absent").length,
    students,
    otherGradeCodes,
    unknownCodes: [...new Set(unknownCodes)],
  };

  saveAttendanceRun(run);
  return run;
}

function extractCodes(chatText) {
  const matches = chatText.toLowerCase().match(/\b(?:g[456]|p[12])[0-9a-f]{4}h\b/g);
  return matches || [];
}

function getAttendanceRuns() {
  return db.prepare("SELECT * FROM attendance_runs ORDER BY uploadedAt DESC, rowid DESC").all().map(mapRun);
}

function getAttendanceRun(runId) {
  return mapRun(db.prepare("SELECT * FROM attendance_runs WHERE id = ?").get(runId));
}

function updateAttendanceRun(runId, updates) {
  const run = getAttendanceRun(runId);

  if (!run) {
    return null;
  }

  if (updates.sessionTitle !== undefined) {
    run.sessionTitle = updates.sessionTitle;
  }

  if (updates.schoolGrade !== undefined) {
    run.schoolGrade = updates.schoolGrade;
  }

  if (Array.isArray(updates.students)) {
    run.students = run.students.map((student) => {
      const update = updates.students.find((item) => item.studentCode === student.studentCode);
      return update ? { ...student, attendance: update.attendance || student.attendance } : student;
    });
  }

  run.presentCount = run.students.filter((student) => student.attendance === "Present").length;
  run.absentCount = run.students.filter((student) => student.attendance === "Absent").length;
  saveAttendanceRun(run, true);
  return run;
}

function deleteAttendanceRun(runId) {
  const run = getAttendanceRun(runId);

  if (!run) {
    return null;
  }

  db.prepare("DELETE FROM attendance_runs WHERE id = ?").run(runId);
  return run;
}

function saveAttendanceRun(run, replace = false) {
  const payload = {
    id: run.id,
    sessionTitle: run.sessionTitle,
    schoolGrade: run.schoolGrade,
    uploadedAt: run.uploadedAt,
    presentCount: run.presentCount,
    absentCount: run.absentCount,
    studentsJson: JSON.stringify(run.students),
    otherGradeCodesJson: JSON.stringify(run.otherGradeCodes),
    unknownCodesJson: JSON.stringify(run.unknownCodes),
  };
  const statement = replace
    ? `UPDATE attendance_runs SET sessionTitle = @sessionTitle, schoolGrade = @schoolGrade, uploadedAt = @uploadedAt,
       presentCount = @presentCount, absentCount = @absentCount, studentsJson = @studentsJson,
       otherGradeCodesJson = @otherGradeCodesJson, unknownCodesJson = @unknownCodesJson WHERE id = @id`
    : `INSERT INTO attendance_runs (
       id, sessionTitle, schoolGrade, uploadedAt, presentCount, absentCount,
       studentsJson, otherGradeCodesJson, unknownCodesJson
       ) VALUES (
       @id, @sessionTitle, @schoolGrade, @uploadedAt, @presentCount, @absentCount,
       @studentsJson, @otherGradeCodesJson, @unknownCodesJson
       )`;

  db.prepare(statement).run(payload);
}

function mapRun(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    sessionTitle: row.sessionTitle,
    schoolGrade: row.schoolGrade,
    uploadedAt: row.uploadedAt,
    presentCount: row.presentCount,
    absentCount: row.absentCount,
    students: JSON.parse(row.studentsJson || "[]"),
    otherGradeCodes: JSON.parse(row.otherGradeCodesJson || "[]"),
    unknownCodes: JSON.parse(row.unknownCodesJson || "[]"),
  };
}

function getNextAttendanceId() {
  const rows = db.prepare("SELECT id FROM attendance_runs WHERE id LIKE 'ATT-%'").all();
  const highestNumber = rows.reduce((highest, run) => {
    const number = Number(String(run.id).replace("ATT-", ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 0);

  return `ATT-${String(highestNumber + 1).padStart(4, "0")}`;
}

module.exports = {
  analyzeZoomChatAttendance,
  deleteAttendanceRun,
  extractCodes,
  getAttendanceRun,
  getAttendanceRuns,
  getGradeOptions,
  getRoster,
  updateAttendanceRun,
};
