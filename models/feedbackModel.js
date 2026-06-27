const db = require("../database/client");

async function getFeedbackForUser(user) {
  if (["Administrator", "Teacher"].includes(user.role)) {
    return db.all("SELECT * FROM feedback_items ORDER BY createdAt DESC, rowid DESC");
  }

  return db.all("SELECT * FROM feedback_items WHERE senderUserId = ? ORDER BY createdAt DESC, rowid DESC", [user.id]);
}

async function createFeedback(user, data) {
  const now = new Date().toISOString();
  const feedback = {
    id: await getNextFeedbackId(),
    senderUserId: user.id,
    senderName: user.name,
    senderRole: user.role,
    type: data.type || "Suggestion",
    pageUrl: data.pageUrl || "",
    title: data.title,
    details: data.details,
    status: "New",
    adminReply: "",
    createdAt: now,
    updatedAt: now,
  };

  await db.run(`
    INSERT INTO feedback_items (
      id, senderUserId, senderName, senderRole, type, pageUrl, title, details,
      status, adminReply, createdAt, updatedAt
    )
    VALUES (
      @id, @senderUserId, @senderName, @senderRole, @type, @pageUrl, @title, @details,
      @status, @adminReply, @createdAt, @updatedAt
    )
  `, feedback);

  return feedback;
}

async function updateFeedback(feedbackId, updates) {
  const feedback = await db.get("SELECT * FROM feedback_items WHERE id = ?", [feedbackId]);

  if (!feedback) {
    return null;
  }

  await db.run(`
    UPDATE feedback_items
    SET status = ?, adminReply = ?, updatedAt = ?
    WHERE id = ?
  `, [
    updates.status || feedback.status,
    updates.adminReply || feedback.adminReply || "",
    new Date().toISOString(),
    feedbackId,
  ]);

  return db.get("SELECT * FROM feedback_items WHERE id = ?", [feedbackId]);
}

async function getNextFeedbackId() {
  const rows = await db.all("SELECT id FROM feedback_items WHERE id LIKE 'FDB-%'");
  const highestNumber = rows.reduce((highest, row) => {
    const number = Number(String(row.id).replace("FDB-", ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 0);

  return `FDB-${String(highestNumber + 1).padStart(5, "0")}`;
}

module.exports = {
  createFeedback,
  getFeedbackForUser,
  updateFeedback,
};
