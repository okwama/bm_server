const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token exists and is valid in database with retries
    let tokenRecord = null;
    let lastError = null;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        tokenRecord = await prisma.tokens.findFirst({
          where: {
            access_token: token,
            is_valid: true,
            expires_at: {
              gt: new Date(),
            },
          },
        });
        
        if (tokenRecord) break;
        
        // If no error but no token found, no need to retry
        if (attempt === 0) break;
        
      } catch (error) {
        lastError = error;
        console.warn(`Auth retry attempt ${attempt + 1} failed:`, error.message);
        
        // Only retry on connection errors
        if (!error.code?.startsWith('P2')) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    // If all retries failed
    if (lastError && !tokenRecord) {
      console.error('Auth failed after all retries:', lastError);
      throw lastError;
    }

    // Check if token was found
    if (!tokenRecord) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Add user info to request
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    
    // Handle Prisma connection errors
    if (error.code?.startsWith('P2')) {
      return res.status(503).json({ 
        error: 'Database connection error, please try again',
        retryAfter: 5
      });
    }

    res.status(500).json({ error: 'Authentication error' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action' 
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};