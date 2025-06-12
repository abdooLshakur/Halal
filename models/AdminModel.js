const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: String, required: false },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  location: { type: String, required: false },
  stateOfOrigin: { type: String, required: false },
  avatar: { type: String, default: '', }, 
  isAuthenticated: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;

