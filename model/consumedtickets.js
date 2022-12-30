const mongoose = require("mongoose");

const consumedticketSchema = new mongoose.Schema({

  uniquecode: { type: String},
  consumedby: { type: String},
  dateconsumed:{ type: Date, default: Date.now()}
},
{
  collection: 'consumed-tickets'
});

module.exports = mongoose.model("consumedtickets",consumedticketSchema);