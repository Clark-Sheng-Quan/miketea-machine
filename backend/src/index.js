import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './config/database.js';
import { OptionItemCode } from './models/OptionItemCode.js';
import { Template } from './models/Template.js';
import { ProductCode } from './models/ProductCode.js';
import { ProductCodeSwitch } from './models/ProductCodeSwitch.js';
import posServiceRoutes from './routes/posServiceRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup request logging
function setupRequestLogging() {
  const logDir = process.env.LOG_DIR || path.join(__dirname, '../logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Request logger middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;

    // Log request start
    const logEntry = `[${timestamp}] ${method} ${url} - IP: ${ip}\n`;
    fs.appendFileSync(path.join(logDir, 'requests.log'), logEntry);

    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      const statusCode = res.statusCode;
      const responseLog = `[${timestamp}] ${method} ${url} -> ${statusCode}\n`;
      fs.appendFileSync(path.join(logDir, 'requests.log'), responseLog);

      // Log errors separately
      if (statusCode >= 400) {
        fs.appendFileSync(path.join(logDir, 'errors.log'), responseLog);
      }

      res.send = originalSend;
      return res.send(data);
    };

    next();
  });
}

// Setup CORS with configuration
function setupCORS() {
  const corsOptions = {
    origin: function(origin, callback) {
      const allowedOrigins = [
        'https://www.vend88.com.au',
        'https://www.vend88.com.au/',
        'https://dev.vend88.com',
        'https://dev.vend88.com/',
        'http://vend88-tea-machine.s3-website-us-east-1.amazonaws.com',
        'http://vend-88.s3-website-us-east-1.amazonaws.com',  // S3 frontend
        'https://vend-88.s3-website-us-east-1.amazonaws.com',  // S3 frontend HTTPS
        // 'http://localhost:3001',
        // 'http://192.168.0.99:3001/'
      ];

      // In development, allow all origins
      if (NODE_ENV === 'development') {
        return callback(null, true);
      }

      // In production, check whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('CORS not allowed'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));
}

// Middleware
setupCORS();
setupRequestLogging();
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/tea_machine', posServiceRoutes);

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
