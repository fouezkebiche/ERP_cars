// server.js (UPDATED)
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database');
const { scheduleVehicleLimitCheck } = require('./src/jobs/vehicleLimitMonitoring.job');
const { scheduleMaintenanceMonitoring } = require('./src/jobs/vehicleMaintenanceMonitoring.job');
const { scheduleKmLimitMonitoring } = require('./src/jobs/kmLimitMonitoring.job');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Test DB connection
    await testConnection();
    console.log('✅ Database connected');

    // IMPORTANT: Only sync in development, NEVER in production
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database synced');
    }

    // 3. Start cron jobs
    console.log('⏰ Starting scheduled jobs...');
    scheduleVehicleLimitCheck();        // Daily at 9 AM
    scheduleMaintenanceMonitoring();    // Every 6 hours + daily at 8 AM
    scheduleKmLimitMonitoring();        // Every 4 hours
    console.log('✅ All cron jobs scheduled');

    // 4. Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing server gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing server gracefully');
  process.exit(0);
});

startServer();