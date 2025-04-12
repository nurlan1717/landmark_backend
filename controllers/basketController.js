const Basket = require("../models/basketModel.js");
const Product = require("../models/productModel.js");
const User = require("../models/userModel.js");
const AppError = require("../utils/appError.js");
const catchAsync = require("../utils/catchAsync.js");

exports.getBasket = catchAsync(async (req, res, next) => {
    
    let basket = await Basket.findOne({ user: req.user._id }).populate("items.product");
  
    if (!basket) {
      console.log("No basket found, creating new one");
      basket = await Basket.create({
        user: req.user._id,
        items: [],
        totalPrice: 0
      });
    }
  
    res.status(200).json({
      status: "success",
      data: basket,
    });
  });
  
  exports.addItemToBasket = catchAsync(async (req, res, next) => {
    const { productId, quantity } = req.body;
  
  
    if (!productId || !quantity) {
      return next(new AppError("Product ID and quantity are required!"), 400);
    }
  
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError("Product not found!"), 404);
    }
  
    let basket = await Basket.findOne({ user: req.user._id });
    if (!basket) {
      basket = new Basket({
        user: req.user._id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const existingItem = basket.items.find(
        (item) => item.product.toString() === productId
      );
  
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        basket.items.push({ product: productId, quantity });
      }
    }
  
    await basket.save();
  
    res.status(200).json({
      status: "success",
      data: basket,
    });
  });
  
exports.removeItemFromBasket = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  let basket = await Basket.findOne({ user: req.user._id });
  if (!basket) {
    return next(new AppError("Basket not found", 404));
  }

  basket.items = basket.items.filter(
    (item) => item.product.toString() !== productId
  );

  await basket.save();

  res.status(200).json({
    status: "success",
    message: "Item removed from basket",
    data: basket,
  });
});

exports.updateItemQuantity = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return next(new AppError("Quantity must be at least 1", 400));
  }

  let basket = await Basket.findOne({ user: req.user._id });

  if (!basket) {
    return next(new AppError("Basket not found", 404));
  }

  const item = basket.items.find(
    (item) => item.product.toString() === productId
  );

  if (!item) {
    return next(new AppError("Product not found in basket", 404));
  }

  item.quantity = quantity;

  await basket.save();

  res.status(200).json({
    status: "success",
    data: basket,
  });
});

exports.clearBasket = catchAsync(async (req, res, next) => {
  let basket = await Basket.findOne({ user: req.user._id });

  if (!basket) {
    return next(new AppError("Basket not found", 404));
  }

  basket.items = [];
  await basket.save();

  res.status(200).json({
    status: "success",
    message: "Basket cleared",
  });
});
