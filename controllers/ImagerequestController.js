const User = require("../models/UserModel");
const { createRequest, respondToRequest } = require("../services/requestService");

const requestImageAccess = async (req, res) => {
  const requesterId = req.user._id;
  const { targetUserId } = req.body;

  try {
    const request = await createRequest({
      requesterId,
      recipientId: targetUserId,
      type: "image",
    });

    res.status(201).json({ success: true, message: "Request sent", data: request });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: "Error requesting image access",
      error: err.message,
    });
  }
};

const respondToImageRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;

  try {
    const { requestNotification, responseNotification } =
      await respondToRequest({
        notificationId: requestId,
        responderId: req.user._id,
        action,
      });

    res.status(200).json({
      success: true,
      message: `Request ${action}`,
      data: requestNotification,
      responseNotification,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: "Error processing request",
      error: err.message,
    });
  }
};

const getProfileImage = async (req, res) => {
  const requesterId = req.user._id;
  const targetUserId = req.params.userId;

  try {
    const targetUser = await User.findById(targetUserId).select(
      "avatar approvedViewers avatarAccessGrantedTo"
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (targetUserId === requesterId.toString()) {
      return res.status(200).json({ success: true, image: targetUser.avatar });
    }

    const isApproved =
      targetUser.approvedViewers?.some(
        (viewerId) => viewerId.toString() === requesterId.toString()
      ) ||
      targetUser.avatarAccessGrantedTo?.some(
        (viewerId) => viewerId.toString() === requesterId.toString()
      );

    if (!isApproved) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, image: targetUser.avatar });
  } catch (err) {
    console.error("Error fetching profile image:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching image",
      error: err.message,
    });
  }
};

module.exports = {
  requestImageAccess,
  respondToImageRequest,
  getProfileImage,
};
