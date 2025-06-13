require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import configurations and middleware
const { sequelize } = require('./models');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const initDefaultAdmin = require('./utils/initAdmin');

// Import routes
const adminAuthRoutes = require('./routes/admin/auth');
const adminUserRoutes = require('./routes/admin/users');
const adminShopRoutes = require('./routes/admin/shops');
const userRoutes = require('./routes/usersRoutes');

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Compression middleware
app.use(compression());

// Request logging
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Rate limiting
app.use('/api/', rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/shops', adminShopRoutes);
app.use('/api/users', userRoutes);
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Graceful shutdown handler
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      logger.info('Database synchronized');
    }

    await initDefaultAdmin();

    const server = app.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only run startServer if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
