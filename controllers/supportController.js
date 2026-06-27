const path = require("path");
const {
  approveSuggestedReply,
  createSupportFlow,
  createSupportMessage,
  getSupportFlows,
  getSupportMessages,
  updateSupportMessage,
} = require("../models/supportModel");

function showSupportInbox(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "support-inbox.html"));
}

function showSupportPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "support.html"));
}

async function listMessages(req, res) {
  return res.json({ messages: await getSupportMessages() });
}

async function listMyMessages(req, res) {
  const { getMessagesForUser } = require("../models/supportModel");
  return res.json({ messages: await getMessagesForUser(req.session.user.id) });
}

async function listFlows(req, res) {
  return res.json({ flows: await getSupportFlows() });
}

async function createFlow(req, res) {
  const requiredFields = ["title", "category", "flowJson"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length) {
    return res.status(400).json({ message: "Missing support scenario information", missingFields });
  }

  try {
    return res.status(201).json({ flow: await createSupportFlow(req.body) });
  } catch (error) {
    return res.status(400).json({ message: "Flow JSON is not valid" });
  }
}

async function createMessage(req, res) {
  if (!req.body.senderName || !req.body.message) {
    return res.status(400).json({ message: "Sender name and message are required" });
  }

  return res.status(201).json({
    message: await createSupportMessage({
      ...req.body,
      senderRole: req.body.senderRole || req.session.user.role,
      createdByUserId: req.session.user.id,
    }),
  });
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
  createFlow,
  createMessage,
  listFlows,
  listMyMessages,
  listMessages,
  showSupportPage,
  showSupportInbox,
  updateMessage,
};
