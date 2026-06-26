let supportMessages = [
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
  },
];

function getSupportMessages() {
  return supportMessages;
}

function createSupportMessage(data) {
  const message = {
    id: `MSG-${4000 + supportMessages.length + 1}`,
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
  };

  supportMessages.unshift(message);
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

  return message;
}

function approveSuggestedReply(messageId) {
  const message = supportMessages.find((item) => item.id === messageId);

  if (!message) {
    return null;
  }

  message.finalReply = message.aiSuggestedReply;
  message.status = "Answered";

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

module.exports = {
  approveSuggestedReply,
  createSupportMessage,
  getMessagesForUser,
  getSupportMessages,
  updateSupportMessage,
};
