const express = require('express');
const authenticateToken = require("../middleware/Auth")
const { createNotification, getAllNotifications, deleteNotification, updateNotificationStatus,getApprovedImageRequests } = require('../controllers/Notification.js');

const router = express.Router();

// Create a Notification
router.post('/createnotifiation/:targetUserId', authenticateToken, createNotification);

// Get all Notifications
router.get('/getAllNotifications', authenticateToken, getAllNotifications);

// Get all Approved image request
router.get('/approvedimagerequests', authenticateToken, getApprovedImageRequests);

// update notification
router.put('/updateNotificationStatus/:notificationId', authenticateToken, updateNotificationStatus);

// Delete a Notification
router.delete('/deleteNotification/:notificationId', authenticateToken, deleteNotification);

module.exports = router;
