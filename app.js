const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const sendMessageTG = require('./utils/sendMessageTG');
const xss = require('xss-clean');
const hpp = require('hpp');
const productsRouter = require('./routes/productsRouter');
const usersRouter = require('./routes/usersRouter');
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController');
const morgan = require('morgan');
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const cors = require("cors")

let app = express();

app.use(helmet());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors({
    origin: ['http://localhost:3000', 'https://rackspace-zeta.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max: 100,
    windowMs: 1000 * 60 * 60,
    message: 'Too many requests! Try again after one hour'
})

app.use('/api', limiter);

app.use(express.json({limit: '10kb'}));

app.use(mongoSanitize());

app.use(xss());

// app.use(hpp({
//     whitelist : [
//         'price', 'description'
//     ]
// }))



app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can not find ${req.originalUrl} on this server`, 404));
})

app.use(globalErrorHandler);

module.exports = app;