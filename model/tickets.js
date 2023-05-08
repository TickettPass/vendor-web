const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  user: { type: String},
  amount: { type: Number},
  purpose: {type:String,required: true},
  uniquecode: { type: String},
  status: { type: Boolean, default: false},
  datecreated:{ type: Date, default: Date.now()}
},
{
  collection: 'tickets'
});

module.exports = mongoose.model("tickets",ticketSchema);