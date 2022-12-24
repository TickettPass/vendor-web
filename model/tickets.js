const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  user: { type: String},
  amount: { type: String},
  purpose: { type: String},
  uniquecode: { type: String},
  status: { type: String, default: "pending"},
  consumedby: { type: String, default: null},
  datecreated:{ type: Date, default: Date.now()}
},
{
  collection: 'tickets'
});

module.exports = mongoose.model("tickets",ticketSchema);