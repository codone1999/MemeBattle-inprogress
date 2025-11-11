require('dotenv').config()
import app from './app.js';
import { connectDB } from './config/database.js';
const PORT = process.env.PORT

connectDB()
    .then(()=>{
        app.listen(
            PORT,()=>{
                 console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
                 console.log(`📡 API: http://localhost:${PORT}/api/${process.env.API_VERSION}`);
            }
        )
    })
    .catch((error) => {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  });
  process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});