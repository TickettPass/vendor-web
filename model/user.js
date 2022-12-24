const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true},
  fullname: { type: String, default: null },
  username: { type: String, default: null },
  email: { type: String },
  password: { type: String },
  number: { type: String },
  datecreated:{ type: Date, default: Date.now() }
},
{
  collection: 'users'
});

module.exports = mongoose.model("user", userSchema);