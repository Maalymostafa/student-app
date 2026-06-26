const users = [
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

module.exports = {
  findUserByCredentials,
  getPublicUser,
  getDemoAccounts,
};
