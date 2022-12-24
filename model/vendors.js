const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  id: { type: String, unique: true},
  name: { type: String, default: null },
  password: { type: String },
  number: { type: String },
  type: { type: String },
  datecreated:{ type: Date, default: Date.now() }
},
{
  collection: 'vendors'
});

module.exports = mongoose.model("vendors", vendorSchema);