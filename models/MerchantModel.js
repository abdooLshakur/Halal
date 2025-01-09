const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const Merchantschema = new Schema({
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
    store_name: {
      type: String,
      required: true,
    },
    store_descp: {
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
    social_media:{
      type: [String],
      required: false,
      default:[],
    },
    avatar: {
      type: String,
      required: false
    },
    banner:{
      type: String,
      required: false,
    },
    is_verified: {
      type: Boolean,
      default: false,
      required: [true, "Merchant Status is Required"],
    },
    isAuthenticated: {
      type: Boolean,
      default: false,
      required: [true, "Merchant Status is Required"],
    },
    date_registered: {
      type: Date,
      default: Date.now(),
    },
   
  });

const Merchant = mongoose.model("Merchant", Merchantschema);
module.exports = Merchant;