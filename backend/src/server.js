require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { logger, morgan } = require('./middleware/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const userRoutes = require('./routes/userRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orchestratorRoutes = require('./routes/orchestratorRoutes');
const creativeRoutes = require('./routes/creativeRoutes');

// Business Operating System routes
const businessRoutes = require('./routes/businessRoutes');
const businessProfileRoutes = require('./routes/businessProfileRoutes');
const dailyAssistantRoutes = require('./routes/dailyAssistantRoutes');
const planningRoutes = require('./routes/planningRoutes');
const customerRoutes = require('./routes/customerRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const reflectionRoutes = require('./routes/reflectionRoutes');
const growthRoutes = require('./routes/growthRoutes');

const inventoryRoutes = require('./routes/inventory'); // Updated to new route file
const assistantRoutes = require('./routes/assistantRoutes');
const communicationRoutes = require('./routes/communicationRoutes');

// Connect to database
const startServer = async () => {
  await connectDB();
};

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
// Increase payload limit for image uploads (base64 images can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Force JSON for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && req.method === 'POST') {
    if (!req.is('application/json')) {
      // Allow multipart/form-data for file uploads if needed, but for now strict on voice command
      // Check if it's NOT multipart (which likely means it's the voice command or standard post)
      // Actually, the user prompt asked strictly for this:
      if (req.headers['content-type'] && !req.headers['content-type'].includes('application/json') && !req.headers['content-type'].includes('multipart/form-data')) {
        return res.status(400).json({
          success: false,
          message: 'Content-Type must be application/json'
        });
      }
    }
  }
  next();
});

app.use(morgan('dev'));
app.use(logger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orchestrator', orchestratorRoutes);
app.use('/api/creative', creativeRoutes);

// Business Operating System routes
app.use('/api/business', businessRoutes);
app.use('/api/business-profile', businessProfileRoutes);
app.use('/api/daily', dailyAssistantRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/competition', competitionRoutes);
app.use('/api/reflection', reflectionRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/communication', communicationRoutes);

// Health check
app.get('/api/health', (req, res) => {

  res.json({
    success: true,
    message: 'PixCraft AI API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

// Start the application
startServer().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});
