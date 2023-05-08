const express = require('express');
const userauth = require('./routes/userauth');
const cabdriverauth = require('./routes/vendors');
const wallet = require('./routes/wallet');
const ticket = require('./routes/ticket');
const driver = require('./routes/drivers');
const morgan = require('morgan');
const multer = require('multer');
const upload = multer();


require("./config/database").connect();
require("dotenv").config();



const app = express();


const PORT = process.env.PORT || 8080;


  app.use(morgan('combined'));

  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(upload.none());

  // Routes
  app.use('/userauth',userauth);
  app.use('/vendors',cabdriverauth);
  app.use('/wallet',wallet);
  app.use('/ticket',ticket);
  app.use('/drivers',driver);

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  })