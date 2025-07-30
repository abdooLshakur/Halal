const Notification = require('../models/notification');
const User = require('../models/UserModel');
const Match = require('../models/MatchModel');
const mongoose = require('mongoose');

// Create a new Notification (Submit Interest)
const createNotification = async (req, res) => {
  try {
    const sender = req.user?._id;
    const recipient = req.params.targetUserId;
    const { message, type } = req.body;

    // Basic validations
    if (!sender) {
      return res.status(401).json({ message: 'Sender not authenticated' });
    }

    if (!recipient) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (!type) {
      return res.status(400).json({ message: 'Notification type is required' });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required and must be a non-empty string' });
    }

    // Optional: prevent duplicate notifications of the same type between same users
    const existing = await Notification.findOne({ sender, recipient, type });
    if (existing) {
      return res.status(409).json({ message: 'Notification already exists' });
    }

    const notification = await Notification.create({
      sender,
      recipient,
      type,
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const fixMatchesOverGet = async () => {
  try {
    setIsLoading(true);
    const { data } = await axios.get(`${API}/matches`, {
      withCredentials: true,
    });

    const sortedMatches = (data.matches || []).sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setMatches(sortedMatches);
  } catch (err) {
    console.error("Error fetching matches:", err);
    toast.error("Failed to fetch matches.");
  } finally {
    setIsLoading(false);
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
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    const { type } = req.query;

    const query = {
      $or: [
        { recipient: userId },
        { sender: userId },
      ]
    };

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .populate('sender', 'first_name last_name')
      .populate('recipient', 'first_name last_name'); // Optional: add recipient name too

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Server Error' });
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