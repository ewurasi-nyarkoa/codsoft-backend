const express = require('express');
const mongoose = require('mongoose');
const Job = require('./models/Job'); // Import your Job model
const app = express();
const cors = require('cors');

app.use(cors()); // Enable CORS for frontend communication
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Create a job
app.post('/api/jobs', async (req, res) => {
  const { title, description, company } = req.body;
  
  // Validate required fields
  if (!title || !description || !company) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    const job = new Job({ title, description, company });
    await job.save();
    res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Error creating job' });
  }
});

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    console.log('Fetching jobs...');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobs = await Job.find()
      .skip(skip)
      .limit(limit);
    
    const total = await Job.countDocuments();
    console.log(`Found ${total} jobs`);

    res.status(200).json({
      jobs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalJobs: total
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Error fetching jobs' });
  }
});

// Get a specific job
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching job' });
  }
});

// Update a job
app.put('/api/jobs/:id', async (req, res) => {
  const { title, description, company } = req.body;
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { title, description, company },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ message: 'Job updated successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Error updating job' });
  }
});

// Delete a job
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting job' });
  }
});

require('./mongoose');

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
