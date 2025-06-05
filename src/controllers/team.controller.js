const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAssignedStaff = async (req, res) => {
  try {
    const staffId = parseInt(req.user.id);
    if (!staffId || isNaN(staffId)) {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }

    const staffWithTeam = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        assignedTeamMembers: {
          include: {
            teamMember: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                emplNo: true,
                photoUrl: true,
              }
            }
          }
        }
      }
    });

    if (!staffWithTeam) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    if (staffWithTeam.assignedTeamMembers.length === 0) {
      return res.status(200).json({ assignedStaff: [], message: 'No team members assigned' });
    }

    const assignedStaff = staffWithTeam.assignedTeamMembers.map(assignment => ({
      ...assignment.teamMember,
      assignedAt: assignment.assignedAt
    }));

    res.status(200).json({ assignedStaff });
  } catch (error) {
    console.error('Error fetching assigned staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAssignedStaff: (req, res, next) => {
    getAssignedStaff(req, res).catch(next);
  }
};
