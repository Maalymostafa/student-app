const path = require("path");
const {
  approveSuggestedReply,
  getSupportMessages,
  updateSupportMessage,
} = require("../models/supportModel");

function showSupportInbox(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "support-inbox.html"));
}

function listMessages(req, res) {
  return res.json({ messages: getSupportMessages() });
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
  listMessages,
  showSupportInbox,
  updateMessage,
};
