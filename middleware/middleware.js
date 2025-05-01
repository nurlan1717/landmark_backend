const express = require('express');
const Product = require('../models/productModel')
const fs = require("fs");
const carsData = JSON.parse(fs.readFileSync(__dirname + '/../data/data.json'))
const catchAsync = require('../utils/catchAsync');



exports.testId = (req, res, next, val) => {

    if( isNaN(Number(val))){
        return res.status(403).json({message : 'Param is not number, try again.'});
    }

    if (val * 1 >  carsData.length) {
        return res.status(403).json({message : 'Not Found'});
    }
    next();
}


exports.checkProductOwnership = catchAsync(async (req, res, next) => {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.seller.id
    });
  
    if (!product) {
      return next(new AppError('You are not the owner of this product', 403));
    }
  
    req.product = product; 
    next();
  });



// exports.checkProductOwnership = catchAsync(async (req, res, next) => {
//     const product = await Product.findById(req.params._id);
//     if (!product) {
//       return next(new AppError('No product found with that ID', 404));
//     }
//     if (product.seller.toString() !== req.seller._id) {
//       return next(new AppError('You do not have permission to perform this action', 403));
//     }
//     req.product = product;
//     next();
//   });