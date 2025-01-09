const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const Wishllistschema = new Schema({
    product_id: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    }, 
    
  });

const Wishllist = mongoose.model("Wishllist", Wishllistschema);
module.exports = Wishllist;