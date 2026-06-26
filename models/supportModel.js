const db = require("../database/db");

function getSupportMessages() {
  return db.prepare("SELECT * FROM support_messages ORDER BY createdAt DESC, rowid DESC").all();
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

  db.prepare(`
    INSERT INTO support_messages (
      id, senderName, senderRole, studentName, category, assignedTo, status, message,
      aiConfidence, aiSuggestedReply, finalReply, createdByUserId, createdAt, updatedAt
    )
    VALUES (
      @id, @senderName, @senderRole, @studentName, @category, @assignedTo, @status, @message,
      @aiConfidence, @aiSuggestedReply, @finalReply, @createdByUserId, @createdAt, @updatedAt
    )
  `).run(message);

  return message;
}

function getMessagesForUser(userId) {
  return db.prepare("SELECT * FROM support_messages WHERE createdByUserId = ? ORDER BY createdAt DESC, rowid DESC").all(userId);
}

function updateSupportMessage(messageId, updates) {
  const message = db.prepare("SELECT * FROM support_messages WHERE id = ?").get(messageId);

  if (!message) {
    return null;
  }

  db.prepare(`
    UPDATE support_messages
    SET assignedTo = ?, status = ?, finalReply = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    updates.assignedTo || message.assignedTo,
    updates.status || message.status,
    updates.finalReply || message.finalReply,
    new Date().toISOString(),
    messageId
  );

  return db.prepare("SELECT * FROM support_messages WHERE id = ?").get(messageId);
}

function approveSuggestedReply(messageId) {
  const message = db.prepare("SELECT * FROM support_messages WHERE id = ?").get(messageId);

  if (!message) {
    return null;
  }

  db.prepare(`
    UPDATE support_messages
    SET finalReply = aiSuggestedReply, status = 'Answered', updatedAt = ?
    WHERE id = ?
  `).run(new Date().toISOString(), messageId);

  return db.prepare("SELECT * FROM support_messages WHERE id = ?").get(messageId);
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
  const rows = db.prepare("SELECT id FROM support_messages WHERE id LIKE 'MSG-%'").all();
  const highestNumber = rows.reduce((highest, message) => {
    const number = Number(String(message.id).replace("MSG-", ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 4000);

  return `MSG-${highestNumber + 1}`;
}

module.exports = {
  approveSuggestedReply,
  createSupportMessage,
  getMessagesForUser,
  getSupportMessages,
  updateSupportMessage,
};
