const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Check for both possible environment variable names
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('MongoDB URI defined:', !!mongoUri);

    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables. Check MONGODB_URI or MONGO_URI in .env file');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    
    console.log('Successfully connected to MongoDB Atlas.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;