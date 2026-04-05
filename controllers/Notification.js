const Notification = require("../models/notification");
const User = require("../models/UserModel");
const {
  createRequest,
  respondToRequest,
  backfillMatchesFromAcceptedInterestRequests,
} = require("../services/requestService");

const createNotification = async (req, res) => {
  try {
    const sender = req.user?._id;
    const recipient = req.params.targetUserId;
    const { message, type } = req.body;

    if (!sender) {
      return res.status(401).json({ message: "Sender not authenticated" });
    }

    if (!recipient) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    if (!type) {
      return res.status(400).json({ message: "Notification type is required" });
    }

    if (!["interest", "image"].includes(type)) {
      return res.status(400).json({
        message: "Only interest and image requests can be created from this endpoint",
      });
    }

    const notification = await createRequest({
      requesterId: sender,
      recipientId: recipient,
      type,
      message,
    });

    return res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Server Error",
    });
  }
};

const fixMatchesOverGet = async (req, res) => {
  try {
    const { createdCount, skippedCount } =
      await backfillMatchesFromAcceptedInterestRequests();

    return res.status(200).json({
      success: true,
      message: `Backup run complete: ${createdCount} new matches created, ${skippedCount} skipped.`,
    });
  } catch (error) {
    console.error("Error in fixOverFetch:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getApprovedImageRequests = async (req, res) => {
  try {
    const owners = await User.find({
      approvedViewers: req.user._id,
    }).select("_id");

    res.status(200).json({
      approvedIds: owners.map((owner) => owner._id),
    });
  } catch (error) {
    console.error("Error fetching approved image requests:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const { type } = req.query;
    const query = {
      $or: [{ recipient: userId }, { sender: userId }],
    };

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate("sender", "first_name last_name")
      .populate("recipient", "first_name last_name")
      .populate("parentNotification", "type status createdAt");

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: req.user._id,
      },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const updateNotificationStatus = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { action } = req.body;

    if (!notificationId || !action) {
      return res.status(400).json({
        message: "Notification ID and action are required.",
      });
    }

    const { requestNotification, responseNotification, match } =
      await respondToRequest({
        notificationId,
        responderId: req.user._id,
        action,
      });

    res.status(200).json({
      success: true,
      message:
        match && action === "accepted"
          ? "Request accepted and match created."
          : "Notification updated.",
      notification: requestNotification,
      responseNotification,
      match,
    });
  } catch (error) {
    console.error("Error updating notification status:", error);
    res.status(error.statusCode || 500).json({
      message: error.message || "Server Error",
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const userId = req.user._id.toString();
    const isOwner =
      notification.recipient?.toString() === userId ||
      notification.sender?.toString() === userId;

    if (!isOwner) {
      return res.status(401).json({ message: "Not authorized to delete this notification" });
    }

    await Notification.deleteOne({ _id: notification._id });

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createNotification,
  getAllNotifications,
  fixMatchesOverGet,
  updateNotificationStatus,
  getApprovedImageRequests,
  deleteNotification,
  markAllAsRead,
  markNotificationAsRead,
  getUnreadCount,
};
