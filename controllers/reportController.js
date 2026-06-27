const path = require("path");
const { createReportExpense, getReports } = require("../models/reportModel");

function showReportsPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "reports.html"));
}

async function getReportData(req, res) {
  return res.json({ reports: await getReports(req.query.month) });
}

async function addExpense(req, res) {
  const requiredFields = ["title", "category", "amount", "expenseDate"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length) {
    return res.status(400).json({ message: "Missing expense information", missingFields });
  }

  return res.status(201).json({ expense: await createReportExpense(req.body) });
}

module.exports = {
  addExpense,
  getReportData,
  showReportsPage,
};
