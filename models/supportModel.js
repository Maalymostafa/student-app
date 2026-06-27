const db = require("../database/client");

const defaultFlows = [
  {
    id: "FLOW-SYSTEM-LOGIN",
    title: "I cannot sign in",
    category: "Technical support",
    audience: "Parent/Student",
    status: "Active",
    nodes: {
      start: {
        text: "Are you signing in as Student or Parent?",
        options: [
          { label: "Student", next: "student-login" },
          { label: "Parent", next: "parent-login" },
          { label: "Admin / Teacher", next: "human" },
        ],
      },
      "student-login": {
        text: "Choose Student, then use the student code and the password chosen during registration.",
        options: [
          { label: "It worked", next: "solved" },
          { label: "I forgot the password", next: "human" },
          { label: "The code is rejected", next: "human" },
        ],
      },
      "parent-login": {
        text: "Choose Parent, then use any child student code with that child password. The parent portal will show all children linked to the same parent WhatsApp number.",
        options: [
          { label: "It worked", next: "solved" },
          { label: "I cannot see all children", next: "human" },
          { label: "Password does not work", next: "human" },
        ],
      },
      solved: { resolution: "Great, no support message is needed." },
      human: { resolution: "Leave a message with the student code, parent WhatsApp number, and what happened on the login screen." },
    },
  },
  {
    id: "FLOW-SYSTEM-PAYMENT",
    title: "Payment or balance problem",
    category: "Payments",
    audience: "Parent/Student",
    status: "Active",
    nodes: {
      start: {
        text: "What payment problem do you have?",
        options: [
          { label: "I want to upload payment proof", next: "upload" },
          { label: "Payment is still pending", next: "pending" },
          { label: "Remaining balance looks wrong", next: "human" },
        ],
      },
      upload: {
        text: "Open Payments, choose the child, enter payment details, and upload a clear transaction photo showing amount, receiver, date, time, and sender number.",
        options: [
          { label: "I found it", next: "solved" },
          { label: "Upload failed", next: "human" },
        ],
      },
      pending: {
        text: "Pending review means the academy received the proof but has not confirmed it yet.",
        options: [
          { label: "Okay", next: "solved" },
          { label: "It has been too long", next: "human" },
        ],
      },
      solved: { resolution: "Great, no support message is needed." },
      human: { resolution: "Leave a message with the student code, amount paid, transfer date/time, and transfer phone." },
    },
  },
  {
    id: "FLOW-SYSTEM-SESSION",
    title: "Zoom, attendance, or answer upload",
    category: "Session question",
    audience: "Parent/Student",
    status: "Active",
    nodes: {
      start: {
        text: "What do you need help with?",
        options: [
          { label: "Zoom link", next: "zoom" },
          { label: "Attendance", next: "attendance" },
          { label: "Upload Q1/Q2 answers", next: "answers" },
        ],
      },
      zoom: {
        text: "The Zoom link appears in My Results only at the time set by the academy. Before that, it stays hidden.",
        options: [
          { label: "I will wait", next: "solved" },
          { label: "The session time started but no link appeared", next: "human" },
        ],
      },
      attendance: {
        text: "During the open session window, press Mark attendance only. If you upload Q1 or Q2, attendance is marked automatically.",
        options: [
          { label: "Understood", next: "solved" },
          { label: "The window closed before I could mark attendance", next: "human" },
        ],
      },
      answers: {
        text: "Open Upload answers during the session window. You may upload Q1, Q2, or both. Uploading any answer marks attendance automatically.",
        options: [
          { label: "I found it", next: "solved" },
          { label: "I could not upload", next: "human" },
        ],
      },
      solved: { resolution: "Great, no support message is needed." },
      human: { resolution: "Leave a message with the session name, student code, and what step failed." },
    },
  },
  {
    id: "FLOW-SYSTEM-RESULTS",
    title: "Grades, feedback, or prize question",
    category: "Grade question",
    audience: "Parent/Student",
    status: "Active",
    nodes: {
      start: {
        text: "What result question do you have?",
        options: [
          { label: "I cannot see a correction", next: "correction" },
          { label: "I disagree with a score", next: "human" },
          { label: "Monthly prize", next: "prize" },
        ],
      },
      correction: {
        text: "If the result says Correction in progress, the assistant has not finished checking the answer yet.",
        options: [
          { label: "Okay", next: "solved" },
          { label: "It has been too long", next: "human" },
        ],
      },
      prize: {
        text: "Monthly prize appears when the student completes the monthly target and reaches the required full score. The prize transfer phone is collected during registration.",
        options: [
          { label: "Okay", next: "solved" },
          { label: "Prize phone is wrong", next: "human" },
        ],
      },
      solved: { resolution: "Great, no support message is needed." },
      human: { resolution: "Leave a message with the session/month, student code, and the exact score or question you want reviewed." },
    },
  },
];

async function getSupportMessages() {
  return db.all("SELECT * FROM support_messages ORDER BY createdAt DESC, rowid DESC");
}

async function getSupportFlows() {
  const customFlows = await db.all("SELECT * FROM support_flows WHERE status = 'Active' ORDER BY createdAt DESC, rowid DESC");
  return [...defaultFlows, ...customFlows.map(mapFlow)];
}

async function createSupportFlow(data) {
  const now = new Date().toISOString();
  const flow = {
    id: await getNextFlowId(),
    title: data.title,
    category: data.category,
    audience: data.audience || "Parent/Student",
    flowJson: data.flowJson,
    status: "Active",
    createdAt: now,
    updatedAt: now,
  };

  JSON.parse(flow.flowJson);

  await db.run(`
    INSERT INTO support_flows (id, title, category, audience, flowJson, status, createdAt, updatedAt)
    VALUES (@id, @title, @category, @audience, @flowJson, @status, @createdAt, @updatedAt)
  `, flow);

  return mapFlow(flow);
}

async function createSupportMessage(data) {
  const now = new Date().toISOString();
  const message = {
    id: await getNextMessageId(),
    senderName: data.senderName,
    senderRole: data.senderRole || "Parent",
    studentName: data.studentName || "",
    category: data.category || "General question",
    assignedTo: data.assignedTo || getDefaultAssignee(data.category),
    createdByUserId: data.createdByUserId || "",
    status: "New",
    message: data.message,
    aiConfidence: data.aiConfidence || "Needs human",
    aiSuggestedReply: data.aiSuggestedReply || "What is the best reply for this message?",
    finalReply: "",
    createdAt: now,
    updatedAt: now,
  };

  await db.run(`
    INSERT INTO support_messages (
      id, senderName, senderRole, studentName, category, assignedTo, status, message,
      aiConfidence, aiSuggestedReply, finalReply, createdByUserId, createdAt, updatedAt
    )
    VALUES (
      @id, @senderName, @senderRole, @studentName, @category, @assignedTo, @status, @message,
      @aiConfidence, @aiSuggestedReply, @finalReply, @createdByUserId, @createdAt, @updatedAt
    )
  `, message);

  return message;
}

async function getMessagesForUser(userId) {
  return db.all("SELECT * FROM support_messages WHERE createdByUserId = ? ORDER BY createdAt DESC, rowid DESC", [userId]);
}

async function updateSupportMessage(messageId, updates) {
  const message = await db.get("SELECT * FROM support_messages WHERE id = ?", [messageId]);

  if (!message) {
    return null;
  }

  await db.run(`
    UPDATE support_messages
    SET assignedTo = ?, status = ?, finalReply = ?, updatedAt = ?
    WHERE id = ?
  `, [
    updates.assignedTo || message.assignedTo,
    updates.status || message.status,
    updates.finalReply || message.finalReply,
    new Date().toISOString(),
    messageId,
  ]);

  return db.get("SELECT * FROM support_messages WHERE id = ?", [messageId]);
}

async function approveSuggestedReply(messageId) {
  const message = await db.get("SELECT * FROM support_messages WHERE id = ?", [messageId]);

  if (!message) {
    return null;
  }

  await db.run(`
    UPDATE support_messages
    SET finalReply = aiSuggestedReply, status = 'Answered', updatedAt = ?
    WHERE id = ?
  `, [new Date().toISOString(), messageId]);

  return db.get("SELECT * FROM support_messages WHERE id = ?", [messageId]);
}

function getDefaultAssignee(category = "") {
  const normalized = category.toLowerCase();

  if (normalized.includes("technical")) {
    return "Technical Support";
  }

  if (normalized.includes("grade")) {
    return "Miss Hoda / Assistant Teacher";
  }

  if (normalized.includes("group") || normalized.includes("access")) {
    return "Manager";
  }

  return "Assistant Teacher";
}

async function getNextMessageId() {
  const rows = await db.all("SELECT id FROM support_messages WHERE id LIKE 'MSG-%'");
  const highestNumber = rows.reduce((highest, message) => {
    const number = Number(String(message.id).replace("MSG-", ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 4000);

  return `MSG-${highestNumber + 1}`;
}

async function getNextFlowId() {
  const rows = await db.all("SELECT id FROM support_flows WHERE id LIKE 'FLOW-%'");
  const highestNumber = rows.reduce((highest, flow) => {
    const number = Number(String(flow.id).replace("FLOW-", ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 0);

  return `FLOW-${String(highestNumber + 1).padStart(4, "0")}`;
}

function mapFlow(flow) {
  return {
    id: flow.id,
    title: flow.title,
    category: flow.category,
    audience: flow.audience,
    status: flow.status,
    nodes: flow.nodes || JSON.parse(flow.flowJson || "{}"),
  };
}

module.exports = {
  approveSuggestedReply,
  createSupportFlow,
  createSupportMessage,
  getMessagesForUser,
  getSupportFlows,
  getSupportMessages,
  updateSupportMessage,
};
