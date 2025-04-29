const ImageRequest = require("../models/Imagerequestmodal");
const User = require("../models/UserModel");

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
    const request = await ImageRequest.findById(requestId);

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


// Get target user's details including access status
const getImageRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const incomingRequests = await ImageRequest.find({ targetUser: userId })
      .populate({
        path: 'requester',
        select: 'first_name last_name'
      })
      .populate({
        path: 'targetUser',
        select: 'first_name last_name'
      });

    const sentRequests = await ImageRequest.find({ requester: userId })
      .populate({
        path: 'requester',
        select: 'first_name last_ame'
      })
      .populate({
        path: 'targetUser',
        select: 'first_name last_name'
      });

    const approvedRequests = await ImageRequest.find({
      $or: [{ requester: userId }, { targetUser: userId }],
      status: 'approved',
    })
      .populate({
        path: 'requester',
        select: 'first_name last_name'
      })
      .populate({
        path: 'targetUser',
        select: 'first_name last_name'
      });

    const formatRequests = (requests) => {
      return requests.map(req => ({
        _id: req._id,
        requesterFullName: `${req.requester.first_name} ${req.requester.last_name}`,
        targetUserFullName: `${req.targetUser.first_name} ${req.targetUser.last_name}`,
        status: req.status,
        createdAt: req.createdAt
      }));
    };

    res.status(200).json({
      success: true,
      data: {
        incomingRequests: formatRequests(incomingRequests),
        sentRequests: formatRequests(sentRequests),
        approvedRequests: formatRequests(approvedRequests),
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};






module.exports = {
  requestImageAccess,
  respondToImageRequest,
  getImageRequests,
};
