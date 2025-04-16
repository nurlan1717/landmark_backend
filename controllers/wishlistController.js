const Wishlist = require("../models/wishlistModel.js");
const Product = require("../models/productModel.js");
const AppError = require("../utils/appError.js");
const catchAsync = require("../utils/catchAsync.js");

exports.getWishlist = catchAsync(async (req, res, next) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
    "items"
  );

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({
    status: "success",
    data: wishlist,
  });
});

exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;
  if (!productId) {
    return next(AppError("Product ID is required", 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(AppError("Product not found!", 404));
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist.create({
      user: req.user._id,
      items: [productId],
    });
  } else {
    if (!wishlist.items.includes(productId)) {
      wishlist.items.push(productId);
    }
  }
  await wishlist.save();

  res.status(200).json({
    status: "success",
    data: wishlist,
  });
});





exports.removeFromWishlist = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
  
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return next(new AppError("Wishlist not found", 404));
    }
  
    wishlist.items = wishlist.items.filter(
      (id) => id.toString() !== productId
    );
  
    await wishlist.save();
  
    res.status(200).json({
      status: "success",
      message: "Product removed from wishlist",
      data: wishlist,
    });
  });
  
  exports.clearWishlist = catchAsync(async (req, res, next) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
  
    if (!wishlist) {
      return next(new AppError("Wishlist not found", 404));
    }
  
    wishlist.items = [];
    await wishlist.save();
  
    res.status(200).json({
      status: "success",
      message: "Wishlist cleared",
    });
  });

