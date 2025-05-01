const express = require('express');
const productController = require('../controllers/productController');
const sellerAuthController = require('../controllers/sellerAuthController');

const router = express.Router();

router.route('/')
  .get(productController.getAllProducts);

router.route('/:id')
  .get(productController.getProductById);

router.use(sellerAuthController.protect);

router.route('/')
  .post(productController.createProduct);

router.route('/:id')
  .patch(productController.editProductById)
  .delete(productController.deleteProductById);

module.exports = router;

// const express = require('express');
// const productController = require('../controllers/productController');
// const sellerAuthController = require('../controllers/sellerAuthController');
// const { testId } = require('../middleware/middleware');

// const router = express.Router();

// router.route('/')
//   .get(productController.getAllProducts);

// router.route('/:id')
//   .get(productController.getProductById);

// router.use(sellerAuthController.protect);

// router.route('/')
//   .post(productController.createProduct);

// router.route('/:id')
//   .patch(productController.editProductById)
//   .delete(productController.deleteProductById);

// module.exports = router;
