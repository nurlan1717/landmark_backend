const mongoose = require("mongoose");
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1); 
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE_URL

const mongooseOptions = {
    serverSelectionTimeoutMS: 5000, 
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000
};

mongoose.connect(DB, mongooseOptions)
    .then(() => console.log("✅ Connected to DB successfully"))
    .catch(err => {
        console.error("❌ DB connection error:", err.message);
        process.exit(1);
    });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    console.log(`🚀 Server running on port ${port}`);
});

process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(1);
        });
    });
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
    });
});
