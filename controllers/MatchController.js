const Match = require('../models/MatchModel');
const Notification = require('../models/notification');

// Create new match
const autoCreateMatch = async (req, res) => {
    try {
      // Find all accepted "interest" notifications
      const acceptedNotifications = await Notification.find({ 
        type: 'interest', 
        status: 'accepted' 
      }).populate('sender recipient'); // Populate sender and recipient
  
      // We’ll filter out already matched users
      for (const notification of acceptedNotifications) {
        const { sender, recipient } = notification;
  
        // Check if this pair of users is already a match
        const existingMatch = await Match.findOne({
          $or: [
            { user1: sender._id, user2: recipient._id },
            { user1: recipient._id, user2: sender._id },
          ],
        });
  
        // Skip if match already exists
        if (existingMatch) {
          continue;
        }
  
        // Create new match
        const newMatch = await Match.create({
          user1: sender._id,
          user2: recipient._id,
        });
  
        // Send notifications to both users
        const notificationData = {
          type: 'interest_response',  // Acknowledge match
          message: 'You’ve been matched! Contact info will be shared once approved.',
        };
  
        // Notify sender
        await Notification.create({
          recipient: sender._id,
          sender: recipient._id,
          ...notificationData,
        });
  
        // Notify recipient
        await Notification.create({
          recipient: recipient._id,
          sender: sender._id,
          ...notificationData,
        });
  
        console.log(`Match created between ${sender.name} and ${recipient.name}`);
      }
  
      res.status(200).json({ success: true, message: 'Matches processed successfully.' });
    } catch (error) {
      console.error('Error creating matches:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

// Share contact info (update match + notify)
const shareContactInfo = async (req, res) => {
  try {
    const matchId = req.params.matchId;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    match.sharedContact = true;
    await match.save();

    const notifyBoth = async (recipientId, senderId) => {
      await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'interest_response',
        message: 'Contact information has been shared with your match.',
      });
    };

    await notifyBoth(match.user1, match.user2);
    await notifyBoth(match.user2, match.user1);

    res.status(200).json({ success: true, message: 'Contact shared and users notified' });
  } catch (error) {
    console.error('Error sharing contact info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all matches
const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find().populate('user1', 'name email').populate('user2', 'name email');
    res.status(200).json(matches);
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
