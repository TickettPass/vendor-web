require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const twilio = require('twilio');
const auth = require("../middleware/auth");
const { make } = require('simple-body-validator');
const { v4: uuidv4 } = require('uuid');
const Driver = require('../model/bowendrivers');
const Dwallet = require('../model/bowendriverswallet');


let app = express.Router();
// const accountSid = 'ACc837fae39258cf7e3ad0c965c7f48bf7';
// const authToken = 'd13339360106662b7a945a4f5a4557e3';

const accountSid = 'AC948c5eeb7f5e6db18ecd920c12ec24a5';
const authToken = '63938f09dfba3e30a4ad8bb89630c1a3';
const client = new twilio(accountSid, authToken);

app.post("/new-driver",async (req, res) => {
    try {
        // const rules = {
        //     name: 'required|string',
        //     number: 'required|string'
        // }

        // const validator = make(req.body, rules);
        // if (!validator.validate()) {
            
        //     return res.send({errors:validator.errors().all()})
        // }else{

            const { name,number } = req.body;

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
                const wallet = await Dwallet.create({id:driverid});

                const driver = await Driver.create({
                    id:driverid,
                    name:name.toLowerCase(),
                    number
                  });

                  res.send({
                    error:false,
                    message:"Driver Registration Succesful",
                    driver 	
                    });
            }
        // }
    } catch (error) {
        
    }
});

app.delete("/delete/:id",async (req,res) => {

    try {
        const  id  = req.params.id;
        const driver  = await Driver.findOne({id});

        if(!driver){
            res.send({error:true,msg:'driver not found'})
        }else{
            const driver = await Driver.deleteOne({id})
            res.send({error:false,msg:'driver deleted',driver})
        }
    } catch (error) {
        res.send({error:true,msg:'error driver deleting driver'})
    }
});

app.get("/drivers",async (req, res) => {
    const drivers = await Driver.find();
    res.send({error:false,drivers});
});

app.get("/drivers/:id",async (req, res) => {
    const  id  = req.params.id;
    const driver  = await Driver.findOne({id});

    if(!driver){
        res.send({error:true,msg:'driver not found'})
    }else{
        res.send({error:false,driver});
    }
});

module.exports = app;