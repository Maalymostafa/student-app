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

async function listStudents(req, res) {
  const students = await getStudents(req.query.search || "");
  return res.json({ students });
}

async function getOneStudent(req, res) {
  const student = await getStudent(req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ student });
}

async function addStudent(req, res) {
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

  const student = await createStudent(req.body);
  return res.status(201).json({ student });
}

async function archive(req, res) {
  const student = await archiveStudent(req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ student });
}

async function update(req, res) {
  const student = await updateStudent(req.params.id, req.body);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ student });
}

async function remove(req, res) {
  const student = await deleteStudent(req.params.id);

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
