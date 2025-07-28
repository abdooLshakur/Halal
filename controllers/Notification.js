const Notification = require('../models/notification');
const User = require('../models/UserModel');
const Match = require('../models/MatchModel');

// Create a new Notification (Submit Interest)
const createNotification = async (req, res) => {
  try {
    const sender = req.user._id;
    const recipient = req.params.targetUserId;
    const { message, type } = req.body;

    if (!recipient) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    // Validate that type is provided in the request
    if (!type) {
      return res.status(400).json({ message: 'Notification type is required' });
    }

    const notification = await Notification.create({
      sender,
      recipient,
      type,
      message,
    });

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const fixMatchesOverGet = async (req, res) => {
  try {
    const acceptedNotifications = await Notification.find({
      type: 'interest',
      status: 'accepted',
      matchCreated: { $ne: true }, // Optional: avoid reprocessing
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const notification of acceptedNotifications) {
      const senderId = notification.sender.toString();
      const recipientId = notification.recipient.toString();

      // Ensure consistent ordering
      const [user1, user2] = senderId < recipientId
        ? [senderId, recipientId]
        : [recipientId, senderId];

      // Check if match already exists
      const matchExists = await Match.findOne({ user1, user2 });
      if (matchExists) {
        skippedCount++;
        notification.matchCreated = true; // mark so it's skipped next time
        await notification.save();
        continue;
      }

      // Create new match
      await Match.create({ user1, user2 });

      const message = 'You’ve been matched! Contact info will be shared once approved.';

      // Notify both users
      await Notification.create({
        recipient: senderId,
        sender: recipientId,
        type: 'interest_response',
        message,
      });

      await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'interest_response',
        message,
      });

      // Mark original notification to avoid reprocessing
      notification.matchCreated = true;
      await notification.save();

      createdCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Finished processing. ${createdCount} new matches created, ${skippedCount} skipped.`,
    });
  } catch (error) {
    console.error('Error in fixMatchesOverGet:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getApprovedImageRequests = async (req, res) => {
  try {
    const approvedRequests = await Notification.find({
      sender: req.user.id,
      type: 'image',
      status: 'accepted'
    }).select('recipient');

    res.status(200).json({
      approvedIds: approvedRequests.map(req => req.recipient)
    });
  } catch (error) {
    console.error('Error fetching approved image requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Get All Notifications for Logged-in User
const getAllNotifications = async (req, res) => {
  try {
    const { type } = req.query;

    const query = {
      $or: [
        { recipient: req.user._id },
        { sender: req.user._id },
      ]
    };

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('sender', 'first_name last_name'); // ✅ include sender's name

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ✅ Get Unread Count for Logged-in User
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
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ✅ Mark All Notifications as Read for Logged-in User
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


const updateNotificationStatus = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { action } = req.body;

    if (!notificationId || !action) {
      return res.status(400).json({ message: 'Notification ID and action are required.' });
    }

    // Convert the logged-in user ID to an ObjectId for proper comparison
    const userId = req.user._id;

    // Find the notification by either recipient or sender
    const notification = await Notification.findOne({
      _id: notificationId,
      $or: [
        { recipient: userId },   // The logged-in user can be the recipient
        { sender: userId }       // Or the logged-in user can be the sender
      ]
    });


    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or unauthorized.' });
    }

    // Inside updateNotificationStatus, just before saving:
    if (action === 'accepted' || action === 'rejected') {
      if (notification.recipient.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to respond to this notification.' });
      }

      notification.status = action; // Update the notification status

      // 💡 Add avatar access if it's an image request and accepted
      if (action === 'accepted' && notification.type === 'image') {
        await User.findByIdAndUpdate(notification.recipient, {
          $addToSet: { approvedViewers: notification.sender }
        });
      }

    }


    // Save the notification after performing the action
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification updated.',
      notification
    });

  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete a Notification by ID
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Optional: Check if user owns the notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this notification' });
    }

    await notification.remove();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server Error' });
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
  getUnreadCount,
};