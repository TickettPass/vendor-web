require('dotenv').config();
const express = require('express');
const Ticket = require("../model/tickets");
const Ride   = require("../model/rides");
const User = require("../model/user");

const twilio = require('twilio');
const auth = require("../middleware/auth");
const { make } = require('simple-body-validator');
const ShortUniqueId = require('short-unique-id');
const Driver = require('../model/bowendrivers');
const Vendor = require('../model/vendors');

let app = express.Router();

const accountSid = 'AC948c5eeb7f5e6db18ecd920c12ec24a5';
const authToken = '63938f09dfba3e30a4ad8bb89630c1a3';
const client = new twilio(accountSid, authToken);




app.post("/new-meal",async (req,res) => {
    try {

        const rules = {
            id: 'required|string',
            amount: 'required|string'
        }

        const validator = make(req.body,rules);
        if (! validator.validate()) {
            return res.send({errors:validator.errors().all()});
         }else{

            const { id,amount } = req.body;
            const uid = new ShortUniqueId({ length: 8 });
            const uniquecode = uid();


            const user = await User.findOne({ id });
            if(!user){
                res.send({error:true,msg:'User not found'})
            }else{
                
                if(user.wallet < amount){
                    res.send({error:true,msg:"Insuffient funds"});
                }else{

                    const ticket = {
                        user:id,
                        purpose:"meal",
                        amount,
                        uniquecode
                    }
                    await Ticket.create(ticket)
                    const wallet = user.wallet - amount;
                    Object.assign(user,{wallet});

                    const transaction = {
                        amount,
                        type:'debit',
                    };

                    user.transactions.push(transaction);
                    
                    
                    user.tickets.push({
                        amount,
                        purpose:"meal",
                        uniquecode,
                    })

                    user.save();

                    // client.messages
                    // .create({ body: `New Ticket Created with unique code ${uniquecode}`,from: '+16204551912', to: `+234${user.number}` })
                    // .then(message => console.log(message.sid))
                    // .catch(error => console.log(error));
                
                    res.status(200).json({error:false,msg:"Ticket created",data:{ticket,transaction}});
    
                }
            }
         }
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Server error' });
        }
});



app.post("/new-cab",async (req,res) => { 
try {
    // const rules = {
    //     user: 'required|string',
    //     driver: 'required|string',
    //     quantity: 'required|number',
    //     destination: 'required|string'
    // };

    // const validator = make(req.body,rules);
    // if (!validator.validate()) {
    //     return res.send({errors:validator.errors().all()});
    //  }else{
        
        const { user,quantity,driver,destination } = req.body;
        price = quantity * 75;
        const uid = new ShortUniqueId({ length: 8 });
        const uniquecode = uid();

        const userid = await User.findOne({ id:user });
        const driverid = await Driver.findOne({ id:driver });
        if(!userid || !driverid){

            if(!userid ){
                res.send({error:true,msg:'User not found'});
            }else{
                res.send({error:true,msg:'Driver not found'});
            }

        }else{
            
            if(userid.wallet < price){
                res.send({error:true,msg:"Insuffient funds"}); 
            }else{
                
            const ride = await Ride.create({
                user,
                quantity,
                driver,
                uniquecode,
                destination,
                price
            });

            console.log(ride);
            

            userid.transactions.push({
                amount:price,
                type:'debit'
            });

            userid.rides.push({
                quantity,
                uniquecode,
                driver,
                destination,
            });

            console.log(userid.wallet)
                //debit the user
                const balance = userid.wallet - price;
                Object.assign(userid,{wallet:balance});
                

                //credit the driver
                const dbalance = driverid.wallet + price;
                Object.assign(driverid,{wallet:dbalance});
                userid.save();
                
                
                driverid.transactions.push({
                    amount:price,
                    type:'credit'
                });
                

                driverid.rides.push({
                    quantity,
                    uniquecode,
                    user,
                    amount:price,
                    destination,
                });
                driverid.save();
                

            client.messages
            .create({ body: `New Ride Created with unique code ${uniquecode}`,from: '+16204551912', to: `+234${driverid.number}` })
            .then(message => console.log(message.sid))
            .catch(error => console.log(error));


            res.send({error:false,data:ride});

            }
        // }
     }
} catch (error) {
    res.status(500).json({ error: 'Server error' });
}

});


app.delete("/delete/:uniquecode",async (req,res) => {
    try {
        const uniquecode = req.params.uniquecode;
        const ticket = await Ticket.findOne({uniquecode});
        if(!ticket){
            res.send({error:true,msg:'ticket not found'});
        }else{
            const ticket = await Ticket.deleteOne({id:req.params.id});


            const userToUpdate = User.find({ "tickets.uniquecode": uniquecode });
            const updatedTickets = userToUpdate.tickets.filter(ticket => ticket.uniquecode != uniquecode);

            Object.assign(userToUpdate,{tickets:updatedTickets});
            userToUpdate.save();

            


            res.send({error:false,msg:'ticket deleted',ticket});
        }

        } catch (error) {
            res.send({error:true})
    }
});


app.post("/consume",async (req,res) => {
    try {
            
            const { uniquecode,vendor } = req.body;
            const ticket = await Ticket.findOne({ uniquecode });

            
            if(!ticket){
                res.send({error:true,msg:'Ticket not found'});
            }else{
                
                if(ticket.status){
                    res.send({error:true,msg:'This ticket is already used'});
                }else{

                    const tvendor = await Vendor.findOne({id:vendor});


                    if(!tvendor){
                        res.send({error:true,msg:'Vendor not found'});
                    }else{
                        try {
                            const ticketamount = ticket.amount;

                            
                            


                            
                            Object.assign(ticket,{status:true});
                            ticket.save();

                            await User.updateOne({ tickets: { $elemMatch: { uniquecode } } }, { $set: { "tickets.$.status": true } });
                            
                            const transaction = {
                                amount:ticketamount,
                                type:"credit"
                            }

                            Object.assign(tvendor,{wallet:ticketamount+tvendor.wallet});
                            tvendor.transactions.push(transaction);
                            tvendor.tickets.push({
                                user:ticket.user,
                                amount:ticket.amount,
                                uniquecode,
                            });
                            tvendor.save();
                            res.send({error:false,msg:'Ticket consumed',ticket,transaction});
                        } catch (error) {

                            console.log(error);
                            res.status(500).json({ error: 'Server error' });
                        }
                        
                        
                        
                    }
                    
                }
            
         }
    } catch (error) {

    }
});


app.get("/find/:id",async (req,res) => {
    const id  = req.params.id;
    const tickets = await Ticket.findOne({uniquecode:id})
    if(tickets){
        res.send({error:false,tickets})
    }else{
        res.send({error:true,msg:"Ticket not found"})
    }
});

module.exports = app;