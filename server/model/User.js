const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  token: {
    type: String
  },
  authToken: {
    type: String
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;