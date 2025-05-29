const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const Galleryschema = new Schema({
  gallery_img: {
    type: String,
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
  
});

const Gallery = mongoose.model("Gallery", Galleryschema);
module.exports = Gallery;