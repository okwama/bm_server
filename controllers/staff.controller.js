const staffService = require('../services/staff.service');
const { validationResult } = require('express-validator');

const createStaff = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const staff = await staffService.createStaff(req.body);
    res.status(201).json(staff);
  } catch (error) {
    next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const roles = await staffService.getRoles();
    res.status(200).json(roles);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStaff,
  getRoles,
}; 