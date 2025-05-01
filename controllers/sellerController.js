const Seller = require('../models/sellerModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcrypt')




exports.createSeller = catchAsync(async (req, res, next) => {
  const { name, surname, email, sellerCategory, certificate, age, location, photo, password } = req.body;

  if (!name || !surname || !email || !certificate || !age || !location || !password) {
      return next(new AppError('Please provide all required fields: name, surname, email, certificate, age, location, password', 400));
  }

  const existingSeller = await Seller.findOne({ email });
  if (existingSeller) {
      return next(new AppError('Seller with this email already exists.', 400));
  }

  const sellerData = {
      name,
      surname,
      email,
      sellerCategory: sellerCategory || 'Fruits', 
      certificate,
      age,
      location,
      photo: photo || 'https://thumbs.dreamstime.com/b/default-profile-picture-icon-high-resolution-high-resolution-default-profile-picture-icon-symbolizing-no-display-picture-360167031.jpg',
      password 
  };

  const newSeller = await Seller.create(sellerData);

  console.log('New seller created:', newSeller);

  res.status(201).json({
      status: 'success',
      data: {
          seller: newSeller
      }
  });
});





exports.getProfile = catchAsync(async (req, res, next) => {
  const seller = await Seller.findById(req.seller.id);
  
  if (!seller) {
    return next(new AppError('No seller found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      seller
    }
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    return next(new AppError('This route is not for password updates. Please use /update-password.', 400));
  }
  
  const filteredBody = filterObj(req.body, 
    'name', 'surname', 'profilePicture', 'sellerCategory', 'certificate', 'age', 'location'
  );
  
  const updatedSeller = await Seller.findByIdAndUpdate(req.seller.id, filteredBody, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      seller: updatedSeller
    }
  });
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};