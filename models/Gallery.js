const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Galleryschema = new Schema({
  gallery_imgs: {
    type: [String], // Array of image paths
    required: true,
  },
  gallery_header: {
    type: String,
    required: true,
  },
  gallery_location: {
    type: String,
    required: true,
  },
  gallery_description: {
    type: String,
    default: "", // Optional description
  },
}, { timestamps: true });

const Gallery = mongoose.model("Gallery", Galleryschema);
module.exports = Gallery;
