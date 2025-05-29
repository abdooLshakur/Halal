const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharedContact: { type: Boolean, default: false }
}, {
  timestamps: true 
});

// Enforce uniqueness of match regardless of order
MatchSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('Match', MatchSchema);
