const db = require("../database/client");

const gradeOptions = ["Grade 4", "Grade 5", "Grade 6", "Prep 1", "Prep 2"];

function getGradeOptions() {
  return gradeOptions;
}

async function getRoster() {
  return db.all("SELECT studentName, schoolGrade, studentCode FROM attendance_roster ORDER BY schoolGrade, studentName");
}

async function analyzeZoomChatAttendance({ schoolGrade, sessionTitle, chatText }) {
  const roster = await getRoster();
  const selectedRoster = roster.filter((student) => student.schoolGrade === schoolGrade);
  const chatCodes = extractCodes(chatText);
  const chatCodeSet = new Set(chatCodes);
  const students = selectedRoster.map((student) => ({
    ...student,
    attendance: chatCodeSet.has(normalizeStudentCode(student.studentCode)) ? "Present" : "Absent",
  }));
  const otherGradeCodes = roster
    .filter(
      (student) =>
        student.schoolGrade !== schoolGrade &&
        chatCodeSet.has(normalizeStudentCode(student.studentCode))
    )
    .map((student) => ({
      studentName: student.studentName,
      schoolGrade: student.schoolGrade,
      studentCode: student.studentCode,
      note: "Ignored because this code belongs to another grade",
    }));
  const unknownCodes = chatCodes.filter(
    (code) => !roster.some((student) => normalizeStudentCode(student.studentCode) === code)
  );
  const run = {
    id: await getNextAttendanceId(),
    sessionTitle: sessionTitle || "Zoom Webinar",
    schoolGrade,
    uploadedAt: new Date().toISOString(),
    presentCount: students.filter((student) => student.attendance === "Present").length,
    absentCount: students.filter((student) => student.attendance === "Absent").length,
    students,
    otherGradeCodes,
    unknownCodes: [...new Set(unknownCodes)],
  };

  await saveAttendanceRun(run);
  return run;
}

function extractCodes(chatText) {
  const matches = chatText.match(/\b(?:G[456]|P[12])[0-9A-F]{4}H?\b/gi);
  return (matches || []).map(normalizeStudentCode);
}

function normalizeStudentCode(code) {
  return String(code || "").trim().toUpperCase().replace(/H$/, "");
}

async function getAttendanceRuns() {
  const rows = await db.all("SELECT * FROM attendance_runs ORDER BY uploadedAt DESC, rowid DESC");
  return rows.map(mapRun);
}

async function getAttendanceRun(runId) {
  return mapRun(await db.get("SELECT * FROM attendance_runs WHERE id = ?", [runId]));
}

async function updateAttendanceRun(runId, updates) {
  const run = await getAttendanceRun(runId);

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
  await saveAttendanceRun(run, true);
  return run;
}

async function deleteAttendanceRun(runId) {
  const run = await getAttendanceRun(runId);

  if (!run) {
    return null;
  }

  await db.run("DELETE FROM attendance_runs WHERE id = ?", [runId]);
  return run;
}

async function saveAttendanceRun(run, replace = false) {
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

  await db.run(statement, payload);
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

async function getNextAttendanceId() {
  const rows = await db.all("SELECT id FROM attendance_runs WHERE id LIKE 'ATT-%'");
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
