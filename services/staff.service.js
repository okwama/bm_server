const prisma = require('../config/db');

const createStaff = async (staffData) => {
  const { name, phone, emplNo, roleId, photoUrl, idNo } = staffData;

  const role = await prisma.roles.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new Error('Invalid role ID');
  }

  const newStaff = await prisma.staff.create({
    data: {
      name,
      phone,
      emplNo,
      idNo: idNo ? parseInt(idNo, 10) : null,
      roleId,
      photoUrl,
      role: role.name,
      status: 0, // Default status
    },
  });
  return newStaff;
};

const getRoles = async () => {
  const roles = await prisma.roles.findMany();
  return roles;
};

module.exports = {
  createStaff,
  getRoles,
}; 