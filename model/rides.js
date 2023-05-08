const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
    user: { type: String,required: true},
    quantity: { type: String,required: true},
    uniquecode: { type: String,unique: true},
    driver:{ type: String,required: true},
    destination:{ type: String},
    price:{ type: Number},
    datecreated:{ type: Date, default: Date.now()}
  },
  {
    collection: 'rides'
  });

  module.exports = mongoose.model("ride", rideSchema);