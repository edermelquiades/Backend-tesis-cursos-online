const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");

const UserSchema = Schema({
  name: String,
  lastname: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  registerDate: String,
  birthday: String,
  role: String,
  active: Boolean,
  avatar: String,
});

UserSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("User", UserSchema);
