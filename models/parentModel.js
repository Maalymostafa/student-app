const db = require("../database/client");

async function getChildrenForParent(parent) {
  const explicitChildren = await db.all(
    "SELECT studentCode, studentName, grade FROM parent_children WHERE parentId = ? ORDER BY studentName",
    [parent.id]
  );
  const phoneDigits = normalizePhone(parent.id);
  const registrations = await db.all("SELECT * FROM registrations WHERE studentCode IS NOT NULL AND studentCode <> '' ORDER BY studentName");
  const phoneMatchedChildren = phoneDigits
    ? registrations
        .filter((registration) => {
          const parentPhones = [
            registration.parentWhatsapp,
            registration.whatsapp,
            registration.phone,
          ].map(normalizePhone);

          return parentPhones.includes(phoneDigits);
        })
        .map(mapRegistrationToChild)
    : [];

  return mergeChildren([...explicitChildren.map(mapLinkedChild), ...phoneMatchedChildren]);
}

function mapLinkedChild(child) {
  return {
    studentCode: child.studentCode,
    studentName: child.studentName,
    grade: child.grade,
    accountStatus: "Linked",
    reservationStatus: "",
    paymentStatus: "",
    intakeStatus: "",
  };
}

function mapRegistrationToChild(registration) {
  return {
    studentCode: registration.studentCode,
    studentName: registration.studentName,
    grade: registration.schoolGrade,
    accountStatus: getAccountStatusLabel(registration),
    reservationStatus: registration.reservationStatus || "",
    paymentStatus: registration.paymentStatus || "",
    intakeStatus: registration.intakeStatus || "",
  };
}

function mergeChildren(children) {
  const byCode = new Map();

  for (const child of children) {
    if (!child.studentCode) {
      continue;
    }

    byCode.set(child.studentCode, {
      ...byCode.get(child.studentCode),
      ...child,
    });
  }

  return Array.from(byCode.values()).sort((first, second) =>
    first.studentName.localeCompare(second.studentName)
  );
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

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

module.exports = {
  getChildrenForParent,
  normalizePhone,
};
