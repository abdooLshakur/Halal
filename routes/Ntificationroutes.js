const express = require('express');
const authenticateToken = require("../middleware/Auth")
const { createNotification,fixMatchesOverGet, getAllNotifications, deleteNotification, updateNotificationStatus,getApprovedImageRequests } = require('../controllers/Notification.js');
const Protected = require('../middleware/Aminauth');

const router = express.Router();

// Create a Notification
router.post('/createnotifiation/:targetUserId', authenticateToken, createNotification);

// Get all Notifications
router.get('/getAllNotifications', authenticateToken, getAllNotifications);

// Get all Approved image request
router.get('/approvedimagerequests', authenticateToken, getApprovedImageRequests);

router.get('/admin/fix-matches/:adminId', Protected, fixMatchesOverGet);

// update notification
router.put('/updateNotificationStatus/:notificationId', authenticateToken, updateNotificationStatus);

// Delete a Notification
router.delete('/deleteNotification/:notificationId', authenticateToken, deleteNotification);

module.exports = router;
