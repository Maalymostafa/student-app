const path = require("path");
const Database = require("better-sqlite3");

const databasePath = path.join(__dirname, "ams.sqlite");
const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      dateOfBirth TEXT NOT NULL,
      gender TEXT NOT NULL,
      schoolGrade TEXT NOT NULL,
      parentName TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      registrationDate TEXT NOT NULL,
      status TEXT NOT NULL,
      medicalNotes TEXT,
      emergencyContact TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      submittedAt TEXT NOT NULL,
      applicantType TEXT,
      studentName TEXT NOT NULL,
      parentName TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      schoolGrade TEXT NOT NULL,
      course TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      paymentProof TEXT NOT NULL,
      paymentProofUrl TEXT,
      refundPhone TEXT,
      intakeStatus TEXT,
      recipientMatches INTEGER NOT NULL DEFAULT 0,
      dateWithinRange INTEGER NOT NULL DEFAULT 0,
      timePresent INTEGER NOT NULL DEFAULT 0,
      paymentStatus TEXT NOT NULL,
      reservationStatus TEXT NOT NULL,
      studentCode TEXT,
      rejectionReason TEXT,
      rejectedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS registration_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      opensDay INTEGER NOT NULL,
      closesDay INTEGER NOT NULL,
      updatedAt TEXT,
      updatedBy TEXT
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      senderName TEXT NOT NULL,
      senderRole TEXT NOT NULL,
      studentName TEXT,
      category TEXT NOT NULL,
      assignedTo TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT NOT NULL,
      aiConfidence TEXT NOT NULL,
      aiSuggestedReply TEXT NOT NULL,
      finalReply TEXT,
      createdByUserId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parent_children (
      parentId TEXT NOT NULL,
      studentCode TEXT NOT NULL,
      studentName TEXT NOT NULL,
      grade TEXT NOT NULL,
      PRIMARY KEY (parentId, studentCode)
    );

    CREATE TABLE IF NOT EXISTS attendance_roster (
      studentCode TEXT PRIMARY KEY,
      studentName TEXT NOT NULL,
      schoolGrade TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_runs (
      id TEXT PRIMARY KEY,
      sessionTitle TEXT NOT NULL,
      schoolGrade TEXT NOT NULL,
      uploadedAt TEXT NOT NULL,
      presentCount INTEGER NOT NULL,
      absentCount INTEGER NOT NULL,
      studentsJson TEXT NOT NULL,
      otherGradeCodesJson TEXT NOT NULL,
      unknownCodesJson TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      sessionTitle TEXT NOT NULL,
      schoolGrade TEXT NOT NULL,
      closesAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quizId TEXT NOT NULL,
      type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      choicesJson TEXT,
      correctAnswer TEXT,
      modelAnswer TEXT,
      position INTEGER NOT NULL,
      FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_submissions (
      id TEXT PRIMARY KEY,
      quizId TEXT NOT NULL,
      quizTitle TEXT NOT NULL,
      sessionTitle TEXT NOT NULL,
      schoolGrade TEXT NOT NULL,
      studentCode TEXT NOT NULL,
      submittedAt TEXT NOT NULL,
      score INTEGER NOT NULL,
      maxScore INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      answersJson TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_late_requests (
      id TEXT PRIMARY KEY,
      quizId TEXT NOT NULL,
      quizTitle TEXT NOT NULL,
      studentCode TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL,
      requestedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grading_submissions (
      id TEXT PRIMARY KEY,
      sessionTitle TEXT NOT NULL,
      grade TEXT NOT NULL,
      studentCode TEXT NOT NULL,
      studentName TEXT NOT NULL,
      assistantTeacher TEXT NOT NULL,
      attendance TEXT NOT NULL,
      q1Image TEXT NOT NULL,
      q2Image TEXT NOT NULL,
      q1Score INTEGER,
      q2Score INTEGER,
      q1Feedback TEXT,
      q2Feedback TEXT,
      q1CorrectionPhoto TEXT,
      q2CorrectionPhoto TEXT
    );
  `);

  seedDatabase();
}

function seedDatabase() {
  if (!db.prepare("SELECT COUNT(*) AS count FROM users").get().count) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (@id, @email, @password, @name, @role)
    `);

    [
      { id: "usr_admin_001", email: "admin@academy.test", password: "password123", name: "Academy Admin", role: "Administrator" },
      { id: "usr_teacher_001", email: "teacher@academy.test", password: "password123", name: "Mona Teacher", role: "Teacher" },
      { id: "usr_parent_001", email: "parent@academy.test", password: "password123", name: "Ahmed Parent", role: "Parent" },
      { id: "usr_student_001", email: "student@academy.test", password: "password123", name: "Lina Student", role: "Student" },
    ].forEach((user) => insertUser.run(user));
  }

  if (!db.prepare("SELECT COUNT(*) AS count FROM students").get().count) {
    const insertStudent = db.prepare(`
      INSERT INTO students (
        id, fullName, dateOfBirth, gender, schoolGrade, parentName, phone, whatsapp, email,
        address, registrationDate, status, medicalNotes, emergencyContact, notes
      )
      VALUES (
        @id, @fullName, @dateOfBirth, @gender, @schoolGrade, @parentName, @phone, @whatsapp, @email,
        @address, @registrationDate, @status, @medicalNotes, @emergencyContact, @notes
      )
    `);

    [
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
    ].forEach((student) => insertStudent.run(student));
  }

  if (!db.prepare("SELECT COUNT(*) AS count FROM registrations").get().count) {
    const insertRegistration = db.prepare(`
      INSERT INTO registrations (
        id, submittedAt, applicantType, studentName, parentName, phone, whatsapp, email, schoolGrade,
        course, paymentMethod, paymentProof, paymentProofUrl, refundPhone, intakeStatus,
        recipientMatches, dateWithinRange, timePresent, paymentStatus, reservationStatus, studentCode
      )
      VALUES (
        @id, @submittedAt, @applicantType, @studentName, @parentName, @phone, @whatsapp, @email, @schoolGrade,
        @course, @paymentMethod, @paymentProof, @paymentProofUrl, @refundPhone, @intakeStatus,
        @recipientMatches, @dateWithinRange, @timePresent, @paymentStatus, @reservationStatus, @studentCode
      )
    `);

    [
      {
        id: "REG-2001",
        submittedAt: "2026-06-24",
        applicantType: "Parent",
        studentName: "Youssef Ali",
        parentName: "Sara Ali",
        phone: "+20 100 300 4500",
        whatsapp: "+20 100 300 4500",
        email: "sara.ali@example.com",
        schoolGrade: "Grade 4",
        course: "English Conversation - Level 1",
        paymentMethod: "Vodafone Cash",
        paymentProof: "payment-youssef-ali.jpg",
        paymentProofUrl: "",
        refundPhone: "",
        intakeStatus: "Open window",
        recipientMatches: 0,
        dateWithinRange: 0,
        timePresent: 0,
        paymentStatus: "Needs review",
        reservationStatus: "Pending",
        studentCode: "",
      },
      {
        id: "REG-2002",
        submittedAt: "2026-06-25",
        applicantType: "Parent",
        studentName: "Farida Samir",
        parentName: "Samir Nabil",
        phone: "+20 111 909 7711",
        whatsapp: "+20 111 909 7711",
        email: "samir.nabil@example.com",
        schoolGrade: "Prep 2",
        course: "English Grammar - Level 2",
        paymentMethod: "Instapay",
        paymentProof: "payment-farida-samir.png",
        paymentProofUrl: "",
        refundPhone: "",
        intakeStatus: "Open window",
        recipientMatches: 1,
        dateWithinRange: 1,
        timePresent: 0,
        paymentStatus: "Needs review",
        reservationStatus: "Pending",
        studentCode: "",
      },
      {
        id: "REG-2003",
        submittedAt: "2026-06-22",
        applicantType: "Parent",
        studentName: "Karim Tarek",
        parentName: "Tarek Mahmoud",
        phone: "+20 122 707 8811",
        whatsapp: "+20 122 707 8811",
        email: "tarek.mahmoud@example.com",
        schoolGrade: "Prep 2",
        course: "Placement Test",
        paymentMethod: "Bank transfer",
        paymentProof: "payment-karim-tarek.pdf",
        paymentProofUrl: "",
        refundPhone: "",
        intakeStatus: "Open window",
        recipientMatches: 1,
        dateWithinRange: 1,
        timePresent: 1,
        paymentStatus: "Verified",
        reservationStatus: "Confirmed",
        studentCode: "p20064h",
      },
    ].forEach((registration) => insertRegistration.run(registration));
  }

  db.prepare(`
    INSERT OR IGNORE INTO registration_settings (id, opensDay, closesDay, updatedAt, updatedBy)
    VALUES (1, 1, 10, '', '')
  `).run();

  if (!db.prepare("SELECT COUNT(*) AS count FROM parent_children").get().count) {
    const insertChild = db.prepare(`
      INSERT INTO parent_children (parentId, studentCode, studentName, grade)
      VALUES (@parentId, @studentCode, @studentName, @grade)
    `);

    [
      { parentId: "usr_parent_001", studentCode: "STU-2026-001", studentName: "Lina Ahmed", grade: "Grade 7" },
      { parentId: "usr_parent_001", studentCode: "STU-2026-002", studentName: "Omar Hassan", grade: "Grade 7" },
    ].forEach((child) => insertChild.run(child));
  }

  if (!db.prepare("SELECT COUNT(*) AS count FROM attendance_roster").get().count) {
    const insertRoster = db.prepare(`
      INSERT INTO attendance_roster (studentName, schoolGrade, studentCode)
      VALUES (@studentName, @schoolGrade, @studentCode)
    `);

    [
      { studentName: "Youssef Ali", schoolGrade: "Grade 4", studentCode: "g40064h" },
      { studentName: "Mariam Adel", schoolGrade: "Grade 4", studentCode: "g40065h" },
      { studentName: "Nour Mostafa", schoolGrade: "Grade 6", studentCode: "g60064h" },
      { studentName: "Karim Tarek", schoolGrade: "Prep 2", studentCode: "p20064h" },
      { studentName: "Farida Samir", schoolGrade: "Prep 2", studentCode: "p20065h" },
    ].forEach((student) => insertRoster.run(student));
  }

  if (!db.prepare("SELECT COUNT(*) AS count FROM support_messages").get().count) {
    const insertMessage = db.prepare(`
      INSERT INTO support_messages (
        id, senderName, senderRole, studentName, category, assignedTo, status, message,
        aiConfidence, aiSuggestedReply, finalReply, createdByUserId, createdAt, updatedAt
      )
      VALUES (
        @id, @senderName, @senderRole, @studentName, @category, @assignedTo, @status, @message,
        @aiConfidence, @aiSuggestedReply, @finalReply, @createdByUserId, @createdAt, @updatedAt
      )
    `);

    [
      {
        id: "MSG-4001",
        senderName: "Sara Ali",
        senderRole: "Parent",
        studentName: "Youssef Ali",
        category: "Session question",
        assignedTo: "Assistant Teacher",
        status: "New",
        message: "What time is the next Zoom session?",
        aiConfidence: "High",
        aiSuggestedReply: "The next Zoom session time will be shared in your session schedule. Please check the latest academy update, and we will notify you if there is any change.",
        finalReply: "",
        createdByUserId: "",
        createdAt: "2026-06-24T10:00:00.000Z",
        updatedAt: "2026-06-24T10:00:00.000Z",
      },
      {
        id: "MSG-4002",
        senderName: "Omar Hassan",
        senderRole: "Student",
        studentName: "Omar Hassan",
        category: "Technical support",
        assignedTo: "Technical Support",
        status: "In progress",
        message: "I cannot open my results page.",
        aiConfidence: "Medium",
        aiSuggestedReply: "Please try logging out and logging in again with your student account. If it still does not open, technical support should check your account.",
        finalReply: "",
        createdByUserId: "",
        createdAt: "2026-06-25T11:30:00.000Z",
        updatedAt: "2026-06-25T11:30:00.000Z",
      },
      {
        id: "MSG-4003",
        senderName: "Mariam Hassan",
        senderRole: "Parent",
        studentName: "Omar Hassan",
        category: "Grade question",
        assignedTo: "Miss Hoda / Assistant Teacher",
        status: "New",
        message: "Why did Omar get 1 in question one?",
        aiConfidence: "Needs human",
        aiSuggestedReply: "What is the best reply for this message?",
        finalReply: "",
        createdByUserId: "",
        createdAt: "2026-06-25T12:15:00.000Z",
        updatedAt: "2026-06-25T12:15:00.000Z",
      },
      {
        id: "MSG-4004",
        senderName: "Ahmed Parent",
        senderRole: "Parent",
        studentName: "Lina Ahmed",
        category: "Technical support",
        assignedTo: "Technical Support",
        status: "Answered",
        message: "I cannot see Lina's old session result.",
        aiConfidence: "Needs human",
        aiSuggestedReply: "What is the best reply for this message?",
        finalReply: "We checked Lina's account and restored the old session result in the parent portal.",
        createdByUserId: "usr_parent_001",
        createdAt: "2026-06-20T09:00:00.000Z",
        updatedAt: "2026-06-20T10:10:00.000Z",
      },
    ].forEach((message) => insertMessage.run(message));
  }

  if (!db.prepare("SELECT COUNT(*) AS count FROM quizzes").get().count) {
    db.prepare(`
      INSERT INTO quizzes (id, title, sessionTitle, schoolGrade, closesAt)
      VALUES ('QUIZ-5001', 'Session 1 Quick Quiz', 'Zoom Webinar - Session 1', 'Grade 4', '2099-12-31T16:00')
    `).run();

    const insertQuestion = db.prepare(`
      INSERT INTO quiz_questions (id, quizId, type, prompt, choicesJson, correctAnswer, modelAnswer, position)
      VALUES (@id, @quizId, @type, @prompt, @choicesJson, @correctAnswer, @modelAnswer, @position)
    `);

    [
      {
        id: "Q-1",
        quizId: "QUIZ-5001",
        type: "multiple_choice",
        prompt: "Choose the correct past form of go.",
        choicesJson: JSON.stringify(["goed", "went", "goes", "going"]),
        correctAnswer: "went",
        modelAnswer: "",
        position: 1,
      },
      {
        id: "Q-2",
        quizId: "QUIZ-5001",
        type: "completion",
        prompt: "I ____ my homework yesterday.",
        choicesJson: JSON.stringify(["do", "did", "does", "doing"]),
        correctAnswer: "did",
        modelAnswer: "",
        position: 2,
      },
      {
        id: "Q-3",
        quizId: "QUIZ-5001",
        type: "essay",
        prompt: "Write one sentence about your last weekend.",
        choicesJson: JSON.stringify([]),
        correctAnswer: "",
        modelAnswer: "I visited my family last weekend.",
        position: 3,
      },
    ].forEach((question) => insertQuestion.run(question));
  }

  if (!db.prepare("SELECT COUNT(*) AS count FROM grading_submissions").get().count) {
    const insertSubmission = db.prepare(`
      INSERT INTO grading_submissions (
        id, sessionTitle, grade, studentCode, studentName, assistantTeacher, attendance, q1Image, q2Image,
        q1Score, q2Score, q1Feedback, q2Feedback, q1CorrectionPhoto, q2CorrectionPhoto
      )
      VALUES (
        @id, @sessionTitle, @grade, @studentCode, @studentName, @assistantTeacher, @attendance, @q1Image, @q2Image,
        @q1Score, @q2Score, @q1Feedback, @q2Feedback, @q1CorrectionPhoto, @q2CorrectionPhoto
      )
    `);

    [
      {
        id: "SUB-3001",
        sessionTitle: "Zoom Webinar - Session 1",
        grade: "Grade 7",
        studentCode: "STU-2026-001",
        studentName: "Lina Ahmed",
        assistantTeacher: "Mona Teacher",
        attendance: "Present",
        q1Image: "Handwriting photo: Q1 answer about past simple verbs",
        q2Image: "Handwriting photo: Q2 answer about sentence correction",
        q1Score: null,
        q2Score: null,
        q1Feedback: "",
        q2Feedback: "",
        q1CorrectionPhoto: "",
        q2CorrectionPhoto: "",
      },
      {
        id: "SUB-3002",
        sessionTitle: "Zoom Webinar - Session 1",
        grade: "Grade 7",
        studentCode: "STU-2026-002",
        studentName: "Omar Hassan",
        assistantTeacher: "Mona Teacher",
        attendance: "Present",
        q1Image: "Handwriting photo: Q1 short answer",
        q2Image: "Handwriting photo: Q2 grammar correction",
        q1Score: 1,
        q2Score: null,
        q1Feedback: "Good idea, but the verb ending needs correction.",
        q2Feedback: "",
        q1CorrectionPhoto: "omar-q1-corrected.jpg",
        q2CorrectionPhoto: "",
      },
      {
        id: "SUB-3003",
        sessionTitle: "Zoom Webinar - Session 1",
        grade: "Grade 6",
        studentCode: "STU-2026-003",
        studentName: "Nour Mostafa",
        assistantTeacher: "Mona Teacher",
        attendance: "Absent",
        q1Image: "No uploaded answer",
        q2Image: "No uploaded answer",
        q1Score: 0,
        q2Score: 0,
        q1Feedback: "No answer uploaded.",
        q2Feedback: "No answer uploaded.",
        q1CorrectionPhoto: "",
        q2CorrectionPhoto: "",
      },
    ].forEach((submission) => insertSubmission.run(submission));
  }
}

initializeDatabase();

module.exports = db;
