const jwt = require("jsonwebtoken");
const User = require('./../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/appError");
const {promisify} = require("util");
const sendEmail = require("../utils/email");

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if(process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        data: {
            user
        },
        token
    })
}

exports.signUp = catchAsync(async (req, res, next) => {

    const newUser = await User.create({
        email: req.body.email,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    createSendToken(newUser, 201, res);
})

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    if (!email || !password) {
        next(new AppError("Please enter a valid email address and password!", 400));
    }

    const user = await User.findOne({email}).select('+password');


    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError("Email address and password is not correct! Try again", 401));
    }


    createSendToken(user, 201, res);
})

exports.protect = catchAsync(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.replace('Bearer ', '');
    }

    if (!token) {
        return next(new AppError("No token provided", 401));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id).select('+role');

    if (!currentUser) {
        return next(new AppError("The user belonging to this token does no longer exist", 401));
    }


    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError("User recently changed password! Please log in again!", 401));
    }

    req.user = currentUser;
    next();

})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(new AppError("You don't have permission", 401));
        }

        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({email: req.body.email});
    if (!user) {
        return next(new AppError("There is not user with provided email!", 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    const resetURL = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Link : ${resetURL}`;
    try {
        await sendEmail({
            email: "huseynaga1999@gmail.com",
            subject: "Password Reset Token",
            message
        });

        res.status(200).json({
            status: "success",
            message: "Token send to email!"
        })
    } catch (err) {
        user.passwordResetExpires = undefined;
        user.passwordResetToken = undefined;

        await user.save({validateBeforeSave: false});

        return next(new AppError("There was a problem with sending the email, Try again later!", 401));
    }

})

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}
    })

    if (!user) {
        return next(new AppError("Invalid token or expired", 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save();

    createSendToken(user, 200, res);


})

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError("Current Password is wrong", 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, res);

})