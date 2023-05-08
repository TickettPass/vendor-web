const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type:String,required: true},
  date: { type: Date, required: true, default: Date.now()  },
});


const rideSchema = new mongoose.Schema({
  user: { type: String, required: true },
  amount: {type:String,required: true },
  quantity:{type:Number,required:true },
  uniquecode:{type:String,required:true },
  date: { type: Date, required: true, default: Date.now()  },
});



const driverSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  number: { type: String,required: true },
  platenumber: { type: String,required: true },
  wallet : {type:Number, default: 0 },
  transactions: [transactionSchema],
  rides:[rideSchema], 
  datecreated:{ type: Date, default: Date.now() }
},
{
  collection: 'drivers'
});

module.exports = mongoose.model("drivers", driverSchema);