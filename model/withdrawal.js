const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  vendor: { type: String, unique: true},
  amount: { type: Number,default:500  }
},
{
  collection: 'withdrawal'
});

module.exports = mongoose.model("withdraw", withdrawSchema);