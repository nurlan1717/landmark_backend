const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.getAllProducts = catchAsync(async (req, res, next) => {

  let filter = {};
  if(req.seller){
    filter = {seller:req.seller.id}
  }


  const features = new APIFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .search()
    .limitFields()
    .paginate();
  const allProducts = await features.query.populate(
    "seller",
    "firstname lastname email"
  );
  console.log("all products", allProducts);
  res.status(200).json({
    status: "success",
    data: allProducts,
  });
});

// exports.getProductById = catchAsync(async (req, res, next) => {
//   const { id } = req.params;
//   const oneProduct = await Product.findById(id).populate(
//     "seller",
//     "firstname lastname email"
//   );

//   if (!oneProduct) {
//     return next(new AppError("No car with id " + id, 404));
//   }

//   res.status(200).json(oneProduct);
// });
exports.getProductById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  let query = Product.findById(id).populate(
    "seller",
    "name surname email profilePicture"
  );
  
  if (req.seller) {
    query = Product.findOne({ _id: id, seller: req.seller.id }).populate(
      "seller",
      "name surname email profilePicture"
    );
  }
  
  const product = await query;

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: product
  });
});

// exports.editProductById = catchAsync(async (req, res, next) => {
//   const { id } = req.params;
//   const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!updatedProduct) {
//     return next(new AppError("No car with id " + id, 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: updatedProduct,
//   });
// });



exports.editProductById= catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  
  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }
  
  if (product.seller.toString() !== req.seller.id) {
    return next(new AppError("You do not have permission to update this product", 403));
  }
  
  const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  }).populate("seller", "name surname email profilePicture");

  res.status(200).json({
    status: "success",
    data: updatedProduct
  });
});





// exports.createProduct = catchAsync(async (req, res, next) => {
//   try {
//     let newProduct = await Product.create(req.body);
//     newProduct = await Product.findById(newProduct._id).populate(
//       "seller",
//       "firstname lastname email"
//     );
//     res.status(201).json({
//       status: "success",
//       data: newProduct,
//     });
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

exports.createProduct = catchAsync(async (req, res, next) => {
 

  if (!req.body.seller) {
    if (req.seller && req.seller.id) {
      req.body.seller = req.seller.id;
    } else {
      console.warn("No seller info found in request. Cannot assign seller.");
    }
  }

  try {
    const newProduct = await Product.create(req.body);

    const populatedProduct = await Product.findById(newProduct._id).populate(
      "seller",
      "name surname email profilePicture"
    );


    res.status(201).json({
      status: "success",
      data: populatedProduct
    });
  } catch (err) {
    console.error("Error creating product:", err);
    return next(new AppError("Failed to create product", 500));
  }
});




// exports.deleteProductById = catchAsync(async (req, res, next) => {
//   const { id } = req.params;

//   const deletedProduct = await Product.findByIdAndDelete(id);

//   if (!deletedProduct) {
//     return next(new AppError("No product with id " + id, 404));
//   }

//   res.status(204).json({ status: "success", data: null });
// });

exports.deleteProductById= catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  
  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }
  
  if (product.seller.toString() !== req.seller.id) {
    return next(new AppError("You do not have permission to delete this product", 403));
  }
  
  await Product.findByIdAndDelete(id);

  res.status(204).json({
    status: "success",
    data: null
  });
});



exports.getMyProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({ seller: req.seller._id });

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products
  });
});