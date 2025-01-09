const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const Categoryschema = new Schema({
    merchant_id: {
      type: String,
      required: [true, "Merchant ID is Required"],
    },
    name:{
      type: String,
      required: [true, "Category Name is Required"],
    },
    icon: {
      type: String,
      required: false, 
    },
    date_added: {
      type: Date,
      default: Date.now(),
    },
   
  });

const Category = mongoose.model("Category", Categoryschema);
module.exports = Category;