const Interest = require("../models/IntrestModel");
const Users = require("../models/UserModel");

const expressInterest = async (req, res) => {
  const sender = req.user.id; 
  const receiver = req.params.id;   // <- get it from route param
  const { message } = req.body;

  if (!receiver) {
    return res.status(400).json({ message: "Receiver is required." });
  }

  try {
    const interest = new Interest({ sender, receiver, message });
    await interest.save();

    res.json({ success: true, message: "Interest sent!", data: interest });
  } catch (err) {
    res.json({ success: false, message: "Failed to send interest", error: err.message });
  }
};


const respondToInterest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const updatedInterest = await Interest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedInterest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.status(200).json({ success: true, data: updatedInterest });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInterestRequest = async (req, res) => {
  const userId = req.params.id;

  try {
    // Find all interest requests where the current user is either sender or receiver
    const interests = await Interest.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', 'first_name last_name')
      .populate('receiver', 'first_name last_name');

    // Format the results with full names
    const formattedInterests = interests.map((interest) => {
      const senderFullName = `${interest.sender.first_name} ${interest.sender.last_name}`;
      const receiverFullName = `${interest.receiver.first_name} ${interest.receiver.last_name}`;

      return {
        _id: interest._id,
        message: interest.message,
        status: interest.status,
        createdAt: interest.createdAt,
        updatedAt: interest.updatedAt,
        sender: {
          _id: interest.sender._id,
          fullName: senderFullName
        },
        receiver: {
          _id: interest.receiver._id,
          fullName: receiverFullName
        }
      };
    });

    res.status(200).json({ success: true, data: formattedInterests });
  } catch (error) {
    console.error("Error getting interest requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



const deleteInterestRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Interest.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.status(200).json({ success: true, message: 'Request deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  expressInterest,
  respondToInterest,
  getInterestRequest,
  deleteInterestRequest
};
