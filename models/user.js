const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = Schema({
  name: String,
  lastanme: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  registerDate: String,
  birthday: String,
  role: String,
  active: Boolean,
});

module.exports = mongoose.model("User", UserSchema);
