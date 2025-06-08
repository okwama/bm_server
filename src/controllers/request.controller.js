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
        OR: [
          { userId: req.user.userId },  // Requests created by this user
          { MyStaffId: req.user.userId }  // Requests assigned to this user
        ],
        status: 'pending',
        AND: [
          { createdAt: { not: undefined } },
          { createdAt: { gt: new Date(0) } }
        ]
      },
      select: {    
        MyStaff: {  // Include assigned staff
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        id: true,
        // clientName: false,
        pickupLocation: true,
        deliveryLocation: true,
        status: true,
        priority: true,
        pickupDate: true,
        createdAt: true,
        ServiceType: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const formattedRequests = rawRequests.map(request => ({
      ...request, 
      pickupDate: formatDate(request.pickupDate),
      createdAt: formatDate(request.createdAt),
      ServiceType: request.ServiceType?.name || 'Not provided',
      serviceTypeId: request.ServiceType?.id || 0,
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
        clientName: false,
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
    (cashCount.ones || 0) * 1 +
    (cashCount.fives || 0) * 5 +
    (cashCount.tens || 0) * 10 +
    (cashCount.twenties || 0) * 20 +
    (cashCount.forties || 0) * 40 +
    (cashCount.fifties || 0) * 50 +
    (cashCount.hundreds || 0) * 100 +
    (cashCount.twoHundreds || 0) * 200 +
    (cashCount.fiveHundreds || 0) * 500 +
    (cashCount.thousands || 0) * 1000
  );
}

const confirmPickup = async (req, res, next) => {
  // Set longer timeout for this endpoint
  req.setTimeout(60000); // 60 seconds
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array()
       });
    }
 
    const requestId = validateRequestId(req.params.id);
    const { cashCount, imageUrl } = req.body;
 
    console.log('Starting confirmPickup transaction for request:', requestId);
    
    // Start transaction with timeout
    const result = await prisma.$transaction(async (tx) => {
      // Get request with service type
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
           
      console.log('Confirming pickup for request:', {
        requestId,
        serviceTypeId: request?.ServiceType?.id,
        serviceTypeName: request?.ServiceType?.name,
        cashCount: !!cashCount,
        hasImage: !!imageUrl
      });
 
      if (!request) {
        throw new Error('Request not found');
      }
 
      if (request.status !== 'pending') {
        throw new Error('Request is not in pending status');
      }
 
      // Update request status first
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: 'in_progress',
          myStatus: 2, // 1 means picked up
          updatedAt: new Date()
        },
        include: {
          ServiceType: {
            select: { id: true, name: true }
          }
        }
      });
      
      console.log('Request status updated to in_progress');
 
      let cashCountRecord = null;
      // For BSS service (ID: 2), create cash count record if provided
      if (request.ServiceType.id === 2 && cashCount) {
        try {
          const totalAmount = calculateTotalAmount(cashCount);
          console.log('Creating cash count record with total:', totalAmount);
          
          cashCountRecord = await tx.cashCount.create({
            data: {
              ones: cashCount.ones || 0,
              fives: cashCount.fives || 0,
              tens: cashCount.tens || 0,
              twenties: cashCount.twenties || 0,
              forties: cashCount.forties || 0,
              fifties: cashCount.fifties || 0,
              hundreds: cashCount.hundreds || 0,
              twoHundreds: cashCount.twoHundreds || 0,
              fiveHundreds: cashCount.fiveHundreds || 0,
              thousands: cashCount.thousands || 0,
              totalAmount: totalAmount,
              sealNumber: cashCount.sealNumber || null,
              image_url: imageUrl || null,
              requestId: requestId,
              staffId: req.user.userId,
              createdAt: new Date()
            }
          });
          
          console.log('Cash count record created:', {
            cashCountId: cashCountRecord.id,
            totalAmount: cashCountRecord.totalAmount,
            requestId: requestId
          });
        } catch (cashCountError) {
          console.error('Error creating cash count record:', cashCountError);
          throw new Error('Failed to create cash count record: ' + cashCountError.message);
        }
      }
 
      return {
        request: updatedRequest,
        cashCount: cashCountRecord
      };
    }, {
      timeout: 45000, // 45 second transaction timeout
      isolationLevel: 'ReadCommitted'
    });
    
    console.log('Transaction completed successfully');
 
    // Send immediate response to prevent timeout
    res.status(200).json({
      success: true,
      data: result.request,
      cashCount: result.cashCount ? {
        id: result.cashCount.id,
        totalAmount: result.cashCount.totalAmount
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
    } else if (error.message === 'Request is not in pending status') {
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

// const inProgressRequests = async (req, res, next) => {
//   try {
//     console.log('Staff ID:', req.user.id);
    
//     // Query for in-progress requests with branch and client information
//     const requests = await prisma.request.findMany({
//       where: {
//         OR: [
//           { MyStaffId: req.user.id },
//           { team_id: req.user.team_id }
//         ],
//         OR: [
//           { status: 'in_progress' },
//           { myStatus: 2 }
//         ]
//       },
//       include: {
//         ServiceType: {
//           select: {
//             name: true
//           }
//         },
//         branches: {
//           include: {
//             clients: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true
//               }
//             }
//           }
//         },
//         Staff: {
//           select: {
//             id: true,
//             name: true,
//             email: true
//           }
//         }
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });

//     // Format the response
//     const formattedRequests = requests.map(request => ({
//       id: request.id,
//       pickupLocation: request.pickupLocation,
//       deliveryLocation: request.deliveryLocation,
//       status: request.status,
//       priority: request.priority,
//       pickupDate: formatDate(request.pickupDate),
//       createdAt: formatDate(request.createdAt),
//       myStatus: request.myStatus,
//       serviceType: request.ServiceType?.name || 'Not provided',
//       branch: request.branches ? {
//         id: request.branches.id,
//         name: request.branches.name,
//         address: request.branches.address,
//         phone: request.branches.phone,
//         email: request.branches.email
//       } : null,
//       client: request.branches?.clients ? {
//         id: request.branches.clients.id,
//         name: request.branches.clients.name,
//         email: request.branches.clients.email,
//         phone: request.branches.clients.phone
//       } : null,
//       staff: request.Staff ? {
//         id: request.Staff.id,
//         name: request.Staff.name,
//         email: request.Staff.email
//       } : null
//     }));

//     res.json({
//       success: true,
//       count: formattedRequests.length,
//       data: formattedRequests
//     });
//   } catch (error) {
//     console.error('Error in inProgressRequests:', error);
//     next(error);
//   }
// };


const inProgressRequests = async (req, res, next) => {
  try {
    console.log('User making request:', req.user);
    
    // Build the where condition
    const whereCondition = {
      OR: [
        { status: 'in_progress' },
        { myStatus: 2 }
      ]
    };

    // Add staff/team conditions if available
    if (req.user.id || req.user.team_id) {
      const staffTeamConditions = [];
      if (req.user.id) staffTeamConditions.push({ MyStaffId: req.user.id });
      if (req.user.team_id) staffTeamConditions.push({ team_id: req.user.team_id });
      
      if (staffTeamConditions.length > 0) {
        whereCondition.AND = [{ OR: staffTeamConditions }];
      }
    }

    console.log('Query conditions:', JSON.stringify(whereCondition, null, 2));

    // Get the requests with relationships
    const requests = await prisma.request.findMany({
      where: whereCondition,
      include: {
        ServiceType: {
          select: { name: true }
        },
        branch: {
          include: {
            clients: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        Staff: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('Fetched requests with branch data:', JSON.stringify(requests, null, 2));

    console.log(`Found ${requests.length} requests`);

    // Format the response
    const formattedRequests = requests.map(request => {
      const response = {
        id: request.id,
        pickupLocation: request.pickupLocation,
        deliveryLocation: request.deliveryLocation,  // Keep for backward compatibility
        dropOffLocation: request.deliveryLocation,  // Add for Flutter app compatibility
        status: request.status,
        priority: request.priority,
        pickupDate: formatDate(request.pickupDate),
        createdAt: formatDate(request.createdAt),
        myStatus: request.myStatus,
        serviceType: request.ServiceType?.name || 'Not provided',
        branch: null,
        client: null,
        staff: null
      };

      // Add branch and client info if available
      if (request.branch) {
        response.branch = {
          id: request.branch.id,
          name: request.branch.name,
          address: request.branch.address || null,
          phone: request.branch.phone || null,
          email: request.branch.email || null
        };

        if (request.branch.clients) {
          response.client = {
            id: request.branch.clients.id,
            name: request.branch.clients.name,
            email: request.branch.clients.email || null,
            phone: request.branch.clients.phone || null
          };
        }
      }

      console.log(`Request ${request.id} branch data:`, JSON.stringify(request.branch, null, 2));
      return response;
    });

    // Return the array directly as expected by the Flutter app
    res.json(formattedRequests);
  } catch (error) {
    console.error('Error in inProgressRequests:', error);
    next(error);
  }
};

module.exports = {
  getPendingRequests,
  getRequestDetails,
  confirmPickup,
  confirmDelivery,
  getAllStaffRequests,
  inProgressRequests 
};