const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRequestStatus() {
  try {
    const updatedRequest = await prisma.request.update({
      where: { id: 18 },
      data: { 
        myStatus: 2  // Set to 2 since status is already 'in_progress'
      },
      select: { 
        id: true, 
        status: true, 
        myStatus: true
      }
    });
    
    console.log('Request 18 updated:', updatedRequest);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRequestStatus(); 