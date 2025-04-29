  const mongoose = require("mongoose")
  const Schema = mongoose.Schema;

  const ImageRequestSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  });
  const ImageRequest = mongoose.model('ImageRequest', ImageRequestSchema);
  module.exports = ImageRequest;
