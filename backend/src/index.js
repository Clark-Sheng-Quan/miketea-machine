import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { setupScheduledTasks } from './services/scheduledTasks.js';
import flavorRoutes from './routes/flavorRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import qrProtocolRoutes from './routes/qrProtocolRoutes.js';
import posIntegrationRoutes from './routes/posIntegrationRoutes.js';
import posServiceRoutes from './routes/posServiceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
// Only enable POS service routes for now
app.use('/api/service/pos', posServiceRoutes);

// TODO: Enable these routes once actual POS API endpoints are integrated
// app.use('/api/flavors', flavorRoutes);
// app.use('/api/templates', templateRoutes);
// app.use('/api/qr-protocol', qrProtocolRoutes);
// app.use('/api/pos', posIntegrationRoutes);
// app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Initialize and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');

    // TODO: Enable scheduled tasks once flavor sync API is integrated
    // if (process.env.FLAVOR_SYNC_ENABLED === 'true') {
    //   setupScheduledTasks();
    //   console.log('Scheduled tasks configured');
    // }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
