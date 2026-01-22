import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

// Admin: Dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const flavorCount = await db.one('SELECT COUNT(*) as count FROM flavors');
    const templateCount = await db.one('SELECT COUNT(*) as count FROM qr_templates');
    const protocolCount = await db.one('SELECT COUNT(*) as count FROM qr_protocols');
    const recentProtocols = await db.query('SELECT * FROM qr_protocols ORDER BY created_at DESC LIMIT 5');

    res.json({
      success: true,
      data: {
        totalFlavors: parseInt(flavorCount.count),
        totalTemplates: parseInt(templateCount.count),
        totalProtocols: parseInt(protocolCount.count),
        recentProtocols
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin: System health
router.get('/health', async (req, res, next) => {
  try {
    const dbHealth = await db.one('SELECT NOW() as timestamp');
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: dbHealth.timestamp
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
