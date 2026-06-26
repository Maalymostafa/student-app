const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "..", "database", "users.json");

const seedUsers = [
  {
    id: "usr_admin_001",
    email: "admin@academy.test",
    password: "password123",
    name: "Academy Admin",
    role: "Administrator",
  },
  {
    id: "usr_teacher_001",
    email: "teacher@academy.test",
    password: "password123",
    name: "Mona Teacher",
    role: "Teacher",
  },
  {
    id: "usr_parent_001",
    email: "parent@academy.test",
    password: "password123",
    name: "Ahmed Parent",
    role: "Parent",
  },
  {
    id: "usr_student_001",
    email: "student@academy.test",
    password: "password123",
    name: "Lina Student",
    role: "Student",
  },
];

let users = loadUsers();

function findUserByCredentials(email, password) {
  return users.find((user) => user.email === email && user.password === password);
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
  return users.map(({ email, name, role }) => ({ email, name, role }));
}

function findUserById(userId) {
  return users.find((user) => user.id === userId) || null;
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

  user.password = newPassword;
  saveUsers();

  return { user: getPublicUser(user) };
}

function loadUsers() {
  ensureUsersFile();

  try {
    const fileContent = fs.readFileSync(usersFile, "utf8");
    const parsedUsers = JSON.parse(fileContent);
    return Array.isArray(parsedUsers) ? parsedUsers : seedUsers;
  } catch (error) {
    return seedUsers;
  }
}

function saveUsers() {
  ensureUsersFile();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function ensureUsersFile() {
  const databaseDir = path.dirname(usersFile);

  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify(seedUsers, null, 2));
  }
}

module.exports = {
  findUserByCredentials,
  findUserById,
  getPublicUser,
  getDemoAccounts,
  updateUserPassword,
};
