const mongoose = require("mongoose");

const basketItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required in basket!"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required!"],
    min: [1, "Quantity must be at least 1"],
  },
});

const basketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Basket must belong to a user!"],
      unique: true,
    },
    items: [basketItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, "Total price cannot be negative"],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

basketSchema.pre("save", async function (next) {
  if (!this.isModified('items')) return next();

  const Product = mongoose.model("Product");

  let total = 0;
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      total += product.price * item.quantity;
    }
  }

  this.totalPrice = total;
  this.updatedAt = Date.now();
  next();
});

const Basket = mongoose.model("Basket", basketSchema);

module.exports = Basket;
