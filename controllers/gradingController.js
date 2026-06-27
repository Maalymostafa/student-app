const path = require("path");
const { getStudentPaymentSummary } = require("../models/paymentModel");
const {
  createLibraryMaterial,
  createSession,
  createSessionArchive,
  getNextSessionForStudent,
  getStudentArchiveAndLibrary,
} = require("../models/sessionModel");
const {
  createGradingWindow,
  getActiveWindowsForStudent,
  getCommentTemplates,
  getGradingWindows,
  getMonthlyResultSummary,
  getStudentResults,
  getSubmissions,
  markStudentPresent,
  saveCommentTemplate,
  submitStudentAnswers,
  updateQuestionNotes,
  updateSubmissionScore,
} = require("../models/gradingModel");

function showGradingPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "grading.html"));
}

function showStudentResultsPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "student-results.html"));
}

function showSessionWorkPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "session-work.html"));
}

async function listSubmissions(req, res) {
  return res.json({
    submissions: await getSubmissions(),
    windows: await getGradingWindows(),
    templates: await getCommentTemplates(),
  });
}

async function listStudentResults(req, res) {
  const studentCode = req.query.studentCode || "STU-2026-001";
  const paymentOverview = await getStudentPaymentSummary(req.session.user, studentCode);
  return res.json({
    results: await getStudentResults(studentCode),
    monthlySummary: await getMonthlyResultSummary(studentCode),
    accountOverview: buildAccountOverview(paymentOverview),
    nextSession: await getNextSessionForStudent(studentCode),
    resources: await getStudentArchiveAndLibrary(studentCode),
    studentCode,
  });
}

async function listActiveWork(req, res) {
  const studentCode = getStudentCodeFromRequest(req);
  return res.json({ windows: await getActiveWindowsForStudent(studentCode), studentCode });
}

async function createWindow(req, res) {
  const requiredFields = ["sessionTitle", "schoolGrade", "q1Prompt", "q2Prompt", "closesAt"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length) {
    return res.status(400).json({ message: "Missing session window information", missingFields });
  }

  return res.status(201).json({ window: await createGradingWindow(req.body) });
}

async function createScheduledSession(req, res) {
  const requiredFields = ["title", "schoolGrade", "startsAt", "zoomLink", "zoomRevealAt"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length) {
    return res.status(400).json({ message: "Missing session information", missingFields });
  }

  return res.status(201).json({ session: await createSession(req.body) });
}

async function createArchive(req, res) {
  const requiredFields = ["title", "schoolGrade", "sessionDate", "youtubeUrl"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length) {
    return res.status(400).json({ message: "Missing archive information", missingFields });
  }

  return res.status(201).json({ archive: await createSessionArchive(req.body) });
}

async function createMaterial(req, res) {
  const requiredFields = ["title", "schoolGrade", "category", "materialUrl"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length) {
    return res.status(400).json({ message: "Missing library material information", missingFields });
  }

  return res.status(201).json({ material: await createLibraryMaterial(req.body) });
}

async function submitWork(req, res) {
  const result = await submitStudentAnswers(
    getStudentCodeFromRequest(req),
    req.params.windowId,
    req.files || {}
  );

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json(result);
}

async function markAttendance(req, res) {
  const result = await markStudentPresent(req.body.windowId, req.body.studentCode);

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json(result);
}

async function markOwnAttendance(req, res) {
  const result = await markStudentPresent(
    req.params.windowId,
    getStudentCodeFromRequest(req),
    { requireOpenWindow: true }
  );

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json(result);
}

async function updateScore(req, res) {
  const submission = await updateSubmissionScore(req.params.id, req.body.question, req.body.score);

  if (!submission) {
    return res.status(400).json({ message: "Invalid submission, question, or score" });
  }

  return res.json({ submission });
}

async function updateNotes(req, res) {
  const submission = await updateQuestionNotes(
    req.params.id,
    req.body.question,
    req.body.feedback,
    req.body.correctionPhoto
  );

  if (!submission) {
    return res.status(400).json({ message: "Invalid submission or question" });
  }

  return res.json({ submission });
}

async function createCommentTemplate(req, res) {
  const template = await saveCommentTemplate(req.body.templateText);

  if (!template) {
    return res.status(400).json({ message: "Template text is required" });
  }

  return res.status(201).json({ template });
}

async function uploadCorrectionPhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Correction photo is required" });
  }

  const submission = await updateQuestionNotes(
    req.params.id,
    req.body.question,
    req.body.feedback,
    `/uploads/${req.file.filename}`
  );

  if (!submission) {
    return res.status(400).json({ message: "Invalid submission or question" });
  }

  return res.json({ submission });
}

function getStudentCodeFromRequest(req) {
  if (req.session.user.role === "Student") {
    return req.session.user.id;
  }

  return req.query.studentCode || req.body.studentCode || "";
}

function buildAccountOverview(paymentOverview) {
  const remaining = Number(paymentOverview.summary.remaining || 0);
  const pendingPaid = Number(paymentOverview.summary.pendingPaid || 0);
  const status = paymentOverview.studentStatus || {};

  return {
    accountStatus: status.accountStatus,
    reservationStatus: status.reservationStatus,
    paymentStatus: status.paymentStatus,
    remaining,
    pendingPaid,
    verifiedPaid: Number(paymentOverview.summary.verifiedPaid || 0),
    required: Number(paymentOverview.summary.required || 0),
    stopRisk: remaining > 0 && pendingPaid === 0,
    message: remaining > 0 && pendingPaid === 0
      ? "There is a remaining balance. The account may be paused before the next session if payment is not submitted."
      : pendingPaid > 0
        ? "A payment is waiting for academy review."
        : status.message || "Account is clear right now.",
  };
}

module.exports = {
  createArchive,
  createCommentTemplate,
  createMaterial,
  createScheduledSession,
  createWindow,
  listActiveWork,
  showGradingPage,
  showSessionWorkPage,
  showStudentResultsPage,
  listSubmissions,
  listStudentResults,
  markAttendance,
  markOwnAttendance,
  submitWork,
  updateScore,
  updateNotes,
  uploadCorrectionPhoto,
};
