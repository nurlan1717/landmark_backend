const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const productSchema = new mongoose.Schema({
    name: {type: String, required: [true, "Product name is required!"]},
    description: {type: String, required: [true, "Product description is required!"]},
    images: {
        type: [String],
        required: true,
        set: function (val) {
            if (!Array.isArray(val)) {
                throw new AppError('Images must be an array!', 400);
            }
            if (!val.every(item => typeof item === 'string')) {
                throw new AppError('Images array must only contain strings!', 400);
            }
            return val;
        },
        validate: {
            validator: function (value) {
                return Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string');
            },
            message: 'Images must be an array of strings'
        }
    },
    price: Number,
    seller: {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required: [true, "Seller of product is required!"]
    },
})

const Product = mongoose.model('Product', productSchema);

module.exports = Product;