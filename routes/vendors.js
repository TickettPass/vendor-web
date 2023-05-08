require('dotenv').config();
const express = require('express');
const User = require("../model/user");
const Vendor = require("../model/vendors")
const Ticket = require("../model/tickets");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const twilio = require('twilio');
const auth = require("../middleware/auth");
const { make } = require('simple-body-validator');
const { v4: uuidv4 } = require('uuid');
const Withdrawal = require("../model/withdrawal")


let app = express.Router();
const accountSid = 'AC948c5eeb7f5e6db18ecd920c12ec24a5';
const authToken = '63938f09dfba3e30a4ad8bb89630c1a3';
const client = new twilio(accountSid, authToken);

app.post("/register",async (req, res) => {
   
        const rules = {
            name: 'required|string',
            number: 'required|string',
            password: 'required|string',
        }
        
        const validator = make(req.body, rules);
        if (!validator.validate()) {
            return res.send({errors:validator.errors().all()});
        }else{
            const { name,number, password } = req.body;
            const existingvendor = await Vendor.findOne({ number });
            if (existingvendor) {              
                    return res.status(409).send({error:true,msg:"Number already exists"});
                
            }else{
                var vendor_id = uuidv4();
    
                const encryptedPassword = await bcrypt.hash(password, 10);
                const vendor = await Vendor.create({
                    id:vendor_id,
                    name,
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

// 

// app.post("/update-password",auth,async (req, res) => {

//         const rules = {
//             password: 'required|string',
//             rtpassword: 'required|string|same:password',
//             number:'required|string'
//         }
//         const validator = make(req.body, rules);
//         if (! validator.validate()) {
//             return res.send({errors:validator.errors().all()});
//          }else{
//             const {password,number} = req.body;
//             const encryptedPassword = await bcrypt.hash(password, 10);
            
//            const vendor = await Vendor.findOne({ number:number });
//             Object.assign(vendor,{password:encryptedPassword});
            
//             vendor.save();
//             res.send({error:false,msg:'password updated',vendor});
// } 
// });

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

        const vendor = await Vendor.findOne({id});

        if(!vendor){
            res.send("Vendor not found");
        }else{

            if(vendor.wallet >=  amount){
                

                Object.assign(vendor,{wallet:amount+vendor.wallet});
                vendor.save();
                const withdrawal =  await Withdrawal.create({vendor:id,amount,});
                res.status(200).send({error:true,msg:"Withdrawal Pending"})
                
            }else{
                res.send({error:true,msg:' insuffieicnt funds'});
            }
            
            
           
            
            
        }
} 
});



module.exports = app;