const path = require('path');
const fs = require('fs');
const User = require('../models/UserModel');

const serveAvatar = async (req, res) => {
  try {
    const ownerId = req.params.userId;
    const requesterId = req.user._id;

    // Fetch the avatar owner
    const owner = await User.findById(ownerId);

    if (!owner || !owner.avatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    // Check if requester is allowed to access the avatar
    const isAllowed = owner.avatarAccessGrantedTo.some(
      (id) => id.toString() === requesterId.toString()
    );

    if (!isAllowed && ownerId !== requesterId.toString()) {
      return res.status(403).json({ message: 'Access to this avatar is denied' });
    }

    // Serve the image file
    const avatarPath = path.join(__dirname, '..', owner.avatar);
    if (!fs.existsSync(avatarPath)) {
      return res.status(404).json({ message: 'Avatar file not found on server' });
    }

    res.sendFile(avatarPath);
  } catch (err) {
    console.error('Error serving avatar:', err);
    res.status(500).json({ message: 'Server error while accessing avatar' });
  }
};
module.exports = {
  serveAvatar,
};