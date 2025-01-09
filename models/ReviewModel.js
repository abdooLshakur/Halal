const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const Reviewschema = new Schema({
    user_id: {
      type: String,
      required: true,
    },
    product_id: {
      type: String,
      required: true,
    },
    user_name:{
      type: String,
      required: true,
    },
    user_avatar:{
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    date_added: {
      type: Date,
      default: Date.now(),
    },   
  });

const Review = mongoose.model("Review", Reviewschema);
module.exports = Review;