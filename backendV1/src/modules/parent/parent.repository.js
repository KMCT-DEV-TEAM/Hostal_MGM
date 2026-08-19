
class ParentRepository {
  async findParentByEmail(email, tx = prisma) {
    return await tx.parent.findUnique({
      where: { email },
    });
  }

  async findStudentParentLink(studentId, parentId, tx = prisma) {
    return await tx.studentParent.findUnique({
      where: {
        studentId_parentId: { studentId, parentId },
      },
    });
  }

  async createParentRecord(data, tx = prisma) {
    return await tx.parent.create({
      data: {
        parentName: data.parentName,
        phone: data.phone,
        email: data.email,
        passwordHash: data.password,
        tempPassword: data.tempPassword || false,
        isVerified: data.isVerified || false,
      },
    });
  }

  async updateParentRecord(parentDoc, data, tx = prisma) {
    const updateData = {};
    if (data.parentName) updateData.parentName = data.parentName;
    if (data.phone) updateData.phone = data.phone;

    return await tx.parent.update({
      where: { id: parentDoc.id },
      data: updateData,
    });
  }

  async countStudentParentLinks(studentId, tx = prisma) {
    return await tx.studentParent.count({
      where: { studentId },
    });
  }

  async clearDefaultGuardian(studentId, tx = prisma) {
    return await tx.studentParent.updateMany({
      where: { studentId },
      data: { defaultGuardian: false },
    });
  }

  async createStudentParentLink(data, tx = prisma) {
    return await tx.studentParent.create({
      data: {
        studentId: data.studentId,
        parentId: data.parentId,
        relationship: data.relationship,
        defaultGuardian: data.defaultGuardian,
        status: data.status,
      },
    });
  }

  async getLinkedStudents(parentId, tx = prisma) {
    return await tx.studentParent.findMany({
      where: { parentId },
      include: {
        student: { select: { id: true } }
      }
    });
  }
}

export const parentRepository = new ParentRepository();
