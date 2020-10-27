const jwt = require("jwt-simple");
const moment = require("moment");
const JWT =require("jsonwebtoken")
const SECRET_KEY = "FacciUleamCursosOnline2020VentasOnline";

exports.createAccessToken = function(user) {
  const payload = {
    id: user._id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    registerDate: user.registerDate,
    birthday: user.birthday,
    createToken: moment().unix(),
    exp: moment().add(3, "hours").unix()
  };

  return jwt.encode(payload, SECRET_KEY);
};

exports.createAccessTokenActiveEmail = function(user) {
  const payload = {
    
    email: user.email,
    name: user.name,
    lastname: user.lastname,
    createToken: moment().unix(),
    exp: moment().add(3, "hours").unix()
  };

  return jwt.encode(payload, SECRET_KEY);
};

exports.createRefreshToken = function (user) {
  const payload = {
    id: user._id,
    exp: moment().add(30, "days").unix(),
  };

  return jwt.encode(payload, SECRET_KEY);
};

exports.decodeToken = function (token) {
  return jwt.decode(token, SECRET_KEY, true);
};

exports.verifyToken = function (token){
    
    try {
      return jwt.decode(token, SECRET_KEY);
    } catch (error) {
      return  "invalido";
    }
  
}