const db = require("../database/client");
const { getAttendanceRuns } = require("./attendanceModel");
const { getMonthlyResultSummary } = require("./gradingModel");
const { getRegistrations } = require("./registrationModel");
const { getSupportMessages } = require("./supportModel");

async function getReports(month = currentMonth()) {
  const payments = await db.all("SELECT * FROM payments ORDER BY createdAt DESC, rowid DESC");
  const registrations = await getRegistrations();
  const attendanceRuns = await getAttendanceRuns();
  const submissions = await db.all("SELECT * FROM grading_submissions ORDER BY submittedAt DESC, rowid DESC");
  const quizSubmissions = await db.all("SELECT * FROM quiz_submissions ORDER BY submittedAt DESC, rowid DESC");
  const supportMessages = await getSupportMessages();
  const expenses = await db.all("SELECT * FROM report_expenses ORDER BY expenseDate DESC, rowid DESC");
  const monthPayments = payments.filter((payment) => isMonth(payment.createdAt, month));
  const monthExpenses = expenses.filter((expense) => isMonth(expense.expenseDate, month));
  const verifiedPayments = monthPayments.filter((payment) => payment.status === "Verified");
  const grossIncome = sum(verifiedPayments, "paidAmount");
  const totalExpenses = sum(monthExpenses, "amount");
  const studentCodes = unique([
    ...registrations.map((registration) => registration.studentCode).filter(Boolean),
    ...submissions.map((submission) => submission.studentCode).filter(Boolean),
    ...payments.map((payment) => payment.studentCode).filter(Boolean),
  ]);
  const rewards = await buildRewardReport(studentCodes, month);

  return {
    month,
    overview: {
      grossIncome,
      totalExpenses,
      netIncome: grossIncome - totalExpenses,
      renewedCount: unique(verifiedPayments.map((payment) => payment.studentCode)).length,
      notRenewedCount: countNotRenewed(registrations, verifiedPayments),
      supportOpen: supportMessages.filter((message) => message.status !== "Answered").length,
      prizeEligible: rewards.filter((reward) => reward.total >= 97).length,
    },
    payments: buildPaymentReport(payments, monthPayments, registrations),
    attendance: buildAttendanceReport(attendanceRuns, submissions, quizSubmissions),
    grades: {
      rewards,
      buckets: [
        { label: "100", value: rewards.filter((reward) => reward.total === 100).length },
        { label: "99", value: rewards.filter((reward) => reward.total === 99).length },
        { label: "98", value: rewards.filter((reward) => reward.total === 98).length },
        { label: "97", value: rewards.filter((reward) => reward.total === 97).length },
      ],
    },
    support: buildSupportReport(supportMessages),
    assistants: buildAssistantReport(submissions),
    expenses: monthExpenses,
  };
}

async function createReportExpense(data) {
  const expense = {
    id: await getNextId("EXP", "report_expenses", 0),
    title: data.title,
    category: data.category,
    amount: Number(data.amount || 0),
    expenseDate: data.expenseDate,
    notes: data.notes || "",
    createdAt: new Date().toISOString(),
  };

  await db.run(`
    INSERT INTO report_expenses (id, title, category, amount, expenseDate, notes, createdAt)
    VALUES (@id, @title, @category, @amount, @expenseDate, @notes, @createdAt)
  `, expense);

  return expense;
}

function buildPaymentReport(payments, monthPayments, registrations) {
  const verified = monthPayments.filter((payment) => payment.status === "Verified");
  const pending = payments.filter((payment) => payment.status === "Pending review");
  const rejected = payments.filter((payment) => payment.status === "Rejected");
  const owing = registrations.filter((registration) =>
    ["Pending Payment", "Waiting List"].includes(registration.reservationStatus)
  );

  return {
    verifiedAmount: sum(verified, "paidAmount"),
    pendingAmount: sum(pending, "paidAmount"),
    rejectedAmount: sum(rejected, "paidAmount"),
    owingCount: owing.length,
    statusBars: [
      { label: "Verified", value: verified.length },
      { label: "Pending", value: pending.length },
      { label: "Rejected", value: rejected.length },
      { label: "Need payment", value: owing.length },
    ],
    byType: groupCount(monthPayments, "paymentType"),
  };
}

function buildAttendanceReport(attendanceRuns, submissions, quizSubmissions) {
  const present = attendanceRuns.reduce((count, run) => count + Number(run.presentCount || 0), 0);
  const absent = attendanceRuns.reduce((count, run) => count + Number(run.absentCount || 0), 0);
  const presentCodes = new Set();
  const absentCodes = new Set();
  const quizCodes = new Set(quizSubmissions.map((submission) => submission.studentCode));

  for (const run of attendanceRuns) {
    for (const student of run.students || []) {
      if (student.attendance === "Present") {
        presentCodes.add(student.studentCode);
      }

      if (student.attendance === "Absent") {
        absentCodes.add(student.studentCode);
      }
    }
  }

  const answerCodes = new Set(submissions.map((submission) => submission.studentCode));
  const absentButSolving = Array.from(absentCodes).filter((code) => quizCodes.has(code) || answerCodes.has(code));
  const inactiveStudents = Array.from(absentCodes).filter((code) => !quizCodes.has(code) && !answerCodes.has(code));

  return {
    present,
    absent,
    attendanceRate: present + absent ? Math.round((present / (present + absent)) * 100) : 0,
    absentButSolvingCount: absentButSolving.length,
    inactiveCount: inactiveStudents.length,
    bars: [
      { label: "Present", value: present },
      { label: "Absent", value: absent },
      { label: "Absent but solving", value: absentButSolving.length },
      { label: "Missing completely", value: inactiveStudents.length },
    ],
  };
}

function buildSupportReport(messages) {
  return {
    total: messages.length,
    open: messages.filter((message) => message.status !== "Answered").length,
    answered: messages.filter((message) => message.status === "Answered").length,
    byCategory: groupCount(messages, "category"),
    byAssignee: groupCount(messages, "assignedTo"),
  };
}

function buildAssistantReport(submissions) {
  const byAssistant = new Map();

  for (const submission of submissions) {
    const name = submission.assistantTeacher || "Unassigned";
    const row = byAssistant.get(name) || { name, corrected: 0, pending: 0, totalScore: 0, scored: 0 };
    const complete = submission.q1Score !== null && submission.q2Score !== null;
    row.corrected += complete ? 1 : 0;
    row.pending += complete ? 0 : 1;
    row.totalScore += Number(submission.q1Score || 0) + Number(submission.q2Score || 0);
    row.scored += [submission.q1Score, submission.q2Score].filter((score) => score !== null).length;
    byAssistant.set(name, row);
  }

  return Array.from(byAssistant.values()).map((row) => ({
    ...row,
    averageQuestionScore: row.scored ? Number((row.totalScore / row.scored).toFixed(2)) : 0,
  }));
}

async function buildRewardReport(studentCodes, month) {
  const rewards = [];

  for (const studentCode of studentCodes) {
    const summaries = await getMonthlyResultSummary(studentCode);
    const summary = summaries.find((item) => item.month === month);

    if (summary && summary.total >= 97) {
      const registration = await db.get("SELECT * FROM registrations WHERE studentCode = ?", [studentCode]);
      rewards.push({
        studentCode,
        studentName: registration ? registration.studentName : studentCode,
        schoolGrade: registration ? registration.schoolGrade : "",
        prizePhone: registration ? registration.prizePhone : "",
        total: summary.total,
      });
    }
  }

  return rewards.sort((first, second) => second.total - first.total);
}

function countNotRenewed(registrations, verifiedPayments) {
  const renewedCodes = new Set(verifiedPayments.map((payment) => payment.studentCode));
  return registrations.filter((registration) =>
    registration.studentCode && !renewedCodes.has(registration.studentCode)
  ).length;
}

function groupCount(rows, key) {
  const grouped = new Map();

  for (const row of rows) {
    const label = row[key] || "Not set";
    grouped.set(label, (grouped.get(label) || 0) + 1);
  }

  return Array.from(grouped.entries()).map(([label, value]) => ({ label, value }));
}

function unique(values) {
  return [...new Set(values)];
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function isMonth(value, month) {
  return String(value || "").slice(0, 7) === month;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function getNextId(prefix, tableName, startNumber) {
  const rows = await db.all(`SELECT id FROM ${tableName} WHERE id LIKE ?`, [`${prefix}-%`]);
  const highestNumber = rows.reduce((highest, row) => {
    const number = Number(String(row.id).replace(`${prefix}-`, ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, startNumber);

  return `${prefix}-${String(highestNumber + 1).padStart(4, "0")}`;
}

module.exports = {
  createReportExpense,
  getReports,
};
