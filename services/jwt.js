const jwt = require("jwt-simple");
const moment = require("moment");

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
