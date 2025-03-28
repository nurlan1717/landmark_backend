const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path} : ${err.value}`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJwtErrorDB = err => {
    const message = "Invalid token, please login!"
    return new AppError(message, 400);
}

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        // stack: err.stack,
        message: err.message,
        error: err
    });
}


const sendErrorProd = (err, res) => {
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }else{
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong! :(',
        })
    }

}

module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {



        if(err.name === 'CastError'){
          const castError = handleCastErrorDB(err);

            sendErrorProd(castError, res);
            return;

        }

        if(err.code === 11000){
            const duplicateError = handleDuplicateFieldsDB(err);
            sendErrorProd(duplicateError, res);
            return;
        }

        if(err.name === 'ValidationError'){
            const validationError = handleValidationErrorDB(err);
            sendErrorProd(validationError, res);
            return;
        }

        if(err.name === 'JsonWebTokenError'){
            const jsonWebTokenError = handleJwtErrorDB(err);
            sendErrorProd(jsonWebTokenError, res);
            return;
        }





        sendErrorProd(err, res);
    }


}