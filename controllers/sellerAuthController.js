const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const Seller = require("../models/sellerModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (seller, statusCode, res) => {
  const token = signToken(seller._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  seller.password = undefined;

  res.cookie(statusCode).json({
    status: "succes",
    token,
    data: {
      seller,
    },
  });
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;



  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const seller = await Seller.findOne({ email }).select("+password");

  const authError = new AppError("Incorrect email or password", 401);

  if (!seller || !(await seller.correctPassword(password, seller.password))) {
    console.log("Authentication failed");
    return next(authError);
  }

  if (!seller.isActive) {
    return next(
      new AppError("Your account has been deactivated. Please contact admin.", 401)
    );
  }

  createSendToken(seller, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  
  let token;
  
  
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    console.error('No token found in headers or cookies');
    return next(new AppError("You are not logged in! Please log in to get access.", 401));
  }


  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log('🔓 Decoded token payload:', {
      id: decoded.id,
      iat: new Date(decoded.iat * 1000).toISOString(),
      exp: new Date(decoded.exp * 1000).toISOString()
    });

  
    const currentSeller = await Seller.findById(decoded.id).select('+passwordChangedAt +isActive');
    
    if (!currentSeller) {
      console.error('Seller not found in database');
      return next(new AppError("The seller belonging to this token no longer exists", 401));
    }
    

    if (currentSeller.changedPasswordAfter(decoded.iat)) {
      console.warn('Password was changed after token issued');
      return next(new AppError("Seller recently changed password! Please log in again.", 401));
    }

    if (!currentSeller.isActive) {
      console.warn('Account is deactivated');
      return next(new AppError("Your account has been deactivated. Please contact admin.", 401));
    }

    req.seller = currentSeller;
    next();
    
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return next(new AppError("Invalid or expired token. Please log in again.", 401));
  }
});

exports.updatedPassword = catchAsync(async (req, res, next) => {
  const seller = await Seller.findById(req.seller.id).select("+password");

  if(!(await seller.correctPassword(req.body.passwordCurrent,seller.password))){
    return next(new AppError('Your current password is incorrect',401))
  }


  seller.password = req.body.password;
  await seller.save()


  createSendToken(seller,200,res)



});
