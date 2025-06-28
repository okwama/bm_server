const prisma = require('../config/db');

class SSEService {
  constructor() {
    this.clients = new Map(); // userId -> Set of response objects
    this.userConnections = new Map(); // userId -> connection info
    this.isInitialized = false;
    this.dashboardUpdateTimers = new Map(); // userId -> timer for debouncing
    this.dashboardCache = new Map(); // userId -> cached dashboard data
    this.cacheTimeout = 30000; // 30 seconds cache timeout
  }

  // Initialize SSE service
  initialize() {
    if (this.isInitialized) return;
    
    console.log('🔄 Initializing SSE Service...');
    this.isInitialized = true;
    
    // Set up periodic cleanup of stale connections
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000); // Clean up every 30 seconds
    
    // Set up periodic cache cleanup
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Clean up cache every minute
    
    console.log('✅ SSE Service initialized');
  }

  // Add a new client connection
  addClient(userId, res, userInfo = {}) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    
    const userClients = this.clients.get(userId);
    userClients.add(res);
    
    // Store connection info
    this.userConnections.set(userId, {
      ...userInfo,
      connectedAt: new Date(),
      lastActivity: new Date(),
      clientCount: userClients.size
    });
    
    console.log(`📱 Client connected: User ${userId} (${userClients.size} connections)`);
    
    // Send initial connection message
    this.sendToUser(userId, {
      type: 'connected',
      userId: userId,
      timestamp: new Date().toISOString(),
      message: 'SSE connection established'
    });
    
    // Send initial dashboard data
    this.sendDashboardUpdate(userId);
    
    return userClients.size;
  }

  // Remove a client connection
  removeClient(userId, res) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      
      if (userClients.size === 0) {
        this.clients.delete(userId);
        this.userConnections.delete(userId);
        console.log(`📱 All clients disconnected: User ${userId}`);
      } else {
        // Update connection info
        const connectionInfo = this.userConnections.get(userId);
        if (connectionInfo) {
          connectionInfo.clientCount = userClients.size;
          connectionInfo.lastActivity = new Date();
        }
        console.log(`📱 Client disconnected: User ${userId} (${userClients.size} remaining)`);
      }
    }
  }

  // Send message to specific user
  sendToUser(userId, data) {
    const userClients = this.clients.get(userId);
    if (userClients && userClients.size > 0) {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      let sentCount = 0;
      
      userClients.forEach(res => {
        try {
          if (!res.destroyed) {
            res.write(message);
            sentCount++;
          }
        } catch (error) {
          console.error(`❌ Error sending to client: ${error.message}`);
          // Remove broken connection
          userClients.delete(res);
        }
      });
      
      if (sentCount > 0) {
        console.log(`📤 Sent to User ${userId}: ${data.type} (${sentCount} clients)`);
      }
      
      // Update last activity
      const connectionInfo = this.userConnections.get(userId);
      if (connectionInfo) {
        connectionInfo.lastActivity = new Date();
      }
    }
  }

  // Broadcast message to all connected users
  broadcastToAll(data) {
    console.log(`📢 Broadcasting to all users: ${data.type}`);
    this.clients.forEach((userClients, userId) => {
      this.sendToUser(userId, data);
    });
  }

  // Send dashboard update to specific user (debounced)
  async sendDashboardUpdate(userId) {
    // Clear existing timer for this user
    const existingTimer = this.dashboardUpdateTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer for debouncing (500ms delay)
    const timer = setTimeout(async () => {
      await this._performDashboardUpdate(userId);
      this.dashboardUpdateTimers.delete(userId);
    }, 500);
    
    this.dashboardUpdateTimers.set(userId, timer);
  }
  
  // Perform the actual dashboard update
  async _performDashboardUpdate(userId) {
    try {
      // Check cache first
      const cached = this.dashboardCache.get(userId);
      const now = new Date();
      
      if (cached && (now - cached.timestamp) < this.cacheTimeout) {
        // Use cached data if it's still valid
        this.sendToUser(userId, {
          type: 'dashboard_update',
          data: cached.data,
          timestamp: new Date().toISOString(),
          cached: true
        });
        
        console.log(`📊 Dashboard update sent to User ${userId} (cached): Pending=${cached.data.pending}, InProgress=${cached.data.inProgress}, Completed=${cached.data.completed}`);
        return;
      }
      
      // Fetch fresh data from database with timeout and retry logic
      const fetchData = async () => {
        try {
          const [pending, inProgress, completed] = await Promise.all([
            prisma.request.count({ 
              where: { 
                staff_id: parseInt(userId), 
                myStatus: 1 
              } 
            }),
            prisma.request.count({ 
              where: { 
                staff_id: parseInt(userId), 
                myStatus: 2 
              } 
            }),
            prisma.request.count({ 
              where: { 
                staff_id: parseInt(userId), 
                myStatus: 3 
              } 
            })
          ]);

          return { pending, inProgress, completed };
        } catch (error) {
          console.error(`❌ Database query error for User ${userId}:`, error);
          throw error;
        }
      };

      // Execute with timeout
      const dashboardData = await Promise.race([
        fetchData(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 10000)
        )
      ]);

      // Cache the data
      this.dashboardCache.set(userId, {
        data: dashboardData,
        timestamp: now
      });

      this.sendToUser(userId, {
        type: 'dashboard_update',
        data: dashboardData,
        timestamp: new Date().toISOString(),
        cached: false
      });
      
      console.log(`📊 Dashboard update sent to User ${userId}: Pending=${dashboardData.pending}, InProgress=${dashboardData.inProgress}, Completed=${dashboardData.completed}`);
    } catch (error) {
      console.error(`❌ Error sending dashboard update to User ${userId}:`, error);
      
      // If database fails, try to send cached data as fallback
      const cached = this.dashboardCache.get(userId);
      if (cached) {
        console.log(`🔄 Using cached dashboard data as fallback for User ${userId}`);
        this.sendToUser(userId, {
          type: 'dashboard_update',
          data: cached.data,
          timestamp: new Date().toISOString(),
          cached: true,
          fallback: true
        });
      } else {
        // Send default values if no cache available
        console.log(`📊 Sending default dashboard values for User ${userId}`);
        this.sendToUser(userId, {
          type: 'dashboard_update',
          data: { pending: 0, inProgress: 0, completed: 0 },
          timestamp: new Date().toISOString(),
          cached: false,
          fallback: true
        });
      }
    }
  }
  
  // Force refresh dashboard (bypass cache)
  async forceDashboardUpdate(userId) {
    // Clear any pending debounced updates
    const existingTimer = this.dashboardUpdateTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.dashboardUpdateTimers.delete(userId);
    }
    
    // Clear cache for this user
    this.dashboardCache.delete(userId);
    
    // Perform immediate update
    await this._performDashboardUpdate(userId);
  }

  // Send request status change notification
  sendRequestStatusChange(userId, requestId, oldStatus, newStatus, requestData = {}) {
    this.sendToUser(userId, {
      type: 'request_status_changed',
      data: {
        requestId: requestId,
        oldStatus: oldStatus,
        newStatus: newStatus,
        request: requestData
      },
      timestamp: new Date().toISOString()
    });
  }

  // Send new request assignment notification
  sendNewRequestAssignment(userId, requestData) {
    this.sendToUser(userId, {
      type: 'new_request_assigned',
      data: requestData,
      timestamp: new Date().toISOString()
    });
  }

  // Send system notification
  sendSystemNotification(userId, message, level = 'info') {
    this.sendToUser(userId, {
      type: 'system_notification',
      data: {
        message: message,
        level: level
      },
      timestamp: new Date().toISOString()
    });
  }

  // Get connection statistics
  getConnectionStats() {
    const stats = {
      totalUsers: this.clients.size,
      totalConnections: 0,
      users: []
    };

    this.clients.forEach((userClients, userId) => {
      const connectionInfo = this.userConnections.get(userId);
      stats.totalConnections += userClients.size;
      
      stats.users.push({
        userId: userId,
        connections: userClients.size,
        connectedAt: connectionInfo?.connectedAt,
        lastActivity: connectionInfo?.lastActivity
      });
    });

    return stats;
  }

  // Clean up stale connections
  cleanupStaleConnections() {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    this.userConnections.forEach((connectionInfo, userId) => {
      const timeSinceLastActivity = now - connectionInfo.lastActivity;
      
      if (timeSinceLastActivity > staleThreshold) {
        console.log(`🧹 Cleaning up stale connection for User ${userId}`);
        const userClients = this.clients.get(userId);
        if (userClients) {
          userClients.forEach(res => {
            try {
              res.end();
            } catch (error) {
              // Connection already closed
            }
          });
          this.clients.delete(userId);
          this.userConnections.delete(userId);
        }
      }
    });
  }

  // Clean up expired cache
  cleanupExpiredCache() {
    const now = new Date();
    this.dashboardCache.forEach((cacheEntry, userId) => {
      const { timestamp, data } = cacheEntry;
      const timeSinceCacheCreation = now - timestamp;
      
      if (timeSinceCacheCreation > this.cacheTimeout) {
        console.log(`🧹 Cleaning up expired cache for User ${userId}`);
        this.dashboardCache.delete(userId);
      }
    });
  }

  // Health check
  healthCheck() {
    return {
      isInitialized: this.isInitialized,
      activeConnections: this.getConnectionStats(),
      cacheStats: {
        cachedUsers: this.dashboardCache.size,
        pendingUpdates: this.dashboardUpdateTimers.size,
        cacheTimeout: this.cacheTimeout
      },
      databaseHealth: this.getDatabaseHealth(),
      uptime: process.uptime()
    };
  }

  // Get database health status
  async getDatabaseHealth() {
    try {
      // Simple query to test database connectivity
      const result = await prisma.$queryRaw`SELECT 1 as health_check`;
      return {
        status: 'healthy',
        response: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clear cache for specific user
  clearUserCache(userId) {
    this.dashboardCache.delete(userId);
    const existingTimer = this.dashboardUpdateTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.dashboardUpdateTimers.delete(userId);
    }
    console.log(`🧹 Cache cleared for User ${userId}`);
  }
  
  // Clear all cache
  clearAllCache() {
    this.dashboardCache.clear();
    this.dashboardUpdateTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.dashboardUpdateTimers.clear();
    console.log('🧹 All cache cleared');
  }
}

// Export singleton instance
module.exports = new SSEService(); 