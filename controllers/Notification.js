const Notification = require('../models/notification');
const User = require('../models/UserModel');

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
      type,  // Dynamically use the type from the request
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

// Get All Notifications for Logged-in User
const getAllNotifications = async (req, res) => {
  try {
    const { type } = req.query;

    // Build query object
    const query = {
      $or: [
        { recipient: req.user._id },
        { sender: req.user._id },
      ]
    };

    // If type is provided, add it to the query filter
    if (type) {
      query.type = type;
    }

    // Get notifications from DB
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 });  // Sort by newest first

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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
          $addToSet: { avatarAccessGrantedTo: notification.sender }
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
  updateNotificationStatus,
  getApprovedImageRequests,
  deleteNotification,
};