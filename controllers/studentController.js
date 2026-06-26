const path = require("path");
const {
  archiveStudent,
  createStudent,
  deleteStudent,
  getStudent,
  getStudents,
  updateStudent,
} = require("../models/studentModel");

function showStudentsPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "students.html"));
}

function listStudents(req, res) {
  const students = getStudents(req.query.search || "");
  return res.json({ students });
}

function getOneStudent(req, res) {
  const student = getStudent(req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ student });
}

function addStudent(req, res) {
  const requiredFields = [
    "fullName",
    "dateOfBirth",
    "gender",
    "schoolGrade",
    "parentName",
    "phone",
    "whatsapp",
    "email",
    "address",
    "emergencyContact",
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Missing required student information",
      missingFields,
    });
  }

  const student = createStudent(req.body);
  return res.status(201).json({ student });
}

function archive(req, res) {
  const student = archiveStudent(req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ student });
}

function update(req, res) {
  const student = updateStudent(req.params.id, req.body);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ student });
}

function remove(req, res) {
  const student = deleteStudent(req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ student });
}

module.exports = {
  addStudent,
  archive,
  getOneStudent,
  listStudents,
  remove,
  showStudentsPage,
  update,
};
