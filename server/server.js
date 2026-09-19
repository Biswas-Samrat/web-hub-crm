require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./src/config/database');
const { errorHandler } = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth');
const clientRoutes = require('./src/routes/clients');
const followupRoutes = require('./src/routes/followups');
const dashboardRoutes = require('./src/routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Allow React app assets
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: isProduction
    ? process.env.FRONTEND_URL || true
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (!isProduction) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Health Check (no auth required) ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/follow-ups', followupRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── Serve React Frontend in Production ──────────────────────────────────────
if (isProduction) {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));

  // SPA fallback — all non-API routes return index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ─── 404 for unknown API routes in development ────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Web Hub CRM Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

module.exports = app;
