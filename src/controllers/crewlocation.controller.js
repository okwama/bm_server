const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/locations

const createLocation = async (req, res) => {
  try {
    const staffId = req.user?.userId;
    console.log('Authenticated staffId:', staffId);

    if (!staffId || isNaN(staffId)) {
      console.error('❌ Missing or invalid staff ID');
      return res.status(401).json({ error: 'Invalid or missing staff ID from authentication' });
    }

    const { requestId, latitude, longitude } = req.body;
    console.log('Request Body:', req.body);

    if (!requestId || latitude === undefined || longitude === undefined) {
      console.error('❌ Missing requestId or coordinates');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Create the crew location record
      const location = await tx.crewLocation.create({
        data: {
          requestId: Number(requestId),
          staffId: Number(staffId),
          latitude,
          longitude
        }
      });

      // Update the request with the most recent coordinates
      const updatedRequest = await tx.request.update({
        where: {
          id: Number(requestId)
        },
        data: {
          latitude,
          longitude,
          updatedAt: new Date() // Explicitly update the timestamp
        }
      });

      return { location, updatedRequest };
    });

    console.log('✅ Location created and request updated successfully');
    res.status(201).json({
      location: result.location,
      message: 'Location created and request updated successfully'
    });

  } catch (err) {
    console.error('❌ Location error:', err);
    
    // Handle specific Prisma errors
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/locations/:requestId
 const getLocationsByRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const locations = await prisma.crewLocation.findMany({
      where: { requestId: Number(requestId) },
      orderBy: { capturedAt: 'asc' }
    });

    res.status(200).json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch locations' });
  }
};
module.exports = {
  createLocation,
  getLocationsByRequest,
};