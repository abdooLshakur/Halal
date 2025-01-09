const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  merchant_id:{
    type: String,
    required: true,
  },
  category_id:{
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  descp: {
    type: String, 
    required: false,
  },
  images:{
    type: [String], 
    required: false,
    default: [],
  },
  price:{
    type: String,
    required: true,
  },
  currency:{
    type: String,
    required: true,
  },
  brand:{
    type: String,
    required: false,
  },
  quantity:{
    type: String,
    required: true,
  },
  min_qty:{
    type: String,
    required: false,
  },
  max_qty:{
    type: String,
    required: false,
  },
  discount:{
    type: String,
    required: false,
  },
  shipping_locations:{
    type: String,
    required: false,
    default:[],
  },
  is_trending:{
    type: Boolean,
    required: false,
    default:false,
  },
  is_featured:{
    type: Boolean,
    required: false,
    default:false,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
