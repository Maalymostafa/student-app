const db = require("../database/client");

async function getSubmissions() {
  const rows = await db.all("SELECT * FROM grading_submissions ORDER BY submittedAt DESC, rowid DESC");
  return rows.map(addPerformance);
}

async function getStudentResults(studentCode) {
  const rows = await db.all("SELECT * FROM grading_submissions WHERE studentCode = ? ORDER BY rowid DESC", [studentCode]);
  return rows
    .map(addPerformance)
    .map(addKidMessage);
}

async function updateSubmissionScore(submissionId, question, score) {
  const parsedScore = Number(score);
  const submission = await getSubmission(submissionId);
  const allowedQuestions = ["q1Score", "q2Score"];
  const allowedScores = [0, 1, 2];

  if (!submission || !allowedQuestions.includes(question) || !allowedScores.includes(parsedScore)) {
    return null;
  }

  await db.run(`UPDATE grading_submissions SET ${question} = ? WHERE id = ?`, [parsedScore, submissionId]);
  return addPerformance(await getSubmission(submissionId));
}

async function updateQuestionNotes(submissionId, question, feedback, correctionPhoto) {
  const submission = await getSubmission(submissionId);
  const allowedQuestions = ["q1", "q2"];

  if (!submission || !allowedQuestions.includes(question)) {
    return null;
  }

  await db.run(`
    UPDATE grading_submissions
    SET ${question}Feedback = ?, ${question}CorrectionPhoto = ?
    WHERE id = ?
  `, [feedback || "", correctionPhoto || "", submissionId]);

  if (feedback) {
    await saveCommentTemplate(feedback);
  }

  return addPerformance(await getSubmission(submissionId));
}

async function getSubmission(submissionId) {
  return db.get("SELECT * FROM grading_submissions WHERE id = ?", [submissionId]);
}

async function createGradingWindow(data) {
  const window = {
    id: await getNextId("WIN", "grading_windows", 0),
    sessionTitle: data.sessionTitle,
    schoolGrade: data.schoolGrade,
    q1Prompt: data.q1Prompt,
    q2Prompt: data.q2Prompt,
    opensAt: data.opensAt || new Date().toISOString(),
    closesAt: data.closesAt,
    status: "Open",
    createdAt: new Date().toISOString(),
  };

  await db.run(`
    INSERT INTO grading_windows (
      id, sessionTitle, schoolGrade, q1Prompt, q2Prompt, opensAt, closesAt, status, createdAt
    )
    VALUES (
      @id, @sessionTitle, @schoolGrade, @q1Prompt, @q2Prompt, @opensAt, @closesAt, @status, @createdAt
    )
  `, window);

  return mapGradingWindow(window);
}

async function getGradingWindows() {
  const rows = await db.all("SELECT * FROM grading_windows ORDER BY createdAt DESC, rowid DESC");
  return rows.map(mapGradingWindow);
}

async function getActiveWindowsForStudent(studentCode) {
  const registration = await getRegistrationByStudentCode(studentCode);

  if (!registration) {
    return [];
  }

  const now = new Date();
  const windows = await db.all(
    "SELECT * FROM grading_windows WHERE schoolGrade = ? AND status = 'Open' ORDER BY closesAt",
    [registration.schoolGrade]
  );

  return windows
    .map(mapGradingWindow)
    .filter((window) => new Date(window.opensAt) <= now && now <= new Date(window.closesAt));
}

async function submitStudentAnswers(studentCode, windowId, files) {
  const registration = await getRegistrationByStudentCode(studentCode);
  const window = await db.get("SELECT * FROM grading_windows WHERE id = ?", [windowId]);

  if (!registration || !window) {
    return { error: "Student or session window was not found" };
  }

  const mappedWindow = mapGradingWindow(window);

  if (!mappedWindow.isOpenNow) {
    return { error: "This answer window is closed" };
  }

  const q1Image = files.q1Image ? `/uploads/${files.q1Image[0].filename}` : "";
  const q2Image = files.q2Image ? `/uploads/${files.q2Image[0].filename}` : "";

  if (!q1Image && !q2Image) {
    return { error: "Upload at least one answer photo to submit work" };
  }

  const existing = await db.get(
    "SELECT * FROM grading_submissions WHERE windowId = ? AND studentCode = ?",
    [windowId, studentCode]
  );
  const submission = {
    id: existing ? existing.id : await getNextId("SUB", "grading_submissions", 3000),
    windowId,
    sessionTitle: window.sessionTitle,
    grade: window.schoolGrade,
    studentCode,
    studentName: registration.studentName,
    assistantTeacher: "Unassigned",
    attendance: "Present",
    q1Image: q1Image || (existing ? existing.q1Image : "No answer uploaded"),
    q2Image: q2Image || (existing ? existing.q2Image : "No answer uploaded"),
    q1Uploaded: q1Image ? 1 : 0,
    q2Uploaded: q2Image ? 1 : 0,
    q1Score: null,
    q2Score: null,
    q1Feedback: "",
    q2Feedback: "",
    q1CorrectionPhoto: "",
    q2CorrectionPhoto: "",
    submittedAt: new Date().toISOString(),
  };

  if (existing) {
    await db.run(`
      UPDATE grading_submissions
      SET q1Image = @q1Image, q2Image = @q2Image, attendance = 'Present', submittedAt = @submittedAt,
          q1Score = CASE WHEN @q1Uploaded = 1 THEN NULL ELSE q1Score END,
          q2Score = CASE WHEN @q2Uploaded = 1 THEN NULL ELSE q2Score END
      WHERE id = @id
    `, submission);
  } else {
    await db.run(`
      INSERT INTO grading_submissions (
        id, windowId, sessionTitle, grade, studentCode, studentName, assistantTeacher, attendance,
        q1Image, q2Image, q1Score, q2Score, q1Feedback, q2Feedback, q1CorrectionPhoto, q2CorrectionPhoto, submittedAt
      )
      VALUES (
        @id, @windowId, @sessionTitle, @grade, @studentCode, @studentName, @assistantTeacher, @attendance,
        @q1Image, @q2Image, @q1Score, @q2Score, @q1Feedback, @q2Feedback, @q1CorrectionPhoto, @q2CorrectionPhoto, @submittedAt
      )
    `, submission);
  }

  return { submission: addPerformance(submission) };
}

async function markStudentPresent(windowId, studentCode, options = {}) {
  const registration = await getRegistrationByStudentCode(studentCode);
  const window = await db.get("SELECT * FROM grading_windows WHERE id = ?", [windowId]);

  if (!registration || !window) {
    return { error: "Student or session window was not found" };
  }

  const mappedWindow = mapGradingWindow(window);

  if (options.requireOpenWindow && !mappedWindow.isOpenNow) {
    return { error: "Attendance is closed for this session" };
  }

  const existing = await db.get(
    "SELECT * FROM grading_submissions WHERE windowId = ? AND studentCode = ?",
    [windowId, studentCode]
  );

  if (existing) {
    await db.run("UPDATE grading_submissions SET attendance = 'Present' WHERE id = ?", [existing.id]);
    return { submission: addPerformance(await getSubmission(existing.id)) };
  }

  const submission = {
    id: await getNextId("SUB", "grading_submissions", 3000),
    windowId,
    sessionTitle: window.sessionTitle,
    grade: window.schoolGrade,
    studentCode,
    studentName: registration.studentName,
    assistantTeacher: "Manual attendance",
    attendance: "Present",
    q1Image: "No answer uploaded",
    q2Image: "No answer uploaded",
    q1Score: null,
    q2Score: null,
    q1Feedback: "",
    q2Feedback: "",
    q1CorrectionPhoto: "",
    q2CorrectionPhoto: "",
    submittedAt: new Date().toISOString(),
  };

  await db.run(`
    INSERT INTO grading_submissions (
      id, windowId, sessionTitle, grade, studentCode, studentName, assistantTeacher, attendance,
      q1Image, q2Image, q1Score, q2Score, q1Feedback, q2Feedback, q1CorrectionPhoto, q2CorrectionPhoto, submittedAt
    )
    VALUES (
      @id, @windowId, @sessionTitle, @grade, @studentCode, @studentName, @assistantTeacher, @attendance,
      @q1Image, @q2Image, @q1Score, @q2Score, @q1Feedback, @q2Feedback, @q1CorrectionPhoto, @q2CorrectionPhoto, @submittedAt
    )
  `, submission);

  return { submission: addPerformance(submission) };
}

async function getCommentTemplates() {
  return db.all("SELECT * FROM grading_comment_templates ORDER BY usageCount DESC, templateText LIMIT 30");
}

async function saveCommentTemplate(templateText) {
  const text = String(templateText || "").trim();

  if (!text) {
    return null;
  }

  const existing = await db.get("SELECT * FROM grading_comment_templates WHERE templateText = ?", [text]);

  if (existing) {
    await db.run("UPDATE grading_comment_templates SET usageCount = usageCount + 1 WHERE id = ?", [existing.id]);
    return db.get("SELECT * FROM grading_comment_templates WHERE id = ?", [existing.id]);
  }

  const template = {
    id: await getNextId("FB", "grading_comment_templates", 0),
    templateText: text,
    usageCount: 1,
    createdAt: new Date().toISOString(),
  };

  await db.run(`
    INSERT INTO grading_comment_templates (id, templateText, usageCount, createdAt)
    VALUES (@id, @templateText, @usageCount, @createdAt)
  `, template);

  return template;
}

async function getMonthlyResultSummary(studentCode) {
  const submissions = await getStudentResults(studentCode);
  const quizRows = await db.all("SELECT * FROM quiz_submissions WHERE studentCode = ?", [studentCode]);
  const months = new Map();

  for (const submission of submissions) {
    const monthKey = getMonthKey(submission.submittedAt || submission.sessionTitle);
    const month = ensureMonth(months, monthKey);
    month.sessions += 1;
    month.questionPoints += submission.total;
    month.attendancePoints += submission.attendance === "Present" ? 1 : 0;
  }

  for (const quiz of quizRows) {
    const monthKey = getMonthKey(quiz.submittedAt);
    const month = ensureMonth(months, monthKey);
    month.quizPoints += Math.round((Number(quiz.percentage || 0) / 100) * 20);
  }

  return Array.from(months.values())
    .map((month) => ({
      ...month,
      total: month.quizPoints + month.questionPoints + month.attendancePoints,
      max: 100,
      prizeEligible: month.sessions >= 4 && month.quizPoints + month.questionPoints + month.attendancePoints >= 100,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

function addPerformance(submission) {
  const q1 = submission.q1Score;
  const q2 = submission.q2Score;
  const total = [q1, q2].filter((score) => score !== null).reduce((sum, score) => sum + score, 0);
  const max = 4;
  const percentage = Math.round((total / max) * 100);
  const complete = q1 !== null && q2 !== null;

  return {
    ...submission,
    total,
    max,
    percentage,
    complete,
  };
}

function mapGradingWindow(window) {
  const now = new Date();
  const opensAt = new Date(window.opensAt);
  const closesAt = new Date(window.closesAt);

  return {
    ...window,
    isOpenNow: window.status === "Open" && opensAt <= now && now <= closesAt,
    isClosed: now > closesAt || window.status !== "Open",
  };
}

async function getRegistrationByStudentCode(studentCode) {
  return db.get("SELECT * FROM registrations WHERE studentCode = ?", [studentCode]);
}

function getMonthKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 7);
  }

  return date.toISOString().slice(0, 7);
}

function ensureMonth(months, monthKey) {
  if (!months.has(monthKey)) {
    months.set(monthKey, {
      month: monthKey,
      sessions: 0,
      quizPoints: 0,
      questionPoints: 0,
      attendancePoints: 0,
    });
  }

  return months.get(monthKey);
}

async function getNextId(prefix, tableName, startNumber) {
  const rows = await db.all(`SELECT id FROM ${tableName} WHERE id LIKE ?`, [`${prefix}-%`]);
  const highestNumber = rows.reduce((highest, row) => {
    const number = Number(String(row.id).replace(`${prefix}-`, ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, startNumber);

  return `${prefix}-${String(highestNumber + 1).padStart(4, "0")}`;
}

function addKidMessage(submission) {
  let headline = "Keep going";
  let message = "Every answer is practice. Review the feedback and try the next one with confidence.";

  if (!submission.complete) {
    headline = "Correction in progress";
    message = "Your teacher is still checking this work. Come back soon for your full result.";
  } else if (submission.percentage === 100) {
    headline = "Perfect work";
    message = "Amazing job. You answered everything correctly and should feel proud.";
  } else if (submission.percentage >= 50) {
    headline = "Good effort";
    message = "You are on the right track. Read the feedback and polish the missing part.";
  }

  return {
    ...submission,
    kidHeadline: headline,
    kidMessage: message,
  };
}

module.exports = {
  createGradingWindow,
  getActiveWindowsForStudent,
  getCommentTemplates,
  getGradingWindows,
  getMonthlyResultSummary,
  getSubmissions,
  getStudentResults,
  markStudentPresent,
  saveCommentTemplate,
  submitStudentAnswers,
  updateSubmissionScore,
  updateQuestionNotes,
};
