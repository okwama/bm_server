const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const sseService = require('../services/sse.service');

// Initialize SSE service
sseService.initialize();

// SSE connection endpoint
router.get('/connect', authenticate, (req, res) => {
  const userId = req.user.userId;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connection_established',
    userId: userId,
    timestamp: new Date().toISOString(),
    message: 'SSE connection established successfully'
  })}\n\n`);

  // Add client to SSE service
  sseService.addClient(userId, res, {
    name: req.user.name,
    role: req.user.role,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log(`📱 Client disconnected: User ${userId}`);
    sseService.removeClient(userId, res);
  });

  req.on('error', (error) => {
    console.error(`❌ SSE connection error for User ${userId}:`, error);
    sseService.removeClient(userId, res);
  });

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    if (res.destroyed) {
      clearInterval(heartbeat);
      return;
    }
    
    try {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })}\n\n`);
    } catch (error) {
      console.error(`❌ Heartbeat error for User ${userId}:`, error);
      clearInterval(heartbeat);
      sseService.removeClient(userId, res);
    }
  }, 30000); // Send heartbeat every 30 seconds

  // Clean up heartbeat on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Manual dashboard refresh endpoint
router.post('/refresh-dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await sseService.forceDashboardUpdate(userId);
    
    res.json({
      success: true,
      message: 'Dashboard refresh triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error refreshing dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh dashboard',
      error: error.message
    });
  }
});

// Send test notification endpoint
router.post('/test-notification', authenticate, (req, res) => {
  try {
    const userId = req.user.userId;
    const { message, level = 'info' } = req.body;
    
    sseService.sendSystemNotification(userId, message, level);
    
    res.json({
      success: true,
      message: 'Test notification sent',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});

// SSE health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await sseService.healthCheck();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ SSE health check error:', error);
    res.status(500).json({
      success: false,
      message: 'SSE service health check failed',
      error: error.message
    });
  }
});

// Database health check endpoint
router.get('/db-health', async (req, res) => {
  try {
    const prisma = require('../config/db');
    
    // Test database connection
    const startTime = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as health_check`;
    const endTime = Date.now();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        responseTime: `${endTime - startTime}ms`,
        result: result,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Database health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get connection statistics endpoint (admin only)
router.get('/stats', authenticate, (req, res) => {
  try {
    // Only allow admins/supervisors to view stats
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view SSE statistics'
      });
    }
    
    const stats = sseService.getConnectionStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting SSE stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SSE statistics',
      error: error.message
    });
  }
});

// Clear cache endpoint (admin only)
router.post('/clear-cache', authenticate, (req, res) => {
  try {
    // Only allow admins/supervisors to clear cache
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to clear cache'
      });
    }
    
    const { userId } = req.body;
    
    if (userId) {
      // Clear cache for specific user
      sseService.clearUserCache(userId);
      res.json({
        success: true,
        message: `Cache cleared for User ${userId}`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Clear all cache
      sseService.clearAllCache();
      res.json({
        success: true,
        message: 'All cache cleared',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

module.exports = router; 