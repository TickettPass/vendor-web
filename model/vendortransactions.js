const mongoose = require("mongoose");

const vtransactionSchema = new mongoose.Schema({
  vendor: { type: String},
  amount: { type: String,},
  type: { type: String,},
  date:{ type: Date, default: Date.now() }
},
{
  collection: 'vendor-transactions'
});

module.exports = mongoose.model("vendor-transaction", vtransactionSchema);