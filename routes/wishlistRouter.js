const express = require("express");
const wishlistController = require("../controllers/wishlistController.js");
const authController = require("../controllers/authController.js");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(wishlistController.getWishlist)
  .post(wishlistController.addToWishlist)
  .delete(wishlistController.clearWishlist);

router
  .route("/:productId")
  .delete(wishlistController.removeFromWishlist);

module.exports = router;
