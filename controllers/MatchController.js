const Match = require("../models/MatchModel");
const Notification = require("../models/notification");
const User = require("../models/UserModel");
const { backfillMatchesFromAcceptedInterestRequests } = require("../services/requestService");

const autoCreateMatch = async (req, res) => {
  try {
    const { createdCount, skippedCount } =
      await backfillMatchesFromAcceptedInterestRequests();

    return res.status(200).json({
      success: true,
      message: `Finished processing. ${createdCount} new matches created, ${skippedCount} skipped.`,
    });
  } catch (error) {
    console.error("Error in autoCreateMatch:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      .sort({ createdAt: -1 })
      .populate("user1", "first_name last_name phone email")
      .populate("user2", "first_name last_name phone email");

    res.status(200).json({ success: true, matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const shareContactInfo = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const adminId = req.Admin?._id;

    if (!adminId) {
      return res.status(403).json({ message: "Only admins can perform this action" });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    if (match.sharedContact) {
      return res.status(400).json({ message: "Contact info already shared" });
    }

    const user1 = await User.findById(match.user1);
    const user2 = await User.findById(match.user2);

    if (!user1 || !user2) {
      return res.status(404).json({ message: "One of the matched users was not found" });
    }

    match.sharedContact = true;
    await match.save();

    const messageForUser1 = `Admin has shared your match's contact info: ${user2.first_name} ${user2.last_name}, Email: ${user2.email}`;
    const messageForUser2 = `Admin has shared your match's contact info: ${user1.first_name} ${user1.last_name}, Email: ${user1.email}`;

    await Notification.create({
      recipient: user1._id,
      sender: user2._id,
      type: "interest_response",
      status: "accepted",
      message: messageForUser1,
    });

    await Notification.create({
      recipient: user2._id,
      sender: user1._id,
      type: "interest_response",
      status: "accepted",
      message: messageForUser2,
    });

    res.status(200).json({ success: true, message: "Contact shared and users notified" });
  } catch (error) {
    console.error("Error sharing contact info:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  autoCreateMatch,
  shareContactInfo,
  getAllMatches,
};
