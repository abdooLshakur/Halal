const mongoose = require("mongoose");
const Notification = require("../models/notification");
const Match = require("../models/MatchModel");
const User = require("../models/UserModel");

const REQUEST_TYPES = new Set(["interest", "image"]);
const RESPONSE_TYPE_BY_REQUEST = {
  interest: "interest_response",
  image: "image_response",
};

const normalizeId = (value) => value?.toString();

const sortMatchUsers = (userA, userB) => {
  const first = normalizeId(userA);
  const second = normalizeId(userB);
  return first < second ? [first, second] : [second, first];
};

const buildResponseMessage = ({ type, action, requester, recipient }) => {
  const requesterName = `${requester.first_name} ${requester.last_name}`.trim();
  const recipientName = `${recipient.first_name} ${recipient.last_name}`.trim();

  if (type === "interest") {
    return action === "accepted"
      ? `${recipientName} accepted your interest request.`
      : `${recipientName} declined your interest request.`;
  }

  return action === "accepted"
    ? `${recipientName} granted your image access request.`
    : `${recipientName} declined your image access request.`;
};

const createMatchFromInterest = async (requestNotification) => {
  const [user1, user2] = sortMatchUsers(
    requestNotification.sender,
    requestNotification.recipient
  );

  const existingMatch = await Match.findOne({ user1, user2 });
  if (existingMatch) {
    return existingMatch;
  }

  return Match.create({ user1, user2 });
};

const createRequest = async ({ requesterId, recipientId, type, message = "" }) => {
  if (!REQUEST_TYPES.has(type)) {
    throw Object.assign(new Error("Unsupported request type"), { statusCode: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    throw Object.assign(new Error("Recipient ID is invalid"), { statusCode: 400 });
  }

  if (normalizeId(requesterId) === normalizeId(recipientId)) {
    throw Object.assign(new Error("You cannot send a request to yourself"), {
      statusCode: 400,
    });
  }

  const [requester, recipient] = await Promise.all([
    User.findById(requesterId),
    User.findById(recipientId),
  ]);

  if (!requester || requester.is_deleted) {
    throw Object.assign(new Error("Requesting user not found"), { statusCode: 404 });
  }

  if (!recipient || recipient.is_deleted) {
    throw Object.assign(new Error("Recipient not found"), { statusCode: 404 });
  }

  if (!requester.isVerified) {
    throw Object.assign(
      new Error("Your account must be activated before sending requests"),
      { statusCode: 403 }
    );
  }

  if (type === "image") {
    const alreadyApproved = recipient.approvedViewers.some(
      (viewerId) => normalizeId(viewerId) === normalizeId(requesterId)
    );

    if (alreadyApproved) {
      throw Object.assign(new Error("Image access has already been granted"), {
        statusCode: 409,
      });
    }
  }

  if (type === "interest") {
    const [user1, user2] = sortMatchUsers(requesterId, recipientId);
    const existingMatch = await Match.findOne({ user1, user2 });
    if (existingMatch) {
      throw Object.assign(new Error("You are already matched with this user"), {
        statusCode: 409,
      });
    }
  }

  const existingPendingRequest = await Notification.findOne({
    sender: requesterId,
    recipient: recipientId,
    type,
    status: "pending",
    requestResolvedAt: null,
  });

  if (existingPendingRequest) {
    throw Object.assign(new Error("A pending request already exists"), {
      statusCode: 409,
    });
  }

  const requestNotification = await Notification.create({
    sender: requesterId,
    recipient: recipientId,
    type,
    message: typeof message === "string" ? message.trim() : "",
    status: "pending",
  });

  return requestNotification;
};

const respondToRequest = async ({ notificationId, responderId, action }) => {
  if (!["accepted", "rejected"].includes(action)) {
    throw Object.assign(new Error("Invalid action"), { statusCode: 400 });
  }

  const requestNotification = await Notification.findOne({
    _id: notificationId,
    recipient: responderId,
    type: { $in: Array.from(REQUEST_TYPES) },
  });

  if (!requestNotification) {
    throw Object.assign(new Error("Request not found"), { statusCode: 404 });
  }

  if (requestNotification.status !== "pending") {
    throw Object.assign(new Error("This request has already been resolved"), {
      statusCode: 409,
    });
  }

  const [requester, recipient] = await Promise.all([
    User.findById(requestNotification.sender),
    User.findById(requestNotification.recipient),
  ]);

  if (!requester || !recipient) {
    throw Object.assign(new Error("One of the users tied to this request no longer exists"), {
      statusCode: 404,
    });
  }

  requestNotification.status = action;
  requestNotification.isRead = true;
  requestNotification.requestResolvedAt = new Date();
  requestNotification.respondedBy = responderId;

  if (action === "accepted" && requestNotification.type === "image") {
    await User.findByIdAndUpdate(recipient._id, {
      $addToSet: {
        approvedViewers: requester._id,
        avatarAccessGrantedTo: requester._id,
      },
    });
  }

  let match = null;
  if (action === "accepted" && requestNotification.type === "interest") {
    match = await createMatchFromInterest(requestNotification);
    requestNotification.matchCreated = true;
  }

  await requestNotification.save();

  const responseNotification = await Notification.create({
    sender: recipient._id,
    recipient: requester._id,
    type: RESPONSE_TYPE_BY_REQUEST[requestNotification.type],
    status: action,
    message: buildResponseMessage({
      type: requestNotification.type,
      action,
      requester,
      recipient,
    }),
    parentNotification: requestNotification._id,
    requestResolvedAt: requestNotification.requestResolvedAt,
  });

  return {
    requestNotification,
    responseNotification,
    match,
  };
};

const backfillMatchesFromAcceptedInterestRequests = async () => {
  const acceptedInterestNotifications = await Notification.find({
    type: "interest",
    status: "accepted",
    matchCreated: { $ne: true },
  });

  let createdCount = 0;
  let skippedCount = 0;

  for (const notification of acceptedInterestNotifications) {
    const [user1, user2] = sortMatchUsers(notification.sender, notification.recipient);
    const existingMatch = await Match.findOne({ user1, user2 });

    if (existingMatch) {
      skippedCount += 1;
      notification.matchCreated = true;
      await notification.save();
      continue;
    }

    await Match.create({ user1, user2 });
    notification.matchCreated = true;
    await notification.save();
    createdCount += 1;
  }

  return { createdCount, skippedCount };
};

module.exports = {
  REQUEST_TYPES,
  createRequest,
  respondToRequest,
  backfillMatchesFromAcceptedInterestRequests,
};
