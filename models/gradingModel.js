const db = require("../database/db");

function getSubmissions() {
  return db.prepare("SELECT * FROM grading_submissions ORDER BY rowid").all().map(addPerformance);
}

function getStudentResults(studentCode) {
  return db.prepare("SELECT * FROM grading_submissions WHERE studentCode = ? ORDER BY rowid DESC").all(studentCode)
    .map(addPerformance)
    .map(addKidMessage);
}

function updateSubmissionScore(submissionId, question, score) {
  const parsedScore = Number(score);
  const submission = getSubmission(submissionId);
  const allowedQuestions = ["q1Score", "q2Score"];
  const allowedScores = [0, 1, 2];

  if (!submission || !allowedQuestions.includes(question) || !allowedScores.includes(parsedScore)) {
    return null;
  }

  db.prepare(`UPDATE grading_submissions SET ${question} = ? WHERE id = ?`).run(parsedScore, submissionId);
  return addPerformance(getSubmission(submissionId));
}

function updateQuestionNotes(submissionId, question, feedback, correctionPhoto) {
  const submission = getSubmission(submissionId);
  const allowedQuestions = ["q1", "q2"];

  if (!submission || !allowedQuestions.includes(question)) {
    return null;
  }

  db.prepare(`
    UPDATE grading_submissions
    SET ${question}Feedback = ?, ${question}CorrectionPhoto = ?
    WHERE id = ?
  `).run(feedback || "", correctionPhoto || "", submissionId);

  return addPerformance(getSubmission(submissionId));
}

function getSubmission(submissionId) {
  return db.prepare("SELECT * FROM grading_submissions WHERE id = ?").get(submissionId) || null;
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
  getSubmissions,
  getStudentResults,
  updateSubmissionScore,
  updateQuestionNotes,
};
