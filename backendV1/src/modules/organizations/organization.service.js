import { prisma } from '../../config/prisma.js';

// Add organization specific business logic here

export const getAggregateOrganizationDataDb = async (organizationId) => {
  const orgData = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      code: true,
      organisationNumber: true,
      email: true,
      phone: true,
      address: true,
      students: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          isActive: true,
          studentParents: {
            select: {
              parent: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  isActive: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!orgData) return [];

  const transformedData = {
    _id: orgData.id,
    name: orgData.name,
    code: orgData.code,
    organisationNumber: orgData.organisationNumber,
    email: orgData.email,
    phone: orgData.phone,
    address: orgData.address,
    students: orgData.students.map(student => {
      // Create a clean object without studentParents to match frontend expectation
      const mappedStudent = {
        _id: student.id,
        name: student.fullName,
        email: student.email,
        phone: student.phone,
        isActive: student.isActive,
        parentsList: student.studentParents.map(sp => ({
          _id: sp.parent.id,
          name: sp.parent.fullName,
          email: sp.parent.email,
          phone: sp.parent.phone,
          isActive: sp.parent.isActive
        }))
      };
      return mappedStudent;
    })
  };

  return [transformedData];
};
