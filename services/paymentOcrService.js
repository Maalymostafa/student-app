const fs = require("fs");
const path = require("path");
const { recognize } = require("tesseract.js");

const uploadsRoot = path.join(__dirname, "..", "public", "uploads");

async function analyzePaymentProof(payment, criteria = {}) {
  const imagePath = resolveUploadPath(payment.paymentProofUrl);

  if (!imagePath || !fs.existsSync(imagePath)) {
    return {
      extractedText: "",
      checks: [],
      passed: false,
      message: "Payment image file was not found.",
    };
  }

  const result = await recognize(imagePath, "eng");
  const extractedText = result.data.text || "";
  const checks = buildChecks(payment, criteria, extractedText);

  return {
    extractedText,
    checks,
    passed: checks.length > 0 && checks.every((check) => check.passed),
    message: "Image reading completed.",
  };
}

function resolveUploadPath(paymentProofUrl = "") {
  const fileName = path.basename(paymentProofUrl);

  if (!fileName) {
    return "";
  }

  const resolvedPath = path.resolve(uploadsRoot, fileName);
  return resolvedPath.startsWith(path.resolve(uploadsRoot)) ? resolvedPath : "";
}

function buildChecks(payment, criteria, extractedText) {
  const normalizedText = normalizeText(extractedText);
  const checks = [];
  const keywords = splitList(criteria.requiredKeywords);
  const receiverTerms = splitList(criteria.receiverTerms);

  if (keywords.length) {
    const missing = keywords.filter((keyword) => !normalizedText.includes(normalizeText(keyword)));
    checks.push({
      key: "requiredKeywords",
      label: "Required words are visible",
      passed: missing.length === 0,
      details: missing.length ? `Missing: ${missing.join(", ")}` : `Found: ${keywords.join(", ")}`,
    });
  }

  if (receiverTerms.length) {
    const matched = receiverTerms.filter((term) => normalizedText.includes(normalizeText(term)));
    checks.push({
      key: "receiverTerms",
      label: "Receiver account matches",
      passed: matched.length > 0,
      details: matched.length ? `Matched: ${matched.join(", ")}` : `Expected one of: ${receiverTerms.join(", ")}`,
    });
  }

  if (criteria.expectedAmount || payment.paidAmount) {
    const amount = String(criteria.expectedAmount || payment.paidAmount);
    checks.push({
      key: "amount",
      label: "Paid amount is visible",
      passed: includesNumber(normalizedText, amount),
      details: `Expected amount: ${amount}`,
    });
  }

  if (criteria.expectedSender || payment.transferPhone) {
    const phone = String(criteria.expectedSender || payment.transferPhone);
    checks.push({
      key: "sender",
      label: "Sender number is visible",
      passed: includesNumber(normalizedText, phone),
      details: `Expected sender: ${phone}`,
    });
  }

  if (criteria.dateFrom || criteria.dateTo) {
    const dates = extractDates(extractedText);
    const from = criteria.dateFrom ? new Date(`${criteria.dateFrom}T00:00:00`) : null;
    const to = criteria.dateTo ? new Date(`${criteria.dateTo}T23:59:59`) : null;
    const matchingDates = dates.filter((date) => isDateInRange(date, from, to));
    checks.push({
      key: "dateRange",
      label: "Transfer date is inside the allowed range",
      passed: matchingDates.length > 0,
      details: dates.length
        ? `Found dates: ${dates.map((date) => formatDate(date)).join(", ")}`
        : "No clear date found in the photo.",
    });
  }

  checks.push({
    key: "time",
    label: "Transfer time is visible",
    passed: /\b([01]?\d|2[0-3])[:.][0-5]\d\b/.test(extractedText),
    details: "Looks for a time like 14:35 or 9.05.",
  });

  return checks;
}

function splitList(value = "") {
  return String(value)
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}@.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function includesNumber(text, expected) {
  const target = normalizeDigits(expected);

  if (!target) {
    return false;
  }

  return normalizeDigits(text).includes(target);
}

function extractDates(text = "") {
  const dates = [];
  const patterns = [
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g,
    /\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/g,
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(text);

    while (match) {
      const date = pattern === patterns[0]
        ? buildDate(match[3], match[2], match[1])
        : buildDate(match[1], match[2], match[3]);

      if (date) {
        dates.push(date);
      }

      match = pattern.exec(text);
    }
  }

  return dates;
}

function buildDate(year, month, day) {
  const fullYear = Number(year.length === 2 ? `20${year}` : year);
  const monthIndex = Number(month) - 1;
  const dayNumber = Number(day);
  const date = new Date(fullYear, monthIndex, dayNumber);

  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== dayNumber
  ) {
    return null;
  }

  return date;
}

function isDateInRange(date, from, to) {
  if (from && date < from) {
    return false;
  }

  if (to && date > to) {
    return false;
  }

  return true;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

module.exports = {
  analyzePaymentProof,
};
