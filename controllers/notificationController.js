const path = require("path");
const {
  createNotificationBatch,
  getNotificationsForUser,
  markNotificationRead,
} = require("../models/notificationModel");

function showNotificationsPage(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "notifications.html"));
}

async function listNotifications(req, res) {
  const notifications = await getNotificationsForUser(req.session.user);
  const unreadCount = notifications.filter((notification) => notification.status === "Unread").length;

  return res.json({ notifications, unreadCount, user: req.session.user });
}

async function sendNotification(req, res) {
  const requiredFields = ["audience", "title", "body"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length) {
    return res.status(400).json({ message: "Missing notification information", missingFields });
  }

  const result = await createNotificationBatch({
    ...req.body,
    createdByUserId: req.session.user.id,
  });

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  return res.status(201).json({
    notifications: result.created,
    count: result.created.length,
  });
}

async function markRead(req, res) {
  const notification = await markNotificationRead(req.session.user, req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  return res.json({ notification });
}

module.exports = {
  listNotifications,
  markRead,
  sendNotification,
  showNotificationsPage,
};
