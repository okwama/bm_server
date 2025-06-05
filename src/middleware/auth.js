const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    // Token expected in request header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token and extract payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user exists and is active
    const user = await prisma.staff.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ message: 'User account is not active' });
    }
    console.log('Authenticated user:', user);
    // Attach user info to request
    req.user = {
      userId: user.id,
      role: user.role
    };
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};