import express, { Request, Response } from 'express';
import { getConnectionMetrics, isDatabaseConnected } from '../utils/db.util';
import { verifyToken } from '../middlewares/auth.middleware';
import { Logger } from '../services/logger.service';

const router = express.Router();
const logger = new Logger('AdminRoutes');

/**
 * @route GET /admin/health
 * @desc Get system health status
 * @access Private (Admin)
 */
router.get('/health', verifyToken, (req: Request, res: Response) => {
  try {
    // Get database status
    const dbConnected = isDatabaseConnected();

    // Get database metrics
    const dbMetrics = getConnectionMetrics();

    // Return health status
    res.status(200).json({
      status: 'success',
      data: {
        database: {
          connected: dbConnected,
          metrics: dbMetrics
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          env: process.env.NODE_ENV
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get health status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system health status'
    });
  }
});

/**
 * @route POST /admin/database/reconnect
 * @desc Force database reconnection
 * @access Private (Admin)
 */
router.post('/database/reconnect', verifyToken, async (req: Request, res: Response) => {
  try {
    // Get the connection pool
    const dbConnected = isDatabaseConnected();

    if (dbConnected) {
      res.status(200).json({
        status: 'success',
        message: 'Database is already connected'
      });
      return;
    }

    // Close the current connection (if any) and reconnect
    await import('../utils/db.util').then(async (db) => {
      try {
        await db.closeDatabase();
        await db.connectDatabase();

        res.status(200).json({
          status: 'success',
          message: 'Database reconnected successfully'
        });
      } catch (error) {
        logger.error('Failed to reconnect to database:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to reconnect to database'
        });
      }
    });
  } catch (error) {
    logger.error('Failed to process reconnect request:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process reconnect request'
    });
  }
});

export default router;