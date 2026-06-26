const path = require("path");
const {
  approveSuggestedReply,
  createSupportMessage,
  getSupportMessages,
  updateSupportMessage,
} = require("../models/supportModel");

function showSupportInbox(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "support-inbox.html"));
}

function listMessages(req, res) {
  return res.json({ messages: getSupportMessages() });
}

function createMessage(req, res) {
  if (!req.body.senderName || !req.body.message) {
    return res.status(400).json({ message: "Sender name and message are required" });
  }

  return res.status(201).json({ message: createSupportMessage(req.body) });
}

function updateMessage(req, res) {
  const message = updateSupportMessage(req.params.id, req.body);

  if (!message) {
    return res.status(404).json({ message: "Support message not found" });
  }

  return res.json({ message });
}

function approveReply(req, res) {
  const message = approveSuggestedReply(req.params.id);

  if (!message) {
    return res.status(404).json({ message: "Support message not found" });
  }

  return res.json({ message });
}

module.exports = {
  approveReply,
  createMessage,
  listMessages,
  showSupportInbox,
  updateMessage,
};
