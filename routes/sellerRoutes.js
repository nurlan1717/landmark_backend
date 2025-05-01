const express = require('express');
const sellerAuthController = require('../controllers/sellerAuthController');
const sellerController = require('../controllers/sellerController');
const productController = require('../controllers/productController');

const router = express.Router();

router.post('/login', sellerAuthController.login);

router.use(sellerAuthController.protect);

router.get('/profile', sellerController.getProfile);
router.patch('/update-profile', sellerController.updateProfile);
router.patch('/update-password', sellerAuthController.updatedPassword);

// router.get('/products', productController.getAllProducts);
// router.post('/products', productController.createProduct);
// router.get('/products/:id', productController.getProductById);
// router.patch('/products/:id', productController.editProductById);
// router.delete('/products/:id', productController.deleteProductById);

module.exports = router;