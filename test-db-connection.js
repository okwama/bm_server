const prisma = require('./config/db');
const sseService = require('./services/sse.service');

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection...');
  
  try {
    // Test basic connection
    console.log('🔗 Testing basic database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test simple query
    console.log('🔍 Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Simple query result:', result);
    
    // Test request count queries (the ones causing issues)
    console.log('📊 Testing request count queries...');
    const startTime = Date.now();
    
    const [pending, inProgress, completed] = await Promise.all([
      prisma.request.count({ 
        where: { 
          staff_id: 3, 
          myStatus: 1 
        } 
      }),
      prisma.request.count({ 
        where: { 
          staff_id: 3, 
          myStatus: 2 
        } 
      }),
      prisma.request.count({ 
        where: { 
          staff_id: 3, 
          myStatus: 3 
        } 
      })
    ]);
    
    const endTime = Date.now();
    console.log(`✅ Request count queries completed in ${endTime - startTime}ms`);
    console.log(`📊 Results: Pending=${pending}, InProgress=${inProgress}, Completed=${completed}`);
    
    // Test SSE service
    console.log('🔄 Testing SSE service...');
    sseService.initialize();
    
    const health = await sseService.healthCheck();
    console.log('✅ SSE Health Check:', JSON.stringify(health, null, 2));
    
    // Test dashboard update
    console.log('📊 Testing dashboard update...');
    await sseService.forceDashboardUpdate(3);
    
    console.log('✅ All tests completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run the test
testDatabaseConnection().catch(console.error); 