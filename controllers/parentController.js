const path = require("path");
const { getChildrenForParent } = require("../models/parentModel");
const { getStudentResults } = require("../models/gradingModel");
const { createSupportMessage, getMessagesForUser } = require("../models/supportModel");

function showParentPortal(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "parent-portal.html"));
}

function getParentOverview(req, res) {
  const children = getChildrenForParent(req.session.user.id).map((child) => ({
    ...child,
    results: getStudentResults(child.studentCode),
  }));

  return res.json({
    parent: req.session.user,
    children,
  });
}

function listParentMessages(req, res) {
  return res.json({
    messages: getMessagesForUser(req.session.user.id),
  });
}

function createParentMessage(req, res) {
  if (!req.body.message) {
    return res.status(400).json({ message: "Message is required" });
  }

  const supportMessage = createSupportMessage({
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
