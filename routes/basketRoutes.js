const express = require('express');
const basketController = require('../controllers/basketController.js');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.use(authController.protect); 

router
  .route('/')
  .get(basketController.getBasket)
  .post(basketController.addItemToBasket)
  .delete(basketController.clearBasket);

router
  .route('/items/:productId')
  .patch(basketController.updateItemQuantity)
  .delete(basketController.removeItemFromBasket);

module.exports = router;
