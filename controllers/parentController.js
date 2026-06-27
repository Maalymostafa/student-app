const path = require("path");
const { getChildrenForParent } = require("../models/parentModel");
const { getStudentResults } = require("../models/gradingModel");
const { createSupportMessage, getMessagesForUser } = require("../models/supportModel");

function showParentPortal(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "parent-portal.html"));
}

async function getParentOverview(req, res) {
  const children = await Promise.all((await getChildrenForParent(req.session.user)).map(async (child) => ({
    ...child,
    results: await getStudentResults(child.studentCode),
  })));

  return res.json({
    parent: req.session.user,
    children,
  });
}

async function listParentMessages(req, res) {
  return res.json({
    messages: await getMessagesForUser(req.session.user.id),
  });
}

async function createParentMessage(req, res) {
  if (!req.body.message) {
    return res.status(400).json({ message: "Message is required" });
  }

  const supportMessage = await createSupportMessage({
    senderName: req.body.senderName || req.session.user.name,
    senderRole: "Parent",
    studentName: req.body.studentName || "",
    category: req.body.category || "General question",
    message: req.body.message,
    createdByUserId: req.session.user.id,
  });

  return res.status(201).json({ message: supportMessage });
}

module.exports = {
  createParentMessage,
  getParentOverview,
  listParentMessages,
  showParentPortal,
};
