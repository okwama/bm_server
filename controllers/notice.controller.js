const prisma = require('../config/db');
const { validationResult } = require('express-validator');

// Get all notices
exports.getAllNotices = async (req, res, next) => {
  try {
    const notices = await prisma.notices.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });
    res.json({
      success: true,
      data: notices
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    next(error);
  }
};

// Get a single notice
exports.getNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid notice ID is required' 
      });
    }
    
    const notice = await prisma.notices.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!notice) {
      return res.status(404).json({ 
        success: false,
        message: 'Notice not found' 
      });
    }
    
    res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Error fetching notice:', error);
    next(error);
  }
};

// Create a new notice
exports.createNotice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { title, content } = req.body;
    const userId = req.user.userId; // Fixed: use userId from JWT payload
    
    const notice = await prisma.notices.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        created_by: userId
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: notice
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    next(error);
  }
};

// Update a notice
exports.updateNotice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { title, content } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid notice ID is required' 
      });
    }
    
    // Check if notice exists
    const existingNotice = await prisma.notices.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingNotice) {
      return res.status(404).json({ 
        success: false,
        message: 'Notice not found' 
      });
    }
    
    const notice = await prisma.notices.update({
      where: { id: parseInt(id) },
      data: {
        title: title.trim(),
        content: content.trim(),
        updated_at: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: notice
    });
  } catch (error) {
    console.error('Error updating notice:', error);
    next(error);
  }
};

// Delete a notice
exports.deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid notice ID is required' 
      });
    }
    
    // Check if notice exists
    const existingNotice = await prisma.notices.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingNotice) {
      return res.status(404).json({ 
        success: false,
        message: 'Notice not found' 
      });
    }
    
    await prisma.notices.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    next(error);
  }
};
