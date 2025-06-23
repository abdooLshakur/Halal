const ImageRequest = require("../models/Imagerequestmodal");
const User = require("../models/UserModel");
const Notification = require("../models/notification");

// Send image view request
const requestImageAccess = async (req, res) => {
  const requesterId = req.user.id;
  const { targetUserId } = req.body;

  try {
    const existingRequest = await ImageRequest.findOne({
      requester: requesterId,
      targetUser: targetUserId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: "Already requested access" });
    }

    const request = new ImageRequest({
      requester: requesterId,
      targetUser: targetUserId
    });

    await request.save();

    res.status(201).json({ success: true, message: "Request sent", data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error requesting image access", error: err.message });
  }
};

// Approve or reject a request
const respondToImageRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body; // 'accepted' or 'rejected'

  try {
    const request = await User.findByIdAndUpdate(request.targetUser, {
      $addToSet: { approvedViewers: request.requester }
    });


    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.targetUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to respond" });
    }

    // ✅ Only update the request status
    if (action === 'accepted' || action === 'rejected') {
      request.status = action;
      await request.save();
    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    res.status(200).json({ success: true, message: `Request ${action}`, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error processing request", error: err.message });
  }
};



const getProfileImage = async (req, res) => {
  const requesterId = req.user.id;
  const targetUserId = req.params.userId;

  try {
    const targetUser = await User.findById(targetUserId).select('avatar');

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Check if there is an accepted image request notification
    const isApproved = await Notification.exists({
      sender: requesterId,
      recipient: targetUserId,
      type: 'image',
      status: 'accepted'
    });

    if (!isApproved) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, image: targetUser.avatar });

  } catch (err) {
    console.error("Error fetching profile image:", err);
    res.status(500).json({ success: false, message: "Error fetching image", error: err.message });
  }
};








module.exports = {
  requestImageAccess,
  respondToImageRequest,
  getProfileImage,
};
