let students = [
  {
    id: "STU-1001",
    fullName: "Lina Ahmed",
    dateOfBirth: "2012-04-18",
    gender: "Female",
    schoolGrade: "Grade 7",
    parentName: "Ahmed Parent",
    phone: "+20 100 555 1201",
    whatsapp: "+20 100 555 1201",
    email: "lina.student@example.com",
    address: "Nasr City, Cairo",
    registrationDate: "2026-06-01",
    status: "Active",
    medicalNotes: "None",
    emergencyContact: "+20 100 555 1210",
    notes: "Strong reading skills. Needs speaking practice.",
  },
  {
    id: "STU-1002",
    fullName: "Omar Hassan",
    dateOfBirth: "2011-09-07",
    gender: "Male",
    schoolGrade: "Grade 8",
    parentName: "Mariam Hassan",
    phone: "+20 111 222 3344",
    whatsapp: "+20 111 222 3344",
    email: "omar.hassan@example.com",
    address: "Heliopolis, Cairo",
    registrationDate: "2026-05-20",
    status: "Active",
    medicalNotes: "Dust allergy",
    emergencyContact: "+20 111 222 3355",
    notes: "Excellent attendance.",
  },
  {
    id: "STU-1003",
    fullName: "Nour Mostafa",
    dateOfBirth: "2013-01-12",
    gender: "Female",
    schoolGrade: "Grade 6",
    parentName: "Hany Mostafa",
    phone: "+20 122 444 7788",
    whatsapp: "+20 122 444 7788",
    email: "nour.mostafa@example.com",
    address: "Maadi, Cairo",
    registrationDate: "2026-04-11",
    status: "Archived",
    medicalNotes: "None",
    emergencyContact: "+20 122 444 7799",
    notes: "Archived after course completion.",
  },
];

function getStudents(search = "") {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return students;
  }

  return students.filter((student) => {
    const searchableText = [
      student.id,
      student.fullName,
      student.parentName,
      student.phone,
      student.whatsapp,
      student.email,
      student.schoolGrade,
      student.status,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });
}

function getStudent(studentId) {
  return students.find((student) => student.id === studentId) || null;
}

function createStudent(studentData) {
  const nextNumber = students.length + 1001;
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

  students = [student, ...students];
  return student;
}

function archiveStudent(studentId) {
  const student = students.find((item) => item.id === studentId);

  if (!student) {
    return null;
  }

  student.status = "Archived";
  return student;
}

function updateStudent(studentId, updates) {
  const student = getStudent(studentId);

  if (!student) {
    return null;
  }

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

  editableFields.forEach((field) => {
    if (updates[field] !== undefined) {
      student[field] = updates[field];
    }
  });

  return student;
}

function deleteStudent(studentId) {
  const student = getStudent(studentId);

  if (!student) {
    return null;
  }

  students = students.filter((item) => item.id !== studentId);
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
