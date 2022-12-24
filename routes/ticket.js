require('dotenv').config();
const express = require('express');
const Ticket = require("../model/tickets");
const Vendorwallet = require("../model/vendorwallet");
const Transaction = require("../model/transaction");
const Wallet = require("../model/wallet");
const twilio = require('twilio');
const auth = require("../middleware/auth");
const { make } = require('simple-body-validator');
const ShortUniqueId = require('short-unique-id');

let app = express.Router();

app.post("/new",async (req,res) => {

        const rules = {
            user: 'required|string',
            purpose: 'required|string',
            amount: 'required|string'
        }

        const validator = make(req.body,rules);
        if (! validator.validate()) {
            return res.send({errors:validator.errors().all()});
         }else{

            const { user,purpose,amount } = req.body;
            const uid = new ShortUniqueId({ length: 8 });
            const uniquecode = uid();
            console.log('uniquecode',uniquecode);


            const wallet = await Wallet.findOne({ id:user });
            console.log(wallet);
            if(!wallet){
                res.send({error:true,msg:'User not found'})
            }else{
                
                if(wallet.amount < amount){
                    res.send({error:true,msg:"Insuffient funds"});
                }else{
                    const ticket = await Ticket.create({
                        user,
                        purpose,
                        amount,
                        uniquecode
                    })
                    const balance = wallet.amount - amount;
                    Object.assign(wallet,{amount:balance});
                    wallet.save();
                    const transaction = await Transaction.create({
                        user,
                        amount,
                        type:'debit',
                        reference:uniquecode
                    });
                    res.send({error:false,data:{ticket,transaction}});
    
                }
            }
         }
});

app.delete("/delete/:id",async (req,res) => {
    try {
        const ticket = await Ticket.findOne({uniquecode:req.params.id});
        if(!ticket){
            res.send({error:true,msg:'ticket not found'})
        }else{
            const ticket = await Ticket.deleteOne({id:req.params.id})
            res.send({error:true,msg:'ticket deleted',ticket})
        }

        } catch (error) {
        
    }
})

app.post("/consume",async (req,res) => {
    try {
        const rules = {
            uniquecode: 'required|string',
            vendorid: 'required|string',
        }

        const validator = make(req.body,rules);
        if (! validator.validate()) {
            return res.send({errors:validator.errors().all()});
         }else{
            
            const { uniquecode,vendorid } = req.body;
            const ticket = await Ticket.findOne({ uniquecode });
            if(!ticket){
                res.send({error:true,msg:'Ticket not found'});
            }else{
                console.log('ping');
                if(ticket.status == 'consumed'){
                    res.send({error:true,msg:'This ticket is already used'});
                }else{
                    
                    const vendorwallet = await Vendorwallet.findOne({id:vendorid});
                    if(!vendorwallet){
                        res.send({error:true,msg:'Vendor not found'})
                    }else{
                        try {
                            const ticketamount = parseInt(ticket.amount)
                            console.log(ticketamount+vendorwallet.amount);
                            Object.assign(vendorwallet,{amount:ticketamount+vendorwallet.amount});
                            vendorwallet.save();
                        } catch (error) {
                            res.send({error:true,msg:'error updating vendor wallet'});
                        }
                    Object.assign(ticket,{status:'consumed',consumedby:vendorid});
                    ticket.save();
                    res.send({error:false,msg:'Ticket consumed',ticket});
                    }
                    
                }
            }
         }
    } catch (error) {

    }
})

app.get("/find/",async (req,res) => {
    const { id } = req.body;
    const tickets = await Ticket.find({user:id})
    res.send({error:false,tickets})
});

module.exports = app;