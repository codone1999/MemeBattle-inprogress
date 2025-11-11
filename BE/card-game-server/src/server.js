require('dotenv').config();
const app = require('./app.js');
const { connectDatabase } = require('./config/database.js');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDatabase()
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`📡 API: http://localhost:${PORT}/api/${process.env.API_VERSION}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});