const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({msg:"A token is required for access thus route"});
  }else{
    jwt.verify(token, config.TOKEN_KEY ,(err,user) => {
      if(err){
          return res.status(401).send("Invalid Token");
      }else{
          next();
        }
    });
  }
}

module.exports = verifyToken;