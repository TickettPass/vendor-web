const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  id: { type: String, unique: true},
  amount: { type: Number,default:0  }
},
{
  collection: 'wallet'
});

module.exports = mongoose.model("wallet", walletSchema);