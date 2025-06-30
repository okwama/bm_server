const prisma = require('../config/db');
const { validationResult } = require('express-validator');
const sseService = require('../services/sse.service');

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

const getPendingRequests = async (req, res, next) => {
  try {
    console.log('=== getPendingRequests Debug Logs ===');
    console.log('User making request:', {
      userId: req.user.userId
    });

    const whereCondition = {
      myStatus: 1,
      staff_id: req.user.userId
    };

    console.log('whereCondition:', JSON.stringify(whereCondition, null, 2));

    const rawRequests = await prisma.request.findMany({
      where: whereCondition,
      select: {
        id: true,
        pickupLocation: true,
        deliveryLocation: true,
        priority: true,
        pickupDate: true,
        createdAt: true,
        myStatus: true,
        ServiceType: {
          select: {
            id: true,
            name: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    console.log('Number of requests found:', rawRequests.length);

    const formattedRequests = rawRequests.map(request => ({
      ...request,
      pickupDate: formatDate(request.pickupDate),
      createdAt: formatDate(request.createdAt),
      ServiceType: request.ServiceType?.name || 'Not provided',
      serviceTypeId: request.ServiceType?.id || 0,
    }));

    console.log('=== End getPendingRequests Debug Logs ===');
    
    res.json(formattedRequests);
  } catch (error) {
    console.error('Error in getPendingRequests:', {
      message: error.message,
      stack: error.stack,
      user: req.user
    });
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
        clientName: false,
        pickupLocation: true,
        deliveryLocation: true,
        myStatus: true,
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
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const request = await prisma.request.findUnique({
      where: {
        id: requestId
      },
      include: {
        staff: {
          select: {
            role: true
          }
        },
        ServiceType: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Debug log the service type information
    console.log('Fetching request details:', {
      requestId,
      serviceTypeId: request?.ServiceType?.id,
      serviceTypeName: request?.ServiceType?.name
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

// Helper function to calculate total amount from denominations
function calculateTotalAmount(cashCount) {
  if (!cashCount) return 0;
  
  return (
    (cashCount.ones ?? 0) * 1 +
    (cashCount.fives ?? 0) * 5 +
    (cashCount.tens ?? 0) * 10 +
    (cashCount.twenties ?? 0) * 20 +
    (cashCount.forties ?? 0) * 40 +
    (cashCount.fifties ?? 0) * 50 +
    (cashCount.hundreds ?? 0) * 100 +
    (cashCount.twoHundreds ?? 0) * 200 +
    (cashCount.fiveHundreds ?? 0) * 500 +
    (cashCount.thousands ?? 0) * 1000
  );
}

const confirmPickup = async (req, res, next) => {
  req.setTimeout(60000); // 60 seconds
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array()
       });
    }
 
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const { cashCount, imageUrl, atmId, counterNumber } = req.body;
 
    console.log('Starting confirmPickup transaction for request:', requestId);
    
    // Start transaction with timeout
    const result = await prisma.$transaction(async (tx) => {
      // Get request with service type and related data
      const request = await tx.request.findUnique({
        where: { id: requestId },
        include: {
          ServiceType: {
            select: {
              id: true,
              name: true
            }
          },
          branches: {
            select: {
              client_id: true
            }
          }
        }
      });
           
      console.log('Confirming pickup for request:', {
        requestId,
        serviceTypeId: request?.ServiceType?.id,
        serviceTypeName: request?.ServiceType?.name,
        cashCount: !!cashCount,
        hasImage: !!imageUrl,
        atmId: atmId,
        counterNumber: counterNumber,
        currentStatus: request?.myStatus
      });
 
      if (!request) {
        throw new Error('Request not found');
      }
 
      // Only allow pickup confirmation for pending requests (myStatus = 1)
      if (request.myStatus !== 1) {
        throw new Error('Request is not in pending status (myStatus must be 1)');
      }

      // Validate cash count if provided
      if (cashCount) {
        const denominations = ['ones', 'fives', 'tens', 'twenties', 'forties', 
                             'fifties', 'hundreds', 'twoHundreds', 'fiveHundreds', 'thousands'];
        
        for (const denom of denominations) {
          const value = cashCount[denom] ?? 0; // Default to 0 if not provided
          if (typeof value !== 'number' || value < 0) {
            throw new Error(`Invalid ${denom} value: ${value}. Must be non-negative.`);
          }
        }
      }

      // Validate image URL if provided
      if (imageUrl) {
        try {
          new URL(imageUrl);
        } catch (e) {
          throw new Error('Invalid image URL format');
        }
      }

      // Validate ATM loading specific fields for service type 4 only if ATM data is provided
      if (request.ServiceType.id === 4 && (atmId || counterNumber)) {
        if (!atmId) {
          throw new Error('ATM ID is required for ATM loading service');
        }
        if (!counterNumber) {
          throw new Error('Counter number is required for ATM loading service');
        }
      }
 
      // Update request status to in_progress (myStatus = 2)
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          myStatus: 2, // 2 = in_progress (picked up)
          updatedAt: new Date()
        },
        include: {
          ServiceType: {
            select: { id: true, name: true }
          }
        }
      });
      
      console.log('Request status updated to in_progress (myStatus = 2)');
 
      let cashCountRecord = null;
      let atmCounterRecord = null;

      // For ATM service (ID: 4), create ATM cash count record if provided
      if (request.ServiceType.id === 4 && cashCount) {
        try {
          const totalAmount = calculateTotalAmount(cashCount);
          console.log('Creating ATM cash count record with total:', totalAmount);
          
          cashCountRecord = await tx.atm_cash_counts.create({
            data: {
              ones: cashCount.ones ?? 0,
              fives: cashCount.fives ?? 0,
              tens: cashCount.tens ?? 0,
              twenties: cashCount.twenties ?? 0,
              forties: cashCount.forties ?? 0,
              fifties: cashCount.fifties ?? 0,
              hundreds: cashCount.hundreds ?? 0,
              twoHundreds: cashCount.twoHundreds ?? 0,
              fiveHundreds: cashCount.fiveHundreds ?? 0,
              thousands: cashCount.thousands ?? 0,
              totalAmount: totalAmount,
              sealNumber: cashCount.sealNumber || null,
              image_url: imageUrl || null,
              request_id: requestId,
              staff_id: req.user.userId,
              created_at: new Date()
            }
          });
          
          console.log('ATM cash count record created:', {
            cashCountId: cashCountRecord.id,
            totalAmount: cashCountRecord.totalAmount,
            requestId: requestId
          });
        } catch (cashCountError) {
          console.error('Error creating ATM cash count record:', cashCountError);
          throw new Error('Failed to create ATM cash count record: ' + cashCountError.message);
        }
      }

      // For ATM loading service (ID: 4), create ATM counter record only if ATM data is provided
      if (request.ServiceType.id === 4 && atmId && counterNumber) {
        try {
          console.log('Creating ATM counter record for ATM loading');
          
          atmCounterRecord = await tx.atm_counters.create({
            data: {
              atm_id: parseInt(atmId),
              client_id: request.branches?.client_id || 0,
              counter_number: counterNumber,
              team_id: request.team_id,
              crew_commander_id: req.user.userId,
              request_id: requestId,
              date: new Date()
            }
          });
          
          console.log('ATM counter record created:', {
            atmCounterId: atmCounterRecord.id,
            atmId: atmCounterRecord.atm_id,
            counterNumber: atmCounterRecord.counter_number,
            requestId: requestId
          });
        } catch (atmCounterError) {
          console.error('Error creating ATM counter record:', atmCounterError);
          throw new Error('Failed to create ATM counter record: ' + atmCounterError.message);
        }
      }
 
      return {
        request: updatedRequest,
        cashCount: cashCountRecord,
        atmCounter: atmCounterRecord
      };
    }, {
      timeout: 45000, // 45 second transaction timeout
      isolationLevel: 'ReadCommitted'
    });
    
    console.log('Transaction completed successfully');
 
    // Send SSE notifications for real-time updates
    try {
      const userId = req.user.userId;
      
      // Send status change notification
      sseService.sendRequestStatusChange(
        userId, 
        requestId, 
        1, // old status (pending)
        2, // new status (in_progress)
        result.request
      );
      
      // Force dashboard update (bypass cache for immediate effect)
      await sseService.forceDashboardUpdate(userId);
      
      console.log(`📡 SSE notifications sent for request ${requestId} pickup confirmation`);
    } catch (sseError) {
      console.error('❌ SSE notification error:', sseError);
      // Don't fail the request if SSE fails
    }
 
    // Send immediate response to prevent timeout
    res.status(200).json({
      success: true,
      data: result.request,
      cashCount: result.cashCount ? {
        id: result.cashCount.id,
        totalAmount: result.cashCount.totalAmount
      } : null,
      atmCounter: result.atmCounter ? {
        id: result.atmCounter.id,
        atmId: result.atmCounter.atm_id,
        counterNumber: result.atmCounter.counter_number
      } : null
    });
    
  } catch (error) {
    console.error('Error in confirmPickup:', error);
    
    // Ensure we haven't already sent a response
    if (res.headersSent) {
      console.log('Response already sent, cannot send error response');
      return;
    }
         
    let statusCode = 500;
    let message = 'Error confirming pickup';
         
    if (error.message === 'Invalid request ID') {
      statusCode = 400;
      message = error.message;
    } else if (error.message === 'Request not found') {
      statusCode = 404;
      message = error.message;
    } else if (error.message === 'Request is not in pending status (myStatus must be 1)') {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('Invalid') || error.message.includes('Invalid image URL')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('ATM ID is required') || error.message.includes('Counter number is required')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('Timeout')) {
      statusCode = 408;
      message = 'Request timeout - operation may have completed successfully';
    } else if (error.code === 'P2002') { // Prisma unique constraint error
      statusCode = 409;
      message = 'Duplicate entry - pickup may have already been confirmed';
    }
         
    res.status(statusCode).json({
      success: false,
      message,
      requestId: req.params.id,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Complete Delivery (Crew Commander)
const confirmDelivery = async (req, res, next) => {
  try {
    console.log('=== Starting Delivery Confirmation ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Bank Details:', req.body.bankDetails);
    console.log('ATM Counter:', req.body.atmCounter);
    console.log('Latitude:', req.body.latitude);
    console.log('Longitude:', req.body.longitude);
    console.log('Notes:', req.body.notes);
    console.log('User:', req.user);

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const { bankDetails, atmCounter, latitude, longitude, notes } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      console.log('Missing required location data');
      return res.status(400).json({ 
        success: false,
        message: 'Location data (latitude and longitude) is required' 
      });
    }

    console.log('Starting transaction for request:', requestId);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the request with service type
      const request = await tx.request.findUnique({
        where: { id: requestId },
        include: {
          ServiceType: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log('Found request:', request);

      if (!request) {
        throw new Error('Request not found');
      }

      // 2. Verify permissions - check if current user is the assigned staff
      if (request.staff_id !== req.user.userId) {
        console.log('Permission denied:', {
          requestStaffId: request.staff_id,
          currentUserId: req.user.userId
        });
        throw new Error('Not authorized to complete this delivery');
      }

      // Only allow delivery completion for in-progress requests (myStatus = 2)
      if (request.myStatus !== 2) {
        console.log('Invalid request status:', request.myStatus);
        throw new Error('Request is not in progress (myStatus must be 2)');
      }

      console.log('Creating delivery completion record');

      // 3. Upsert delivery completion record
      let deliveryCompletion;
      const existing = await tx.delivery_completion.findUnique({
        where: { requestId }
      });

      if (existing) {
        // Update the existing record
        deliveryCompletion = await tx.delivery_completion.update({
          where: { requestId },
          data: {
            completedById: req.user.userId,
            completedByName: req.user.name,
            bankDetails,
            latitude,
            longitude,
            status: 'completed',
            isVaultOfficer: false,
            notes,
            completedAt: new Date()
          }
        });
      } else {
        // Create a new record
        deliveryCompletion = await tx.delivery_completion.create({
          data: {
            requestId,
            completedById: req.user.userId,
            completedByName: req.user.name,
            bankDetails,
            latitude,
            longitude,
            status: 'completed',
            isVaultOfficer: false,
            notes,
            completedAt: new Date()
          }
        });
      }

      // 4. Handle ATM Counter update for ATM loading (service type 4)
      let updatedAtmCounter = null;
      if (request.ServiceType.id === 4 && atmCounter && atmCounter.counterNumber) {
        try {
          console.log('Handling ATM counter record for delivery completion');
          
          // Find existing ATM counter record for this request
          const existingAtmCounter = await tx.atm_counters.findFirst({
            where: { request_id: requestId }
          });

          if (existingAtmCounter) {
            // Update the existing ATM counter record
            updatedAtmCounter = await tx.atm_counters.update({
              where: { id: existingAtmCounter.id },
              data: {
                counter_number: atmCounter.counterNumber,
                date: new Date()
              }
            });
            
            console.log('ATM counter record updated:', {
              atmCounterId: updatedAtmCounter.id,
              counterNumber: updatedAtmCounter.counter_number,
              requestId: requestId
            });
          } else {
            // Create a new ATM counter record if none exists
            console.log('No existing ATM counter record found, creating new one');
            
            // Get request details to get necessary data
            const requestDetails = await tx.request.findUnique({
              where: { id: requestId },
              include: {
                branches: {
                  select: {
                    client_id: true
                  }
                }
              }
            });

            if (requestDetails) {
              updatedAtmCounter = await tx.atm_counters.create({
                data: {
                  atm_id: requestDetails.atm_id || 1, // Use ATM ID from request or default
                  client_id: requestDetails.branches?.client_id || 1,
                  counter_number: atmCounter.counterNumber,
                  team_id: requestDetails.team_id,
                  crew_commander_id: req.user.userId,
                  request_id: requestId,
                  date: new Date()
                }
              });
              
              console.log('New ATM counter record created:', {
                atmCounterId: updatedAtmCounter.id,
                counterNumber: updatedAtmCounter.counter_number,
                requestId: requestId
              });
            } else {
              console.log('Could not get request details for ATM counter creation');
            }
          }
        } catch (atmCounterError) {
          console.error('Error handling ATM counter record:', atmCounterError);
          // Don't throw error, just log it - delivery completion should still succeed
        }
      }

      // 5. Update request status to completed (myStatus = 3)
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          myStatus: 3, // 3 = completed
          updatedAt: new Date()
        }
      });

      console.log('Request status updated:', updatedRequest);

      return { 
        request: updatedRequest, 
        deliveryCompletion,
        atmCounter: updatedAtmCounter
      };
    });

    console.log('Transaction completed successfully');

    // Send SSE notifications for real-time updates
    try {
      const userId = req.user.userId;
      
      // Send status change notification
      sseService.sendRequestStatusChange(
        userId, 
        requestId, 
        2, // old status (in_progress)
        3, // new status (completed)
        result.request
      );
      
      // Force dashboard update (bypass cache for immediate effect)
      await sseService.forceDashboardUpdate(userId);
      
      console.log(`📡 SSE notifications sent for request ${requestId} delivery completion`);
    } catch (sseError) {
      console.error('❌ SSE notification error:', sseError);
      // Don't fail the request if SSE fails
    }

    // Send success response
    res.status(200).json({
      success: true,
      data: result.request,
      deliveryCompletion: result.deliveryCompletion,
      atmCounter: result.atmCounter ? {
        id: result.atmCounter.id,
        counterNumber: result.atmCounter.counter_number,
        atmId: result.atmCounter.atm_id
      } : null
    });

  } catch (error) {
    console.error('=== Delivery Confirmation Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    let statusCode = 500;
    let message = 'Error completing delivery';

    if (error.message === 'Invalid request ID') {
      statusCode = 400;
      message = error.message;
    } else if (error.message === 'Request not found') {
      statusCode = 404;
      message = error.message;
    } else if (error.message === 'Not authorized to complete this delivery') {
      statusCode = 403;
      message = error.message;
    } else if (error.message === 'Request is not in progress') {
      statusCode = 400;
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message,
      requestId: req.params.id,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Assign to Vault Officer
const assignToVaultOfficer = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const { vaultOfficerId, vaultOfficerName } = req.body;

    // 1. Get the request
    const request = await prisma.request.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // 2. Verify requester is authorized (e.g., team leader)
    if (request.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to assign this request' });
    }

    // 3. Update request with vault officer assignment
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        MyStaffId: vaultOfficerId,
        MyStaffName: vaultOfficerName,
        updatedAt: new Date()
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

// Get in-progress requests
const inProgressRequests = async (req, res, next) => {
  try {
    console.log('User making request:', req.user);
    const userId = req.user.userId;

    // Fetch in-progress requests assigned to the user (myStatus = 2)
    const whereCondition = {
      myStatus: 2, // 2 = in_progress
      staff_id: userId
    };

    console.log('Query conditions:', JSON.stringify(whereCondition, null, 2));

    const requests = await prisma.request.findMany({
      where: whereCondition,
      include: {
        ServiceType: {
          select: {
            name: true
          }
        },
        branches: {
          select: {
            name: true,
            clients: {
              select: {
                name: true
              }
            }
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found requests:', requests.length);

    const formattedRequests = requests.map(request => ({
      id: request.id,
      pickupLocation: request.pickupLocation,
      deliveryLocation: request.deliveryLocation,
      status: request.myStatus, // Use myStatus as the status
      priority: request.priority,
      myStatus: request.myStatus,
      branch: request.branches ? {
        name: request.branches.name,
        client: request.branches.clients?.name
      } : null,
      serviceType: request.ServiceType?.name,
      assignedStaff: request.staff?.map(staff => ({
        id: staff.id,
        name: staff.name,
        role: staff.role
      }))
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error in inProgressRequests:', error);
    next(error);
  }
};

// Get completed requests
const completedRequests = async (req, res, next) => {
  try {
    console.log('User making request:', req.user);
    const userId = req.user.userId;

    // Fetch completed requests assigned to the user (myStatus = 3)
    const whereCondition = {
      myStatus: 3, // 3 = completed
      staff_id: userId
    };

    console.log('Query conditions:', JSON.stringify(whereCondition, null, 2));

    const requests = await prisma.request.findMany({
      where: whereCondition,
      include: {
        ServiceType: {
          select: {
            name: true
          }
        },
        branches: {
          select: {
            name: true,
            clients: {
              select: {
                name: true
              }
            }
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found requests:', requests.length);

    const formattedRequests = requests.map(request => ({
      id: request.id,
      pickupLocation: request.pickupLocation,
      deliveryLocation: request.deliveryLocation,
      status: request.myStatus, // Use myStatus as the status
      priority: request.priority,
      myStatus: request.myStatus,
      branch: request.branches ? {
        name: request.branches.name,
        client: request.branches.clients?.name
      } : null,
      serviceType: request.ServiceType?.name,
      assignedStaff: request.staff?.map(staff => ({
        id: staff.id,
        name: staff.name,
        role: staff.role
      }))
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error in completedRequests:', error);
    next(error);
  }
};

// Get vault officers
const getVaultOfficers = async (req, res, next) => {
  try {
    const vaultOfficers = await prisma.staff.findMany({
      where: {
        roleId: 8,
        status: 1  // Active staff only
      },
      select: {
        id: true,
        name: true,
        phone: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: vaultOfficers
    });

  } catch (error) {
    console.error('Error fetching vault officers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vault officers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get available vault officers
const getAvailableVaultOfficers = async (req, res, next) => {
  try {
    const vaultOfficers = await prisma.staff.findMany({
      where: {
        roleId: 8,
        status: 1
      },
      select: {
        id: true,
        name: true,
        phone: true,
        // Count current active assignments
        _count: {
          select: {
            Request: {
              where: {
                status: {
                  in: ['pending', 'in_progress']
                }
              }
            }
          }
        }
      },
      orderBy: [
        // Order by least assignments first, then by name
        { Request: { _count: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: vaultOfficers
    });

  } catch (error) {
    console.error('Error fetching available vault officers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vault officers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getPendingRequests,
  getAllStaffRequests,
  inProgressRequests,
  completedRequests,
  getRequestDetails,
  confirmPickup,
  confirmDelivery,
  assignToVaultOfficer,
  getVaultOfficers,
  getAvailableVaultOfficers
};