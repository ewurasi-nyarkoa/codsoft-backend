const mongoose = require('mongoose');

// MongoDB connection URI - replace with your actual database URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/job-board';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Successfully connected to MongoDB.');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
  process.exit(1);
});

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Export mongoose instance
module.exports = mongoose;