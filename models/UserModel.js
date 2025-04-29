const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: String, required: false },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  numberOfKids: { type: String, default: 0 },
  location: { type: String, required: false },
  stateOfOrigin: { type: String, required: false },
  ethnicity: { type: String, required: false },
  height: { type: String },
  weight: { type: String },
  genotype: { type: String },
  bloodGroup: { type: String },
  complexion: { type: String },
  maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'], required: false },
  qualification: { type: String },
  profession: { type: String },
  hobbies: { type: [String] },
  religiousLevel: { type: String },
  spouseQualities: { type: String },
  dealBreakers: { type: String },
  physicalChallenges: { type: String },
  bio: { type: String },
  avatar: { type: String, default: '', }, // Initially hidden
  isProfilePictureApproved: { type: Boolean, default: false }, // Admin approval
  approvedViewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who can view after approval
  isAuthenticated: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;

