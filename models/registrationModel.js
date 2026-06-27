const db = require("../database/client");

const CODE_START_NUMBER = 100;

const gradeCodePrefixes = {
  "Grade 4": "G4",
  "Grade 5": "G5",
  "Grade 6": "G6",
  "Prep 1": "P1",
  "Prep 2": "P2",
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

async function getRegistrations() {
  const rows = await db.all("SELECT * FROM registrations ORDER BY submittedAt DESC, rowid DESC");
  return rows.map(mapRegistration);
}

async function getRegistration(registrationId) {
  return mapRegistration(await db.get("SELECT * FROM registrations WHERE id = ?", [registrationId]));
}

async function getRegistrationWindowStatus(date = new Date()) {
  const dayOfMonth = date.getDate();
  const settings = await db.get("SELECT * FROM registration_settings WHERE id = 1");
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

async function updateRegistrationWindowSettings(settings, userName = "") {
  const opensDay = Number(settings.opensDay);
  const closesDay = Number(settings.closesDay);

  if (!Number.isInteger(opensDay) || !Number.isInteger(closesDay)) {
    return { error: "Opening and closing days must be whole numbers" };
  }

  if (opensDay < 1 || opensDay > 31 || closesDay < 1 || closesDay > 31) {
    return { error: "Opening and closing days must be between 1 and 31" };
  }

  await db.run(`
    UPDATE registration_settings
    SET opensDay = ?, closesDay = ?, updatedAt = ?, updatedBy = ?
    WHERE id = 1
  `, [opensDay, closesDay, new Date().toISOString(), userName]);

  return { windowStatus: await getRegistrationWindowStatus() };
}

async function createPublicRegistration(registrationData) {
  const windowStatus = await getRegistrationWindowStatus();
  const registrationId = await getNextId("REG", "registrations", 2000);
  const registration = {
    id: registrationId,
    submittedAt: new Date().toISOString().slice(0, 10),
    applicantType: registrationData.applicantType || "Parent",
    studentName: registrationData.studentName,
    parentName: `Parent of ${registrationData.studentName}`,
    phone: registrationData.parentWhatsapp,
    whatsapp: registrationData.parentWhatsapp,
    studentWhatsapp: registrationData.studentWhatsapp,
    parentWhatsapp: registrationData.parentWhatsapp,
    transferPhone: "",
    prizePhone: registrationData.prizePhone,
    email: registrationData.email || `${String(registrationData.parentWhatsapp).replace(/\D/g, "") || "unknown"}@no-email.local`,
    schoolGrade: registrationData.schoolGrade,
    course: "Math with Miss Hoda Ismail",
    paymentMethod: "Not submitted yet",
    paymentProof: "Not submitted yet",
    paymentProofUrl: "",
    studentPhoto: registrationData.studentPhoto || "",
    studentPhotoUrl: registrationData.studentPhotoUrl || "",
    refundPhone: "",
    intakeStatus: windowStatus.isOpen ? "Open window" : "Waiting list",
    recipientMatches: 0,
    dateWithinRange: 0,
    timePresent: 0,
    paymentStatus: "Payment required",
    reservationStatus: windowStatus.isOpen ? "Pending Payment" : "Waiting List",
    studentCode: await generateStudentCode({ id: registrationId, schoolGrade: registrationData.schoolGrade }),
    accountPassword: registrationData.accountPassword,
    rejectionReason: "",
    rejectedAt: "",
  };

  await db.run(`
    INSERT INTO registrations (
      id, submittedAt, applicantType, studentName, parentName, phone, whatsapp, email, schoolGrade,
      course, paymentMethod, paymentProof, paymentProofUrl, studentWhatsapp, parentWhatsapp, transferPhone, prizePhone, studentPhoto, studentPhotoUrl, refundPhone, intakeStatus,
      recipientMatches, dateWithinRange, timePresent, paymentStatus, reservationStatus, studentCode, accountPassword, rejectionReason, rejectedAt
    )
    VALUES (
      @id, @submittedAt, @applicantType, @studentName, @parentName, @phone, @whatsapp, @email, @schoolGrade,
      @course, @paymentMethod, @paymentProof, @paymentProofUrl, @studentWhatsapp, @parentWhatsapp, @transferPhone, @prizePhone, @studentPhoto, @studentPhotoUrl, @refundPhone, @intakeStatus,
      @recipientMatches, @dateWithinRange, @timePresent, @paymentStatus, @reservationStatus, @studentCode, @accountPassword, @rejectionReason, @rejectedAt
    )
  `, registration);

  await createStudentLoginAccount(registration);
  await createParentLoginAccount(registration);

  return {
    registration: mapRegistration(registration),
    windowStatus,
  };
}

async function confirmRegistration(registrationId) {
  const registration = await getRegistration(registrationId);

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

  const studentCode = registration.studentCode || await generateStudentCode(registration);
  await db.run(`
    UPDATE registrations
    SET studentCode = ?, paymentStatus = 'Verified', reservationStatus = 'Confirmed'
    WHERE id = ?
  `, [studentCode, registrationId]);
  await createStudentLoginAccount({ ...registration, studentCode });
  await createParentLoginAccount({ ...registration, studentCode });

  const updatedRegistration = await getRegistration(registrationId);
  return {
    registration: updatedRegistration,
    message: buildConfirmationMessage(updatedRegistration),
  };
}

async function createStudentLoginAccount(registration) {
  const existingUser = await db.get("SELECT * FROM users WHERE id = ?", [registration.studentCode]);

  if (existingUser) {
    return existingUser;
  }

  const email = `${registration.studentCode}@student.local`;
  await db.run(`
    INSERT INTO users (id, email, password, name, role)
    VALUES (?, ?, ?, ?, 'Student')
  `, [
    registration.studentCode,
    email,
    registration.accountPassword || "password123",
    registration.studentName,
  ]);

  return db.get("SELECT * FROM users WHERE id = ?", [registration.studentCode]);
}

async function createParentLoginAccount(registration) {
  const parentId = normalizePhone(registration.parentWhatsapp || registration.whatsapp || registration.phone);

  if (!parentId) {
    return null;
  }

  const existingUser = await db.get("SELECT * FROM users WHERE id = ?", [parentId]);

  if (existingUser) {
    return existingUser;
  }

  await db.run(`
    INSERT INTO users (id, email, password, name, role)
    VALUES (?, ?, ?, ?, 'Parent')
  `, [
    parentId,
    `${parentId}@parent.local`,
    registration.accountPassword || "password123",
    `Parent of ${registration.studentName}`,
  ]);

  return db.get("SELECT * FROM users WHERE id = ?", [parentId]);
}

async function rejectRegistration(registrationId, reason = "") {
  const registration = await getRegistration(registrationId);

  if (!registration) {
    return null;
  }

  await db.run(`
    UPDATE registrations
    SET paymentStatus = 'Rejected', reservationStatus = 'Rejected', rejectionReason = ?, rejectedAt = ?
    WHERE id = ?
  `, [reason, new Date().toISOString(), registrationId]);

  return getRegistration(registrationId);
}

async function generateStudentCode(registration) {
  const prefix = gradeCodePrefixes[registration.schoolGrade] || "G";
  const sequenceNumber = getRegistrationSequenceNumber(registration);
  const hexadecimalNumber = (sequenceNumber + CODE_START_NUMBER).toString(16).toUpperCase().padStart(4, "0");

  return `${prefix}${hexadecimalNumber}`;
}

function getRegistrationSequenceNumber(registration) {
  const idNumber = Number(String(registration.id || "").replace("REG-", ""));

  if (Number.isInteger(idNumber) && idNumber > 2000) {
    return idNumber - 2000;
  }

  if (Number.isInteger(idNumber) && idNumber > 0) {
    return idNumber;
  }

  return 1;
}

function buildConfirmationMessage(registration) {
  return `Hello ${registration.parentName}, payment received and reservation confirmed for ${registration.studentName}. Your student code is ${registration.studentCode}. Please keep it with you. We will inform you with any updates.`;
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

async function updatePaymentReview(registrationId, review) {
  const registration = await getRegistration(registrationId);

  if (!registration) {
    return null;
  }

  const recipientMatches = review.recipientMatches === true ? 1 : 0;
  const dateWithinRange = review.dateWithinRange === true ? 1 : 0;
  const timePresent = review.timePresent === true ? 1 : 0;
  const paymentStatus = recipientMatches && dateWithinRange && timePresent ? "Ready to confirm" : "Needs review";

  await db.run(`
    UPDATE registrations
    SET recipientMatches = ?, dateWithinRange = ?, timePresent = ?, paymentStatus = ?
    WHERE id = ?
  `, [recipientMatches, dateWithinRange, timePresent, paymentStatus, registrationId]);

  return getRegistration(registrationId);
}

async function updatePaymentProof(registrationId, fileName, fileUrl) {
  const registration = await getRegistration(registrationId);

  if (!registration) {
    return null;
  }

  await db.run(`
    UPDATE registrations
    SET paymentProof = ?, paymentProofUrl = ?, paymentStatus = 'Needs review',
        recipientMatches = 0, dateWithinRange = 0, timePresent = 0
    WHERE id = ?
  `, [fileName, fileUrl, registrationId]);

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

async function getNextId(prefix, tableName, startNumber) {
  const rows = await db.all(`SELECT id FROM ${tableName} WHERE id LIKE ?`, [`${prefix}-%`]);
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
