const _ = require('lodash');
const validator = require('validator');
const User = require ('../models/user');

exports.userSignupValidator = async (req, res, next) =>{
    const {name, email, password, password2} = req.body;

    let errors = {};

    //email
    if(!email) {
        errors.email = "Email is requied"
    } else if (!validator.isEmail(email)) {
        errors.email = "Email is invalid"
    } else {
        const user = await User.findOne({email});
        if (user) errors.email = "Email is exists"
    }

    //password
    if (!password) {
        errors.password = "Password is required"
    }
    else if(!validator.isLength(password, {min:6})) {
        errors.password = "Password must have at least 6 characters"
    }

    //confirm password
    if (!password2) {
        errors.password2 = "Confirm password is required"
    } else if(!validator.equals(password,password2)) {
        errors.password2 = "Password doesn't match"
    }

    //fullName
    if (!name) {
        errors.name = "Full name is required"
    }

    if(_.isEmpty(errors)) return next()
    return res.status(400).json(errors);
}

exports.userSigninValidator = (req, res, next) =>{
    const {email, password} = req.body;

    let errors = {};

    //email
    if(!email) {
        errors.email = "Email is requied"
    } else if (!validator.isEmail(email)) {
        errors.email = "Email is invalid"
    } 
    //password
    if (!password) {
        errors.password = "Password is required"
    }
 

    if(_.isEmpty(errors)) return next()
    return res.status(400).json(errors);
}


exports.createPostValidator = (req, res, next) => {
    // title
    req.check('title', 'Write a title').notEmpty();
    req.check('title', 'Title must be between 4 to 150 characters').isLength({
        min: 4,
        max: 150
    });
    // body
    req.check('body', 'Write a body').notEmpty();
    req.check('body', 'Body must be between 4 to 2000 characters').isLength({
        min: 4,
        max: 2000
    });
    // check for errors
    const errors = req.validationErrors();
    // if error show the first one as they happen
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({ error: firstError });
    }
    // proceed to next middleware
    next();
};



exports.passwordResetValidator = (req, res, next) => {
    const {newPassword} = req.body;

    let errors = {};

    //password
    if (!newPassword) {
        errors.newPassword = "Password is required"
    }
    else if(!validator.isLength(newPassword, {min:6})) {
        errors.newPassword = "Password must have at least 6 characters"
    }

    if(_.isEmpty(errors)) return next()
    return res.status(400).json(errors);
};
