const fs = require("fs");
const path = require("path");

const registrationWindowFile = path.join(__dirname, "..", "database", "registration-window.json");
const defaultRegistrationWindow = {
  opensDay: 1,
  closesDay: 10,
  updatedAt: "",
  updatedBy: "",
};

let registrationWindowSettings = loadRegistrationWindowSettings();

let registrations = [
  {
    id: "REG-2001",
    submittedAt: "2026-06-24",
    studentName: "Youssef Ali",
    parentName: "Sara Ali",
    phone: "+20 100 300 4500",
    whatsapp: "+20 100 300 4500",
    email: "sara.ali@example.com",
    schoolGrade: "Grade 4",
    course: "English Conversation - Level 1",
    paymentMethod: "Vodafone Cash",
    paymentProof: "payment-youssef-ali.jpg",
    paymentProofUrl: "",
    paymentReview: {
      recipientMatches: false,
      dateWithinRange: false,
      timePresent: false,
    },
    paymentStatus: "Needs review",
    reservationStatus: "Pending",
    studentCode: "",
  },
  {
    id: "REG-2002",
    submittedAt: "2026-06-25",
    studentName: "Farida Samir",
    parentName: "Samir Nabil",
    phone: "+20 111 909 7711",
    whatsapp: "+20 111 909 7711",
    email: "samir.nabil@example.com",
    schoolGrade: "Prep 2",
    course: "English Grammar - Level 2",
    paymentMethod: "Instapay",
    paymentProof: "payment-farida-samir.png",
    paymentProofUrl: "",
    paymentReview: {
      recipientMatches: true,
      dateWithinRange: true,
      timePresent: false,
    },
    paymentStatus: "Needs review",
    reservationStatus: "Pending",
    studentCode: "",
  },
  {
    id: "REG-2003",
    submittedAt: "2026-06-22",
    studentName: "Karim Tarek",
    parentName: "Tarek Mahmoud",
    phone: "+20 122 707 8811",
    whatsapp: "+20 122 707 8811",
    email: "tarek.mahmoud@example.com",
    schoolGrade: "Prep 2",
    course: "Placement Test",
    paymentMethod: "Bank transfer",
    paymentProof: "payment-karim-tarek.pdf",
    paymentProofUrl: "",
    paymentReview: {
      recipientMatches: true,
      dateWithinRange: true,
      timePresent: true,
    },
    paymentStatus: "Verified",
    reservationStatus: "Confirmed",
    studentCode: "p20064h",
  },
];

const CODE_START_NUMBER = 100;

const gradeCodePrefixes = {
  "Grade 4": "g4",
  "Grade 5": "g5",
  "Grade 6": "g6",
  "Prep 1": "p1",
  "Prep 2": "p2",
};

function getRegistrations() {
  return registrations;
}

function getRegistrationWindowStatus(date = new Date()) {
  const dayOfMonth = date.getDate();
  const { opensDay, closesDay } = registrationWindowSettings;
  const isOpen = isDayInsideWindow(dayOfMonth, opensDay, closesDay);

  return {
    isOpen,
    opensDay,
    closesDay,
    updatedAt: registrationWindowSettings.updatedAt,
    updatedBy: registrationWindowSettings.updatedBy,
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

  registrationWindowSettings = {
    opensDay,
    closesDay,
    updatedAt: new Date().toISOString(),
    updatedBy: userName,
  };
  saveRegistrationWindowSettings();

  return { windowStatus: getRegistrationWindowStatus() };
}

function createPublicRegistration(registrationData) {
  const windowStatus = getRegistrationWindowStatus();
  const registration = {
    id: `REG-${2000 + registrations.length + 1}`,
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
    paymentReview: {
      recipientMatches: false,
      dateWithinRange: false,
      timePresent: false,
    },
    paymentStatus: windowStatus.isOpen ? "Needs review" : "Waiting list",
    reservationStatus: windowStatus.isOpen ? "Pending" : "Waiting List",
    studentCode: "",
  };

  registrations.unshift(registration);
  return {
    registration,
    windowStatus,
  };
}

function confirmRegistration(registrationId) {
  const registration = registrations.find((item) => item.id === registrationId);

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

  if (!registration.studentCode) {
    registration.studentCode = generateStudentCode(registration);
  }

  registration.paymentStatus = "Verified";
  registration.reservationStatus = "Confirmed";

  return {
    registration,
    message: buildConfirmationMessage(registration),
  };
}

function rejectRegistration(registrationId, reason = "") {
  const registration = registrations.find((item) => item.id === registrationId);

  if (!registration) {
    return null;
  }

  registration.paymentStatus = "Rejected";
  registration.reservationStatus = "Rejected";
  registration.rejectionReason = reason;
  registration.rejectedAt = new Date().toISOString();

  return registration;
}

function generateStudentCode(registration) {
  const prefix = gradeCodePrefixes[registration.schoolGrade] || "g";
  const existingCodesForGrade = registrations.filter((item) =>
    item.studentCode && item.studentCode.toLowerCase().startsWith(prefix)
  );
  const nextNumber = CODE_START_NUMBER + existingCodesForGrade.length;
  const hexadecimalNumber = nextNumber.toString(16).padStart(4, "0");

  return `${prefix}${hexadecimalNumber}h`;
}

function buildConfirmationMessage(registration) {
  return `Hello ${registration.parentName}, payment received and reservation confirmed for ${registration.studentName}. Your student code is ${registration.studentCode}. Please keep it with you. We will inform you with any updates.`;
}

function updatePaymentReview(registrationId, review) {
  const registration = registrations.find((item) => item.id === registrationId);

  if (!registration) {
    return null;
  }

  registration.paymentReview = {
    recipientMatches: review.recipientMatches === true,
    dateWithinRange: review.dateWithinRange === true,
    timePresent: review.timePresent === true,
  };
  registration.paymentStatus = isPaymentReviewComplete(registration) ? "Ready to confirm" : "Needs review";

  return registration;
}

function updatePaymentProof(registrationId, fileName, fileUrl) {
  const registration = registrations.find((item) => item.id === registrationId);

  if (!registration) {
    return null;
  }

  registration.paymentProof = fileName;
  registration.paymentProofUrl = fileUrl;
  registration.paymentStatus = "Needs review";
  registration.paymentReview = {
    recipientMatches: false,
    dateWithinRange: false,
    timePresent: false,
  };

  return registration;
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

function loadRegistrationWindowSettings() {
  ensureRegistrationWindowFile();

  try {
    const fileContent = fs.readFileSync(registrationWindowFile, "utf8");
    const settings = JSON.parse(fileContent);
    return {
      ...defaultRegistrationWindow,
      ...settings,
    };
  } catch (error) {
    return defaultRegistrationWindow;
  }
}

function saveRegistrationWindowSettings() {
  ensureRegistrationWindowFile();
  fs.writeFileSync(registrationWindowFile, JSON.stringify(registrationWindowSettings, null, 2));
}

function ensureRegistrationWindowFile() {
  const databaseDir = path.dirname(registrationWindowFile);

  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  if (!fs.existsSync(registrationWindowFile)) {
    fs.writeFileSync(registrationWindowFile, JSON.stringify(defaultRegistrationWindow, null, 2));
  }
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
