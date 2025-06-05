const prisma = require('../config/db');
const { validationResult } = require('express-validator');

const formatDate = (dateString) => {
  if (!dateString) return 'Not provided';
  try {
    const date = new Date(dateString);
    if (!date || date.toString() === 'Invalid Date') {
      return 'Not provided';
    }
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  } catch (error) {
    return 'Not provided';
  }
};

const validateRequestId = (id) => {
  const requestId = parseInt(id);
  if (isNaN(requestId)) {
    throw new Error('Invalid request ID');
  }
  return requestId;
};

const getPendingRequests = async (req, res, next) => {
  try {
    const rawRequests = await prisma.request.findMany({
      where: {
        userId: req.user.userId,
        status: 'pending',
        AND: [
          { createdAt: { not: undefined } },
          { createdAt: { gt: new Date(0) } }
        ]
      },
      select: {
        id: true,
        clientName: true,
        pickupLocation: true,
        deliveryLocation: true,
        status: true,
        priority: true,
        pickupDate: true,
        createdAt: true,
        ServiceType: {
          select: {
            name: true
          }
        }
      }
    });

    const formattedRequests = rawRequests.map(request => ({
      ...request,
      pickupDate: formatDate(request.pickupDate),
      createdAt: formatDate(request.createdAt),
      ServiceType: request.ServiceType?.name || 'Not provided'
    }));

    res.json(formattedRequests);
  } catch (error) {
    next(error);
  }
};

const getAllStaffRequests = async (req, res, next) => {
  try {
    // Only allow supervisors/admins to view all requests
    if (req.user.role !== 'SUPERVISOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view all requests' });
    }

    const requests = await prisma.request.findMany({
      select: {
        id: true,
        pickupLocation: true,
        deliveryLocation: true,
        status: true,
        ServiceType: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

const getRequestDetails = async (req, res, next) => {
  try {
    const requestId = validateRequestId(req.params.id);

    const request = await prisma.request.findUnique({
      where: {
        id: requestId
      },
      include: {
        Staff: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to access this request' });
    }

    res.json(request);
  } catch (error) {
    if (error.message === 'Invalid request ID') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

const confirmPickup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const requestId = validateRequestId(req.params.id);

    const request = await prisma.request.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to confirm this pickup' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not in pending status' });
    }

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'in_progress',
        myStatus: 1 // Assuming 1 means picked up
      }
    });

    res.json(updatedRequest);
  } catch (error) {
    if (error.message === 'Invalid request ID') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

const confirmDelivery = async (req, res, next) => {
  try {
    const requestId = validateRequestId(req.params.id);

    const request = await prisma.request.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to confirm this delivery' });
    }

    if (request.status !== 'in_progress') {
      return res.status(400).json({ message: 'Request is not in progress' });
    }

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        myStatus: 2 // Assuming 2 means delivered
      }
    });

    res.json(updatedRequest);
  } catch (error) {
    if (error.message === 'Invalid request ID') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

const getConfirmedPickup = async (req, res, next) => {
  try {
    const confirmedRequests = await prisma.request.findMany({
      where: {
        userId: req.user.userId,
        status: 'in_progress'
      },
      select: {
        id: true,
        clientName: true,
        pickupLocation: true,
        deliveryLocation: true,
        status: true,
        priority: true,
        pickupDate: true,
        createdAt: true,
        ServiceType: {
          select: {
            name: true
          }
        }
      }
    });

    const formattedRequests = confirmedRequests.map(request => ({
      ...request,
      pickupDate: formatDate(request.pickupDate),
      createdAt: formatDate(request.createdAt),
      ServiceType: request.ServiceType?.name || 'Not provided'
    }));

    res.json(formattedRequests);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingRequests,
  getRequestDetails,
  confirmPickup,
  confirmDelivery,
  getAllStaffRequests,
  getConfirmedPickup 
};