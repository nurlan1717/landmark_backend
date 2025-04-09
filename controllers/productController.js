const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/appError");
const APIFeatures = require('../utils/apiFeatures');

exports.getAllProducts = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Product.find(), req.query)
        .filter()
        .sort()
        .search()
        .limitFields()
        .paginate();
    const allProducts = await features.query.populate('seller', 'firstname lastname email');;
    res.status(200).json({
        status: "success",
        data: allProducts,
    })
});

exports.getProductById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const oneProduct = await Product.findById(id).populate('seller', 'firstname lastname email');

    if (!oneProduct) {
        return next(new AppError('No car with id ' + id, 404));
    }

    res.status(200).json(oneProduct);
})

exports.editProductById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id,
        req.body,
        {
            new: true,
            runValidators: true
        })

    if (!updatedProduct) {
        return next(new AppError('No car with id ' + id, 404));
    }

    res.status(200).json({
        "status": "success",
        "data": updatedProduct
    });
})

exports.createProduct = catchAsync(async (req, res, next) => {
    try {
        let newProduct = await Product.create(req.body);
        newProduct = await Product.findById(newProduct._id).populate('seller', 'firstname lastname email');
        res.status(201).json({
            status: "success",
            data: newProduct
        });
    } catch (error) {
        console.error(error); 
        next(error); 
    }
});

exports.deleteProductById = catchAsync(async (req, res, next) => {
    const { id } = req.params;


    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
        return next(new AppError('No product with id ' + id, 404));
    }


    res.status(204).json({ status: "success", data: null });
});
