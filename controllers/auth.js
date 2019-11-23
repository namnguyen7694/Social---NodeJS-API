const jwt = require('jsonwebtoken');
const bcrypt = require ('bcryptjs');
const {promisify} = require ('util');
const comparePassword = promisify(bcrypt.compare);
const jwtSign = promisify(jwt.sign)
const verifyJwt = promisify(jwt.verify);
require('dotenv').config();

const User = require('../models/user');
const _ = require('lodash');
const { OAuth2Client } = require('google-auth-library');
const { sendEmail } = require('../helpers');

exports.signup = async (req, res) => {
    const user = await new User(req.body);
    await user.save();
    res.status(200).json({ message: 'Signup success! Please login.' , user});
};

exports.signin = (req, res) => {
    // find the user based on email
    const { email, password } = req.body;
    User.findOne({email})
        .then(user =>{
            if (!user) return Promise.reject({status:404, message: "User not found"})
            return Promise.all([comparePassword(password, user.password), user]) 
        })
        .then(result =>{
            const isMatch = result[0];
            const user =result[1];
            if (!isMatch) return Promise.reject({status:400, message: "Password incorrect"})
            const payload = {
                _id : user._id,
                email : user.email,
                role : user.role
            }
            return jwtSign(payload, process.env.JWT_SECRET, {expiresIn: 1800})
        })
        .then(token => {
            res.cookie('t', token, {expire: new Date() + 9999})
            res.status(200).json({message: "login success", token})
        })
        .catch(err =>{
            if(!err.status) return res.status(500).json({message:err.message})
            return res.status(err.status).json({message:err.message})
        })    
}

exports.signout = (req, res) => {
    res.clearCookie('t');
    return res.json({ message: 'Signout success!' });
};

exports.requireSignin = (req, res, next) => {
    const token = req.header("token");
    verifyJwt(token, process.env.JWT_SECRET)
        .then(decoded => {
            if (decoded) {
                req.auth = decoded
                console.log("auth id: ", req.auth._id);
                return next()
            }
        })
        .catch( ()=> res.status(401).json({message: "Require Sign in to continue"}))
}

exports.forgotPassword = (req, res) => {
    // if (!req.body.email) return res.status(400).json({ message: 'No Email in request body' });
    const { email } = req.body;
    User.findOne({ email })
        .then(user => {
            if (!user) return Promise.reject({status :404,  message: 'User with that email does not exist!' })

            const payload2 = {
                _id: user._id,
                iss: process.env.APP_NAME
            }
            return Promise.all([jwtSign(payload2, process.env.JWT_SECRET, { expiresIn: 600 }),user])
        })
        .then(result => {
            const user = result[1]
            const token = result[0]
            const emailData = {
                from: 'noreply@node-react.com',
                to: email,
                subject: 'Password Reset Instructions',
                text: `Please use the following link to reset your password: ${
                    process.env.SERVER_URL  //CLIENT_URL/reset-password/token  khi kết nối với front-end
                    }/api/reset-password/?resetlink=${token}`,
                html: `<p>Please use the following link to reset your password:</p> <p>${
                    process.env.SERVER_URL   //CLIENT_URL/reset-password/token  khi kết nối với front-end
                    }/api/reset-password/?resetlink=${token}</p>`
            };
            return Promise.all([user.updateOne({ resetPasswordLink: token }), emailData])
        })
        .then(result => {
            const emailData = result[1]
            sendEmail(emailData);
            return res.status(200).json({
                message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
            });
        })
        .catch(err =>{
            if(!err.status) return res.status(500).json({message:err.message})
            return res.status(err.status).json({message:err.message})
        })    
}

// find the user in the database with user's resetPasswordLink match the token

exports.resetPassword = (req, res) => {
    // const { resetPasswordLink } = req.body  --> khi kết nối FE
    const { resetPasswordLink } = req.params;
    const { newPassword } = req.body;

    User.findOne({ resetPasswordLink })
        .then(user => {
            if (!user) return Promise.reject({ status: 401, message: 'Invalid Link!' })
            const updatedFields = {
                password: newPassword,
                resetPasswordLink: ''
            };
            user = _.extend(user, updatedFields);
            user.updated = Date.now();
            return user.save()
        })
        .then(user => res.status(200).json({
            message: `Great ${user.name}! Now you can login with your new password.`
        })
        )
        .catch(err => {
            if (err.status) return res.status(err.status).json({ message: err.message })
            return res.status(500).json(err)
        })
}

const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);

exports.socialLogin = async (req, res) => {
    const idToken = req.body.tokenId;
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.REACT_APP_GOOGLE_CLIENT_ID });
    // console.log('ticket', ticket);
    const { email_verified, email, name, picture, sub: googleid } = ticket.getPayload();

    if (email_verified) {
        console.log(`email_verified > ${email_verified}`);

        const newUser = { email, name, password: googleid };
        // try signup by finding user with req.email
        let user = User.findOne({ email }, (err, user) => {
            if (err || !user) {
                // create a new user and login
                user = new User(newUser);
                req.profile = user;
                user.save();
                // generate a token with user id and secret
                const token = jwt.sign({ _id: user._id, iss: process.env.APP_NAME }, process.env.JWT_SECRET);
                res.cookie('t', token, { expire: new Date() + 9999 });
                // return response with user and token to frontend client
                const { _id, name, email } = user;
                return res.json({ token, user: { _id, name, email } });
            } else {
                // update existing user with new social info and login
                req.profile = user;
                user = _.extend(user, newUser);
                user.updated = Date.now();
                user.save();
                // generate a token with user id and secret
                const token = jwt.sign({ _id: user._id, iss: process.env.APP_NAME }, process.env.JWT_SECRET);
                res.cookie('t', token, { expire: new Date() + 9999 });
                // return response with user and token to frontend client
                const { _id, name, email } = user;
                return res.json({ token, user: { _id, name, email } });
            }
        });
    }
};

// exports.socialLogin = (req, res) => {
//     console.log('social login req.body', req.body);

// // try signup by finding user with req.email
// let user = User.findOne({ email: req.body.email }, (err, user) => {
//     if (err || !user) {
//         // create a new user and login
//         user = new User(req.body);
//         req.profile = user;
//         user.save();
//         // generate a token with user id and secret
//         const token = jwt.sign({ _id: user._id, iss: process.env.APP_NAME }, process.env.JWT_SECRET);
//         res.cookie('t', token, { expire: new Date() + 9999 });
//         // return response with user and token to frontend client
//         const { _id, name, email } = user;
//         return res.json({ token, user: { _id, name, email } });
//     } else {
//         // update existing user with new social info and login
//         req.profile = user;
//         user = _.extend(user, req.body);
//         user.updated = Date.now();
//         user.save();
//         // generate a token with user id and secret
//         const token = jwt.sign({ _id: user._id, iss: process.env.APP_NAME }, process.env.JWT_SECRET);
//         res.cookie('t', token, { expire: new Date() + 9999 });
//         // return response with user and token to frontend client
//         const { _id, name, email } = user;
//         return res.json({ token, user: { _id, name, email } });
//     }
// });

