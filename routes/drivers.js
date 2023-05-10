require('dotenv').config();
const express = require('express');const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const twilio = require('twilio');
const auth = require("../middleware/auth");
const { make } = require('simple-body-validator');
const { v4: uuidv4 } = require('uuid');
const Driver = require('../model/bowendrivers');


let app = express.Router();

const accountSid = 'AC948c5eeb7f5e6db18ecd920c12ec24a5';
const authToken = '63938f09dfba3e30a4ad8bb89630c1a3';
const client = new twilio(accountSid, authToken);

app.post("/new",async (req, res) => {
    try {

        const rules = {
            name: 'required|string',
            number: 'required|string',
            platenumber: 'required|string'
        }

        const validator = make(req.body, rules);
        if (!validator.validate()) {
            
            return res.send({errors:validator.errors().all()});
        }else{

            const { name,number,platenumber } = req.body;

            
            const existingdriver = await Driver.findOne({ name:name.toLowerCase() });
            const dnumber = await Driver.findOne({ number});
            if ( existingdriver || dnumber) {
                if(existingdriver){
                    return res.status(409).send({error:true,msg:"username already exists"});
                }
                if(dnumber){
                    return res.status(409).send({error:true,msg:"email already exists"});
                }
            }else{
                var driverid = uuidv4();

                const driver = await Driver.create({
                    id:driverid,
                    name:name.toLowerCase(),
                    number,
                    platenumber
                  });

                  res.status(201).send({
                    error:false,
                    message:"Driver Registration Succesful",
                    driver 	
                    });
            }
        }
        
    } catch (error) {
        
    }
});

app.delete("/delete",async (req,res) => {

    try {
        const { number } = req.body;
        const driver  = await Driver.findOne({number});

        if(!driver){
            res.send({error:true,msg:'driver not found'})
        }else{
            const driver = await Driver.deleteOne({number})
            res.send({error:false,msg:'driver deleted',driver})
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get("/all",async (req, res) => {
    try {
        const drivers = await Driver.find();
        res.send({error:false,drivers});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }

});

app.get("/single/:number",async (req, res) => {

    try {
        const  number  = req.params.number;
        const driver  = await Driver.findOne({number});
    
        if(!driver){
            res.send({error:true,msg:'driver not found'})
        }else{
            res.send({error:false,driver});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }



});

module.exports = app;