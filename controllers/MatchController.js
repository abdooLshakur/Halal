const Match = require('../models/MatchModel');
const Notification = require('../models/notification');
const User = require('../models/UserModel');


const autoCreateMatch = async (req, res) => {
  try {
    const acceptedNotifications = await Notification.find({
      type: 'interest',
      status: 'accepted',
      matchCreated: { $ne: true }
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const notification of acceptedNotifications) {
      const senderId = notification.sender.toString();
      const recipientId = notification.recipient.toString();

      const [user1, user2] = senderId < recipientId
        ? [senderId, recipientId]
        : [recipientId, senderId];

      const existingMatch = await Match.findOne({ user1, user2 });

      if (existingMatch) {
        skippedCount++;
        notification.matchCreated = true;
        await notification.save();
        continue;
      }

      await Match.create({ user1, user2 });

      const message = 'You’ve been matched! Contact info will be shared once approved.';

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

      notification.matchCreated = true;
      await notification.save();

      createdCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Finished processing. ${createdCount} new matches created, ${skippedCount} skipped.`,
    });
  } catch (error) {
    console.error('Error in autoCreateMatch:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      .sort({ createdAt: -1 }) // ⬅️ Show newest matches first
      .populate('user1', 'first_name last_name phone email')
      .populate('user2', 'first_name last_name phone email');

    res.status(200).json({ success: true, matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const shareContactInfo = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const adminId = req.Admin?._id;

    if (!adminId) {
      return res.status(403).json({ message: 'Only admins can perform this action' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.sharedContact) {
      return res.status(400).json({ message: 'Contact info already shared' });
    }

    // Fetch the matched users
    const user1 = await User.findById(match.user1);
    const user2 = await User.findById(match.user2);

    if (!user1 || !user2) {
      return res.status(404).json({ message: 'One of the matched users was not found' });
    }

    // Save the shared contact flag
    match.sharedContact = true;
    await match.save();

    // Build messages with available info
    const messageForUser1 = `Admin has shared your match's contact info: ${user2.first_name} ${user2.last_name}, Email: ${user2.email}`;
    const messageForUser2 = `Admin has shared your match's contact info: ${user1.first_name} ${user1.last_name}, Email: ${user1.email}`;

    // Create notifications for both users
    const notif1 = await Notification.create({
      recipient: user1._id,
      sender: user2._id,
      type: 'interest',
      message: messageForUser1,
    });

    const notif2 = await Notification.create({
      recipient: user2._id,
      sender: user1._id,
      type: 'interest',
      message: messageForUser2,
    });


    res.status(200).json({ success: true, message: 'Contact shared and users notified' });
  } catch (error) {
    console.error('Error sharing contact info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




module.exports = {
  autoCreateMatch,
  shareContactInfo,
  getAllMatches,
};
