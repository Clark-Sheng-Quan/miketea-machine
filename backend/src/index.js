import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { OptionItemCode } from './models/OptionItemCode.js';
import { Template } from './models/Template.js';
import { ProductCode } from './models/ProductCode.js';
import { ProductCodeSwitch } from './models/ProductCodeSwitch.js';
import posServiceRoutes from './routes/posServiceRoutes.js';

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
app.use('/api/service/pos', posServiceRoutes);

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

    // Initialize database tables
    await OptionItemCode.initializeTable();
    await Template.initializeTable();
    await ProductCode.initializeTable();
    await ProductCodeSwitch.initializeTable();
    console.log('Tables initialized successfully');

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
