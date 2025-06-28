const sseService = require('./services/sse.service');

// Test SSE service functionality
async function testSSEService() {
  console.log('🧪 Testing SSE Service...');
  
  // Initialize the service
  sseService.initialize();
  
  // Test health check
  const health = sseService.healthCheck();
  console.log('✅ Health Check:', JSON.stringify(health, null, 2));
  
  // Test connection stats
  const stats = sseService.getConnectionStats();
  console.log('📊 Connection Stats:', JSON.stringify(stats, null, 2));
  
  // Test cache functionality
  console.log('🧪 Testing cache functionality...');
  
  // Simulate multiple rapid dashboard updates for user 3
  console.log('📊 Sending multiple dashboard updates (should be debounced)...');
  for (let i = 0; i < 5; i++) {
    sseService.sendDashboardUpdate(3);
    console.log(`   Update ${i + 1} triggered`);
  }
  
  // Wait for debouncing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test force update
  console.log('📊 Testing force dashboard update...');
  await sseService.forceDashboardUpdate(3);
  
  // Test cache clearing
  console.log('🧹 Testing cache clearing...');
  sseService.clearUserCache(3);
  
  // Test system notification (if any users are connected)
  if (stats.totalUsers > 0) {
    console.log('📢 Sending test notification to connected users...');
    stats.users.forEach(user => {
      sseService.sendSystemNotification(
        user.userId, 
        'This is a test notification from the server!', 
        'info'
      );
    });
  } else {
    console.log('📱 No users currently connected for testing');
  }
  
  // Final health check
  const finalHealth = sseService.healthCheck();
  console.log('✅ Final Health Check:', JSON.stringify(finalHealth, null, 2));
  
  console.log('✅ SSE Service test completed');
}

// Run the test
testSSEService().catch(console.error); 