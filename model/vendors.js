const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: {type:String,required: true},
  date: { type: Date, required: true, default: Date.now()  }
});

const ticketSchema = new mongoose.Schema({
  user: { type: String, required: true },
  amount: { type: Number, required: true },
  uniquecode: { type: String},
  date: { type: Date, required: true, default: Date.now()  }
});


const vendorSchema = new mongoose.Schema({
  id: { type: String, unique: true},
  name: { type: String, default: null },
  password: { type: String },
  number: { type: String },
  wallet: {type:Number, default: 0 },
  transactions: [transactionSchema],
  tickets:[ticketSchema],
  datecreated:{ type: Date, default: Date.now() }
},
{
  collection: 'vendors'
});

module.exports = mongoose.model("vendors", vendorSchema);