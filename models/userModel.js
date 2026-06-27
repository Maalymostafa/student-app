const db = require("../database/client");

async function findUserByCredentials(identifier, password) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  return db.get(
    "SELECT * FROM users WHERE (email = ? OR id = ? OR id = ?) AND password = ?",
    [identifier, identifier, normalizedIdentifier, password]
  );
}

async function findParentAccessByStudentCredentials(studentCode, password) {
  const studentUser = await db.get(
    "SELECT * FROM users WHERE id = ? AND password = ? AND role = 'Student'",
    [studentCode, password]
  );

  if (!studentUser) {
    return null;
  }

  const registration = await db.get("SELECT * FROM registrations WHERE studentCode = ?", [studentCode]);

  if (!registration) {
    return null;
  }

  const parentId = normalizeIdentifier(
    registration.parentWhatsapp || registration.whatsapp || registration.phone
  );

  if (!parentId) {
    return null;
  }

  return {
    id: parentId,
    email: `${parentId}@parent.local`,
    name: `Parent of ${registration.studentName}`,
    role: "Parent",
  };
}

function getPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

async function getDemoAccounts() {
  return db.all("SELECT email, name, role FROM users ORDER BY rowid");
}

async function getStaffUsers() {
  return db.all("SELECT id, email, name, role FROM users WHERE role IN ('Administrator', 'Teacher') ORDER BY role, name");
}

async function createStaffUser(data) {
  const role = data.role === "Administrator" ? "Administrator" : "Teacher";
  const user = {
    id: data.id || data.email,
    email: data.email,
    password: data.password,
    name: data.name,
    role,
  };

  const existing = await db.get("SELECT * FROM users WHERE id = ? OR email = ?", [user.id, user.email]);

  if (existing) {
    return { error: "This staff account already exists" };
  }

  await db.run(`
    INSERT INTO users (id, email, password, name, role)
    VALUES (@id, @email, @password, @name, @role)
  `, user);

  return { user: getPublicUser(user) };
}

async function findUserById(userId) {
  return db.get("SELECT * FROM users WHERE id = ?", [userId]);
}

async function updateUserPasswordByAdmin(userId, newPassword) {
  const user = await findUserById(userId);

  if (!user) {
    return { error: "User not found" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  await db.run("UPDATE users SET password = ? WHERE id = ?", [newPassword, userId]);

  return { user: getPublicUser({ ...user, password: newPassword }) };
}

async function updateUserPassword(userId, currentPassword, newPassword) {
  const user = await findUserById(userId);

  if (!user) {
    return { error: "User not found" };
  }

  if (user.password !== currentPassword) {
    return { error: "Current password is incorrect" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  await db.run("UPDATE users SET password = ? WHERE id = ?", [newPassword, userId]);

  return { user: getPublicUser({ ...user, password: newPassword }) };
}

function normalizeIdentifier(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits || value;
}

module.exports = {
  findParentAccessByStudentCredentials,
  findUserByCredentials,
  findUserById,
  getPublicUser,
  getDemoAccounts,
  getStaffUsers,
  createStaffUser,
  updateUserPasswordByAdmin,
  updateUserPassword,
};
