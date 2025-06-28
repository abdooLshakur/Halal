const canAccessAvatar = async (req, res, next) => {
  const { ownerId } = req.params;
  const requesterId = req.user._id; // from auth middleware

  const owner = await User.findById(ownerId);

  const hasAccess = owner.avatarAccessGrantedTo.includes(requesterId);

  if (!hasAccess) {
    return res.status(403).json({ message: "Access to avatar denied." });
  }

  next();
};
module.exports = canAccessAvatar;