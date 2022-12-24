const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: { type: String},
  amount: { type: String, default: null },
  type: { type: String, default: null },
  reference: { type: String},
  date:{ type: Date, default: Date.now() }
},
{
  collection: 'transactions'
});

module.exports = mongoose.model("transaction", transactionSchema);