const db = require("../database/db");

function findUserByCredentials(email, password) {
  return db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
}

function getPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function getDemoAccounts() {
  return db.prepare("SELECT email, name, role FROM users ORDER BY rowid").all();
}

function findUserById(userId) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) || null;
}

function updateUserPassword(userId, currentPassword, newPassword) {
  const user = findUserById(userId);

  if (!user) {
    return { error: "User not found" };
  }

  if (user.password !== currentPassword) {
    return { error: "Current password is incorrect" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, userId);

  return { user: getPublicUser({ ...user, password: newPassword }) };
}

module.exports = {
  findUserByCredentials,
  findUserById,
  getPublicUser,
  getDemoAccounts,
  updateUserPassword,
};
