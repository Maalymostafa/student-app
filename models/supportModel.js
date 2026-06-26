const fs = require("fs");
const path = require("path");

const supportMessagesFile = path.join(__dirname, "..", "database", "support-messages.json");

const seedSupportMessages = [
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
    createdByUserId: "usr_parent_001",
    status: "Answered",
    message: "I cannot see Lina's old session result.",
    aiConfidence: "Needs human",
    aiSuggestedReply: "What is the best reply for this message?",
    finalReply: "We checked Lina's account and restored the old session result in the parent portal.",
    createdAt: "2026-06-20T09:00:00.000Z",
    updatedAt: "2026-06-20T10:10:00.000Z",
  },
];

let supportMessages = loadSupportMessages();

function getSupportMessages() {
  return supportMessages;
}

function createSupportMessage(data) {
  const now = new Date().toISOString();
  const message = {
    id: getNextMessageId(),
    senderName: data.senderName,
    senderRole: data.senderRole || "Parent",
    studentName: data.studentName || "",
    category: data.category || "General question",
    assignedTo: data.assignedTo || getDefaultAssignee(data.category),
    createdByUserId: data.createdByUserId || "",
    status: "New",
    message: data.message,
    aiConfidence: "Needs human",
    aiSuggestedReply: "What is the best reply for this message?",
    finalReply: "",
    createdAt: now,
    updatedAt: now,
  };

  supportMessages.unshift(message);
  saveSupportMessages();
  return message;
}

function getMessagesForUser(userId) {
  return supportMessages.filter((message) => message.createdByUserId === userId);
}

function updateSupportMessage(messageId, updates) {
  const message = supportMessages.find((item) => item.id === messageId);

  if (!message) {
    return null;
  }

  message.assignedTo = updates.assignedTo || message.assignedTo;
  message.status = updates.status || message.status;
  message.finalReply = updates.finalReply || message.finalReply;
  message.updatedAt = new Date().toISOString();
  saveSupportMessages();

  return message;
}

function approveSuggestedReply(messageId) {
  const message = supportMessages.find((item) => item.id === messageId);

  if (!message) {
    return null;
  }

  message.finalReply = message.aiSuggestedReply;
  message.status = "Answered";
  message.updatedAt = new Date().toISOString();
  saveSupportMessages();

  return message;
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

function getNextMessageId() {
  const highestNumber = supportMessages.reduce((highest, message) => {
    const number = Number(String(message.id).replace("MSG-", ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 4000);

  return `MSG-${highestNumber + 1}`;
}

function loadSupportMessages() {
  ensureDatabaseFile();

  try {
    const fileContent = fs.readFileSync(supportMessagesFile, "utf8");
    const parsedMessages = JSON.parse(fileContent);
    return Array.isArray(parsedMessages) ? parsedMessages : seedSupportMessages;
  } catch (error) {
    return seedSupportMessages;
  }
}

function saveSupportMessages() {
  ensureDatabaseFile();
  fs.writeFileSync(supportMessagesFile, JSON.stringify(supportMessages, null, 2));
}

function ensureDatabaseFile() {
  const databaseDir = path.dirname(supportMessagesFile);

  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  if (!fs.existsSync(supportMessagesFile)) {
    fs.writeFileSync(supportMessagesFile, JSON.stringify(seedSupportMessages, null, 2));
  }
}

module.exports = {
  approveSuggestedReply,
  createSupportMessage,
  getMessagesForUser,
  getSupportMessages,
  updateSupportMessage,
};
