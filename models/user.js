const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { ObjectId } = mongoose.Schema;
const Post = require("./post");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: Date,
    photo: {
        data: Buffer,
        contentType: String
    },
    about: {
        type: String,
        trim: true
    },
    following: [{ type: ObjectId, ref: "User" }],
    followers: [{ type: ObjectId, ref: "User" }],
    resetPasswordLink: {
        data: String,
        default: ""
    },
    role: {
        type: String,
        default: "subscriber"
    }
});

const genSalt = promisify(bcrypt.genSalt);
const hash = promisify(bcrypt.hash);

userSchema.pre("save", function (next) {
//   console.log(this);
  const user = this;

  if (!user.isModified("password")) return next();   //nếu không đổi password thì chạy tiếp không cần hash pw

  genSalt(10)
    .then(salt => {
      return hash(user.password, salt)
    })
    .then(hash => {
      user.password = hash;
      next();
    })
})

module.exports = mongoose.model("User", userSchema);
