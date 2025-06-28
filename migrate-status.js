const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateStatuses() {
  try {
    console.log('Starting status migration...');
    
    // Get all requests (status field no longer exists)
    const requests = await prisma.request.findMany({
      select: {
        id: true,
        myStatus: true
      }
    });
    
    console.log(`Found ${requests.length} requests to check`);
    
    for (const request of requests) {
      console.log(`Request ${request.id}: myStatus=${request.myStatus}`);
    }
    
    console.log('Status migration completed successfully!');
    console.log('Note: status field has been removed from schema, only myStatus is used now.');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateStatuses(); 