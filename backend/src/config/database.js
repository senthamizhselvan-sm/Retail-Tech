const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('📍 Atlas URI is set');
    console.log('🌐 Attempting Atlas connection...');
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000, // 15 second timeout
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('connected', () => {
      console.log('🟢 MongoDB connected successfully');
    });
    
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Failed: ${error.message}`);
    console.error('🔧 Please verify:');
    console.error('   1. MongoDB Atlas credentials are correct');
    console.error('   2. IP address is whitelisted (try 0.0.0.0/0 for testing)');
    console.error('   3. Network/firewall settings allow MongoDB connections');
    throw error; // Re-throw to handle at application level
  }
};

module.exports = connectDB;
