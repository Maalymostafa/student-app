const db = require("../database/db");

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

function getStudents(search = "") {
  const normalizedSearch = `%${search.trim().toLowerCase()}%`;

  if (!search.trim()) {
    return db.prepare("SELECT * FROM students ORDER BY registrationDate DESC, rowid DESC").all();
  }

  return db.prepare(`
    SELECT * FROM students
    WHERE lower(id || ' ' || fullName || ' ' || parentName || ' ' || phone || ' ' || whatsapp || ' ' || email || ' ' || schoolGrade || ' ' || status)
    LIKE ?
    ORDER BY registrationDate DESC, rowid DESC
  `).all(normalizedSearch);
}

function getStudent(studentId) {
  return db.prepare("SELECT * FROM students WHERE id = ?").get(studentId) || null;
}

function createStudent(studentData) {
  const highestNumber = db.prepare("SELECT id FROM students WHERE id LIKE 'STU-%' ORDER BY id DESC LIMIT 1").get();
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

  db.prepare(`
    INSERT INTO students (
      id, fullName, dateOfBirth, gender, schoolGrade, parentName, phone, whatsapp, email,
      address, registrationDate, status, medicalNotes, emergencyContact, notes
    )
    VALUES (
      @id, @fullName, @dateOfBirth, @gender, @schoolGrade, @parentName, @phone, @whatsapp, @email,
      @address, @registrationDate, @status, @medicalNotes, @emergencyContact, @notes
    )
  `).run(student);

  return student;
}

function archiveStudent(studentId) {
  const student = getStudent(studentId);

  if (!student) {
    return null;
  }

  db.prepare("UPDATE students SET status = 'Archived' WHERE id = ?").run(studentId);
  return getStudent(studentId);
}

function updateStudent(studentId, updates) {
  const student = getStudent(studentId);

  if (!student) {
    return null;
  }

  const fieldsToUpdate = editableFields.filter((field) => updates[field] !== undefined);

  if (!fieldsToUpdate.length) {
    return student;
  }

  const assignments = fieldsToUpdate.map((field) => `${field} = @${field}`).join(", ");
  db.prepare(`UPDATE students SET ${assignments} WHERE id = @id`).run({ id: studentId, ...updates });

  return getStudent(studentId);
}

function deleteStudent(studentId) {
  const student = getStudent(studentId);

  if (!student) {
    return null;
  }

  db.prepare("DELETE FROM students WHERE id = ?").run(studentId);
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
