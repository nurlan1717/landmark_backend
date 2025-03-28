const express = require('express');
const productController = require('../controllers/productController');
const {testId} = require('../middleware/middleware');
const authController = require('../controllers/authController');
const app = express();

const router = express.Router();

// router.param('id', testId);

router.route('/').post(productController.createProduct)
    .get(productController.getAllProducts)
//authController.restrictTo("user"),authController.protect, 

router.route('/:id')
    .get(productController.getProductById)
    .patch(productController.editProductById)
    .delete(productController.deleteProductById)


module.exports = router;