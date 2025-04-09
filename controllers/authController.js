const jwt = require("jsonwebtoken");
const User = require('./../models/userModel');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/appError");
const { promisify } = require("util");
const sendEmail = require("../utils/email");

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    try {
        const token = signToken(user._id);

        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        res.cookie('jwt', token, cookieOptions);

        user.password = undefined;
        user.active = undefined;
        user.emailVerified = undefined;

        res.status(statusCode).json({
            status: 'success',
            token,
            data: {
                user
            }
        });
    } catch (err) {
        console.error('Token oluşturma hatası:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

const createVerificationEmail = (name, url) => {
    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Merhaba ${name},</h2>
            <p>Hesabınızı doğrulamak için lütfen aşağıdaki butona tıklayın:</p>
            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                Emailimi Doğrula
            </a>
            <p>Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
            <p>Link 24 saat boyunca geçerlidir.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p>Teşekkürler,</p>
            <p>${process.env.EMAIL_FROM_NAME}</p>
        </div>
    `;
};

exports.signUp = catchAsync(async (req, res, next) => {
    try {
        const newUser = await User.create({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            gender: req.body.gender,
            phoneNumber: req.body.phoneNumber,
            birthDate: req.body.birthDate,
            city: req.body.city,
            district: req.body.district
        });

        const verifyToken = newUser.createEmailVerifyToken();

        await newUser.save({ validateBeforeSave: false });

        const verifyURL = `${req.protocol}://${req.get('host')}/api/users/verify-email/${newUser.emailVerifyToken}`;

        await sendEmail({
            email: newUser.email,
            subject: 'Email Doğrulama - Hesabınızı Aktivləşdirin',
            html: `Hörmətli ${newUser.firstname},<br><br>
                  Hesabınızı aktivləşdirmək üçün aşağıdakı linkə klik edin:<br>
                  <a href="${verifyURL}">Hesabımı Təsdiqlə</a><br><br>
                  Link 24 saat ərzində etibarlıdır.`
        });

        res.status(200).json({
            status: 'success',
            message: 'Doğrulama linki email ünvanınıza göndərildi! Zəhmət olmasa emailinizi təsdiqləyin.',
            data: {
                user: {
                    firstname: newUser.firstname,
                    email: newUser.email
                }
            }
        });

    } catch (err) {
        console.error('XƏTA BAŞ VERDİ:', err);

        if (newUser) {
            newUser.emailVerifyToken = undefined;
            newUser.emailVerifyExpires = undefined;
            await newUser.save({ validateBeforeSave: false });
        }

        return next(new AppError('Email göndərilərkən xəta baş verdi! Zəhmət olmasa daha sonra yenidən cəhd edin.', 500));
    }
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
    console.log('Email verification request started');
    const rawToken = req.params.token;
    console.log('Raw token from URL:', rawToken);

    if (!rawToken || rawToken.length < 64) {
        console.error('Invalid token format');
        return next(new AppError('Geçersiz doğrulama linki formatı', 400));
    }

    const user = await User.findOne({
        emailVerifyToken: rawToken,
        emailVerifyExpires: { $gt: Date.now() }
    }).select('+emailVerifyToken +emailVerifyExpires');

    console.log('User found:', user ? user.email : 'NOT FOUND');

    if (!user) {
        console.error('Token not found or expired');
        return next(new AppError('Doğrulama linki geçersiz veya süresi dolmuş', 400));
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;

    console.log('Updating user...');
    await user.save({ validateBeforeSave: false });
    console.log('User updated successfully');

    console.log('Sending response...');
    createSendToken(user, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
    console.log('Login request body:', JSON.stringify(req.body));
    const { email, password } = req.body;
    if (!email || !password) {
        console.log('Missing credentials - Email:', email, 'Password:', !!password);
        next(new AppError('Please provide email and password!', 400));
        return res.status(400).json({ error: 'Please provide email and password!' });
    }

    const user = await User.findOne({ email }).select('+password +active +emailVerified');
    if (!user) {
        console.log('User not found with email:', email);
        next(new AppError('Incorrect email or password', 401));
        return res.status(400).json({ error: 'Incorrect email or password' });
    }

    const isPasswordCorrect = await user.correctPassword(password, user.password);
    if (!isPasswordCorrect) {
        console.log('Incorrect password for email:', email);
        next(new AppError('Incorrect email or password', 401));
        return res.status(400).json({ error: 'Incorrect password for email' });

    }

    if (!user.active) {
        console.log('Account not active for email:', email);
        next(new AppError('Your account has been deactivated', 403));
        return res.status(400).json({ error: 'Your account has been deactivated' });
    }

    if (!user.emailVerified) {
        console.log('Email not verified for email:', email);
        next(new AppError('Email not verified for email!', 400));
        return res.status(400).json({ error: 'Pleace verify email' });
    }

    console.log('Successful login for email:', email);
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('Bu işlemi yapmak için giriş yapmalısınız!', 401));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('Bu tokena ait kullanıcı artık mevcut değil.', 401));
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Şifreniz değiştirilmiş! Lütfen tekrar giriş yapın.', 401));
    }

    if (!currentUser.emailVerified) {
        return next(new AppError('Email adresiniz doğrulanmamış!', 401));
    }

    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Bu işlemi yapmaya yetkiniz yok!', 403));
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('Bu email adresine kayıtlı kullanıcı bulunamadı.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Şifre Sıfırlama Bağlantınız (10 dakika geçerlidir)',
            html: `
                <p>Şifrenizi sıfırlamak için lütfen aşağıdaki linke tıklayın:</p>
                <a href="${resetURL}">${resetURL}</a>
                <p>Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
            `
        });

        res.status(200).json({
            status: 'success',
            message: 'Şifre sıfırlama linki email adresinize gönderildi!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Email gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token geçersiz veya süresi dolmuş', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user (handled in model pre-save middleware)

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Mevcut şifreniz yanlış!', 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, res);
});

exports.resendVerificationEmail = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError('Bu email adresine kayıtlı kullanıcı bulunamadı.', 404));
    }

    if (user.emailVerified) {
        return next(new AppError('Bu email adresi zaten doğrulanmış.', 400));
    }

    const verifyToken = user.createEmailVerifyToken();
    await user.save({ validateBeforeSave: false });

    const verifyURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verifyToken}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Email Doğrulama - Hesabınızı Aktif Edin',
            html: createVerificationEmail(user.firstname, verifyURL)
        });

        res.status(200).json({
            status: 'success',
            message: 'Yeni doğrulama linki email adresinize gönderildi!'
        });
    } catch (err) {
        user.emailVerifyToken = undefined;
        user.emailVerifyExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Email gönderilirken bir hata oluştu! Lütfen daha sonra tekrar deneyin.', 500));
    }
});

