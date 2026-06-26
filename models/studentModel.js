const db = require("../database/client");

const editableFields = [
  "fullName",
  "dateOfBirth",
  "gender",
  "schoolGrade",
  "parentName",
  "phone",
  "whatsapp",
  "email",
  "address",
  "status",
  "medicalNotes",
  "emergencyContact",
  "notes",
];

async function getStudents(search = "") {
  const normalizedSearch = `%${search.trim().toLowerCase()}%`;

  if (!search.trim()) {
    return db.all("SELECT * FROM students ORDER BY registrationDate DESC, rowid DESC");
  }

  return db.all(`
    SELECT * FROM students
    WHERE lower(id || ' ' || fullName || ' ' || parentName || ' ' || phone || ' ' || whatsapp || ' ' || email || ' ' || schoolGrade || ' ' || status)
    LIKE ?
    ORDER BY registrationDate DESC, rowid DESC
  `, [normalizedSearch]);
}

async function getStudent(studentId) {
  return db.get("SELECT * FROM students WHERE id = ?", [studentId]);
}

async function createStudent(studentData) {
  const highestNumber = await db.get("SELECT id FROM students WHERE id LIKE 'STU-%' ORDER BY id DESC LIMIT 1");
  const nextNumber = highestNumber ? Number(highestNumber.id.replace("STU-", "")) + 1 : 1001;
  const student = {
    id: `STU-${nextNumber}`,
    fullName: studentData.fullName,
    dateOfBirth: studentData.dateOfBirth,
    gender: studentData.gender,
    schoolGrade: studentData.schoolGrade,
    parentName: studentData.parentName,
    phone: studentData.phone,
    whatsapp: studentData.whatsapp,
    email: studentData.email,
    address: studentData.address,
    registrationDate: new Date().toISOString().slice(0, 10),
    status: "Active",
    medicalNotes: studentData.medicalNotes || "None",
    emergencyContact: studentData.emergencyContact,
    notes: studentData.notes || "",
  };

  await db.run(`
    INSERT INTO students (
      id, fullName, dateOfBirth, gender, schoolGrade, parentName, phone, whatsapp, email,
      address, registrationDate, status, medicalNotes, emergencyContact, notes
    )
    VALUES (
      @id, @fullName, @dateOfBirth, @gender, @schoolGrade, @parentName, @phone, @whatsapp, @email,
      @address, @registrationDate, @status, @medicalNotes, @emergencyContact, @notes
    )
  `, student);

  return student;
}

async function archiveStudent(studentId) {
  const student = await getStudent(studentId);

  if (!student) {
    return null;
  }

  await db.run("UPDATE students SET status = 'Archived' WHERE id = ?", [studentId]);
  return getStudent(studentId);
}

async function updateStudent(studentId, updates) {
  const student = await getStudent(studentId);

  if (!student) {
    return null;
  }

  const fieldsToUpdate = editableFields.filter((field) => updates[field] !== undefined);

  if (!fieldsToUpdate.length) {
    return student;
  }

  const assignments = fieldsToUpdate.map((field) => `${field} = @${field}`).join(", ");
  await db.run(`UPDATE students SET ${assignments} WHERE id = @id`, { id: studentId, ...updates });

  return getStudent(studentId);
}

async function deleteStudent(studentId) {
  const student = await getStudent(studentId);

  if (!student) {
    return null;
  }

  await db.run("DELETE FROM students WHERE id = ?", [studentId]);
  return student;
}

module.exports = {
  archiveStudent,
  createStudent,
  deleteStudent,
  getStudent,
  getStudents,
  updateStudent,
};
