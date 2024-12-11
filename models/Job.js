const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: 'Remote'
  },
  salary: {
    type: String,
  },
  requirements: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  featured: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Job', jobSchema);