const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const Userschema = new Schema({
    first_name: {
      type: String,
      required: [true, "First Name is Required"],
    },
    last_name:{
      type: String,
      required: [true, "Last Name is Required"],
    },
    email: {
      type: String,
      required: [true, "email Name is Required"],
    },
    gender: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: [true, "Password is Required"],
    },
    date_registered: {
      type: Date,
      default: Date.now(),
    },
    avatar: {
      type: String,
      required: true
    },
  });

const User = mongoose.model("user", Userschema);
module.exports = User;