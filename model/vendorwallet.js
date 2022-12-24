const mongoose = require("mongoose");

const vendorwalletSchema = new mongoose.Schema({
  id: { type: String, unique: true},
  amount: { type: Number,default:0  }
},
{
  collection: 'vendorwallet'
});

module.exports = mongoose.model("vendorwallet", vendorwalletSchema);