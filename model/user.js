const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: {type:String,required: true},
  date: { type: Date, required: true, default: Date.now()  }
});

const ticketSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  purpose: {type:String,required: true},
  uniquecode: { type: String},
  status: { type: Boolean, default: false},
  date: { type: Date, required: true, default: Date.now()  }
});

const rideSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  uniquecode: { type: String},
  driver:{ type: String},
  destination:{ type: String},
  date: { type: Date, required: true, default: Date.now()  }
});


const userSchema = new mongoose.Schema({
  id: { type: String, unique: true},
  fullname: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String,required: true },
  password: { type: String,required: true },
  number: { type: String,required: true },
  wallet: {type:Number, default: 0},
  transactions: [transactionSchema],
  rides:[rideSchema],
  tickets:[ticketSchema],
  datecreated:{ type: Date, default: Date.now() }
},
{
  collection: 'users'
});

module.exports = mongoose.model("user", userSchema);