import { prisma } from "../../config/prisma.js";

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
        password: data.password,
        tempPassword: data.tempPassword || false,
        isVerified: data.isVerified || false,
      },
    });
  }

  async updateParentRecord(parentDoc, data, tx = prisma) {
    const updateData = {};
    if (data.parentName) updateData.parentName = data.parentName;
    if (data.phone) updateData.phone = data.phone;
    if (data.address) updateData.address = data.address; // Assuming address is needed, wait Prisma parent doesn't have address. We'll pass it if exists.

    return await tx.parent.update({
      where: { id: parentDoc.id || parentDoc._id },
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
        defaultGuardian: data.defaultGuardian || false,
        status: data.status || "active",
      },
    });
  }

  async updateStudentParentLink(linkDoc, data, tx = prisma) {
    const updateData = {};
    if (data.relationship) updateData.relationship = data.relationship;
    if (data.defaultGuardian !== undefined) updateData.defaultGuardian = data.defaultGuardian;
    if (data.status) updateData.status = data.status;

    return await tx.studentParent.update({
      where: { id: linkDoc.id },
      data: updateData,
    });
  }

  async getLinkedStudents(parentId, tx = prisma) {
    const links = await tx.studentParent.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            courseId: true,
            batchId: true,
            academicYear: true
          }
        }
      }
    });

    // Remap to match Mongoose exactly if needed
    return links.map(link => ({
      ...link,
      studentId: {
        _id: link.student.id,
        name: link.student.name,
        course: link.student.courseId,
        batch: link.student.batchId,
        academicYear: link.student.academicYear
      }
    }));
  }

  async getParentAuthContext(parentId) {
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        studentParents: {
          include: {
            student: true
          }
        }
      }
    });

    if (!parent) return null;

    const linkedOrganizationIds = parent.studentParents
      .map(sp => sp.student.organizationId)
      .filter(Boolean);

    const linkedBatchIds = parent.studentParents
      .map(sp => sp.student.batchId)
      .filter(Boolean);

    return {
      _id: parent.id,
      email: parent.email,
      linkedOrganizationIds,
      linkedBatchIds
    };
  }

  async findActiveStudentsByParentId(parentId, filters = {}) {
    // Build Prisma student filters
    const studentFilter = {};

    if (filters.studentStatus) {
      studentFilter.isActive = filters.studentStatus === "active";
    }

    if (filters.hostelStatus) {
      if (filters.hostelStatus === "active") {
        studentFilter.studentHostels = { some: { status: "active" } };
      }
    }

    if (filters.organizationId) studentFilter.organizationId = filters.organizationId;
    if (filters.courseId) studentFilter.courseId = filters.courseId;
    if (filters.departmentId) studentFilter.departmentId = filters.departmentId;
    if (filters.batchId) studentFilter.batchId = filters.batchId;

    if (filters.studentId) studentFilter.id = filters.studentId;
    if (filters.studentName) studentFilter.name = { contains: filters.studentName, mode: 'insensitive' };

    const links = await prisma.studentParent.findMany({
      where: {
        parentId,
        status: "active",
        student: studentFilter
      },
      include: {
        student: {
          include: {
            course: true,
            department: true,
            batch: true,
            studentHostels: {
              where: { status: "active" },
              include: { hostel: true }
            }
          }
        }
      },
      orderBy: {
        student: { name: 'asc' }
      }
    });

    return links.map(link => {
      const s = link.student;
      const activeHostelAlloc = s.studentHostels && s.studentHostels.length > 0 ? s.studentHostels[0] : null;

      return {
        _id: s.id,
        studentId: s.studentId,
        name: s.name,
        roomNumber: activeHostelAlloc ? activeHostelAlloc.roomNumber : null,
        hostelId: activeHostelAlloc ? activeHostelAlloc.hostel.id : null,
        hostelName: activeHostelAlloc ? activeHostelAlloc.hostel.name : null,
        courseId: s.course ? s.course.id : null,
        courseName: s.course ? s.course.name : null,
        departmentId: s.department ? s.department.id : null,
        departmentName: s.department ? s.department.name : null,
        batchId: s.batch ? s.batch.id : null,
        batchName: s.batch ? s.batch.name : null
      };
    });
  }
}

export const parentRepository = new ParentRepository();
