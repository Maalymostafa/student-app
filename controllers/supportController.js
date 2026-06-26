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

async function listMessages(req, res) {
  return res.json({ messages: await getSupportMessages() });
}

async function createMessage(req, res) {
  if (!req.body.senderName || !req.body.message) {
    return res.status(400).json({ message: "Sender name and message are required" });
  }

  return res.status(201).json({ message: await createSupportMessage(req.body) });
}

async function updateMessage(req, res) {
  const message = await updateSupportMessage(req.params.id, req.body);

  if (!message) {
    return res.status(404).json({ message: "Support message not found" });
  }

  return res.json({ message });
}

async function approveReply(req, res) {
  const message = await approveSuggestedReply(req.params.id);

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
