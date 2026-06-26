let registrations = [
  {
    id: "REG-2001",
    submittedAt: "2026-06-24",
    studentName: "Youssef Ali",
    parentName: "Sara Ali",
    phone: "+20 100 300 4500",
    whatsapp: "+20 100 300 4500",
    email: "sara.ali@example.com",
    course: "English Conversation - Level 1",
    paymentMethod: "Vodafone Cash",
    paymentProof: "payment-youssef-ali.jpg",
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
    course: "English Grammar - Level 2",
    paymentMethod: "Instapay",
    paymentProof: "payment-farida-samir.png",
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
    course: "Placement Test",
    paymentMethod: "Bank transfer",
    paymentProof: "payment-karim-tarek.pdf",
    paymentReview: {
      recipientMatches: true,
      dateWithinRange: true,
      timePresent: true,
    },
    paymentStatus: "Verified",
    reservationStatus: "Confirmed",
    studentCode: "STU-2026-001",
  },
];

function getRegistrations() {
  return registrations;
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
    const nextNumber = registrations.filter((item) => item.studentCode).length + 1;
    registration.studentCode = `STU-2026-${String(nextNumber).padStart(3, "0")}`;
  }

  registration.paymentStatus = "Verified";
  registration.reservationStatus = "Confirmed";

  return {
    registration,
    message: buildConfirmationMessage(registration),
  };
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

function isPaymentReviewComplete(registration) {
  return Boolean(
    registration.paymentReview &&
      registration.paymentReview.recipientMatches &&
      registration.paymentReview.dateWithinRange &&
      registration.paymentReview.timePresent
  );
}

module.exports = {
  getRegistrations,
  confirmRegistration,
  buildConfirmationMessage,
  updatePaymentReview,
};
