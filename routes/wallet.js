const User = require("../model/user");
const express = require('express');
const { make } = require('simple-body-validator');
const twilio = require('twilio');
const auth = require("../middleware/auth");
const Wallet = require("../model/wallet");
const Transaction = require("../model/transaction");
const request = require('request');
require('dotenv').config();

let app = express.Router();

app.post("/payment",async (req,res) => {
    const { amount, email} = req.body;

    const body  = JSON.stringify({amount,email,callback_url:'https://e-waste-e8125.web.app/'});
      request.post('https://api.paystack.co/transaction/initialize', {
        	'auth': {
            'bearer': 'sk_test_e3d31ea7f6fe860ecca346739d8d4b27659e7728'
             },
             body
},async (err,data)=> {
    if(err){
        res.send({err});
    }else{ 
        const info = JSON.parse(data.body);
        res.send({error:false,info});
    }
    });   
});


app.get("/topup/:id",async (req,res) => {
    //verify transaction
    request.get(`https://api.paystack.co/transaction/verify/${req.params.id}`, { 
  'auth': {
    'bearer': 'sk_test_e3d31ea7f6fe860ecca346739d8d4b27659e7728'
  }
},async (err,data)=> {
    if(err){
        res.send({err});
    }else{
        const info = JSON.parse(data.body);
        //get user wallet
        if(info.data.status == 'success'){
            const user = await User.findOne({ email:info.data.customer.email });
            if(user){
                const wallet = await Wallet.findOne({ id:user.id });
                Object.assign(wallet,{amount:wallet.amount + info.data.amount/100});
                wallet.save();
                
                const transaction = await Transaction.create({
                    user:user.id,
                    amount:info.data.amount,
                    type:'credit',
                    reference:req.params.id
                });
                res.send({error:false,msg:`${info.data.amount} added to ${user.id}`,transaction});
            }else{
                res.send({error:true,msg:"User not found"});
            }
        }else{
            res.send({error:true,msg:"Transaction not succesful"});
        }
    }
});

});

app.get("/find/:id",async (req,res) => {
    try {
        const id  = req.params.id;
        const wallet = await Wallet.findOne({ id });
        res.send({error:false,wallet});
    } catch (error) {
        res.send({error});
    }

});

app.get("/transactions/:id",async (req,res) => {
    try {
        const id  = req.params.id
        const transactions = await Transaction.find({id});
        res.send({error:false,transactions});
    } catch (error) {
        res.send({error});
    }

});

module.exports = app;

