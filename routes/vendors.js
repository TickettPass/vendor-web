require('dotenv').config();
const express = require('express');
const User = require("../model/user");
const Vendorwallet = require("../model/vendorwallet");
const Vtransaction = require("../model/vendortransactions");
const Vendor = require("../model/vendors")
const Ticket = require("../model/tickets");
const cTicket = require("../model/consumedtickets")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const twilio = require('twilio');
const auth = require("../middleware/auth");
const { make } = require('simple-body-validator');
const { v4: uuidv4 } = require('uuid');


let app = express.Router();
const accountSid = 'AC948c5eeb7f5e6db18ecd920c12ec24a5';
const authToken = '63938f09dfba3e30a4ad8bb89630c1a3';
const client = new twilio(accountSid, authToken);

app.post("/register",async (req, res) => {
   
        const rules = {
            name: 'required|string',
            type: 'required|string',
            number: 'required|string',
            password: 'required|string',
        }
        
        const validator = make(req.body, rules);
        if (!validator.validate()) {
            return res.send({errors:validator.errors().all()});
        }else{
            const { name, type,number, password } = req.body;
            const existingvendor = await Vendor.findOne({ number });
            if (existingvendor) {              
                    return res.status(409).send({error:true,msg:"Vendor already exists"});
                
            }else{
                var vendor_id = uuidv4();
                const wallet = await Vendorwallet.create({id:vendor_id})
    
                const encryptedPassword = await bcrypt.hash(password, 10);
                const vendor = await Vendor.create({
                    id:vendor_id,
                    name,
                    type,
                    password: encryptedPassword,
                    number
                  });
                  
    
                  res.send({
                    error:false,
                    message:"Registration Succesful",
                    vendor 	
                    });

            } 
        }

});


app.post("/login",async (req, res) => {
    
        const rules = {
            number: 'required|string',
            password: 'required|string'
        }           

        const validator = make(req.body, rules);
    if (! validator.validate()) {
        return res.send({errors:validator.errors().all()})
     }else{
        const { number, password } = req.body;
        const vendor = await Vendor.findOne({ number });
        
        if (vendor) {
            if((await bcrypt.compare(password, vendor.password))){
                const token = jwt.sign(
                    { number },
                    process.env.TOKEN_KEY
                  );

                  res.json({
                      error:false,
                      message:"Login Succesful",
                      token,
                      vendor 	
                      });
            }else{
                res.status(400).send({error:true,msg:"Incorrect Password"});
            }  
          }else{
            res.status(400).send({error:true,msg:"Vendor not found"});
          }

     }  
});

app.post("/forgot-password",async (req, res) => {
        const rules = {
            number: 'required|string'
        }
        const validator = make(req.body, rules);
    if (! validator.validate()) {
        return res.send({errors:validator.errors().all()})
     }else{
        const {number} = req.body;     
        const vendor = await Vendor.findOne({ number });
        if (vendor == null) {
          return res.status(409).send({
            error:true,
            msg:"Number dosent exist"
            });
        }else{
            client.verify.v2.services('VAd5a15a4abce077331500ee4354f8012c')
            .verifications
            .create({to: `+234${number}`, channel: 'sms'})
            .then((verification) =>{
                    const token = jwt.sign(
                        { number },
                        process.env.TOKEN_KEY
                      );
                      res.send({error:false,message:`Otp sent to ${number}`,otpstatus:verification.status,token});
                });    
        }
     }
});

app.post("/verify-otp",auth,async (req, res) => {

        const rules = {
            number: 'required|string',
            otp: 'required|string',
        }

        const validator = make(req.body, rules);
    if (! validator.validate()) {
        return res.send({errors:validator.errors().all()})
     }else{
        const {number,otp} = req.body;
        if (!(number)) {
            return res.send("Number is required");
        }else{
            client.verify.v2.services('VAd5a15a4abce077331500ee4354f8012c')
            .verificationChecks
            .create({to: `+234${number}`, code: otp})
            .then(verification_check =>{
                res.send({
                    error:false,
                    status:verification_check.status
                })
            })
        }
     }

});

app.post("/update-password",auth,async (req, res) => {

        const rules = {
            password: 'required|string',
            rtpassword: 'required|string|same:password',
            number:'required|string'
        }
        const validator = make(req.body, rules);
        if (! validator.validate()) {
            return res.send({errors:validator.errors().all()});
         }else{
            const {password,number} = req.body;
            const encryptedPassword = await bcrypt.hash(password, 10);
            
           const vendor = await Vendor.findOne({ number:number });
            Object.assign(vendor,{password:encryptedPassword});
            
            vendor.save();
            res.send({error:false,msg:'password updated',vendor});
} 
});

app.post("/withdraw/:id",auth,async (req, res) => {

    const rules = {
        amount: 'required|string',
        
    }
    const validator = make(req.body, rules);
    if (! validator.validate()) {
        return res.send({errors:validator.errors().all()});
     }else{
        const {amount} = req.body;
        const id = req.params.id;

        const wallet = await Vendorwallet.findOne({id});

        if(!wallet){
            res.send("wallet not found");
        }else{
            const transaction = await Vtransaction.create({vendor:id,amount,type:"debit"});
            Object.assign(wallet,{amount:wallet.amount -  amount});
            wallet.save();
            res.send({error:false,msg:amount +' withdrawn',wallet});
        }
} 
});

app.get("/ticket-history/:id",async (req, res) => {

        const  id  = req.params.id;
        const vendor  = await Vendor.findOne({consumedby:id});
        if(!vendor){
            res.send({error:true,msg:"Vendor not found"});
        }else{
        const tickets = await cTicket.find({consumedby:id});
        res.send({error:false,tickets});
        }
});

app.get("/transaction-history/:id",async (req, res) => {
    const id  = req.params.id;
    const vendor  = await Vendor.findOne({id});
    console.log(id);
    if(!vendor){
        res.send({error:true,msg:"Vendor not found",id});
    }else{
    const transactions = await Vtransaction.find({vendor:id});
    res.send({error:false,transactions});
    }
});


module.exports = app;