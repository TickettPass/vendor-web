const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({

  user: { type: String, required: true},
  amount: { type: Number, required: true },
  type: {type:String,required: true},
  date: { type: Date, required: true, default: Date.now()  }

},
{
  collection: 'deposits'
});

module.exports = mongoose.model("deposits",depositSchema);