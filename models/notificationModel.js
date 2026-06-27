const db = require("../database/client");

async function getNotificationsForUser(user) {
  if (["Administrator", "Teacher"].includes(user.role)) {
    return db.all("SELECT * FROM notifications ORDER BY createdAt DESC, rowid DESC");
  }

  return db.all(
    "SELECT * FROM notifications WHERE recipientUserId = ? OR recipientRole = ? ORDER BY createdAt DESC, rowid DESC",
    [user.id, user.role]
  );
}

async function createNotification(data) {
  const notification = {
    id: await getNextNotificationId(),
    recipientUserId: data.recipientUserId || "",
    recipientRole: data.recipientRole || "Parent",
    studentCode: data.studentCode || "",
    title: data.title,
    body: data.body,
    category: data.category || "General",
    priority: data.priority || "Normal",
    deliveryChannel: data.deliveryChannel || "In-app",
    status: "Unread",
    createdByUserId: data.createdByUserId || "",
    createdAt: new Date().toISOString(),
    readAt: "",
  };

  await db.run(`
    INSERT INTO notifications (
      id, recipientUserId, recipientRole, studentCode, title, body, category, priority,
      deliveryChannel, status, createdByUserId, createdAt, readAt
    )
    VALUES (
      @id, @recipientUserId, @recipientRole, @studentCode, @title, @body, @category, @priority,
      @deliveryChannel, @status, @createdByUserId, @createdAt, @readAt
    )
  `, notification);

  return notification;
}

async function createNotificationBatch(data) {
  const recipients = await resolveNotificationRecipients(data);
  const created = [];

  if (!recipients.length) {
    return { created, error: "No matching recipients found" };
  }

  for (const recipient of recipients) {
    created.push(await createNotification({
      ...data,
      recipientUserId: recipient.id,
      recipientRole: recipient.role,
      studentCode: recipient.studentCode || data.studentCode || "",
    }));
  }

  return { created };
}

async function createNotificationsForStudent(studentCode, data) {
  const recipients = await resolveStudentRecipients(studentCode);
  const created = [];

  for (const recipient of recipients) {
    created.push(await createNotification({
      ...data,
      recipientUserId: recipient.id,
      recipientRole: recipient.role,
      studentCode,
    }));
  }

  return created;
}

async function resolveNotificationRecipients(data) {
  const audience = data.audience || "role";

  if (audience === "account" && data.recipientUserId) {
    return [{
      id: normalizeIdentifier(data.recipientUserId),
      role: data.recipientRole || "Parent",
      studentCode: data.studentCode || "",
    }];
  }

  if (audience === "grade") {
    return getRecipientsForGrade(data.schoolGrade, data.includeParents !== "no");
  }

  if (audience === "everyone") {
    return getEveryoneRecipients();
  }

  if (audience === "students") {
    return getStudentRecipients();
  }

  if (audience === "parents") {
    return getParentRecipients();
  }

  return [{ id: "", role: data.recipientRole || "Parent", studentCode: data.studentCode || "" }];
}

async function getRecipientsForGrade(schoolGrade, includeParents = true) {
  if (!schoolGrade) {
    return [];
  }

  const registrations = await db.all(
    "SELECT studentCode, schoolGrade, parentWhatsapp, whatsapp, phone FROM registrations WHERE schoolGrade = ? AND studentCode IS NOT NULL AND studentCode <> ''",
    [schoolGrade]
  );
  const recipients = [];

  registrations.forEach((registration) => {
    recipients.push({
      id: registration.studentCode,
      role: "Student",
      studentCode: registration.studentCode,
    });

    if (includeParents) {
      const parentId = normalizeIdentifier(registration.parentWhatsapp || registration.whatsapp || registration.phone);

      if (parentId) {
        recipients.push({
          id: parentId,
          role: "Parent",
          studentCode: registration.studentCode,
        });
      }
    }
  });

  return uniqueRecipients(recipients);
}

async function getEveryoneRecipients() {
  const users = await db.all("SELECT id, role FROM users ORDER BY role, id");
  const registrationRecipients = await getRegistrationRecipients();

  return uniqueRecipients([
    ...users.map((user) => ({ id: user.id, role: user.role, studentCode: user.role === "Student" ? user.id : "" })),
    ...registrationRecipients,
  ]);
}

async function getStudentRecipients() {
  const users = await db.all("SELECT id, role FROM users WHERE role = 'Student' ORDER BY id");
  const registrations = await db.all(
    "SELECT studentCode FROM registrations WHERE studentCode IS NOT NULL AND studentCode <> '' ORDER BY studentCode"
  );

  return uniqueRecipients([
    ...users.map((user) => ({ id: user.id, role: "Student", studentCode: user.id })),
    ...registrations.map((registration) => ({
      id: registration.studentCode,
      role: "Student",
      studentCode: registration.studentCode,
    })),
  ]);
}

async function getParentRecipients() {
  const users = await db.all("SELECT id, role FROM users WHERE role = 'Parent' ORDER BY id");
  const registrationRecipients = await getRegistrationRecipients();

  return uniqueRecipients([
    ...users.map((user) => ({ id: user.id, role: "Parent", studentCode: "" })),
    ...registrationRecipients.filter((recipient) => recipient.role === "Parent"),
  ]);
}

async function getRegistrationRecipients() {
  const registrations = await db.all(`
    SELECT studentCode, parentWhatsapp, whatsapp, phone
    FROM registrations
    WHERE studentCode IS NOT NULL AND studentCode <> ''
  `);
  const recipients = [];

  registrations.forEach((registration) => {
    const parentId = normalizeIdentifier(registration.parentWhatsapp || registration.whatsapp || registration.phone);

    if (registration.studentCode) {
      recipients.push({
        id: registration.studentCode,
        role: "Student",
        studentCode: registration.studentCode,
      });
    }

    if (parentId) {
      recipients.push({
        id: parentId,
        role: "Parent",
        studentCode: registration.studentCode,
      });
    }
  });

  return recipients;
}

function uniqueRecipients(recipients) {
  const seen = new Set();
  const unique = [];

  recipients.forEach((recipient) => {
    const key = `${recipient.id || "role"}:${recipient.role}:${recipient.studentCode || ""}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(recipient);
    }
  });

  return unique;
}

async function markNotificationRead(user, notificationId) {
  const notification = await db.get("SELECT * FROM notifications WHERE id = ?", [notificationId]);

  if (!notification) {
    return null;
  }

  const canRead = ["Administrator", "Teacher"].includes(user.role) ||
    notification.recipientUserId === user.id ||
    notification.recipientRole === user.role;

  if (!canRead) {
    return null;
  }

  await db.run("UPDATE notifications SET status = 'Read', readAt = ? WHERE id = ?", [
    new Date().toISOString(),
    notificationId,
  ]);

  return db.get("SELECT * FROM notifications WHERE id = ?", [notificationId]);
}

async function resolveStudentRecipients(studentCode) {
  const recipients = [{ id: studentCode, role: "Student" }];
  const registration = await db.get("SELECT * FROM registrations WHERE studentCode = ?", [studentCode]);

  if (registration) {
    const parentId = normalizeIdentifier(registration.parentWhatsapp || registration.whatsapp || registration.phone);

    if (parentId) {
      recipients.push({ id: parentId, role: "Parent" });
    }
  }

  return recipients;
}

function normalizeIdentifier(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits || value;
}

async function getNextNotificationId() {
  const rows = await db.all("SELECT id FROM notifications WHERE id LIKE 'NOT-%'");
  const highestNumber = rows.reduce((highest, row) => {
    const number = Number(String(row.id).replace("NOT-", ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 0);

  return `NOT-${String(highestNumber + 1).padStart(5, "0")}`;
}

module.exports = {
  createNotification,
  createNotificationBatch,
  createNotificationsForStudent,
  getNotificationsForUser,
  markNotificationRead,
};
