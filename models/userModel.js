const db = require("../database/client");

async function findUserByCredentials(email, password) {
  return db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
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

async function findUserById(userId) {
  return db.get("SELECT * FROM users WHERE id = ?", [userId]);
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

module.exports = {
  findUserByCredentials,
  findUserById,
  getPublicUser,
  getDemoAccounts,
  updateUserPassword,
};
