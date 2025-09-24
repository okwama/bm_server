const prisma = require('./config/db');

async function testProcedure() {
  try {
    console.log('🧪 Testing stored procedure directly...');
    
    // Test the stored procedure
    const rawRequests = await prisma.$queryRaw`
      CALL GetPendingRequests(3)
    `;
    
    console.log('Raw procedure result:');
    console.log(JSON.stringify(rawRequests, null, 2));
    
    if (rawRequests.length > 0) {
      console.log('\n📋 First request from procedure:');
      const firstRequest = rawRequests[0];
      console.log('All keys:', Object.keys(firstRequest));
      console.log('All values:', Object.values(firstRequest));
    }
    
  } catch (error) {
    console.error('❌ Error testing procedure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProcedure(); 