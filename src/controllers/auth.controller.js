const prisma = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { emplNo, password } = req.body;

    const user = await prisma.staff.findFirst({
      where: { emplNo }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ message: 'User account is not active' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const userData = {
      id: user.id,
      name: user.name,
      emplNo: user.emplNo,
      role: user.role,
      roleId: user.roleId,
      idNo: user.idNo,
      photoUrl: user.photoUrl,
      status: user.status
    };

    // Token sent in response
    res.json({ 
      token,  // Client should store this
      user: userData 
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, password, roleId, role, emplNo, idNo } = req.body;

    // Check if employee number exists
    const existingUser = await prisma.staff.findFirst({
      where: { emplNo }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Employee number already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new staff with optional fields
    const user = await prisma.staff.create({
      data: {
        name,
        phone: phone || null,
        password: hashedPassword,
        roleId: roleId || 0,
        role,
        emplNo,
        idNo,
        photoUrl: 'default.jpg',
        status: 0
      }
    });

    // Create token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        emplNo: user.emplNo,
        role: user.role,
        roleId: user.roleId
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        roleId: true,
        emplNo: true,
        idNo: true,
        photoUrl: true,
        status: true,
        requests: {
          where: {
            createdAt: {
              gte: new Date('1970-01-01') // Filter dates after Unix epoch
            }
          },
          select: {
            id: true,
            clientName: true,
            pickupLocation: true,
            deliveryLocation: true,
            status: true,
            myStatus: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json(staff);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const updatedUser = await prisma.staff.update({
      where: { id: req.user.userId },
      data: {
        name,
        phone
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        emplNo: true,
        photoUrl: true,
        status: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};