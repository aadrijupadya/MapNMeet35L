// const axios = require('axios');
// const jwt = require('jsonwebtoken');
// const { promisify } = require('util');
// const oauth2Client = require('../utils/oauth2client');
// const catchAsync = require('./../utils/catchAsync'); // TODO 
// const AppError = require('./../utils/appError'); // TODO 
// const User = require('../models/UserModel'); // TODO 
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import oauth2Client from '../utils/oauth2client.js';
import catchAsync from './../utils/catchAsync.js';
import User from '../models/UserModel.js';
import dotenv from 'dotenv';

dotenv.config()

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_TIMEOUT,
    });
};
// Create and send Cookie ->
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);

    const cookieOptions = {
        expires: new Date(Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN),
        httpOnly: true,
        path: '/',
        // sameSite: "none",
        secure: false,
    };

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
    }

    user.password = undefined;

    
    res.cookie('jwt', token, cookieOptions); // Little confused about this line, do we have do decode the cookie somewhere?

    res.status(statusCode).json({
        message: 'success',
        token,
        data: {
            user,
        },
    });
};
/* GET Google Authentication API. */
// exports.googleAuth = catchAsync(async (req, res, next) => {
//     const code = req.query.code;
//     console.log("USER CREDENTIAL -> ", code);

//     const googleRes = await oauth2Client.oauth2Client.getToken(code);
    
//     oauth2Client.oauth2Client.setCredentials(googleRes.tokens);

//     const userRes = await axios.get(
//         `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
// 	);
	
//     let user = await User.findOne({ email: userRes.data.email });
   
//     if (!user) {
//         console.log('New User found');
//         user = await User.create({
//             name: userRes.data.name,
//             email: userRes.data.email,
//             image: userRes.data.picture,
//         });
//     }

//     createSendToken(user, 201, res);
// });

export const googleAuth = catchAsync(async (req, res, next) => {
    const code = req.query.code;

    // const googleRes = await oauth2Client.getToken({code, redirect_uri: 'postmessage'});
    const googleRes = await oauth2Client.getToken(code)
    
    oauth2Client.setCredentials(googleRes.tokens);

    const userRes = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );
    

    if (!userRes.data.email.endsWith('ucla.edu')) { // TODO work on this unauthorized flow for non UCLA users
        return res.status(401).json({ message: 'Unauthorized: Email domain not allowed. Ensure you are using a UCLA email.' });
    }

    let user = await User.findOne({ email: userRes.data.email });
   
    if (!user) {
        console.log('New User found');
        user = await User.create({
            name: userRes.data.name,
            email: userRes.data.email,
            contact: userRes.data.email,
            image: userRes.data.picture,
        });
    }
    createSendToken(user, 201, res);
});



export const validateSession = async (req, res, next) => {
    // console.log("Validating session...");
    // console.log("Cookies received:", req.cookies);
    
    const token = req.cookies.jwt;
    if (!token) {
        console.log("No JWT cookie found");
        return res.status(401).json({ message: 'Not logged in' });
    }

    // console.log("JWT token found, verifying...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded token:", decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
        console.log("User not found for ID:", decoded.id);
        return res.status(401).json({ message: 'User not found' });
    }

    console.log("User found:", user._id);
    req.user = user;

    if (next && !req.query.refresh) {
        next()
        console.log("next: ", next)
    } else {
        res.status(200).json({ user });
    }


};