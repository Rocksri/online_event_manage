const mongoose = require('mongoose');

const connectDB = async () => {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
        console.error('MongoDB connection error: MONGO_URI is not defined in environment variables');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;