const prisma = require('../config/db');

// Get all notices
exports.getAllNotices = async (req, res) => {
  try {
    const notices = await prisma.notices.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });
    res.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
};

// Get a single notice
exports.getNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await prisma.notices.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    
    res.json(notice);
  } catch (error) {
    console.error('Error fetching notice:', error);
    res.status(500).json({ error: 'Failed to fetch notice' });
  }
};

// Create a new notice
exports.createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id; // Assuming user info is attached to req by auth middleware
    
    const notice = await prisma.notices.create({
      data: {
        title,
        content,
        created_by: userId
      }
    });
    
    res.status(201).json(notice);
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ error: 'Failed to create notice' });
  }
};

// Update a notice
exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    const notice = await prisma.notices.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        updated_at: new Date()
      }
    });
    
    res.json(notice);
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ error: 'Failed to update notice' });
  }
};

// Delete a notice
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.notices.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
};
