const submissions = [
  {
    id: "SUB-3001",
    sessionTitle: "Zoom Webinar - Session 1",
    grade: "Grade 7",
    studentCode: "STU-2026-001",
    studentName: "Lina Ahmed",
    assistantTeacher: "Mona Teacher",
    attendance: "Present",
    q1Image: "Handwriting photo: Q1 answer about past simple verbs",
    q2Image: "Handwriting photo: Q2 answer about sentence correction",
    q1Score: null,
    q2Score: null,
  },
  {
    id: "SUB-3002",
    sessionTitle: "Zoom Webinar - Session 1",
    grade: "Grade 7",
    studentCode: "STU-2026-002",
    studentName: "Omar Hassan",
    assistantTeacher: "Mona Teacher",
    attendance: "Present",
    q1Image: "Handwriting photo: Q1 short answer",
    q2Image: "Handwriting photo: Q2 grammar correction",
    q1Score: 1,
    q2Score: null,
  },
  {
    id: "SUB-3003",
    sessionTitle: "Zoom Webinar - Session 1",
    grade: "Grade 6",
    studentCode: "STU-2026-003",
    studentName: "Nour Mostafa",
    assistantTeacher: "Mona Teacher",
    attendance: "Absent",
    q1Image: "No uploaded answer",
    q2Image: "No uploaded answer",
    q1Score: 0,
    q2Score: 0,
  },
];

function getSubmissions() {
  return submissions.map(addPerformance);
}

function updateSubmissionScore(submissionId, question, score) {
  const parsedScore = Number(score);
  const submission = submissions.find((item) => item.id === submissionId);
  const allowedQuestions = ["q1Score", "q2Score"];
  const allowedScores = [0, 1, 2];

  if (!submission || !allowedQuestions.includes(question) || !allowedScores.includes(parsedScore)) {
    return null;
  }

  submission[question] = parsedScore;
  return addPerformance(submission);
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

module.exports = {
  getSubmissions,
  updateSubmissionScore,
};
