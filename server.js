const mongoose = require("mongoose");
const dotenv = require('dotenv');
const sendMessageTG = require("./utils/sendMessageTG");
const cors = require('cors');


process.on('uncaughtException',async err => {
    console.log('UNCAUGHT EXCEPTION!  Shutting down...');
    console.log(err.name, err.message);
    // sendMessageTG('UNCAUGHT EXCEPTION!  Shutting down...');


});

dotenv.config({path: './config.env'});

const app = require('./app');


let db = process.env.DATABASE_URL.replace('<db_username>', process.env.DB_USERNAME);
db = db.replace('<db_password>', process.env.DB_PASS);

mongoose.connect(db, {})
    .then(() => {
        console.log("Connected to DB")
    })
    .catch(() => {
        console.log("Cannot connect to DB")
    });


    app.use(cors({
        origin: ['http://localhost:3000', 'https://rackspace-zeta.vercel.app'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
      }));


const server = app.listen(process.env.PORT || 3000, () => {
    console.log("Environment is " + process.env.NODE_ENV);
    console.log("Server started on port " + process.env.PORT + "!");
    // sendMessageTG("Server started on port " + process.env.PORT + "!");
    // sendMessageTG("Environment is " + process.env.NODE_ENV);
});

console.log(process.env);
process.on('unhandledRejection', err => {
    sendMessageTG(err);
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

