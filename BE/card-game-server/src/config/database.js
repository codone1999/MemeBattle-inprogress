const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const options = {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5,
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 30000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS) || 45000,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase
};