const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  id: { type: String, unique: true},
  name: { type: String, default: null },
  number: { type: String },
  datecreated:{ type: Date, default: Date.now() }
},
{
  collection: 'bowen-drivers'
});

module.exports = mongoose.model("drivers", driverSchema);