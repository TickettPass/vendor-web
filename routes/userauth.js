require('dotenv').config();
const express = require('express');
const User = require("../model/user");
const Wallet = require("../model/wallet");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const twilio = require('twilio');
const auth = require("../middleware/auth");
const { make } = require('simple-body-validator');
const { v4: uuidv4 } = require('uuid');
const Ticket = require("../model/tickets");
const Transaction = require("../model/transaction");




let app = express.Router();

const accountSid = 'AC948c5eeb7f5e6db18ecd920c12ec24a5';
const authToken = '63938f09dfba3e30a4ad8bb89630c1a3';
const client = new twilio(accountSid, authToken);

app.get("/user/:number",async (req, res) => {
    const number = req.params.number;
    const user = await User.findOne({ number })

    if(user){
        res.send({error:false,user})
    }else{
        res.send({error:true,msg:"User not found"});
    }
});

app.post("/login",async (req, res) => {
    
        try {
            const rules = {
                username: 'required|string',
                password: 'required|string'
            }           

            const validator = make(req.body, rules);
        if (! validator.validate()) {
            return res.send({errors:validator.errors().all()})
         }else{
            const { username, password } = req.body;
            const user = await User.findOne({ username:username.toLowerCase() });
            
            if (user) {
                if((await bcrypt.compare(password, user.password))){
                    const token = jwt.sign(
                        { username },
                        process.env.TOKEN_KEY
                      );
                      res.json({
                          error:false,
                          message:"Login Succesful",
                          token,
                          user 	
                          });
                }else{
                    res.status(400).send({error:true,msg:"Incorrect Password"});
                }  
              }else{
                res.status(400).send({error:true,msg:"User not found"});
              }

         }  
        } catch (error) {
            console.log(error);
        }
});


// app.post("/register",async (req, res) => {
//             const { fullname, username, email,number, password } = req.body;
//             const existinguser = await User.findOne({ username:username.toLowerCase() });
//             const uemail = await User.findOne({ email });
//             console.log(existinguser,uemail)
// })
app.post("/register",async (req, res) => {
    try {
    //     const rules = {
    //         fullname: 'required|string',
    //         username: 'required|string',
    //         email: 'required|email',
    //         number: 'required|string',
    //         password: 'required|string',
    //     }
        
        // const validator = make(req.body, rules);
        // if (!validator.validate()) {
            
        //     return res.send({errors:validator.errors().all()})
        // }else{
            
            const { fullname, username, email,number, password } = req.body;
            const existinguser = await User.findOne({ username:username.toLowerCase() });
            const uemail = await User.findOne({ email });
            if (existinguser || uemail) {
                if(existinguser){
                    return res.status(409).send({error:true,msg:"username already exists"});
                }
                if(uemail){
                    return res.status(409).send({error:true,msg:"email already exists"});
                }
                
            }else{

                var user_id = uuidv4();
                const wallet = await Wallet.create({id:user_id})
    
                const encryptedPassword = await bcrypt.hash(password, 10);
                const user = await User.create({
                    id:user_id,
                    fullname,
                    username:username.toLowerCase(),
                    email: email.toLowerCase(),
                    password: encryptedPassword,
                    number
                  });
                  
    
                  res.send({
                    error:false,
                    message:"Registration Succesful",
                    user 	
                    });

            }            
        // }
           
    } catch (error) {
        res.send(error);      
    }
});


app.post("/forgot-password",async (req, res) => {
    try {

    //     const rules = {
    //         number: 'required|string',
    //     }

    //     const validator = make(req.body, rules);
    // if (! validator.validate()) {
    //     return res.send({errors:validator.errors().all()})
    //  }else{
        
        const {number} = req.body;     
        const user = await User.findOne({ number })
        if (user == null) {
    
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
// }
    } catch (error) {
        res.send(error)
    }
});

app.post("/verify-otp",auth,async (req, res) => {
    
    try {

    //     const rules = {
    //         number: 'required|string',
    //         otp: 'required|string',
    //     }

    //     const validator = make(req.body, rules);
    // if (! validator.validate()) {
    //     return res.send({errors:validator.errors().all()})
    //  }else{
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
    //  }
    } catch (error) {
        
    }

});

app.post("/update-password",auth,async (req, res) => {

        // const rules = {
        //     password: 'required|string',
        //     rtpassword: 'required|string|same:password',
        //     number:'required|string'
        // }
        // const validator = make(req.body, rules);
        // if (! validator.validate()) {


        //     return res.send({errors:validator.errors().all()})
        //  }else{
            const {password,number} = req.body;
            const encryptedPassword = await bcrypt.hash(password, 10);
            console.log(encryptedPassword,number);
            
           const user = await User.findOne({ number:number })
            Object.assign(user,{password:encryptedPassword})
            
            user.save();
            res.send({error:false,msg:'password updated',user});
            

        //  }
   
});

app.get("/ticket-history/:id",async (req, res) => {

    const  id  = req.params.id;
    const user  = await User.findOne({id});
    if(!user){
        res.send({error:true,msg:"User not found",id});
    }else{
    const tickets = await Ticket.find({user:id});
    res.send({error:false,tickets});
    }
});

app.get("/transaction-history/:id",async (req, res) => {
const id  = req.params.id;
const user  = await User.findOne({id});
if(!user){
    res.send({error:true,msg:"user not found",id});
}else{
const transactions = await Transaction.find({user:id});
res.send({error:false,transactions});
}
});


module.exports = app;