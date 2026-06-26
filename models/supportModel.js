const db = require("../database/client");

async function getSupportMessages() {
  return db.all("SELECT * FROM support_messages ORDER BY createdAt DESC, rowid DESC");
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
    aiConfidence: "Needs human",
    aiSuggestedReply: "What is the best reply for this message?",
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
    messageId
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

module.exports = {
  approveSuggestedReply,
  createSupportMessage,
  getMessagesForUser,
  getSupportMessages,
  updateSupportMessage,
};
