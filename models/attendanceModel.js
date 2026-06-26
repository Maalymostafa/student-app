const roster = [
  {
    studentName: "Youssef Ali",
    schoolGrade: "Grade 4",
    studentCode: "g40064h",
  },
  {
    studentName: "Mariam Adel",
    schoolGrade: "Grade 4",
    studentCode: "g40065h",
  },
  {
    studentName: "Nour Mostafa",
    schoolGrade: "Grade 6",
    studentCode: "g60064h",
  },
  {
    studentName: "Karim Tarek",
    schoolGrade: "Prep 2",
    studentCode: "p20064h",
  },
  {
    studentName: "Farida Samir",
    schoolGrade: "Prep 2",
    studentCode: "p20065h",
  },
];

const gradeOptions = ["Grade 4", "Grade 5", "Grade 6", "Prep 1", "Prep 2"];

let attendanceRuns = [];

function getGradeOptions() {
  return gradeOptions;
}

function getRoster() {
  return roster;
}

function analyzeZoomChatAttendance({ schoolGrade, sessionTitle, chatText }) {
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
    id: `ATT-${String(attendanceRuns.length + 1).padStart(4, "0")}`,
    sessionTitle: sessionTitle || "Zoom Webinar",
    schoolGrade,
    uploadedAt: new Date().toISOString(),
    presentCount: students.filter((student) => student.attendance === "Present").length,
    absentCount: students.filter((student) => student.attendance === "Absent").length,
    students,
    otherGradeCodes,
    unknownCodes: [...new Set(unknownCodes)],
  };

  attendanceRuns.unshift(run);
  return run;
}

function extractCodes(chatText) {
  const matches = chatText.toLowerCase().match(/\b(?:g[456]|p[12])[0-9a-f]{4}h\b/g);
  return matches || [];
}

function getAttendanceRuns() {
  return attendanceRuns;
}

module.exports = {
  analyzeZoomChatAttendance,
  extractCodes,
  getAttendanceRuns,
  getGradeOptions,
  getRoster,
};
