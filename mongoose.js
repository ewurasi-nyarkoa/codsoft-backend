const mongoose = require('mongoose');

// MongoDB connection URI - replace with your actual database URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/job-board';

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI); // No need for deprecated options
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the app on connection error
  }

  // Handle disconnection events
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
};

module.exports = connectDB;
