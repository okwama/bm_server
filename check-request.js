const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRequest() {
  try {
    const request = await prisma.request.findUnique({
      where: { id: 18 },
      select: { 
        id: true, 
        status: true, 
        myStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log('Request 18 details:', request);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRequest(); 