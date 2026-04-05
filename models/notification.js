const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true, enum: ['interest', 'interest_response', 'image', 'image_response'] },
  isRead: { type: Boolean, default: false },
  message: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  matchCreated: { type: Boolean, default: false },
  parentNotification: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', default: null },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  requestResolvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ sender: 1, type: 1, status: 1 });
NotificationSchema.index({ parentNotification: 1 });
const notification = mongoose.model('Notification', NotificationSchema);

module.exports = notification;
