const db = require("../database/db");

const CODE_START_NUMBER = 100;

const gradeCodePrefixes = {
  "Grade 4": "g4",
  "Grade 5": "g5",
  "Grade 6": "g6",
  "Prep 1": "p1",
  "Prep 2": "p2",
};

function mapRegistration(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    paymentReview: {
      recipientMatches: Boolean(row.recipientMatches),
      dateWithinRange: Boolean(row.dateWithinRange),
      timePresent: Boolean(row.timePresent),
    },
  };
}

function getRegistrations() {
  return db.prepare("SELECT * FROM registrations ORDER BY submittedAt DESC, rowid DESC").all().map(mapRegistration);
}

function getRegistration(registrationId) {
  return mapRegistration(db.prepare("SELECT * FROM registrations WHERE id = ?").get(registrationId));
}

function getRegistrationWindowStatus(date = new Date()) {
  const dayOfMonth = date.getDate();
  const settings = db.prepare("SELECT * FROM registration_settings WHERE id = 1").get();
  const opensDay = settings.opensDay;
  const closesDay = settings.closesDay;
  const isOpen = isDayInsideWindow(dayOfMonth, opensDay, closesDay);

  return {
    isOpen,
    opensDay,
    closesDay,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy,
    message: isOpen
      ? `Registration is open from day ${opensDay} to day ${closesDay}. Your request will be reviewed after payment verification.`
      : `Registration is currently outside the official booking window from day ${opensDay} to day ${closesDay}. Your request will join the waiting list.`,
  };
}

function updateRegistrationWindowSettings(settings, userName = "") {
  const opensDay = Number(settings.opensDay);
  const closesDay = Number(settings.closesDay);

  if (!Number.isInteger(opensDay) || !Number.isInteger(closesDay)) {
    return { error: "Opening and closing days must be whole numbers" };
  }

  if (opensDay < 1 || opensDay > 31 || closesDay < 1 || closesDay > 31) {
    return { error: "Opening and closing days must be between 1 and 31" };
  }

  db.prepare(`
    UPDATE registration_settings
    SET opensDay = ?, closesDay = ?, updatedAt = ?, updatedBy = ?
    WHERE id = 1
  `).run(opensDay, closesDay, new Date().toISOString(), userName);

  return { windowStatus: getRegistrationWindowStatus() };
}

function createPublicRegistration(registrationData) {
  const windowStatus = getRegistrationWindowStatus();
  const registration = {
    id: getNextId("REG", "registrations", 2000),
    submittedAt: new Date().toISOString().slice(0, 10),
    applicantType: registrationData.applicantType || "Parent",
    studentName: registrationData.studentName,
    parentName: registrationData.parentName,
    phone: registrationData.phone,
    whatsapp: registrationData.whatsapp || registrationData.phone,
    email: registrationData.email,
    schoolGrade: registrationData.schoolGrade,
    course: registrationData.course || "Academy session",
    paymentMethod: registrationData.paymentMethod || "Pending",
    paymentProof: registrationData.paymentProof || "Will be reviewed later",
    paymentProofUrl: "",
    refundPhone: windowStatus.isOpen ? "" : registrationData.refundPhone,
    intakeStatus: windowStatus.isOpen ? "Open window" : "Waiting list",
    recipientMatches: 0,
    dateWithinRange: 0,
    timePresent: 0,
    paymentStatus: windowStatus.isOpen ? "Needs review" : "Waiting list",
    reservationStatus: windowStatus.isOpen ? "Pending" : "Waiting List",
    studentCode: "",
    rejectionReason: "",
    rejectedAt: "",
  };

  db.prepare(`
    INSERT INTO registrations (
      id, submittedAt, applicantType, studentName, parentName, phone, whatsapp, email, schoolGrade,
      course, paymentMethod, paymentProof, paymentProofUrl, refundPhone, intakeStatus,
      recipientMatches, dateWithinRange, timePresent, paymentStatus, reservationStatus, studentCode, rejectionReason, rejectedAt
    )
    VALUES (
      @id, @submittedAt, @applicantType, @studentName, @parentName, @phone, @whatsapp, @email, @schoolGrade,
      @course, @paymentMethod, @paymentProof, @paymentProofUrl, @refundPhone, @intakeStatus,
      @recipientMatches, @dateWithinRange, @timePresent, @paymentStatus, @reservationStatus, @studentCode, @rejectionReason, @rejectedAt
    )
  `).run(registration);

  return {
    registration: mapRegistration(registration),
    windowStatus,
  };
}

function confirmRegistration(registrationId) {
  const registration = getRegistration(registrationId);

  if (!registration) {
    return null;
  }

  if (!isPaymentReviewComplete(registration)) {
    return {
      registration,
      message: "",
      error: "Payment proof is missing required confirmation criteria",
    };
  }

  const studentCode = registration.studentCode || generateStudentCode(registration);
  db.prepare(`
    UPDATE registrations
    SET studentCode = ?, paymentStatus = 'Verified', reservationStatus = 'Confirmed'
    WHERE id = ?
  `).run(studentCode, registrationId);

  const updatedRegistration = getRegistration(registrationId);
  return {
    registration: updatedRegistration,
    message: buildConfirmationMessage(updatedRegistration),
  };
}

function rejectRegistration(registrationId, reason = "") {
  const registration = getRegistration(registrationId);

  if (!registration) {
    return null;
  }

  db.prepare(`
    UPDATE registrations
    SET paymentStatus = 'Rejected', reservationStatus = 'Rejected', rejectionReason = ?, rejectedAt = ?
    WHERE id = ?
  `).run(reason, new Date().toISOString(), registrationId);

  return getRegistration(registrationId);
}

function generateStudentCode(registration) {
  const prefix = gradeCodePrefixes[registration.schoolGrade] || "g";
  const count = db.prepare("SELECT COUNT(*) AS count FROM registrations WHERE lower(studentCode) LIKE ?").get(`${prefix}%`).count;
  const nextNumber = CODE_START_NUMBER + count;
  const hexadecimalNumber = nextNumber.toString(16).padStart(4, "0");

  return `${prefix}${hexadecimalNumber}h`;
}

function buildConfirmationMessage(registration) {
  return `Hello ${registration.parentName}, payment received and reservation confirmed for ${registration.studentName}. Your student code is ${registration.studentCode}. Please keep it with you. We will inform you with any updates.`;
}

function updatePaymentReview(registrationId, review) {
  const registration = getRegistration(registrationId);

  if (!registration) {
    return null;
  }

  const recipientMatches = review.recipientMatches === true ? 1 : 0;
  const dateWithinRange = review.dateWithinRange === true ? 1 : 0;
  const timePresent = review.timePresent === true ? 1 : 0;
  const paymentStatus = recipientMatches && dateWithinRange && timePresent ? "Ready to confirm" : "Needs review";

  db.prepare(`
    UPDATE registrations
    SET recipientMatches = ?, dateWithinRange = ?, timePresent = ?, paymentStatus = ?
    WHERE id = ?
  `).run(recipientMatches, dateWithinRange, timePresent, paymentStatus, registrationId);

  return getRegistration(registrationId);
}

function updatePaymentProof(registrationId, fileName, fileUrl) {
  const registration = getRegistration(registrationId);

  if (!registration) {
    return null;
  }

  db.prepare(`
    UPDATE registrations
    SET paymentProof = ?, paymentProofUrl = ?, paymentStatus = 'Needs review',
        recipientMatches = 0, dateWithinRange = 0, timePresent = 0
    WHERE id = ?
  `).run(fileName, fileUrl, registrationId);

  return getRegistration(registrationId);
}

function isPaymentReviewComplete(registration) {
  return Boolean(
    registration.paymentReview &&
      registration.paymentReview.recipientMatches &&
      registration.paymentReview.dateWithinRange &&
      registration.paymentReview.timePresent
  );
}

function isDayInsideWindow(dayOfMonth, opensDay, closesDay) {
  if (opensDay <= closesDay) {
    return dayOfMonth >= opensDay && dayOfMonth <= closesDay;
  }

  return dayOfMonth >= opensDay || dayOfMonth <= closesDay;
}

function getNextId(prefix, tableName, startNumber) {
  const rows = db.prepare(`SELECT id FROM ${tableName} WHERE id LIKE ?`).all(`${prefix}-%`);
  const highestNumber = rows.reduce((highest, row) => {
    const number = Number(String(row.id).replace(`${prefix}-`, ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, startNumber);

  return `${prefix}-${highestNumber + 1}`;
}

module.exports = {
  buildConfirmationMessage,
  confirmRegistration,
  createPublicRegistration,
  generateStudentCode,
  getRegistrations,
  getRegistrationWindowStatus,
  rejectRegistration,
  updateRegistrationWindowSettings,
  updatePaymentReview,
  updatePaymentProof,
};
