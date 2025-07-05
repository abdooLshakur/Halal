const Match = require('../models/MatchModel');
const Notification = require('../models/notification');
const User = require('../models/UserModel');


// Auto-create matches from accepted interests
const autoCreateMatch = async (req, res) => {
  try {
    // Find accepted interest requests that haven't been used to create a match yet
    const acceptedNotifications = await Notification.find({
      type: 'interest',
      status: 'accepted',
      matchCreated: { $ne: true } // new field
    });

    for (const notification of acceptedNotifications) {
      const { sender, recipient } = notification;

      // Normalize IDs
      const senderId = sender.toString();
      const recipientId = recipient.toString();

      const [user1, user2] = senderId < recipientId
        ? [sender, recipient]
        : [recipient, sender];

      // Check for existing match regardless of user order
      const existingMatch = await Match.findOne({
        $or: [
          { user1, user2 },
          { user1: user2, user2: user1 }
        ]
      });

      if (existingMatch) {
        // Optionally mark notification to avoid reprocessing again
        notification.matchCreated = true;
        await notification.save();
        continue;
      }

      // Create the match
      await Match.create({ user1, user2 });

      // Create notification for both users
      const message = 'You’ve been matched! Contact info will be shared once approved.';
      await Notification.create({ recipient: sender, sender: recipient, type: 'interest_response', message });
      await Notification.create({ recipient: recipient, sender: sender, type: 'interest_response', message });

      // Mark original interest notification as "matchCreated"
      notification.matchCreated = true;
      await notification.save();

      console.log(`Matched: ${senderId} + ${recipientId}`);
    }

    res.status(200).json({ success: true, message: 'Matches processed successfully.' });
  } catch (error) {
    console.error('Error creating matches:', error);
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

const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      .populate('user1', 'first_name last_name email')
      .populate('user2', 'first_name last_name email');

    res.status(200).json({ success: true, matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  autoCreateMatch,
  shareContactInfo,
  getAllMatches,
};
