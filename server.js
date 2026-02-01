// server.js
'use strict';

const express = require('express');

const app = express();

// Config
const PORT = parseInt(process.env.PORT || '8080', 10);
const NODE_ENV = process.env.NODE_ENV || 'production';

// Basic middleware
app.disable('x-powered-by'); // small security hardening
app.use(express.json({ limit: '1mb' }));

// Routes
app.get('/health', (req, res) => {
  // If you later add DB/cache dependencies, this is where you check them
  res.status(200).json({
    status: 'ok',
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.status(200).send('DoorFeed-v2 take-home app is running.');
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[startup] listening on port ${PORT} (NODE_ENV=${NODE_ENV})`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`[shutdown] received ${signal}, closing server...`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error('[shutdown] error closing server:', err);
      process.exitCode = 1;
    } else {
      console.log('[shutdown] server closed cleanly');
    }
    process.exit();
  });

  // Force shutdown if stuck
  setTimeout(() => {
    console.error('[shutdown] forcing exit after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Helpful in containers
process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('[fatal] unhandledRejection:', err);
  process.exit(1);
});

// Optional: keep-alive tuning (useful behind ALB)
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
