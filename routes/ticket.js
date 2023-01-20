require('dotenv').config();
const express = require('express');
const Ticket = require("../model/tickets");
const cTicket = require("../model/consumedtickets")
const Vendorwallet = require("../model/vendorwallet");
const Vtransaction = require("../model/vendortransactions");
const Transaction = require("../model/transaction");
const Wallet = require("../model/wallet");
const twilio = require('twilio');
const auth = require("../middleware/auth");
const { make } = require('simple-body-validator');
const ShortUniqueId = require('short-unique-id');
const Driver = require('../model/bowendrivers');
const Dwallet = require('../model/bowendriverswallet');


let app = express.Router();
// const accountSid = 'ACc837fae39258cf7e3ad0c965c7f48bf7';
// const authToken = 'd13339360106662b7a945a4f5a4557e3';

const accountSid = 'AC948c5eeb7f5e6db18ecd920c12ec24a5';
const authToken = '63938f09dfba3e30a4ad8bb89630c1a3';
const client = new twilio(accountSid, authToken);

app.post("/new-meal",async (req,res) => {

        const rules = {
            user: 'required|string',
            amount: 'required|string'
        }

        const validator = make(req.body,rules);
        if (! validator.validate()) {
            return res.send({errors:validator.errors().all()});
         }else{

            const { user,amount } = req.body;
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
                        purpose:"meal",
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

app.post("/new-cab",async (req,res) => {

        const rules = {
            user: 'required|string',
            driver: 'required|string',
            amount: 'required|string'
        }

        const validator = make(req.body,rules);
        if (! validator.validate()) {
            return res.send({errors:validator.errors().all()});
         }else{
            console.log('for uniquesness');
            const { user,amount,driver } = req.body;
            const uid = new ShortUniqueId({ length: 8 });
            const uniquecode = uid();


            const wallet = await Wallet.findOne({ id:user });
            if(!wallet){
                res.send({error:true,msg:'User not found'})
            }else{
                
                if(wallet.amount < parseInt(amount)){
                    res.send({error:true,msg:"Insuffient funds"});
                }else{
                    const ticket = await Ticket.create({
                        user,
                        purpose:"cab",
                        amount,
                        driver,
                        uniquecode
                    })
                    const balance = wallet.amount - parseInt(amount);
                    Object.assign(wallet,{amount:balance});
                    wallet.save();

                    const dnumber = await Driver.findOne({ id:driver });
                    const dwallet = await Dwallet.findOne({ id:dnumber.id });

                    const dbalance = dwallet.amount + parseInt(amount);
                    Object.assign(dwallet,{amount:dbalance});
                    dwallet.save();

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
            res.send({error:false,msg:'ticket deleted',ticket})
        }

        } catch (error) {
            res.send({error:true})
    }
});

app.post("/consume/:uc/:id",async (req,res) => {
    try {
           
            const uniquecode = req.params.uc;
            const vendorid = req.params.id
            const ticket = await Ticket.findOne({ uniquecode });
            if(!ticket){
                res.send({error:true,msg:'Ticket not found'});
            }else{
 
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
                            const vtransaction =await Vtransaction.create({vendor:vendorid,amount:ticketamount,type:"credit"});
                            Object.assign(ticket,{status:"consumed"});
                            ticket.save();
                            await cTicket.create({uniquecode,consumedby:vendorid});

                            res.send({error:false,msg:'Ticket consumed',ticket,vtransaction});
                        } catch (error) {

                            res.send({error:error,msg:'error updating vendor wallet'});
                        }
                        
                        
                        
                    }
                    
                }
            
         }
    } catch (error) {

    }
});

app.get("/find/:id",async (req,res) => {
    const id  = req.params.id;
    const tickets = await Ticket.find({uniquecode:id})
    res.send({error:false,tickets})
});

module.exports = app;