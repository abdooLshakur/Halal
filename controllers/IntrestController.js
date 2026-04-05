const Notification = require("../models/notification");
const { createRequest, respondToRequest } = require("../services/requestService");

const expressInterest = async (req, res) => {
  const sender = req.user._id;
  const receiver = req.params.id;
  const { message } = req.body;

  if (!receiver) {
    return res.status(400).json({ message: "Receiver is required." });
  }

  try {
    const interest = await createRequest({
      requesterId: sender,
      recipientId: receiver,
      type: "interest",
      message,
    });

    res.json({ success: true, message: "Interest sent!", data: interest });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: "Failed to send interest",
      error: err.message,
    });
  }
};

const respondToInterest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const { requestNotification, responseNotification, match } =
      await respondToRequest({
        notificationId: id,
        responderId: req.user._id,
        action: status,
      });

    res.status(200).json({
      success: true,
      data: requestNotification,
      responseNotification,
      match,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

const getInterestRequest = async (req, res) => {
  const userId = req.params.id;

  try {
    const interests = await Notification.find({
      type: { $in: ["interest", "interest_response"] },
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "first_name last_name")
      .populate("recipient", "first_name last_name");

    const formattedInterests = interests.map((interest) => ({
      _id: interest._id,
      message: interest.message,
      type: interest.type,
      status: interest.status,
      createdAt: interest.createdAt,
      updatedAt: interest.requestResolvedAt || interest.createdAt,
      sender: {
        _id: interest.sender?._id || null,
        fullName: interest.sender
          ? `${interest.sender.first_name} ${interest.sender.last_name}`
          : "Deleted Account",
      },
      receiver: {
        _id: interest.recipient?._id || null,
        fullName: interest.recipient
          ? `${interest.recipient.first_name} ${interest.recipient.last_name}`
          : "Deleted Account",
      },
    }));

    res.status(200).json({ success: true, data: formattedInterests });
  } catch (error) {
    console.error("Error getting interest requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteInterestRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: id,
      type: "interest",
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, message: "Request deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  expressInterest,
  respondToInterest,
  getInterestRequest,
  deleteInterestRequest,
};
