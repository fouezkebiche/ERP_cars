// server.js
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database'); // Assuming your DB config is set up as in the provided code

const PORT = process.env.PORT || 5000;

// Test DB connection on startup (optional but good for your Sequelize setup)
const startServer = async () => {
  try {
    await testConnection(); // From your database.js
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Start the server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();