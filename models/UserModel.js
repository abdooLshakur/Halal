const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  nickname: {
    type: String,
    unique: true, 
    sparse: true, 
    trim: true,
  },
  email: { type: String, required: true, unique: true, },
  password: { type: String, required: true },
  phone: { type: String,  },
  age: { type: String },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  numberOfKids: { type: String, default: 0 },
  numberOfWives: { type: Number, default: 0 }, // NEW

  location: { type: String },
  stateOfOrigin: { type: String },
  ethnicity: { type: String },

  height: { type: String },
  weight: { type: String },
  genotype: { type: String },
  bloodGroup: { type: String },
  complexion: { type: String },
  maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },

  qualification: { type: String },
  profession: { type: String },
  hobbies: { type: [String] },

  religiousLevel: { type: String },
  spouseQualities: { type: String },
  preferredSpouseTraits: { type: String }, // NEW
  dealBreakers: { type: String },
  physicalChallenges: { type: String },
  bio: { type: String },

  marriageIntentDuration: {
    type: String,
   
  }, // NEW

  pledgeAccepted: { type: Boolean, default: false, }, // NEW

  avatar: { type: String, default: '' },
  avatarAccessGrantedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  approvedViewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAuthenticated: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
