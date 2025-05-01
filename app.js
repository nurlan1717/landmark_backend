const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");

const productsRouter = require("./routes/productsRouter");
const usersRouter = require("./routes/usersRouter");
const basketRouter = require("./routes/basketRoutes");
const wishlistRouter = require("./routes/wishlistRouter")
const sellerRoutes = require('./routes/sellerRoutes');
const sellerProductRoutes = require('./routes/sellerProductRoutes');

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://rackspace-zeta.vercel.app"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
  skip: (req) => req.method === "OPTIONS",
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(mongoSanitize());

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/basket", basketRouter);
app.use("/api/wishlist", wishlistRouter);
app.use('/api/sellers', sellerRoutes);
app.use('/api/seller/products', sellerProductRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
