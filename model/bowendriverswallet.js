const mongoose = require("mongoose");

const bowendriverswalletSchema = new mongoose.Schema({
  id: { type: String, unique: true},
  amount: { type: Number,default:0  }
},
{
  collection: 'bowendriverswallet'
});

module.exports = mongoose.model("bowendriverswallet", bowendriverswalletSchema);