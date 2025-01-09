const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const Bannerschema = new Schema({
  banner_img: {
    type: String,
    required: true,
  },
  banner_header: {
    type: String,
    required: true,
  },
  banner_descp: {
    type: String,
    required: true,
  },
  banner_link: {
    type: String,
    required: false,
  },
});

const Banner = mongoose.model("Banner", Bannerschema);
module.exports = Banner;