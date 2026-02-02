const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MemoryDatabase = require('../config/memoryDb');
const mongoose = require('mongoose');

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (isMongoConnected()) {
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is disabled',
        });
      }
    } else {
      // Use Memory Database
      const user = MemoryDatabase.findUserById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      req.user = {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      };
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
};
