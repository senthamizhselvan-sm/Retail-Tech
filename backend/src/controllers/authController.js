const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MemoryDatabase = require('../config/memoryDb');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (isMongoConnected()) {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
      });

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } else {
      // Use Memory Database
      const existingUser = MemoryDatabase.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = MemoryDatabase.createUser({
        name,
        email,
        password: hashedPassword,
        role: 'user'
      });

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || 'https://via.placeholder.com/150',
        },
        source: 'memory'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isMongoConnected()) {
      // Check if user exists and password is correct
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is disabled',
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } else {
      // Use Memory Database
      const user = MemoryDatabase.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password (simple comparison for memory database)
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          avatar: user.avatar || 'https://via.placeholder.com/150',
        },
        source: 'memory'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || 'https://via.placeholder.com/150',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (isMongoConnected()) {
      // Get user with password
      const user = await User.findById(req.user.id).select('+password');

      // Check current password
      if (!(await user.matchPassword(currentPassword))) {
        return res.status(401).json({
          success: false,
          message: 'Password is incorrect',
        });
      }

      user.password = newPassword;
      await user.save();

      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
      });
    } else {
      res.status(501).json({
        success: false,
        message: 'Password update not supported in demo mode',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'User logged out successfully',
  });
};
