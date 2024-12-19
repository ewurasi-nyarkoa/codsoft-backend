const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./mongoose');
const Job = require('./models/Job'); // Import your Job model
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

app.use(cors()); // Enable CORS for frontend communication
// app.use(cors({
//   origin: 'http://localhost:3002',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
// }));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);

// Add this to your server.js or index.js
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.log('Mongoose connection error:', err);
});

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      role
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error details:', error); // Detailed error logging
    res.status(500).json({ error: 'Error creating user', details: error.message });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Protected route for getting user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password'); // Do not return password
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});
// PATCH route to update user profile (name and/or password)
app.patch('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate if current password is provided for password change
    if (currentPassword && newPassword) {
      // Ensure new password is valid (you can adjust this to your requirements)
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      // Compare current password with the stored password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash the new password before saving it
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Update the name if provided
    if (name) {
      user.name = name;
    }

    // Save the updated user information
    await user.save();

    // Return the updated profile
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});


// Create a job
app.post('/api/jobs', async (req, res) => {
  const { title, description, company,salary,location,requirements } = req.body;

  // Validate required fields
  if (!title || !description || !company || !salary || !location || !requirements) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const job = new Job({ title, description, company,salary,location,requirements });
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
    const limit = parseInt(req.query.limit) || 100;
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
app.patch('/api/jobs/:id', async (req, res) => {
  const { title, description, company,salary,location,requirements } = req.body;
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { title, description, company,salary,location,requirements },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ message: 'Job updated successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Error updating job' });
  }
});

// Get featured jobs
app.get('/api/jobs/featured', async (req, res) => {
  try {
    const featuredJobs = await Job.find({ featured: true });
    res.status(200).json(featuredJobs);
  } catch (error) {
    console.error('Error fetching featured jobs:', error);
    res.status(500).json({ error: 'Error fetching featured jobs' });
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

const PORT = process.env.PORT || 5001;
const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB first
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('MongoDB Connection State:', mongoose.connection.readyState);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();