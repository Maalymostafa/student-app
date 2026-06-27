const db = require("../database/client");
const { getChildrenForParent } = require("./parentModel");

async function getPaymentsForUser(user, studentCode = "") {
  const targetCode = await resolveAllowedStudentCode(user, studentCode);

  if (targetCode) {
    return db.all("SELECT * FROM payments WHERE studentCode = ? ORDER BY createdAt DESC, rowid DESC", [targetCode]);
  }

  if (["Administrator", "Teacher"].includes(user.role)) {
    return db.all("SELECT * FROM payments ORDER BY createdAt DESC, rowid DESC");
  }

  return [];
}

async function getStudentPaymentSummary(user, studentCode = "") {
  const targetCode = await resolveAllowedStudentCode(user, studentCode);
  const children = user.role === "Parent" ? await getChildrenForParent(user) : [];
  const payments = await getPaymentsForResolvedTarget(user, targetCode, children);
  const studentStatus = await getStudentPaymentStatus(user, targetCode);
  const required = payments.reduce((sum, payment) => sum + Number(payment.requiredAmount || 0), 0);
  const verifiedPaid = payments
    .filter((payment) => payment.status === "Verified")
    .reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);
  const pendingPaid = payments
    .filter((payment) => payment.status === "Pending review")
    .reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);

  return {
    payments,
    children,
    studentStatus,
    summary: {
      required,
      pendingPaid,
      verifiedPaid,
      remaining: Math.max(required - verifiedPaid, 0),
    },
  };
}

async function getPaymentsForResolvedTarget(user, targetCode = "", children = []) {
  if (targetCode) {
    return db.all("SELECT * FROM payments WHERE studentCode = ? ORDER BY createdAt DESC, rowid DESC", [targetCode]);
  }

  if (user.role === "Parent") {
    const childCodes = new Set(children.map((child) => child.studentCode));
    const payments = await db.all("SELECT * FROM payments ORDER BY createdAt DESC, rowid DESC");
    return payments.filter((payment) => childCodes.has(payment.studentCode));
  }

  if (["Administrator", "Teacher"].includes(user.role)) {
    return db.all("SELECT * FROM payments ORDER BY createdAt DESC, rowid DESC");
  }

  return [];
}

async function createPayment(user, data) {
  const studentCode = await resolveAllowedStudentCode(user, data.studentCode);

  if (!studentCode) {
    return { error: "Student code is required" };
  }

  const registration = await db.get("SELECT * FROM registrations WHERE studentCode = ?", [studentCode]);
  const studentName = registration ? registration.studentName : data.studentName || studentCode;
  const schoolGrade = registration ? registration.schoolGrade : data.schoolGrade || "";
  const requiredAmount = Number(data.requiredAmount || 0);
  const paidAmount = Number(data.paidAmount || 0);
  const payment = {
    id: await getNextPaymentId(),
    studentCode,
    studentName,
    schoolGrade,
    paymentType: data.paymentType,
    requiredAmount,
    paidAmount,
    remainingAmount: Math.max(requiredAmount - paidAmount, 0),
    transferDate: data.transferDate,
    transferTime: data.transferTime,
    transferPhone: data.transferPhone,
    refundPhone: data.refundPhone,
    paymentProof: data.paymentProof,
    paymentProofUrl: data.paymentProofUrl,
    status: "Pending review",
    adminNotes: "",
    createdAt: new Date().toISOString(),
    reviewedAt: "",
  };

  await db.run(`
    INSERT INTO payments (
      id, studentCode, studentName, schoolGrade, paymentType, requiredAmount, paidAmount,
      remainingAmount, transferDate, transferTime, transferPhone, refundPhone, paymentProof,
      paymentProofUrl, status, adminNotes, createdAt, reviewedAt
    )
    VALUES (
      @id, @studentCode, @studentName, @schoolGrade, @paymentType, @requiredAmount, @paidAmount,
      @remainingAmount, @transferDate, @transferTime, @transferPhone, @refundPhone, @paymentProof,
      @paymentProofUrl, @status, @adminNotes, @createdAt, @reviewedAt
    )
  `, payment);

  return { payment };
}

async function updatePaymentStatus(paymentId, updates) {
  const payment = await db.get("SELECT * FROM payments WHERE id = ?", [paymentId]);

  if (!payment) {
    return null;
  }

  const status = updates.status || payment.status;
  await db.run(`
    UPDATE payments
    SET status = ?, adminNotes = ?, reviewedAt = ?
    WHERE id = ?
  `, [status, updates.adminNotes || payment.adminNotes || "", new Date().toISOString(), paymentId]);

  return db.get("SELECT * FROM payments WHERE id = ?", [paymentId]);
}

async function getPaymentById(paymentId) {
  return db.get("SELECT * FROM payments WHERE id = ?", [paymentId]);
}

async function savePaymentOcrReview(paymentId, review) {
  await db.run(`
    UPDATE payments
    SET ocrText = ?, ocrReviewJson = ?, ocrReviewedAt = ?
    WHERE id = ?
  `, [
    review.extractedText || "",
    JSON.stringify({
      checks: review.checks || [],
      passed: Boolean(review.passed),
      message: review.message || "",
    }),
    new Date().toISOString(),
    paymentId,
  ]);

  return getPaymentById(paymentId);
}

async function getPaymentOcrRules() {
  return db.all("SELECT * FROM payment_ocr_rules ORDER BY status ASC, updatedAt DESC");
}

async function savePaymentOcrRule(data) {
  const now = new Date().toISOString();
  const requestedStatus = data.status === "Archived" ? "Archived" : "Active";
  const id = data.id || await getNextRuleId();

  if (requestedStatus === "Active") {
    await db.run("UPDATE payment_ocr_rules SET status = 'Archived', updatedAt = ?", [now]);
  }

  const rule = {
    id,
    title: data.title || `Payment rules ${now.slice(0, 7)}`,
    requiredKeywords: data.requiredKeywords || "",
    receiverTerms: data.receiverTerms || "",
    dateFrom: data.dateFrom || "",
    dateTo: data.dateTo || "",
    expectedAmount: data.expectedAmount || "",
    expectedSender: data.expectedSender || "",
    status: requestedStatus,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  const existing = await db.get("SELECT * FROM payment_ocr_rules WHERE id = ?", [id]);

  if (existing) {
    await db.run(`
      UPDATE payment_ocr_rules
      SET title = @title, requiredKeywords = @requiredKeywords, receiverTerms = @receiverTerms,
          dateFrom = @dateFrom, dateTo = @dateTo, expectedAmount = @expectedAmount,
          expectedSender = @expectedSender, status = @status, updatedAt = @updatedAt
      WHERE id = @id
    `, rule);
  } else {
    await db.run(`
      INSERT INTO payment_ocr_rules (
        id, title, requiredKeywords, receiverTerms, dateFrom, dateTo,
        expectedAmount, expectedSender, status, createdAt, updatedAt
      )
      VALUES (
        @id, @title, @requiredKeywords, @receiverTerms, @dateFrom, @dateTo,
        @expectedAmount, @expectedSender, @status, @createdAt, @updatedAt
      )
    `, rule);
  }

  return db.get("SELECT * FROM payment_ocr_rules WHERE id = ?", [id]);
}

async function archivePaymentOcrRule(ruleId) {
  await db.run("UPDATE payment_ocr_rules SET status = 'Archived', updatedAt = ? WHERE id = ?", [
    new Date().toISOString(),
    ruleId,
  ]);

  return db.get("SELECT * FROM payment_ocr_rules WHERE id = ?", [ruleId]);
}

async function getActivePaymentOcrRule() {
  return db.get("SELECT * FROM payment_ocr_rules WHERE status = 'Active' ORDER BY updatedAt DESC LIMIT 1");
}

async function resolveAllowedStudentCode(user, studentCode = "") {
  if (user.role === "Student") {
    return user.id;
  }

  if (user.role === "Parent") {
    const children = await getChildrenForParent(user);

    if (!children.length) {
      return "";
    }

    if (!studentCode) {
      return "";
    }

    return children.some((child) => child.studentCode === studentCode) ? studentCode : "";
  }

  return studentCode;
}

async function getStudentPaymentStatus(user, studentCode = "") {
  if (user.role === "Parent" && !studentCode) {
    const children = await getChildrenForParent(user);

    if (children.length) {
      return {
        studentCode: "",
        studentName: user.name,
        schoolGrade: "",
        accountStatus: "All linked students",
        reservationStatus: "",
        paymentStatus: "",
        message: "This page is showing all children linked to this parent account. Choose one child before submitting a new payment.",
      };
    }
  }

  if (!studentCode) {
    return {
      studentCode: "",
      studentName: user.name,
      schoolGrade: "",
      accountStatus: user.role === "Parent" ? "No linked student" : "All students",
      reservationStatus: "",
      paymentStatus: "",
      message: user.role === "Parent"
        ? "No child is linked to this parent account yet."
        : "Choose a student from a parent or student page to see one account status.",
    };
  }

  const registration = await db.get("SELECT * FROM registrations WHERE studentCode = ?", [studentCode]);

  if (!registration) {
    return {
      studentCode,
      studentName: studentCode,
      schoolGrade: "",
      accountStatus: "Unknown",
      reservationStatus: "",
      paymentStatus: "",
      message: "We could not find a registration record for this student code yet.",
    };
  }

  const accountStatus = getAccountStatusLabel(registration);

  return {
    studentCode: registration.studentCode,
    studentName: registration.studentName,
    schoolGrade: registration.schoolGrade,
    accountStatus,
    reservationStatus: registration.reservationStatus,
    paymentStatus: registration.paymentStatus,
    intakeStatus: registration.intakeStatus,
    message: getAccountStatusMessage(accountStatus, registration),
  };
}

function getAccountStatusLabel(registration) {
  if (registration.reservationStatus === "Confirmed") {
    return "Active";
  }

  if (registration.reservationStatus === "Pending Payment") {
    return "Payment required";
  }

  if (registration.reservationStatus === "Waiting List") {
    return "Waiting list";
  }

  if (registration.reservationStatus === "Rejected") {
    return "Rejected";
  }

  return registration.reservationStatus || "Pending review";
}

function getAccountStatusMessage(accountStatus, registration) {
  if (accountStatus === "Active") {
    return "The reservation is confirmed and the student account is active.";
  }

  if (accountStatus === "Payment required") {
    return "The account is created, but payment still needs to be submitted and reviewed.";
  }

  if (accountStatus === "Waiting list") {
    return "This registration is outside the official booking window and is waiting for approval.";
  }

  if (accountStatus === "Rejected") {
    return registration.rejectionReason || "This registration was rejected by the academy.";
  }

  return "The academy team is still reviewing this account.";
}

async function getNextPaymentId() {
  const rows = await db.all("SELECT id FROM payments WHERE id LIKE 'PAY-%'");
  const highestNumber = rows.reduce((highest, row) => {
    const number = Number(String(row.id).replace("PAY-", ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 0);

  return `PAY-${String(highestNumber + 1).padStart(4, "0")}`;
}

async function getNextRuleId() {
  const rows = await db.all("SELECT id FROM payment_ocr_rules WHERE id LIKE 'OCR-%'");
  const highestNumber = rows.reduce((highest, row) => {
    const number = Number(String(row.id).replace("OCR-", ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 0);

  return `OCR-${String(highestNumber + 1).padStart(4, "0")}`;
}

module.exports = {
  archivePaymentOcrRule,
  createPayment,
  getActivePaymentOcrRule,
  getPaymentById,
  getPaymentOcrRules,
  getStudentPaymentSummary,
  getStudentPaymentStatus,
  savePaymentOcrReview,
  savePaymentOcrRule,
  updatePaymentStatus,
};
